declare module 'altcha-lib' {
  export type HmacAlgorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

  export interface ChallengeOptions {
    hmacKey: string;
    maxNumber?: number;
    saltLength?: number;
    algorithm?: HmacAlgorithm;
  }

  export interface Challenge {
    algorithm: HmacAlgorithm;
    challenge: string;
    salt: string;
    signature: string;
  }

  export function createChallenge(options: ChallengeOptions): Promise<Challenge>;

  export function verifySolution(
    payload: string,
    hmacKey: string,
    checkExpires?: boolean,
  ): Promise<boolean>;

  export function solveChallenge(
    challenge: Challenge,
    salt: string,
    algorithm: HmacAlgorithm,
    max: number,
    start?: number,
  ): Promise<{ number: number; took: number }>;
}
