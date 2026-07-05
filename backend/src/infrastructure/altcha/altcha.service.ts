import { Injectable } from '@nestjs/common';
import { createChallenge, verifySolution } from 'altcha-lib/v1';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class AltchaService {
  constructor(private readonly prisma: PrismaService) {}

  private get hmacKey(): string {
    const key = process.env.ALTCHA_HMAC_KEY;
    if (!key) {
      throw new Error('ALTCHA_HMAC_KEY is not configured');
    }
    return key;
  }

  async generateChallenge(): Promise<{
    algorithm: string;
    challenge: string;
    salt: string;
    signature: string;
    maxnumber: number;
  }> {
    return createChallenge({
      hmacKey: this.hmacKey,
      maxNumber: 50000,
    });
  }

  async verifyPayload(payload: string): Promise<boolean> {
    const valid = await verifySolution(payload, this.hmacKey);
    if (!valid) return false;

    const nonce = this.extractNonce(payload);
    if (!nonce) return false;

    const existing = await this.prisma.usedAltchaNonce.findUnique({
      where: { nonce },
    });
    if (existing) return false;

    await this.prisma.usedAltchaNonce.create({ data: { nonce } });
    await this.cleanupOldNonces();

    return true;
  }

  private extractNonce(payload: string): string | null {
    try {
      const decoded = Buffer.from(payload, 'base64url').toString('utf8');
      const data = JSON.parse(decoded);
      return data.salt || null;
    } catch {
      return null;
    }
  }

  private async cleanupOldNonces(): Promise<void> {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    await this.prisma.usedAltchaNonce.deleteMany({
      where: { createdAt: { lt: cutoff } },
    });
  }
}
