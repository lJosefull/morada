import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { IProperty } from '../../domain/properties/property.entity';

interface ScoredProperty extends IProperty {
  score: number;
  matchReasons: string[];
}

interface UserProfile {
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

  async getFeed(userId: string, page = 1, limit = 20) {
    const profile = await this.buildUserProfile(userId);
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
      .map((p) => this.scoreProperty(p, profile, userId))
      .filter((p) => p.score > 0);

    scored.sort((a, b) => b.score - a.score);

    const total = scored.length;
    const data = scored.slice(skip, skip + limit);

    // Calculate profile summary for debugging/sharing
    const profileSummary = {
      topPropertyType: this.getTopKey(profile.propertyTypeWeights),
      topListingType: this.getTopKey(profile.listingTypeWeights),
      avgPrice: profile.avgPrice,
      preferredBedrooms: profile.preferredBedrooms,
      preferredBathrooms: profile.preferredBathrooms,
      totalInteractions: profile.totalInteractions,
    };

    return { data, total, page, limit, profile: profileSummary };
  }

  private async buildUserProfile(userId: string): Promise<UserProfile> {
    const [views, favorites, inquiries] = await Promise.all([
      this.prisma.propertyView.findMany({
        where: { userId },
        include: { property: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
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

    const properties = [
      ...views.map((v) => v.property),
      ...favorites.map((f) => f.property),
      ...inquiries.map((i) => i.property),
    ];

    if (properties.length === 0) {
      return {
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
    let priceSum = 0;
    let priceCount = 0;
    let bedroomSum = 0;
    let bedroomCount = 0;
    let bathroomSum = 0;
    let bathroomCount = 0;
    let latSum = 0;
    let lngSum = 0;
    let coordCount = 0;

    for (const p of properties) {
      typeWeights[p.propertyType] = (typeWeights[p.propertyType] || 0) + 1;
      listingWeights[p.listingType] = (listingWeights[p.listingType] || 0) + 1;
      if (p.price) { priceSum += p.price; priceCount++; }
      if (p.bedrooms) { bedroomSum += p.bedrooms; bedroomCount++; }
      if (p.bathrooms) { bathroomSum += p.bathrooms; bathroomCount++; }
      if (p.latitude && p.longitude) { latSum += p.latitude; lngSum += p.longitude; coordCount++; }
    }

    // Normalize weights to percentages
    const total = properties.length;
    for (const key of Object.keys(typeWeights)) typeWeights[key] /= total;
    for (const key of Object.keys(listingWeights)) listingWeights[key] /= total;

    // Calculate price standard deviation
    const avgPrice = priceCount > 0 ? priceSum / priceCount : null;
    let priceStd: number | null = null;
    if (avgPrice !== null && priceCount > 1) {
      let sqDiffSum = 0;
      for (const p of properties) {
        if (p.price) sqDiffSum += (p.price - avgPrice) ** 2;
      }
      priceStd = Math.sqrt(sqDiffSum / priceCount);
    }

    return {
      propertyTypeWeights: typeWeights,
      listingTypeWeights: listingWeights,
      avgPrice,
      priceStd,
      preferredBedrooms: bedroomCount > 0 ? Math.round(bedroomSum / bedroomCount) : null,
      preferredBathrooms: bathroomCount > 0 ? Math.round(bathroomSum / bathroomCount) : null,
      avgLatitude: coordCount > 0 ? latSum / coordCount : null,
      avgLongitude: coordCount > 0 ? lngSum / coordCount : null,
      totalInteractions: total,
    };
  }

  private scoreProperty(
    property: any,
    profile: UserProfile,
    _userId: string,
  ): ScoredProperty {
    let score = 0;
    const matchReasons: string[] = [];
    const weights = { type: 0.25, listing: 0.10, price: 0.20, bedrooms: 0.10, bathrooms: 0.05, proximity: 0.30 };

    // 1. Property type match (25%)
    if (profile.propertyTypeWeights[property.propertyType]) {
      score += weights.type * profile.propertyTypeWeights[property.propertyType];
      matchReasons.push(`similar to your interest in ${property.propertyType}s`);
    }

    // 2. Listing type match (10%)
    if (profile.listingTypeWeights[property.listingType]) {
      score += weights.listing * profile.listingTypeWeights[property.listingType];
    }

    // 3. Price range match (20%) — within 1 std dev of avg
    if (profile.avgPrice !== null && profile.priceStd !== null) {
      const priceDiff = Math.abs(property.price - profile.avgPrice);
      if (priceDiff <= profile.priceStd) {
        const priceScore = 1 - (priceDiff / (profile.priceStd * 2));
        score += weights.price * Math.max(0, priceScore);
        matchReasons.push('within your usual price range');
      }
    }

    // 4. Bedrooms match (10%)
    if (profile.preferredBedrooms !== null && property.bedrooms) {
      if (property.bedrooms === profile.preferredBedrooms) {
        score += weights.bedrooms;
      } else {
        const diff = Math.abs(property.bedrooms - profile.preferredBedrooms);
        score += weights.bedrooms * Math.max(0, 1 - diff * 0.3);
      }
    }

    // 5. Bathrooms match (5%)
    if (profile.preferredBathrooms !== null && property.bathrooms) {
      if (property.bathrooms === profile.preferredBathrooms) {
        score += weights.bathrooms;
      } else {
        const diff = Math.abs(property.bathrooms - profile.preferredBathrooms);
        score += weights.bathrooms * Math.max(0, 1 - diff * 0.3);
      }
    }

    // 6. Location proximity (30%) — Haversine-based score
    if (profile.avgLatitude !== null && profile.avgLongitude !== null
        && property.latitude && property.longitude) {
      const distanceKm = this.haversineDistance(
        profile.avgLatitude, profile.avgLongitude,
        property.latitude, property.longitude,
      );

      if (distanceKm <= 5) {
        score += weights.proximity * 1.0;
        matchReasons.push('very close to your area');
      } else if (distanceKm <= 15) {
        score += weights.proximity * 0.7;
        matchReasons.push('near your area');
      } else if (distanceKm <= 50) {
        score += weights.proximity * 0.3;
      }
    }

    const domainProperty: IProperty = {
      id: property.id,
      title: property.title,
      description: property.description,
      price: property.price,
      currency: property.currency,
      propertyType: property.propertyType,
      listingType: property.listingType,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      surface: property.surface,
      surfaceUnit: property.surfaceUnit,
      location: property.location,
      latitude: property.latitude,
      longitude: property.longitude,
      status: property.status,
      aiTitle: property.aiTitle,
      aiDescription: property.aiDescription,
      aiStatus: property.aiStatus,
      userId: property.userId,
      user: property.user ? {
        id: property.user.id,
        name: property.user.name,
        email: property.user.email,
        phone: property.user.phone,
      } : undefined,
      images: (property.images || []).map((img: any) => ({
        id: img.id,
        url: img.url,
        filename: img.filename,
        mimetype: img.mimetype,
        size: img.size,
        isPrimary: img.isPrimary,
        propertyId: img.propertyId,
        createdAt: img.createdAt,
      })),
      createdAt: property.createdAt,
      updatedAt: property.updatedAt,
    };

    return { ...domainProperty, score: Math.round(score * 100) / 100, matchReasons };
  }

  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  private toRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  private getTopKey(obj: Record<string, number>): string | null {
    const keys = Object.keys(obj);
    if (keys.length === 0) return null;
    return keys.reduce((a, b) => (obj[a] > obj[b] ? a : b));
  }
}
