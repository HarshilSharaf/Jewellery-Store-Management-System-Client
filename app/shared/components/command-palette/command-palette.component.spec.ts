import { TestBed } from '@angular/core/testing';

import { CommandPaletteComponent } from './command-palette.component';
import { CommandPaletteService } from './command-palette.service';

// Small fuzzy-match spec. We test the private `match` via casting since it
// carries the core filter contract (substring wins, subsequence fallback,
// unmatched char rejects).
describe('CommandPaletteComponent fuzzy match', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CommandPaletteComponent],
    }).compileComponents();
  });

  function build(): CommandPaletteComponent {
    const fixture = TestBed.createComponent(CommandPaletteComponent);
    return fixture.componentInstance;
  }

  it('substring match wins over subsequence, rejects unmatched char', () => {
    const c: any = build();
    const sub = c.match({ label: 'Customers', section: 'NAV', keywords: '' }, 'cust');
    const seq = c.match({ label: 'Customers', section: 'NAV', keywords: '' }, 'csr');
    const bad = c.match({ label: 'Sell', section: 'NAV', keywords: 'invoice' }, 'zzq');
    expect(sub).toBeGreaterThanOrEqual(0);
    expect(seq).toBeGreaterThanOrEqual(0);
    expect(sub).toBeLessThan(seq);
    expect(bad).toBe(-1);
  });

  it('case-insensitive keyword hit', () => {
    const c: any = build();
    const s = c.match({ label: 'Toggle theme', section: 'QUICK', keywords: 'dark light mode' }, 'DARK');
    expect(s).toBeGreaterThanOrEqual(0);
  });
});

describe('CommandPaletteService', () => {
  it('open/close/toggle isOpen signal', () => {
    const svc = new CommandPaletteService();
    expect(svc.isOpen()).toBe(false);
    svc.open();
    expect(svc.isOpen()).toBe(true);
    svc.close();
    expect(svc.isOpen()).toBe(false);
    svc.toggle();
    expect(svc.isOpen()).toBe(true);
  });
});
