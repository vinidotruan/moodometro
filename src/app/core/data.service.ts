import { computed, effect, inject, Injectable, untracked } from '@angular/core';
import { Mood, MOODS, MoodDef, Relation } from '../../lib/ui';
import { AuthService } from './auth/auth.service';
import { FirestoreBackend } from './backend/firestore-backend';
import { LocalBackend } from './backend/local-backend';
import { Backend, MyDay, Person } from './backend/types';
import { isFirebaseMode } from './config';

export * from './backend/types';

/** Fachada que as telas usam. Escolhe demo (local) ou Firestore pelo config. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);
  private readonly backend: Backend = isFirebaseMode ? new FirestoreBackend() : new LocalBackend();

  readonly kind = this.backend.kind;
  readonly me = this.backend.me;
  readonly people = this.backend.people;
  readonly loading = this.backend.loading;
  readonly error = this.backend.error;
  readonly connectedPeople = computed(() => this.people().filter((p) => !p.pending));
  readonly canCustomizeMoods = this.backend.canCustomizeMoods;
  /** Os 6 humores padrão (com nome/foto do usuário) e depois os criados por ele. */
  readonly moods = computed<MoodDef[]>(() => {
    const p = this.backend.moodPrefs();
    return [
      ...MOODS.map((m) => ({ ...m, label: p.labels[m.id] || m.label, photo: p.photos[m.id] })),
      ...p.custom.map((c) => ({ ...c, photo: p.photos[c.id], custom: true })),
    ];
  });

  constructor() {
    // Liga/desliga os listeners conforme o login.
    effect(() => {
      const user = this.auth.user();
      untracked(() => (user ? void this.backend.start(user) : this.backend.stop()));
    });
  }

  person(id: string): Person | undefined {
    return this.people().find((p) => p.id === id);
  }

  updateMe(patch: Partial<Omit<MyDay, 'sharedAt'>>): void {
    this.backend.updateDraft(patch);
  }

  shareMood = () => this.backend.shareMood();
  setMyWant = (personId: string, wantId: string, value: number) => this.backend.setMyWant(personId, wantId, value);
  renameMood = (id: Mood, label: string) => this.backend.renameMood(id, label);
  setMoodPhoto = (id: Mood, photo: string | null) => this.backend.setMoodPhoto(id, photo);
  addMood = (label: string, emoji: string) => this.backend.addMood(label, emoji);
  removeMood = (id: Mood) => this.backend.removeMood(id);
  createInvite = (label: string, relation: Relation) => this.backend.createInvite(label, relation);
  readInvite = (code: string) => this.backend.readInvite(code);
  acceptInvite = (code: string) => this.backend.acceptInvite(code);
  cancelInvite = (code: string) => this.backend.cancelInvite(code);
  proposeRelation = (personId: string, relation: Relation) => this.backend.proposeRelation(personId, relation);
  setMyConfirmation = (personId: string, confirmed: boolean) => this.backend.setMyConfirmation(personId, confirmed);
  disconnect = (personId: string) => this.backend.disconnect(personId);

  readonly canReset = typeof this.backend.reset === 'function';
  reset(): void {
    this.backend.reset?.();
  }
}

/** Link público de um convite (hash routing). */
export function inviteUrl(code: string): string {
  const base = location.href.split('#')[0];
  return `${base}#/convite/${code}`;
}
