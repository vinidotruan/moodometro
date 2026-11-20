import { computed, signal } from '@angular/core';
import { Mood, Relation } from '../../../lib/ui';
import { AuthUser } from '../auth/auth.types';
import { storage } from '../storage';
import { Backend, EMPTY_MOOD_PREFS, InvitePreview, MoodPrefs, MyDay, newInviteCode, Person, WANTS } from './types';

interface State {
  me: MyDay;
  people: Person[];
  moods: MoodPrefs;
}

const minutesAgo = (m: number) => new Date(Date.now() - m * 60000).toISOString();
const defaults = (r: Relation) => Object.fromEntries(WANTS[r].map((w) => [w.id, 50]));

function seed(): State {
  return {
    me: { mood: null, note: '', topics: [], viewers: ['lucas', 'ana'], sharedAt: null },
    moods: EMPTY_MOOD_PREFS,
    people: [
      {
        id: 'lucas', name: 'Lucas', relation: 'namoro', confirmedByMe: true, confirmedByThem: true,
        mood: 'carente', topic: 'nós dois', when: minutesAgo(20),
        theirWants: { carinho: 90, atencao: 75, comida: 50, sexo: 60, intensidade: 35 },
        myWants: { carinho: 70, atencao: 50, comida: 50, sexo: 50, intensidade: 50 },
      },
      {
        id: 'ana', name: 'Ana', relation: 'amizade', confirmedByMe: true, confirmedByThem: true,
        mood: 'alegre', topic: 'trabalho novo', when: minutesAgo(120),
        theirWants: { carinho: 40, conversa: 85, presente: 30, role: 80 },
        myWants: defaults('amizade'),
      },
      {
        id: 'pedro', name: 'Pedro', relation: 'amizade', confirmedByMe: true, confirmedByThem: true,
        mood: 'cansado', topic: null, when: minutesAgo(300),
        theirWants: { carinho: 60, conversa: 20, presente: 40, role: 10 },
        myWants: defaults('amizade'),
      },
      {
        id: 'bia', name: 'Bia', relation: 'amizade', confirmedByMe: true, confirmedByThem: true,
        mood: null, topic: null, when: null, theirWants: {}, myWants: defaults('amizade'),
      },
    ],
  };
}

const KEY = 'mm.data.v2';

/** Lê o estado salvo; versões antigas guardavam só `labels` (nomes dos humores). */
function load(): State {
  const raw = storage.get<(State & { labels?: MoodPrefs['labels'] }) | null>(KEY, null);
  if (!raw) return seed();
  const { labels, ...rest } = raw;
  return { ...rest, moods: { ...EMPTY_MOOD_PREFS, ...(raw.moods ?? { labels: labels ?? {} }) } };
}

/** Modo demo: tudo no navegador. Simula a outra pessoa confirmando depois de 2 s. */
export class LocalBackend implements Backend {
  readonly kind = 'demo' as const;
  private readonly state = signal<State>(load());

  readonly me = computed(() => this.state().me);
  readonly people = computed(() => this.state().people);
  readonly moodPrefs = computed(() => this.state().moods);
  readonly canCustomizeMoods = true;
  readonly loading = signal(false).asReadonly();
  readonly error = signal<string | null>(null).asReadonly();

  async start(_user: AuthUser): Promise<void> {}
  stop(): void {}

  private set(fn: (s: State) => State): void {
    this.state.update(fn);
    storage.set(KEY, this.state());
  }

  private patchPerson(id: string, patch: Partial<Person>): void {
    this.set((s) => ({ ...s, people: s.people.map((p) => (p.id === id ? { ...p, ...patch } : p)) }));
  }

  updateDraft(patch: Partial<Omit<MyDay, 'sharedAt'>>): void {
    this.set((s) => ({ ...s, me: { ...s.me, ...patch } }));
  }

  async shareMood(): Promise<void> {
    this.set((s) => ({ ...s, me: { ...s.me, sharedAt: new Date().toISOString() } }));
  }

  setMyWant(personId: string, wantId: string, value: number): void {
    const p = this.state().people.find((x) => x.id === personId);
    if (p) this.patchPerson(personId, { myWants: { ...p.myWants, [wantId]: value } });
  }

