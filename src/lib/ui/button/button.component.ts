import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'lg';

@Component({
  selector: 'mm-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[class.block]': 'block()' },
  template: `
    <button
      [type]="type()"
      [class]="'btn ' + variant() + ' ' + size()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
    >
      @if (loading()) {
        <span class="spinner" aria-hidden="true"></span>
      }
      <ng-content />
    </button>
  `,
  styles: `
    :host { display: inline-flex; }
    :host(.block) { display: flex; }
    :host(.block) .btn { width: 100%; }
    .btn {
      display: inline-flex; align-items: center; justify-content: center; gap: var(--mm-space-2);
      min-height: var(--mm-touch); padding: 0 var(--mm-space-5);
      border-radius: var(--mm-radius-md); border: var(--mm-border-width) solid transparent;
      font: inherit; font-weight: 700; font-size: var(--mm-text-sm); cursor: pointer;
      transition: transform var(--mm-duration) var(--mm-ease), background var(--mm-duration) var(--mm-ease), opacity var(--mm-duration);
    }
    .btn.lg { min-height: 52px; font-size: var(--mm-text-md); }
    .btn:active:not(:disabled) { transform: scale(0.97); }
    .btn:disabled { opacity: 0.55; cursor: not-allowed; }
    .primary { background: var(--mm-primary); color: var(--mm-on-primary); }
    .primary:hover:not(:disabled) { background: color-mix(in srgb, var(--mm-primary) 88%, var(--mm-text)); }
    .secondary { background: transparent; color: var(--mm-text); border-color: var(--mm-border-strong); }
    .secondary:hover:not(:disabled) { background: var(--mm-surface); }
    .ghost { background: transparent; color: var(--mm-text); }
    .ghost:hover:not(:disabled) { background: var(--mm-surface); }
    .spinner {
      width: 16px; height: 16px; border-radius: 50%;
      border: 2px solid currentColor; border-right-color: transparent;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<'button' | 'submit'>('button');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly block = input(false);
}
