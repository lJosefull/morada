import { Injectable } from '@nestjs/common';
import { createChallenge, verifySolution, HmacAlgorithm } from 'altcha-lib';

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
    algorithm: HmacAlgorithm;
    challenge: string;
    salt: string;
    signature: string;
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
