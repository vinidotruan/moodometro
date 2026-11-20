import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Mood, moodColor, moodDef, Relation, RELATION_LABEL } from '../mood';
import { MoodIconComponent } from '../mood-icon/mood-icon.component';

@Component({
  selector: 'mm-person-card',
  imports: [MoodIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--mood]': 'moodVar()' },
  template: `
    <button type="button" class="card" (click)="open.emit()">
      <span class="avatar" [class.empty]="!mood()">
        @if (mood(); as m) {
          <mm-mood-icon [mood]="m" [size]="40" />
        }
      </span>
      <span class="body">
        <span class="top">
          <span class="name">{{ name() }}</span>
          <span class="rel">{{ relationLabel() }}</span>
        </span>
        @if (mood()) {
          <span class="mood">Hoje: <strong>{{ moodLabel() }}</strong></span>
          @if (topic()) {
            <span class="muted">Quer falar sobre: {{ topic() }}</span>
          }
          @if (when()) {
            <span class="muted small">{{ when() }}</span>
          }
        } @else {
          <span class="muted">{{ emptyText() }}</span>
        }
      </span>
      <svg class="chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M9 5l7 7-7 7" /></svg>
    </button>
  `,
  styles: `
    :host { display: block; }
    .card {
      width: 100%; display: flex; align-items: center; gap: var(--mm-space-3); text-align: left;
      padding: var(--mm-space-3); border-radius: var(--mm-radius-md);
      border: var(--mm-border-width) solid var(--mm-border); background: var(--mm-surface); color: var(--mm-text);
      font: inherit; cursor: pointer; transition: border-color var(--mm-duration) var(--mm-ease);
    }
    .card:hover { border-color: var(--mm-border-strong); }
    .avatar {
      width: 60px; height: 60px; flex-shrink: 0; border-radius: var(--mm-radius-md);
      display: grid; place-items: center;
      background: color-mix(in srgb, var(--mood) var(--mm-mood-mix), var(--mm-bg)); color: var(--mm-on-mood);
    }
    .avatar.empty { background: transparent; border: var(--mm-border-width) dashed var(--mm-border-strong); }
    .body { display: flex; flex-direction: column; gap: 2px; flex: 1; min-width: 0; }
    .top { display: flex; align-items: center; gap: var(--mm-space-2); }
    .name { font-family: var(--mm-font-heading); font-weight: 600; font-size: 1.0625rem; }
    .rel {
      font-size: 0.75rem; font-weight: 700; padding: 1px 8px; border-radius: var(--mm-radius-pill);
      border: var(--mm-border-width) solid var(--mm-border-strong);
    }
    .mood { font-size: var(--mm-text-sm); }
    .muted { font-size: var(--mm-text-xs); color: var(--mm-text-muted); }
    .chev { color: var(--mm-text-muted); flex-shrink: 0; }
  `,
})
export class PersonCardComponent {
  readonly name = input.required<string>();
  readonly relation = input<Relation>('amizade');
  readonly mood = input<Mood | null>(null);
  readonly topic = input<string | null>(null);
  readonly when = input<string | null>(null);
  /** Texto quando a pessoa não tem humor hoje (ex.: convite pendente). */
  readonly emptyText = input('Ainda não marcou o humor hoje');
  readonly open = output<void>();

  protected readonly relationLabel = computed(() => RELATION_LABEL[this.relation()]);
  protected readonly moodLabel = computed(() => {
    const m = this.mood();
    return m ? moodDef(m).label : '';
  });
  protected readonly moodVar = computed(() => {
    const m = this.mood();
    return m ? moodColor(m) : 'transparent';
  });
}
