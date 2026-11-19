import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Mood, moodDef } from '../mood';

/** Gatinho padrão de cada humor. Na versão final, a galeria troca por imagens. */
@Component({
  selector: 'mm-mood-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 40 40"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      <path d="M8 15 L10 4 L17 10 M32 15 L30 4 L23 10" />
      <circle cx="20" cy="22" r="13" />
      <circle cx="15" cy="20" r="1.3" fill="currentColor" />
      <circle cx="25" cy="20" r="1.3" fill="currentColor" />
      <path [attr.d]="mouth()" />
    </svg>
  `,
  styles: `:host { display: inline-flex; line-height: 0; }`,
})
export class MoodIconComponent {
  readonly mood = input.required<Mood>();
  readonly size = input(40);
  protected readonly mouth = computed(() => moodDef(this.mood()).mouth);
}
