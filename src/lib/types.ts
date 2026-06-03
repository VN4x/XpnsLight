export interface Expense {
  id: string;
  date: string;
  document_number: string;
  vendor: string;
  reference_tag: string;
  gross_with_vat: number;
  net_zero_vat: number;
  vat_amount: number;
  vat_rate: number;
  created?: string;
  updated?: string;
}

export type ExpenseInput = Omit<Expense, 'id' | 'created' | 'updated'>;

export interface VendorSummary {
  vendor: string;
  netTotal: number;
  grossTotal: number;
  count: number;
}
