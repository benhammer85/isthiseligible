
export enum EligibilityStatus {
  ELIGIBLE = 'ELIGIBLE',
  INELIGIBLE = 'INELIGIBLE',
  ON_THE_FENCE = 'ON_THE_FENCE',
  UNCLEAR = 'UNCLEAR'
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface AnalysisResult {
  status: EligibilityStatus;
  reasoning: string;
  recommendations: string[];
  itemName?: string;
  estimatedCost?: string;
  isReceiptDetected: boolean;
  followUpQuestions?: string[];
  groundingUrls?: GroundingSource[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  itemName: string;
  status: EligibilityStatus;
  reasoning: string;
}

export interface AnalysisState {
  isAnalyzing: boolean;
  result: AnalysisResult | null;
  error: string | null;
}