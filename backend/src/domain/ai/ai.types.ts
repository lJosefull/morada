export interface AiPropertyInput {
  title: string;
  description: string;
  price: number;
  currency: string;
  propertyType: string;
  listingType: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  surface?: number | null;
  location: string;
}

export interface AiPropertyOutput {
  optimizedTitle: string;
  improvedDescription: string;
  qualityScore: number;
  suggestions: string[];
}

export const AI_SERVICE = 'AI_SERVICE';

export interface IAiService {
  enhanceProperty(input: AiPropertyInput): Promise<AiPropertyOutput>;
}
