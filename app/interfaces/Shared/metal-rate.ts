export type MetalRateSession = 'AM' | 'PM';
export type MetalRateSource = 'manual' | 'ibja';

export interface MetalRateRow {
  id?: number;
  effectiveDate: string;
  session: MetalRateSession;
  purityCode: string;
  purityLabel?: string;
  metalType?: 'gold' | 'silver' | 'platinum';
  ratePerGram: number;
  source: MetalRateSource;
  setByUserId?: number | null;
  createdAt?: string;
}

export interface MetalRateUpsertPayload {
  purityCode: string;
  ratePerGram: number;
}

export interface SaveMetalRatesRequest {
  effectiveDate: string;
  session: MetalRateSession;
  source?: MetalRateSource;
  setByUserId?: number | null;
  rates: MetalRateUpsertPayload[];
}
