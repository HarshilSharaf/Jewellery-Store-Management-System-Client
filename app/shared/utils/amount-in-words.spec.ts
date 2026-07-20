import { numberToIndianRupees } from './amount-in-words';

describe('numberToIndianRupees', () => {
  it('handles zero', () => {
    expect(numberToIndianRupees(0)).toBe('Rupees Zero Only');
  });

  it('handles one rupee', () => {
    expect(numberToIndianRupees(1)).toBe('Rupees One Only');
  });

  it('handles one hundred', () => {
    expect(numberToIndianRupees(100)).toBe('Rupees One Hundred Only');
  });

  it('handles rupees + paise', () => {
    expect(numberToIndianRupees(1234.56))
      .toBe('Rupees One Thousand Two Hundred Thirty Four and Fifty Six Paise Only');
  });

  it('handles one crore', () => {
    expect(numberToIndianRupees(10000000)).toBe('Rupees One Crore Only');
  });

  it('handles a lakh-and-thousands amount with paise', () => {
    expect(numberToIndianRupees(9999999.99))
      .toBe('Rupees Ninety Nine Lakh Ninety Nine Thousand Nine Hundred Ninety Nine and Ninety Nine Paise Only');
  });

  it('rounds paise so 0.995 becomes rupees += 1 with zero paise', () => {
    expect(numberToIndianRupees(0.995)).toBe('Rupees One Only');
  });

  it('handles negative amounts with Minus prefix', () => {
    expect(numberToIndianRupees(-42)).toBe('Minus Rupees Forty Two Only');
  });
});
