import { Capacitor } from '@capacitor/core';
import { Share } from '@capacitor/share';

export async function shareCsvExport(csv: string, filename = 'expenses-export.csv'): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    await Share.share({
      title: 'Expense Export',
      text: csv,
      dialogTitle: 'Export expenses as CSV',
    });
    return;
  }

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
