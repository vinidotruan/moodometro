import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Mood, MOODS, MoodDef } from '../mood';
import { MoodCardComponent } from '../mood-card/mood-card.component';

@Component({
  selector: 'mm-mood-picker',
  imports: [MoodCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="grid" role="group" [attr.aria-label]="ariaLabel()">
      @for (m of moods(); track m.id) {
        <mm-mood-card [mood]="m.id" [def]="m" [label]="m.label" [selected]="value() === m.id" (pick)="value.set($event)" />
      }
    </div>
  `,
  styles: `
    .grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--mm-space-3); }
  `,
})
export class MoodPickerComponent {
  readonly value = model<Mood | null>(null);
  readonly moods = input<readonly MoodDef[]>(MOODS);
  readonly ariaLabel = input('Escolha seu humor');
}
