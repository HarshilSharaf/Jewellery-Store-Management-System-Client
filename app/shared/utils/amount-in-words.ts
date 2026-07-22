const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) { return ONES[n]; }
  const t = Math.floor(n / 10);
  const o = n % 10;
  return o === 0 ? TENS[t] : `${TENS[t]} ${ONES[o]}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const parts: string[] = [];
  if (h > 0) { parts.push(`${ONES[h]} Hundred`); }
  if (rest > 0) { parts.push(twoDigits(rest)); }
  return parts.join(' ');
}

function integerToIndianWords(n: number): string {
  if (n === 0) { return 'Zero'; }

  const crore = Math.floor(n / 10000000);
  const lakh = Math.floor((n % 10000000) / 100000);
  const thousand = Math.floor((n % 100000) / 1000);
  const hundred = n % 1000;

  const parts: string[] = [];
  if (crore > 0) { parts.push(`${integerToIndianWords(crore)} Crore`); }
  if (lakh > 0) { parts.push(`${twoDigits(lakh)} Lakh`); }
  if (thousand > 0) { parts.push(`${twoDigits(thousand)} Thousand`); }
  if (hundred > 0) { parts.push(threeDigits(hundred)); }

  return parts.join(' ').trim();
}

export function numberToIndianRupees(amount: number): string {
  if (amount === null || amount === undefined || Number.isNaN(Number(amount))) {
    return 'Rupees Zero Only';
  }
  const value = Number(amount);
  const negative = value < 0;
  const abs = Math.abs(value);

  let rupees = Math.floor(abs);
  let paise = Math.round((abs - rupees) * 100);
  if (paise === 100) { rupees += 1; paise = 0; }

  const rupeesWords = integerToIndianWords(rupees);
  const sign = negative ? 'Minus ' : '';

  if (paise === 0) {
    return `${sign}Rupees ${rupeesWords} Only`;
  }
  const paiseWords = twoDigits(paise);
  return `${sign}Rupees ${rupeesWords} and ${paiseWords} Paise Only`;
}
