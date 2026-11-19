import { DOCUMENT } from '@angular/common';
import { effect, inject, Injectable, signal } from '@angular/core';
import { storage } from './storage';

export type Theme = 'latte' | 'mocha';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<Theme>(storage.get<Theme | null>('mm.theme', null) ?? this.systemTheme());

  constructor() {
    effect(() => {
      const t = this.theme();
      this.doc.documentElement.setAttribute('data-theme', t);
      this.doc.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'mocha' ? '#1e1e2e' : '#eff1f5');
      storage.set('mm.theme', t);
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'latte' ? 'mocha' : 'latte'));
  }

  private systemTheme(): Theme {
    try {
      return matchMedia('(prefers-color-scheme: dark)').matches ? 'mocha' : 'latte';
    } catch {
      return 'latte';
    }
  }
}
