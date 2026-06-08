import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IProperty } from '../../domain/properties/property.entity';

const DAY_MS = 86400000;
const DECAY_LAMBDA = 0.04;
const COLLAB_MAX_USERS = 50;
const COLLAB_MAX_PROPERTIES = 20;

interface ScoredProperty extends IProperty {
  score: number;
  matchReasons: string[];
  isCollaborative?: boolean;
}

interface Interaction {
  property: any;
  daysAgo: number;
  weight: number;
}

interface UserProfile {
  interactions: Interaction[];
  propertyTypeWeights: Record<string, number>;
  listingTypeWeights: Record<string, number>;
  avgPrice: number | null;
  priceStd: number | null;
  preferredBedrooms: number | null;
  preferredBathrooms: number | null;
  avgLatitude: number | null;
  avgLongitude: number | null;
  totalInteractions: number;
}

@Injectable()
export class RecommendationsService {
  constructor(private readonly prisma: PrismaService) {}

  // ─── PUBLIC FEED ────────────────────────────────────────────────

  async getFeed(userId: string, page = 1, limit = 20) {
    const profile = await this.buildUserProfile(userId);
    const collaborativeIds = await this.getCollaborativePropertyIds(userId);
    const skip = (page - 1) * limit;

    const allProperties = await this.prisma.property.findMany({
      where: {
        userId: { not: userId },
        status: { not: 'hidden' },
      },
      include: {
        images: { take: 1, orderBy: { isPrimary: 'desc' } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const scored: ScoredProperty[] = allProperties
      .map((p) => {
        const base = this.scoreWithProfile(p, profile);
        if (collaborativeIds.has(p.id)) {
          base.score = Math.min(1, base.score + 0.25);
          base.matchReasons.push('people with similar tastes liked this');
          base.isCollaborative = true;
        }
        return base;
      })
      .filter((p) => p.score > 0);

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const data = scored.slice(skip, skip + limit);

    return {
      data,
      total,
      page,
      limit,
      profile: {
        topPropertyType: this.getTopKey(profile.propertyTypeWeights),
        topListingType: this.getTopKey(profile.listingTypeWeights),
        avgPrice: profile.avgPrice,
        preferredBedrooms: profile.preferredBedrooms,
        preferredBathrooms: profile.preferredBathrooms,
        totalInteractions: profile.totalInteractions,
      },
    };
  }

  // ─── PEOPLE ALSO VIEWED ─────────────────────────────────────────

  async getAlsoViewed(propertyId: string, userId?: string) {
    const property = await this.prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, userId: true },
    });
    if (!property) return [];

    // Find other properties that the same viewers also viewed
    const viewers = await this.prisma.propertyView.findMany({
      where: { propertyId },
      select: { userId: true, ip: true },
      take: 200,
    });

    const userIds = viewers.map((v) => v.userId).filter(Boolean) as string[];
    const ips = viewers.map((v) => v.ip).filter(Boolean) as string[];

    if (userIds.length === 0 && ips.length === 0) return [];

    const alsoViewed = await this.prisma.propertyView.groupBy({
      by: ['propertyId'],
      where: {
        OR: [
          ...(userIds.length > 0 ? [{ userId: { in: userIds } }] : []),
          ...(ips.length > 0 ? [{ ip: { in: ips } }] : []),
        ],
        propertyId: { not: propertyId },
      },
      _count: { propertyId: true },
      orderBy: { _count: { propertyId: 'desc' } },
      take: 10,
    });

    const ids = alsoViewed.map((v) => v.propertyId);
    if (ids.length === 0) return [];

    const properties = await this.prisma.property.findMany({
      where: {
        id: { in: ids },
        status: { not: 'hidden' },
        ...(userId ? { userId: { not: userId } } : {}),
      },
      include: {
        images: { take: 1, orderBy: { isPrimary: 'desc' } },
        user: { select: { id: true, name: true, email: true, phone: true } },
      },
    });

    // Sort by view count
    const viewCounts = new Map(alsoViewed.map((v) => [v.propertyId, v._count.propertyId]));
    properties.sort((a, b) => (viewCounts.get(b.id) || 0) - (viewCounts.get(a.id) || 0));

    return properties.slice(0, 6).map((p) => this.toDomain(p));
  }

  // ─── PROFILE BUILDER (with temporal decay) ──────────────────────

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const now = Date.now();

    const [views, favorites, inquiries] = await Promise.all([
      this.prisma.propertyView.findMany({
        where: { userId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      this.prisma.favorite.findMany({
        where: { userId },
        include: { property: true },
      }),
      this.prisma.inquiry.findMany({
        where: { userId },
        include: { property: true },
      }),
    ]);

    // Build weighted interactions with temporal decay
    const interactions: Interaction[] = [];

    for (const v of views) {
      const daysAgo = (now - v.createdAt.getTime()) / DAY_MS;
      interactions.push({
        property: v.property,
        daysAgo,
        weight: this.temporalWeight(daysAgo) * 0.3,
      });
    }

    for (const f of favorites) {
      const daysAgo = (now - f.createdAt.getTime()) / DAY_MS;
      interactions.push({
        property: f.property,
        daysAgo,
        weight: this.temporalWeight(daysAgo) * 1.0,
      });
    }

    for (const i of inquiries) {
      const daysAgo = (now - i.createdAt.getTime()) / DAY_MS;
      interactions.push({
        property: i.property,
        daysAgo,
        weight: this.temporalWeight(daysAgo) * 1.5,
      });
    }

    // Deduplicate by property, keep highest weight
    const propMap = new Map<string, Interaction>();
    for (const interaction of interactions) {
      const existing = propMap.get(interaction.property.id);
      if (!existing || interaction.weight > existing.weight) {
        propMap.set(interaction.property.id, interaction);
      }
    }

    const unique = Array.from(propMap.values());

    if (unique.length === 0) {
      return {
        interactions: [],
        propertyTypeWeights: {},
        listingTypeWeights: {},
        avgPrice: null,
        priceStd: null,
        preferredBedrooms: null,
        preferredBathrooms: null,
        avgLatitude: null,
        avgLongitude: null,
        totalInteractions: 0,
      };
    }

    const typeWeights: Record<string, number> = {};
    const listingWeights: Record<string, number> = {};
    let weightedPriceSum = 0;
    let weightSum = 0;
    let bedroomSum = 0;
    let bedroomWeight = 0;
    let bathroomSum = 0;
    let bathroomWeight = 0;
    let latSum = 0;
    let lngSum = 0;
    let coordWeight = 0;

    for (const { property: p, weight } of unique) {
      typeWeights[p.propertyType] = (typeWeights[p.propertyType] || 0) + weight;
      listingWeights[p.listingType] = (listingWeights[p.listingType] || 0) + weight;

      if (p.price) { weightedPriceSum += p.price * weight; weightSum += weight; }
      if (p.bedrooms) { bedroomSum += p.bedrooms * weight; bedroomWeight += weight; }
      if (p.bathrooms) { bathroomSum += p.bathrooms * weight; bathroomWeight += weight; }
      if (p.latitude && p.longitude) { latSum += p.latitude * weight; lngSum += p.longitude * weight; coordWeight += weight; }
    }

    // Normalize type weights to percentages
    const totalWeight = unique.reduce((s, i) => s + i.weight, 0);
    if (totalWeight > 0) {
      for (const key of Object.keys(typeWeights)) typeWeights[key] /= totalWeight;
      for (const key of Object.keys(listingWeights)) listingWeights[key] /= totalWeight;
    }

    const avgPrice = weightSum > 0 ? weightedPriceSum / weightSum : null;
    let priceStd: number | null = null;
    if (avgPrice !== null && weightSum > 0) {
      let sqDiffSum = 0;
      let sqWeightSum = 0;
      for (const { property: p, weight } of unique) {
        if (p.price) { sqDiffSum += weight * (p.price - avgPrice) ** 2; sqWeightSum += weight; }
      }
      priceStd = sqWeightSum > 0 ? Math.sqrt(sqDiffSum / sqWeightSum) : null;
    }

    return {
      interactions: unique,
      propertyTypeWeights: typeWeights,
      listingTypeWeights: listingWeights,
      avgPrice,
      priceStd,
      preferredBedrooms: bedroomWeight > 0 ? Math.round(bedroomSum / bedroomWeight) : null,
      preferredBathrooms: bathroomWeight > 0 ? Math.round(bathroomSum / bathroomWeight) : null,
      avgLatitude: coordWeight > 0 ? latSum / coordWeight : null,
      avgLongitude: coordWeight > 0 ? lngSum / coordWeight : null,
      totalInteractions: unique.length,
    };
  }

  // ─── COLLABORATIVE FILTERING (Jaccard similarity) ──────────────

  private async getCollaborativePropertyIds(userId: string): Promise<Set<string>> {
    const myFavorites = await this.prisma.favorite.findMany({
      where: { userId },
      select: { propertyId: true },
    });
    const myFavIds = new Set(myFavorites.map((f) => f.propertyId));

    if (myFavIds.size === 0) return new Set();

    // Find users who share at least one favorite
    const similarUsers = await this.prisma.favorite.findMany({
      where: {
        propertyId: { in: Array.from(myFavIds) },
        userId: { not: userId },
      },
      select: { userId: true, propertyId: true },
      take: 500,
    });

    // Build similarity scores per user
    const userScores = new Map<string, { intersection: Set<string>; union: Set<string> }>();
    for (const fav of similarUsers) {
      if (!userScores.has(fav.userId)) {
        userScores.set(fav.userId, {
          intersection: new Set(),
          union: new Set(myFavIds),
        });
      }
      const record = userScores.get(fav.userId)!;
      record.intersection.add(fav.propertyId);
      record.union.add(fav.propertyId);
    }

    // Calculate Jaccard similarity and get top N similar users
    const scoredUsers = Array.from(userScores.entries())
      .map(([uid, { intersection, union }]) => ({
        userId: uid,
        score: union.size > 0 ? intersection.size / union.size : 0,
      }))
      .filter((u) => u.score > 0.1)
      .sort((a, b) => b.score - a.score)
      .slice(0, COLLAB_MAX_USERS);

    if (scoredUsers.length === 0) return new Set();

    // Get properties they favorited that I haven't
    const theirFavs = await this.prisma.favorite.findMany({
      where: {
        userId: { in: scoredUsers.map((u) => u.userId) },
        propertyId: { notIn: Array.from(myFavIds) },
      },
      select: { propertyId: true },
    });

    // Score by how many similar users favorited it
    const propScores = new Map<string, number>();
    for (const fav of theirFavs) {
      propScores.set(fav.propertyId, (propScores.get(fav.propertyId) || 0) + 1);
    }

    const result = new Set<string>();
    const sorted = Array.from(propScores.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, COLLAB_MAX_PROPERTIES);

    for (const [propId] of sorted) {
      result.add(propId);
    }

    return result;
  }

  // ─── SCORING ───────────────────────────────────────────────────

  private scoreWithProfile(property: any, profile: UserProfile): ScoredProperty {
    let score = 0;
    const matchReasons: string[] = [];
    const weights = { type: 0.20, listing: 0.08, price: 0.17, bedrooms: 0.08, bathrooms: 0.04, proximity: 0.25, popularity: 0.18 };

    if (profile.totalInteractions === 0) {
      // Cold start: no profile, use popularity
      return this.toScored(property, 0.3, ['popular in your area']);
    }

    // 1. Property type match (20%)
    if (profile.propertyTypeWeights[property.propertyType]) {
      score += weights.type * profile.propertyTypeWeights[property.propertyType];
      matchReasons.push(`similar to your interest in ${property.propertyType}s`);
    }

    // 2. Listing type match (8%)
    if (profile.listingTypeWeights[property.listingType]) {
      score += weights.listing * profile.listingTypeWeights[property.listingType];
    }

    // 3. Price range match (17%)
    if (profile.avgPrice !== null && profile.priceStd !== null) {
      const priceDiff = Math.abs(property.price - profile.avgPrice);
      if (priceDiff <= profile.priceStd * 1.5) {
        const priceScore = 1 - Math.min(1, priceDiff / (profile.priceStd * 2));
        score += weights.price * Math.max(0, priceScore);
        matchReasons.push('within your usual price range');
      }
    }

    // 4. Bedrooms match (8%)
    if (profile.preferredBedrooms !== null && property.bedrooms) {
      const diff = Math.abs(property.bedrooms - profile.preferredBedrooms);
      score += weights.bedrooms * Math.max(0, 1 - diff * 0.3);
    }

    // 5. Bathrooms match (4%)
    if (profile.preferredBathrooms !== null && property.bathrooms) {
      const diff = Math.abs(property.bathrooms - profile.preferredBathrooms);
      score += weights.bathrooms * Math.max(0, 1 - diff * 0.3);
    }

    // 6. Location proximity (25%)
    if (profile.avgLatitude !== null && profile.avgLongitude !== null
        && property.latitude && property.longitude) {
      const distanceKm = this.haversineDistance(
        profile.avgLatitude, profile.avgLongitude,
        property.latitude, property.longitude,
      );
      if (distanceKm <= 3) {
        score += weights.proximity * 1.0;
        matchReasons.push('very close to your area');
      } else if (distanceKm <= 10) {
        score += weights.proximity * 0.7;
        if (!matchReasons.includes('very close to your area')) matchReasons.push('near your area');
      } else if (distanceKm <= 30) {
        score += weights.proximity * 0.3;
      }
    }

    // 7. Popularity boost (18%) — more views = more relevant
    if (property.propertyViews && property.propertyViews.length > 0) {
      const viewCount = property.propertyViews.length;
      const popScore = Math.min(1, viewCount / 100);
      score += weights.popularity * popScore;
    }

    return this.toScored(property, Math.round(score * 100) / 100, matchReasons);
  }

  private toScored(property: any, score: number, matchReasons: string[]): ScoredProperty {
    return {
      ...this.toDomain(property),
      score,
      matchReasons,
    };
  }

  private toDomain(raw: any): IProperty {
    return {
      id: raw.id,
      title: raw.title,
      description: raw.description,
      price: raw.price,
      currency: raw.currency,
      propertyType: raw.propertyType,
      listingType: raw.listingType,
      bedrooms: raw.bedrooms,
      bathrooms: raw.bathrooms,
      surface: raw.surface,
      surfaceUnit: raw.surfaceUnit,
      location: raw.location,
      latitude: raw.latitude,
      longitude: raw.longitude,
      status: raw.status,
      aiTitle: raw.aiTitle,
      aiDescription: raw.aiDescription,
      aiStatus: raw.aiStatus,
      userId: raw.userId,
      user: raw.user ? {
        id: raw.user.id,
        name: raw.user.name,
        email: raw.user.email,
        phone: raw.user.phone,
      } : undefined,
      images: (raw.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        mimetype: img.mimetype,
        size: img.size,
        isPrimary: img.isPrimary,
        propertyId: img.propertyId,
        createdAt: img.createdAt,
      })),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }

  // ─── HELPERS ─────────────────────────────────────────────────────

  private temporalWeight(daysAgo: number): number {
    return Math.exp(-DECAY_LAMBDA * daysAgo);
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number { return (deg * Math.PI) / 180; }

  private getTopKey(obj: Record<string, number>): string | null {
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    return keys.reduce((a, b) => (obj[a] > obj[b] ? a : b));
  }
}
