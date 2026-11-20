import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Mood, MoodDef, moodDef } from '../mood';

/** Ícone do humor: a foto escolhida pelo usuário ou, sem foto, o emoji. */
@Component({
  selector: 'mm-mood-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'fontSize()',
  },
  template: `@if (look().photo; as src) { <img [src]="src" alt="" /> } @else { {{ look().emoji }} }`,
  styles: `
    :host {
      display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
      line-height: 1; user-select: none;
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    }
    img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; display: block; }
  `,
})
export class MoodIconComponent {
  readonly mood = input.required<Mood>();
  /** Definição já resolvida (com nome/foto do usuário). Sem ela, usa o humor padrão. */
  readonly def = input<MoodDef | null>(null);
  readonly size = input(40);
  protected readonly look = computed(() => this.def() ?? moodDef(this.mood()));
  protected readonly fontSize = computed(() => Math.round(this.size() * 0.85));
}