  private setMoods(fn: (m: MoodPrefs) => MoodPrefs): void {
    this.set((s) => ({ ...s, moods: fn(s.moods) }));
  }

  async renameMood(id: Mood, label: string): Promise<void> {
    const name = label.trim().slice(0, 30);
    this.setMoods((m) =>
      m.custom.some((c) => c.id === id)
        ? { ...m, custom: m.custom.map((c) => (c.id === id ? { ...c, label: name || c.label } : c)) }
        : { ...m, labels: { ...m.labels, [id]: name } },
    );
  }

  async setMoodPhoto(id: Mood, photo: string | null): Promise<void> {
    this.setMoods((m) => {
      const photos = { ...m.photos };
      if (photo) photos[id] = photo;
      else delete photos[id];
      return { ...m, photos };
    });
  }

  async addMood(label: string, emoji: string): Promise<Mood> {
    const id = `c-${newInviteCode().slice(0, 8)}`;
    const mood = { id, label: label.trim().slice(0, 30) || 'Novo humor', emoji: emoji.trim() || '🙂' };
    this.setMoods((m) => ({ ...m, custom: [...m.custom, mood] }));
    return id;
  }

  async removeMood(id: Mood): Promise<void> {
    this.set((s) => {
      const photos = { ...s.moods.photos };
      delete photos[id];
      return {
        ...s,
        moods: { ...s.moods, photos, custom: s.moods.custom.filter((c) => c.id !== id) },
        me: s.me.mood === id ? { ...s.me, mood: null } : s.me,
      };
    });
  }

  async createInvite(label: string, relation: Relation): Promise<string> {
    const code = newInviteCode();
    const p: Person = {
      id: code, inviteCode: code, name: label, relation, pending: true,
      confirmedByMe: true, confirmedByThem: false,
      mood: null, topic: null, when: null, theirWants: {}, myWants: defaults(relation),
    };
    this.set((s) => ({ ...s, people: [...s.people, p] }));
    return code;
  }

  async readInvite(code: string): Promise<InvitePreview | null> {
    const mine = this.state().people.find((p) => p.inviteCode === code);
    if (mine) return { code, fromName: 'Você', relation: mine.relation, expired: false, used: !mine.pending, mine: true };
    // Na demo, qualquer outro código vira um convite da "Carol" pra testar o aceite.
    return { code, fromName: 'Carol', relation: 'amizade', expired: false, used: false, mine: false };
  }

  async acceptInvite(code: string): Promise<string> {
    const id = `carol-${code.slice(0, 4)}`;
    if (!this.state().people.some((p) => p.id === id)) {
      this.set((s) => ({
        ...s,
        people: [
          ...s.people,
          {
            id, name: 'Carol', relation: 'amizade', confirmedByMe: true, confirmedByThem: true,
            mood: 'animado', topic: 'a viagem', when: minutesAgo(5),
            theirWants: { carinho: 50, conversa: 90, presente: 20, role: 95 }, myWants: defaults('amizade'),
          },
        ],
      }));
    }
    return id;
  }

  async cancelInvite(code: string): Promise<void> {
    this.set((s) => ({ ...s, people: s.people.filter((p) => p.inviteCode !== code) }));
  }

  async proposeRelation(personId: string, relation: Relation): Promise<void> {
    const p = this.state().people.find((x) => x.id === personId);
    if (!p) return;
    this.patchPerson(personId, {
      relation, confirmedByMe: true, confirmedByThem: false,
      myWants: { ...defaults(relation), ...p.myWants },
    });
    setTimeout(() => this.patchPerson(personId, { confirmedByThem: true }), 2000);
  }

  async setMyConfirmation(personId: string, confirmed: boolean): Promise<void> {
    this.patchPerson(personId, { confirmedByMe: confirmed });
  }

  async disconnect(personId: string): Promise<void> {
    this.set((s) => ({
      ...s,
      people: s.people.filter((p) => p.id !== personId),
      me: { ...s.me, viewers: s.me.viewers.filter((v) => v !== personId) },
    }));
  }

  reset(): void {
    this.set(() => seed());
  }
}
