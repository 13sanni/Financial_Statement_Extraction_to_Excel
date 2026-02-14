export type StatementRow = {
  documentName: string;
  rawLine: string;
  normalizedLineItem: string;
  values: number[];
  ambiguity: string;
  confidence: number;
};

export type StatementMetadata = {
  documentName: string;
  years: string[];
  currency: string;
  units: string;
};
