export const VAT_OPTIONS = [0, 5, 20] as const;
export type VatRate = (typeof VAT_OPTIONS)[number];

export interface VatBreakdown {
  gross: number;
  net: number;
  vat: number;
}

/** Derive net (ZeroVAT) and VAT from gross (WithVAT) and rate %. */
export function calculateFromGross(gross: number, ratePercent: VatRate): VatBreakdown {
  if (!Number.isFinite(gross) || gross < 0) {
    return { gross: 0, net: 0, vat: 0 };
  }
  if (ratePercent === 0) {
    return { gross, net: gross, vat: 0 };
  }
  const net = gross / (1 + ratePercent / 100);
  const vat = gross - net;
  return {
    gross,
    net: roundMoney(net),
    vat: roundMoney(vat),
  };
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatMoney(value: number): string {
  return value.toFixed(2);
}
