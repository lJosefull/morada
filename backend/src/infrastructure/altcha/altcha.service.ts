import { Injectable } from '@nestjs/common';
import { createChallenge, verifySolution } from 'altcha-lib/v1';

@Injectable()
export class AltchaService {
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
    return verifySolution(payload, this.hmacKey);
  }
}
