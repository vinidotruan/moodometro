import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';

/** Chip alternável: assuntos ("Trabalho", "Nós dois"), quem vê o humor etc. */
@Component({
  selector: 'mm-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      type="button"
      class="chip"
      [class.on]="selected()"
      [attr.aria-pressed]="selected()"
      [disabled]="disabled()"
      (click)="selected.set(!selected())"
    >
      <ng-content />
    </button>
  `,
  styles: `
    :host { display: inline-flex; }
    .chip {
      min-height: var(--mm-touch); padding: 0 var(--mm-space-4);
      border-radius: var(--mm-radius-pill);
      border: var(--mm-border-width) solid var(--mm-border-strong);
      background: var(--mm-bg); color: var(--mm-text);
      font: inherit; font-size: var(--mm-text-sm); font-weight: 600; cursor: pointer;
      transition: background var(--mm-duration) var(--mm-ease), color var(--mm-duration) var(--mm-ease);
    }
    .chip:hover:not(:disabled) { background: var(--mm-surface); }
    .chip.on { background: var(--mm-text); color: var(--mm-bg); border-color: var(--mm-text); }
    .chip:disabled { opacity: 0.55; cursor: not-allowed; }
  `,
})
export class ChipComponent {
  readonly selected = model(false);
  readonly disabled = input(false);
}
