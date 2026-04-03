export interface PlayerRecord {
  YAHOOID?: string | number;
  Dollars?: number | string | null;
}

export interface StoredPlayerValues {
  DraftValues: string;
  CurrentValues: string;
}

export interface ErrorResponse {
  error: string;
}
