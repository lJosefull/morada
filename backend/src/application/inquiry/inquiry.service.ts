import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import {
  IInquiryRepository,
  INQUIRY_REPOSITORY,
} from '../../domain/inquiry/inquiry.repository';
import { IPropertyRepository, PROPERTY_REPOSITORY } from '../../domain/properties/property.repository';
import { CreateInquiryInput, UpdateInquiryStatusInput, UpdateInquiryNotesInput } from '../../domain/inquiry/inquiry.entity';
import { CreateInquiryDto, UpdateInquiryStatusDto, UpdateInquiryNotesDto } from '../../interfaces/inquiry/inquiry.dto';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class InquiryService {
  constructor(
    @Inject(INQUIRY_REPOSITORY)
    private readonly inquiryRepository: IInquiryRepository,
    @Inject(PROPERTY_REPOSITORY)
    private readonly propertyRepository: IPropertyRepository,
    private readonly prisma: PrismaService,
  ) {}

  async create(propertyId: string, dto: CreateInquiryDto, userId?: string) {
    const property = await this.propertyRepository.findById(propertyId);
    if (!property) {
      throw new NotFoundException('Property not found');
    }

    const input: CreateInquiryInput = {
      propertyId,
      name: dto.name,
      email: dto.email,
      phone: dto.phone || undefined,
      message: dto.message,
      ownerUserId: property.userId,
      userId: userId || undefined,
    };

    const inquiry = await this.inquiryRepository.create(input);

    // Create notification for property owner
    await this.prisma.notification.create({
      data: {
        userId: property.userId,
        type: 'inquiry_new',
        title: 'New inquiry received',
        message: `${dto.name} is interested in "${property.title}"`,
        link: `/inquiries`,
      },
    }).catch((err) => console.error('Failed to create notification:', err));

    return inquiry;
  }

  async findMine(ownerUserId: string, status?: string) {
    const [data, total] = await this.inquiryRepository.findByOwner(ownerUserId, status);
    return { data, total };
  }

  async findOne(id: string, ownerUserId: string) {
    const inquiry = await this.inquiryRepository.findById(id);
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    if (inquiry.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You can only view your own inquiries');
    }
    return inquiry;
  }

  async updateStatus(id: string, dto: UpdateInquiryStatusDto, ownerUserId: string) {
    const inquiry = await this.inquiryRepository.findById(id);
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    if (inquiry.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You can only update your own inquiries');
    }
    const input: UpdateInquiryStatusInput = { status: dto.status };
    const updated = await this.inquiryRepository.updateStatus(id, input);
    await this.inquiryRepository.addStatusChange(id, inquiry.status, dto.status);
    return updated;
  }

  async updateNotes(id: string, dto: UpdateInquiryNotesDto, ownerUserId: string) {
    const inquiry = await this.inquiryRepository.findById(id);
    if (!inquiry) {
      throw new NotFoundException('Inquiry not found');
    }
    if (inquiry.ownerUserId !== ownerUserId) {
      throw new ForbiddenException('You can only update your own inquiries');
    }
    const input: UpdateInquiryNotesInput = { notes: dto.notes };
    return this.inquiryRepository.updateNotes(id, input);
  }

  async findMyHistory(userId: string) {
    const [data, total] = await this.inquiryRepository.findByUser(userId);
    return { data, total };
  }

  async getStats(ownerUserId: string) {
    const byStatus = await this.inquiryRepository.countByOwnerAndStatus(ownerUserId);
    const total = byStatus.reduce((acc, curr) => acc + curr.count, 0);
    return { total, byStatus };
  }
}
