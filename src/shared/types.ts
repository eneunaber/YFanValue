import { z } from "zod";

const yahooIdSchema = z.union([z.string().trim().min(1), z.number().int()]);
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
