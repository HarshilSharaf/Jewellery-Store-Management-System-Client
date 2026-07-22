export interface Purity {
  code: string;
  label: string;
  metalType: 'gold' | 'silver' | 'platinum';
  fineness: number;
  sortOrder?: number;
  active?: 0 | 1;
}
