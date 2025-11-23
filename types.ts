export interface HandwritingAnalysis {
  score: number;
  isPassing: boolean;
  feedback: string[];
  strengths: string[];
  improvements: string[];
}

export enum AppState {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR'
}
