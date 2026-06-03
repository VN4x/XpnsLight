import PocketBase from 'pocketbase';
import type { Expense, ExpenseInput } from './types';

const DEFAULT_URL = 'https://100.x.x.x:18312';

function resolveBaseUrl(): string {
  const url = (import.meta.env.VITE_POCKETBASE_URL ?? DEFAULT_URL).replace(/\/$/, '');
  const allowHttp = import.meta.env.VITE_ALLOW_HTTP === 'true';

  if (import.meta.env.PROD && url.startsWith('http://') && !allowHttp) {
    throw new Error(
      'VITE_POCKETBASE_URL must use HTTPS in production. Set VITE_ALLOW_HTTP=true only for local dev.',
    );
  }

  return url;
}

export const pb = new PocketBase(resolveBaseUrl());

pb.autoCancellation(false);

export async function fetchExpenses(): Promise<Expense[]> {
  if (!pb.authStore.isValid) {
    throw new Error('Not authenticated.');
  }
  const records = await pb.collection('expenses').getFullList({
    sort: '-date',
  });
  return records.map(mapRecord);
}

export async function createExpense(data: ExpenseInput): Promise<Expense> {
  if (!pb.authStore.isValid) {
    throw new Error('Not authenticated.');
  }
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
