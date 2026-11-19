import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly message = signal<string | null>(null);
  private timer?: ReturnType<typeof setTimeout>;

  show(msg: string): void {
    clearTimeout(this.timer);
    this.message.set(msg);
    this.timer = setTimeout(() => this.message.set(null), 2600);
  }
}
