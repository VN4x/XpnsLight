import PocketBase from 'pocketbase';
import type { Expense, ExpenseInput } from './types';

const DEFAULT_URL = 'http://100.x.x.x:18312';

export const pb = new PocketBase(
  import.meta.env.VITE_POCKETBASE_URL ?? DEFAULT_URL,
);

pb.autoCancellation(false);

export async function fetchExpenses(): Promise<Expense[]> {
  const records = await pb.collection('expenses').getFullList({
    sort: '-date',
  });
  return records.map(mapRecord);
}

export async function createExpense(data: ExpenseInput): Promise<Expense> {
  const record = await pb.collection('expenses').create(data);
  return mapRecord(record);
}

function mapRecord(record: Record<string, unknown>): Expense {
  return {
    id: String(record.id),
    date: String(record.date ?? '').slice(0, 10),
    document_number: String(record.document_number ?? ''),
    vendor: String(record.vendor ?? ''),
    reference_tag: String(record.reference_tag ?? ''),
    gross_with_vat: Number(record.gross_with_vat ?? 0),
    net_zero_vat: Number(record.net_zero_vat ?? 0),
    vat_amount: Number(record.vat_amount ?? 0),
    vat_rate: Number(record.vat_rate ?? 0),
    created: record.created as string | undefined,
    updated: record.updated as string | undefined,
  };
}
