import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Seção íntima. Só renderiza o conteúdo quando `unlocked` é true —
 * o app deve passar true apenas quando os DOIS aceitaram uma relação de namoro.
 * Fora disso mostra só um aviso, sem o conteúdo no DOM.
 */
@Component({
  selector: 'mm-private-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (unlocked()) {
      <section class="box" [attr.aria-label]="title()">
        <header>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
            <rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
          <span class="title">{{ title() }}</span>
          <span class="hint">{{ hint() }}</span>
        </header>
        <div class="content"><ng-content /></div>
      </section>
    } @else {
      <div class="hidden" role="note">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 3l18 18M10.6 6.1A9 9 0 0 1 21 12a15 15 0 0 1-2.6 3.4M6.6 6.6A15 15 0 0 0 3 12a9 9 0 0 0 12.4 5.4" />
        </svg>
        {{ lockedText() }}
      </div>
    }
  `,
  styles: `
    :host { display: block; }
    .box {
      border: var(--mm-border-width) solid var(--mm-border); border-radius: var(--mm-radius-md);
      background: var(--mm-surface); padding: var(--mm-space-4);
      display: flex; flex-direction: column; gap: var(--mm-space-4);
    }
    header { display: flex; align-items: center; gap: var(--mm-space-2); color: var(--mm-text); }
    .title { font-family: var(--mm-font-heading); font-weight: 600; font-size: var(--mm-text-md); }
    .hint { margin-left: auto; font-size: var(--mm-text-xs); color: var(--mm-text-muted); }
    .content { display: flex; flex-direction: column; gap: var(--mm-space-4); }
    .hidden {
      display: flex; align-items: center; gap: var(--mm-space-2);
      border: var(--mm-border-width) dashed var(--mm-border-strong); border-radius: var(--mm-radius-md);
      padding: var(--mm-space-3) var(--mm-space-4); font-size: var(--mm-text-xs); color: var(--mm-text-muted);
    }
  `,
})
export class PrivateSectionComponent {
  readonly unlocked = input(false);
  readonly title = input('Íntimo');
  readonly hint = input('só vocês dois veem');
  readonly lockedText = input('Seção íntima oculta nesta relação');
}
