import { z } from "zod";
import { StatementMetadata, StatementRow } from "../types/statement";
import { AppError } from "../utils/appError";

const statementRowSchema = z.object({
  documentName: z.string().min(1),
  rawLine: z.string(),
  normalizedLineItem: z.string().min(1),
  values: z.array(z.number().finite()).max(4),
  ambiguity: z.string(),
  confidence: z.number().min(0).max(1),
});

const statementMetadataSchema = z.object({
  documentName: z.string().min(1),
  years: z.array(z.string().regex(/^(19|20)\d{2}$/)).max(4),
  currency: z.string().min(1),
  units: z.string().min(1),
});

export function validateStatementRows(rows: StatementRow[]): StatementRow[] {
  const parsed = z.array(statementRowSchema).safeParse(rows);
  if (!parsed.success) {
    throw new AppError(`Invalid extracted row format: ${parsed.error.issues[0]?.message ?? "unknown error"}`, 422);
  }
  return parsed.data;
}

export function validateStatementMetadata(metadata: StatementMetadata[]): StatementMetadata[] {
  const parsed = z.array(statementMetadataSchema).safeParse(metadata);
  if (!parsed.success) {
    throw new AppError(
      `Invalid extracted metadata format: ${parsed.error.issues[0]?.message ?? "unknown error"}`,
      422,
    );
  }
  return parsed.data;
}
