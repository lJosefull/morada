import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { IInquiryRepository } from '../../domain/inquiry/inquiry.repository';
import {
  IInquiry,
  CreateInquiryInput,
  UpdateInquiryStatusInput,
  UpdateInquiryNotesInput,
} from '../../domain/inquiry/inquiry.entity';

@Injectable()
export class PrismaInquiryRepository implements IInquiryRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<IInquiry | null> {
    const inquiry = await this.prisma.inquiry.findUnique({
      where: { id },
      include: { statusChanges: { orderBy: { changedAt: 'desc' } } },
    });
    if (!inquiry) return null;
    return this.toDomain(inquiry);
  }

  async findByOwner(
    ownerUserId: string,
    status?: string,
    skip = 0,
    take = 20,
  ): Promise<[IInquiry[], number]> {
    const where: Record<string, unknown> = { ownerUserId };
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return [data.map((d) => this.toDomain(d)), total];
  }

  async findByUser(userId: string, skip = 0, take = 20): Promise<[IInquiry[], number]> {
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.inquiry.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.inquiry.count({ where }),
    ]);
    return [data.map((d) => this.toDomain(d)), total];
  }

  async create(input: CreateInquiryInput): Promise<IInquiry> {
    const inquiry = await this.prisma.inquiry.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        message: input.message,
        ownerUserId: input.ownerUserId,
        userId: input.userId ?? null,
        status: 'new',
      },
    });
    return this.toDomain(inquiry);
  }

  async updateStatus(id: string, input: UpdateInquiryStatusInput): Promise<IInquiry> {
    const old = await this.prisma.inquiry.findUnique({ where: { id } });
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: { status: input.status },
      include: { statusChanges: { orderBy: { changedAt: 'desc' } } },
    });
    return this.toDomain(inquiry);
  }

  async updateNotes(id: string, input: UpdateInquiryNotesInput): Promise<IInquiry> {
    const inquiry = await this.prisma.inquiry.update({
      where: { id },
      data: { notes: input.notes },
    });
    return this.toDomain(inquiry);
  }

  async countByPropertyId(propertyId: string): Promise<number> {
    return this.prisma.inquiry.count({ where: { propertyId } });
  }

  async countByOwnerAndStatus(ownerUserId: string): Promise<{ status: string; count: number }[]> {
    const result = await this.prisma.inquiry.groupBy({
      by: ['status'],
      where: { ownerUserId },
      _count: { status: true },
    });
    return result.map((r) => ({ status: r.status, count: r._count.status }));
  }

  async addStatusChange(
    inquiryId: string,
    fromStatus: string | null,
    toStatus: string,
  ): Promise<void> {
    await this.prisma.inquiryStatusChange.create({
      data: { inquiryId, fromStatus, toStatus },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDomain(raw: any): IInquiry {
    return {
      id: raw.id,
      propertyId: raw.propertyId,
      name: raw.name,
      email: raw.email,
      phone: raw.phone,
      message: raw.message,
      status: raw.status as IInquiry['status'],
      notes: raw.notes,
      ownerUserId: raw.ownerUserId,
      userId: raw.userId,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      statusChanges: raw.statusChanges
        ? raw.statusChanges.map((sc: any) => ({
            id: sc.id,
            inquiryId: sc.inquiryId,
            fromStatus: sc.fromStatus,
            toStatus: sc.toStatus,
            changedAt: sc.changedAt,
          }))
        : undefined,
    };
  }
}
