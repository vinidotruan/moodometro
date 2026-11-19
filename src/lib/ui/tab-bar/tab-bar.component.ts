import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

export interface Tab {
  id: string;
  label: string;
}

export const DEFAULT_TABS: Tab[] = [
  { id: 'hoje', label: 'Hoje' },
  { id: 'galeria', label: 'Galeria' },
  { id: 'pessoas', label: 'Pessoas' },
  { id: 'convidar', label: 'Convidar' },
];

@Component({
  selector: 'mm-tab-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav aria-label="Navegação principal">
      @for (t of tabs(); track t.id) {
        <button
          type="button"
          [class.on]="active() === t.id"
          [attr.aria-current]="active() === t.id ? 'page' : null"
          (click)="active.set(t.id)"
        >
          <span class="dot" aria-hidden="true"></span>
          {{ t.label }}
        </button>
      }
    </nav>
  `,
  styles: `
    nav {
      display: grid; grid-auto-flow: column; grid-auto-columns: minmax(0, 1fr);
      border-top: var(--mm-border-width) solid var(--mm-border); background: var(--mm-surface);
    }
    button {
      min-height: 64px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
      background: none; border: 0; font: inherit; font-size: var(--mm-text-xs); color: var(--mm-text-muted); cursor: pointer;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: transparent; }
    button.on { color: var(--mm-text); font-weight: 700; }
    button.on .dot { background: var(--mm-primary); }
  `,
})
export class TabBarComponent {
  readonly tabs = input<Tab[]>(DEFAULT_TABS);
  readonly active = model('hoje');
}
