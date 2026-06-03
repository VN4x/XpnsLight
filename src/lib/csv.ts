import type { Expense } from './types';
import { formatMoney } from './vat';

const HEADERS = [
  'date',
  'document_number',
  'vendor',
  'reference_tag',
  'gross_with_vat',
  'net_zero_vat',
  'vat_amount',
  'vat_rate',
] as const;

function escapeCell(value: string | number): string {
  const str = String(value);
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function expensesToCsv(rows: Expense[]): string {
  const lines = [HEADERS.join(',')];
  for (const row of rows) {
    lines.push(
      [
        row.date,
        row.document_number,
        row.vendor,
        row.reference_tag,
        formatMoney(row.gross_with_vat),
        formatMoney(row.net_zero_vat),
        formatMoney(row.vat_amount),
        row.vat_rate,
      ]
        .map(escapeCell)
        .join(','),
    );
  }
  return lines.join('\n');
}
