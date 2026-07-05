declare module 'altcha-lib/v1' {
  export type Algorithm = 'SHA-1' | 'SHA-256' | 'SHA-512';

  export interface ChallengeOptions {
    hmacKey: string;
    maxNumber?: number;
    saltLength?: number;
    algorithm?: Algorithm;
    salt?: string;
    number?: number;
    params?: string | Record<string, string>;
    expires?: Date;
  }

  export interface Challenge {
    algorithm: string;
    challenge: string;
    maxnumber: number;
    salt: string;
    signature: string;
  }

  export interface Solution {
    number: number;
    took: number;
  }

  export function createChallenge(options: ChallengeOptions): Promise<Challenge>;

  export function verifySolution(
    payload: string,
    hmacKey: string,
    checkExpires?: boolean,
  ): Promise<boolean>;

  export function solveChallenge(
    challenge: string,
    salt: string,
    algorithm?: Algorithm,
    max?: number,
    start?: number,
  ): { promise: Promise<Solution | null>; controller: AbortController };
}
