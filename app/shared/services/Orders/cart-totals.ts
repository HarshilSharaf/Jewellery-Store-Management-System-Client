import {
  CartLineComputed,
  CartLineInput,
  CartLineTotals,
  CartTotals,
  ComputeCartOptions,
  MakingMode,
  TaxSlab,
} from '../../../interfaces/Shared/cart';

const DEFAULT_HSN = '7113';

function money(n: number): number {
  if (!Number.isFinite(n)) { return 0; }
  return Math.round(n * 100) / 100;
}

function computeMaking(
  mode: MakingMode,
  value: number,
  netWeight: number,
  metal: number
): number {
  const v = Number(value) || 0;
  const g = Number(netWeight) || 0;
  const m = Number(metal) || 0;
  switch (mode) {
    case 'flat':    return v;
    case 'perGram': return g * v;
    case 'percent': return m * (v / 100);
    default:        return 0;
  }
}

function pickSlab(hsn: string | undefined, slabs: Record<string, TaxSlab>): TaxSlab {
  const key = (hsn || DEFAULT_HSN).trim();
  const slab = slabs[key] || slabs[DEFAULT_HSN];
  if (slab) { return slab; }
  return { hsnCode: DEFAULT_HSN, cgstRate: 1.5, sgstRate: 1.5, igstRate: 3 };
}

export function computeLineTotals(
  line: CartLineInput,
  slab: TaxSlab,
  isInterState: boolean
): CartLineTotals {
  const metalValue    = money((Number(line.ratePerGram) || 0) * (Number(line.netWeight) || 0));
  const wastageCharge = money((Number(line.wastagePercent) || 0) / 100 * metalValue);
  const makingCharge  = money(computeMaking(line.makingMode, line.makingValue, line.netWeight, metalValue));
  const stoneCharge   = money(Number(line.stoneCharges) || 0);
  const discount      = money(Number(line.discountAmount) || 0);

  const taxableAmount = money(metalValue + wastageCharge + makingCharge + stoneCharge - discount);

  const cgst = isInterState ? 0 : money(taxableAmount * (slab.cgstRate / 100));
  const sgst = isInterState ? 0 : money(taxableAmount * (slab.sgstRate / 100));
  const igst = isInterState ? money(taxableAmount * (slab.igstRate / 100)) : 0;

  const lineTotal = money(taxableAmount + cgst + sgst + igst);

  return {
    metalValue,
    makingCharge,
    stoneCharge,
    wastageCharge,
    discountAmount: discount,
    taxableAmount,
    cgst,
    sgst,
    igst,
    lineTotal,
  };
}

export function computeCartTotals(
  lines: CartLineInput[],
  options: ComputeCartOptions
): CartTotals {
  const isInterState = String(options.shopStateCode).trim() !== String(options.invoicePlaceOfSupplyStateCode).trim();

  const computedLines: CartLineComputed[] = lines.map((line) => {
    const slab = pickSlab(line.hsnCode, options.taxSlabsByHsn);
    const totals = computeLineTotals(line, slab, isInterState);
    return { ...line, ...totals };
  });

  let subTotalTaxable   = 0;
  let totalMakingCharge = 0;
  let totalStoneCharge  = 0;
  let totalWastage      = 0;
  let totalDiscount     = 0;
  let totalCgst         = 0;
  let totalSgst         = 0;
  let totalIgst         = 0;

  for (const l of computedLines) {
    subTotalTaxable   += l.taxableAmount;
    totalMakingCharge += l.makingCharge;
    totalStoneCharge  += l.stoneCharge;
    totalWastage      += l.wastageCharge;
    totalDiscount     += l.discountAmount;
    totalCgst         += l.cgst;
    totalSgst         += l.sgst;
    totalIgst         += l.igst;
  }

  const oldGoldCreditAmount = money(Number(options.oldGoldCreditAmount) || 0);
  const rawGrand = subTotalTaxable + totalCgst + totalSgst + totalIgst - oldGoldCreditAmount;
  const rounded = options.roundOff === false ? rawGrand : Math.round(rawGrand);
  const roundOffAmount = money(rounded - rawGrand);
  const grandTotal = money(rounded);

  return {
    lines: computedLines,
    subTotalTaxable: money(subTotalTaxable),
    totalMakingCharge: money(totalMakingCharge),
    totalStoneCharge: money(totalStoneCharge),
    totalWastageCharge: money(totalWastage),
    totalDiscount: money(totalDiscount),
    totalCgst: money(totalCgst),
    totalSgst: money(totalSgst),
    totalIgst: money(totalIgst),
    oldGoldCreditAmount,
    roundOffAmount,
    grandTotal,
  };
}
