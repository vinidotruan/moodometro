import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Mood, moodDef } from '../mood';

/** Emoji de cada humor. Na versão final, a galeria troca por imagens. */
@Component({
  selector: 'mm-mood-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'aria-hidden': 'true',
    '[style.width.px]': 'size()',
    '[style.height.px]': 'size()',
    '[style.font-size.px]': 'fontSize()',
  },
  template: `{{ emoji() }}`,
  styles: `
    :host {
      display: inline-flex; align-items: center; justify-content: center;
      line-height: 1; user-select: none;
      font-family: "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif;
    }
  `,
})
export class MoodIconComponent {
  readonly mood = input.required<Mood>();
  readonly size = input(40);
  protected readonly emoji = computed(() => moodDef(this.mood()).emoji);
  protected readonly fontSize = computed(() => Math.round(this.size() * 0.85));
}
