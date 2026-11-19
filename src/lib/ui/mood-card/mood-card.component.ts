import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Mood, moodDef } from '../mood';
import { MoodIconComponent } from '../mood-icon/mood-icon.component';

@Component({
  selector: 'mm-mood-card',
  imports: [MoodIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--mood]': 'moodVar()' },
  template: `
    <button type="button" class="card" [class.on]="selected()" [attr.aria-pressed]="selected()" (click)="pick.emit(mood())">
      <mm-mood-icon [mood]="mood()" [size]="44" />
      <span class="label">{{ label() }}</span>
    </button>
  `,
  styles: `
    :host { display: block; }
    .card {
      width: 100%; display: flex; flex-direction: column; align-items: center; gap: var(--mm-space-1);
      padding: var(--mm-space-3) var(--mm-space-1);
      border-radius: var(--mm-radius-md); border: var(--mm-border-width) solid var(--mm-border);
      background: var(--mm-surface); color: var(--mm-text);
      font: inherit; cursor: pointer;
      transition: transform var(--mm-duration) var(--mm-ease), background var(--mm-duration) var(--mm-ease), border-color var(--mm-duration);
    }
    .card mm-mood-icon { color: var(--mood); }
    .card:hover { border-color: var(--mood); }
    .card:active { transform: scale(0.96); }
    .card.on {
      background: color-mix(in srgb, var(--mood) var(--mm-mood-mix), var(--mm-bg));
      border-color: var(--mood);
      color: var(--mm-on-mood);
    }
    .card.on mm-mood-icon { color: var(--mm-on-mood); }
    .label { font-size: var(--mm-text-xs); font-weight: 700; }
  `,
})
export class MoodCardComponent {
  readonly mood = input.required<Mood>();
  readonly selected = input(false);
  /** Nome customizado pelo usuário; padrão = nome do humor. */
  readonly customLabel = input<string | undefined>(undefined, { alias: 'label' });
  readonly pick = output<Mood>();

  protected readonly label = computed(() => this.customLabel() ?? moodDef(this.mood()).label);
  protected readonly moodVar = computed(() => `var(--mm-mood-${this.mood()})`);
}
