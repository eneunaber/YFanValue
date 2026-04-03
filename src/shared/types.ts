import { z } from "zod";

export const playerRecordSchema = z.object({
  YAHOOID: z.union([z.string(), z.number()]).optional(),
  Dollars: z.union([z.number(), z.string(), z.null()]).optional()
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
