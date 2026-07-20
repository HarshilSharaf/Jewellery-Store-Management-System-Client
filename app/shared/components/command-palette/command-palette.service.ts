import { Injectable, signal } from '@angular/core';

export type ActionKind = 'nav' | 'callback' | 'sub' | 'recent';

export type SubPaletteId =
  | 'add-customer'
  | 'enroll-scheme'
  | 'lock-rate';

export interface CommandAction {
  id: string;
  label: string;
  description?: string;
  section: string;
  kind: ActionKind;
  icon?: string;
  shortcut?: string;
  route?: string | any[];
  sub?: SubPaletteId;
  run?: () => void | Promise<void>;
  keywords?: string;
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteService {
  private readonly _isOpen = signal<boolean>(false);
  readonly isOpen = this._isOpen.asReadonly();

  private readonly _actions = signal<CommandAction[]>([]);
  readonly actions = this._actions.asReadonly();

  open(): void {
    this._isOpen.set(true);
  }

  close(): void {
    this._isOpen.set(false);
  }

  toggle(): void {
    this._isOpen.update((v) => !v);
  }

  register(actions: CommandAction[]): void {
    this._actions.set(actions);
  }
}
