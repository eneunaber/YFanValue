import { z } from "zod";
import { YAHOO_PLAYER_ID_PATTERN } from "./yahooPlayerId";

const yahooIdSchema = z.union([
  z.string().trim().regex(YAHOO_PLAYER_ID_PATTERN, "Yahoo player ID must be 4 or 5 digits"),
  z.number().int().min(1000).max(99999)
]);
const dollarsSchema = z
  .union([z.number().finite(), z.string().trim().min(1)])
  .refine((value) => Number.isFinite(Number(value)), "Dollars must be numeric");

export const playerRecordSchema = z.object({
  YAHOOID: yahooIdSchema,
  Dollars: dollarsSchema
});

export const playerDataSchema = z.array(playerRecordSchema);

export type PlayerRecord = z.infer<typeof playerRecordSchema>;

export interface StoredPlayerValues {
  DraftValues: string;
  CurrentValues: string;
}

export interface ErrorResponse {
  error: string;
}
