import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';

let nextId = 0;

/** "O que eu quero hoje": uma barrinha de menos ↔ mais (carinho, comida, conversa…). */
@Component({
  selector: 'mm-want-slider',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[style.--fill]': 'fill()' },
  template: `
    <label class="label" [attr.for]="id">{{ label() }}</label>
    <input
      [id]="id"
      type="range"
      min="0"
      max="100"
      [step]="step()"
      [value]="value()"
      [disabled]="disabled()"
      [attr.aria-valuetext]="valueText()"
      (input)="value.set(+$any($event.target).value)"
    />
    <div class="ends" aria-hidden="true">
      <span>{{ low() }}</span><span>{{ high() }}</span>
    </div>
  `,
  styles: `
    :host { display: flex; flex-direction: column; gap: var(--mm-space-1); }
    .label { font-weight: 700; font-size: var(--mm-text-md); }
    .ends { display: flex; justify-content: space-between; font-size: var(--mm-text-xs); color: var(--mm-text-muted); }
    input[type='range'] {
      -webkit-appearance: none; appearance: none; width: 100%; height: var(--mm-touch);
      background: transparent; margin: 0; cursor: pointer;
    }
    input[type='range']::-webkit-slider-runnable-track {
      height: 10px; border-radius: var(--mm-radius-pill);
      background: linear-gradient(to right, var(--mm-primary) var(--fill), var(--mm-surface-raised) var(--fill));
    }
    input[type='range']::-moz-range-track { height: 10px; border-radius: var(--mm-radius-pill); background: var(--mm-surface-raised); }
    input[type='range']::-moz-range-progress { height: 10px; border-radius: var(--mm-radius-pill); background: var(--mm-primary); }
    input[type='range']::-webkit-slider-thumb {
      -webkit-appearance: none; width: 26px; height: 26px; margin-top: -8px; border-radius: 50%;
      background: var(--mm-bg); border: 3px solid var(--mm-primary);
    }
    input[type='range']::-moz-range-thumb {
      width: 20px; height: 20px; border-radius: 50%; background: var(--mm-bg); border: 3px solid var(--mm-primary);
    }
    input[type='range']:disabled { opacity: 0.55; cursor: not-allowed; }
  `,
})
export class WantSliderComponent {
  readonly label = input.required<string>();
  readonly low = input('Menos');
  readonly high = input('Mais');
  readonly value = model(50);
  readonly step = input(5);
  readonly disabled = input(false);

  protected readonly id = `mm-want-${nextId++}`;
  protected readonly fill = computed(() => `${this.value()}%`);
  protected readonly valueText = computed(() => {
    const v = this.value();
    if (v <= 20) return `Bem ${this.low().toLowerCase()}`;
    if (v >= 80) return `Bem ${this.high().toLowerCase()}`;
    if (v < 45) return this.low();
    if (v > 55) return this.high();
    return 'No meio';
  });
}
