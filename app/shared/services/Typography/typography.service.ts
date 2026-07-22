import { Injectable, signal } from '@angular/core';

export type TypographyPreset =
  | 'editorial'
  | 'modern_sans'
  | 'traditional_devanagari'
  | 'compact';

export interface PresetDefinition {
  id: TypographyPreset;
  label: string;
  description: string;
  vars: Record<string, string>;
  previewSample: {
    display: string;
    body: string;
    devanagari: string;
  };
}

const STORAGE_KEY = 'jsms.typography.preset';
const DATA_ATTR = 'typographyPreset';

const PRESETS: readonly PresetDefinition[] = [
  {
    id: 'editorial',
    label: 'Editorial (default)',
    description: 'Instrument Serif for headlines, Inter for body. The current design direction.',
    vars: {
      '--font-family-display':    '"Instrument Serif", "Fraunces", ui-serif, Georgia, serif',
      '--font-family-body':       'Inter, Hind, system-ui, sans-serif',
      '--font-family-devanagari': 'Hind, Inter, system-ui, sans-serif',
      '--font-family-mono':       'ui-monospace, monospace',
      '--font-size-base':         '0.875rem',
      '--font-size-scale':        '1',
      '--line-height-base':       '1.5',
      // Legacy tokens the codebase already reads. Keeping them in sync
      // means every existing var(--font-sans/serif/mono) call site becomes
      // preset-aware without touching those files.
      '--font-sans':              'Inter, Hind, system-ui, sans-serif',
      '--font-serif':             '"Instrument Serif", "Fraunces", ui-serif, Georgia, serif',
      '--font-mono':              'ui-monospace, monospace',
    },
    previewSample: {
      display: 'Radiance Jewellers',
      body: '₹42,180 · Grand total',
      devanagari: 'नमस्ते',
    },
  },
  {
    id: 'modern_sans',
    label: 'Modern Sans',
    description: 'Inter everywhere. Feels like Linear.',
    vars: {
      '--font-family-display':    'Inter, Hind, system-ui, sans-serif',
      '--font-family-body':       'Inter, Hind, system-ui, sans-serif',
      '--font-family-devanagari': 'Hind, Inter, system-ui, sans-serif',
      '--font-family-mono':       'ui-monospace, monospace',
      '--font-size-base':         '0.875rem',
      '--font-size-scale':        '0.98',
      '--line-height-base':       '1.5',
      '--font-sans':              'Inter, Hind, system-ui, sans-serif',
      '--font-serif':             'Inter, Hind, system-ui, sans-serif',
      '--font-mono':              'ui-monospace, monospace',
    },
    previewSample: {
      display: 'Radiance Jewellers',
      body: '₹42,180 · Grand total',
      devanagari: 'नमस्ते',
    },
  },
  {
    id: 'traditional_devanagari',
    label: 'Traditional Devanagari',
    description: 'Hind for headlines and body. For shops with primarily Hindi / Marathi / Gujarati clientele.',
    vars: {
      '--font-family-display':    'Hind, "Instrument Serif", ui-serif, sans-serif',
      '--font-family-body':       'Hind, Inter, system-ui, sans-serif',
      '--font-family-devanagari': 'Hind, Inter, system-ui, sans-serif',
      '--font-family-mono':       'ui-monospace, monospace',
      '--font-size-base':         '0.875rem',
      '--font-size-scale':        '1',
      '--line-height-base':       '1.6',
      '--font-sans':              'Hind, Inter, system-ui, sans-serif',
      '--font-serif':             'Hind, "Instrument Serif", ui-serif, sans-serif',
      '--font-mono':              'ui-monospace, monospace',
    },
    previewSample: {
      display: 'Radiance Jewellers',
      body: '₹42,180 · Grand total',
      devanagari: 'नमस्ते',
    },
  },
  {
    id: 'compact',
    label: 'Compact',
    description: 'Denser layout, smaller base size (13px). For power-users who want maximum information density.',
    vars: {
      '--font-family-display':    '"Instrument Serif", "Fraunces", ui-serif, Georgia, serif',
      '--font-family-body':       'Inter, Hind, system-ui, sans-serif',
      '--font-family-devanagari': 'Hind, Inter, system-ui, sans-serif',
      '--font-family-mono':       'ui-monospace, monospace',
      '--font-size-base':         '0.8125rem',
      '--font-size-scale':        '0.95',
      '--line-height-base':       '1.4',
      '--font-sans':              'Inter, Hind, system-ui, sans-serif',
      '--font-serif':             '"Instrument Serif", "Fraunces", ui-serif, Georgia, serif',
      '--font-mono':              'ui-monospace, monospace',
    },
    previewSample: {
      display: 'Radiance Jewellers',
      body: '₹42,180 · Grand total',
      devanagari: 'नमस्ते',
    },
  },
];

const VALID_IDS = new Set<TypographyPreset>(
  PRESETS.map(p => p.id),
);

@Injectable({ providedIn: 'root' })
export class TypographyService {

  readonly presets: readonly PresetDefinition[] = PRESETS;

  private readonly _activePreset = signal<TypographyPreset>(this.readInitial());
  readonly activePreset = this._activePreset.asReadonly();

  getPreset(id: TypographyPreset): PresetDefinition {
    return this.presets.find(p => p.id === id) ?? this.presets[0];
  }

  applyPreset(preset: TypographyPreset, options: { persistLocal?: boolean } = {}): void {
    const def = this.getPreset(preset);
    this._activePreset.set(def.id);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      for (const [name, value] of Object.entries(def.vars)) {
        root.style.setProperty(name, value);
      }
      root.dataset[DATA_ATTR] = def.id;
    }
    if (options.persistLocal !== false) {
      this.persistLocal(def.id);
    }
  }

  clearInlineOverrides(): void {
    if (typeof document === 'undefined') { return; }
    const root = document.documentElement;
    for (const def of this.presets) {
      for (const name of Object.keys(def.vars)) {
        root.style.removeProperty(name);
      }
    }
  }

  /**
   * Called once on app boot. Reads the persisted preset from localStorage
   * (the same key the pre-hydration inline script in index.html read) and
   * applies it. The inline script has already set data-typography-preset
   * on <html> so CSS matched at first paint; this call layers the inline
   * CSS custom properties on top so live-preview swaps stay consistent
   * with the persisted preset.
   */
  hydrate(): TypographyPreset {
    const preset = this.readInitial();
    this.applyPreset(preset);
    return preset;
  }

  /**
   * Save-and-apply. Persistence is renderer-local (localStorage). Y's
   * original spec called for a ShopSettings.typographyPreset column so
   * the preset would be shop-wide; that DB path is deferred pending
   * coordination with the parent-repo schema owners. LocalStorage keeps
   * the preset stable across relaunches on the same machine, which is
   * the primary user requirement (small single-shop deployments).
   */
  savePreset(preset: TypographyPreset): void {
    this.applyPreset(preset);
  }

  private readInitial(): TypographyPreset {
    if (typeof document !== 'undefined') {
      const attr = document.documentElement.dataset[DATA_ATTR];
      if (attr && VALID_IDS.has(attr as TypographyPreset)) {
        return attr as TypographyPreset;
      }
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && VALID_IDS.has(stored as TypographyPreset)) {
        return stored as TypographyPreset;
      }
    } catch { /* localStorage unavailable */ }
    return 'editorial';
  }

  private persistLocal(preset: TypographyPreset): void {
    try { localStorage.setItem(STORAGE_KEY, preset); }
    catch { /* localStorage unavailable */ }
  }
}
