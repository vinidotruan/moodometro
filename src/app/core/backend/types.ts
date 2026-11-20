import { Signal } from '@angular/core';
import { Mood, Relation } from '../../../lib/ui';
import { AuthUser } from '../auth/auth.types';

export interface WantDef {
  id: string;
  label: string;
  low: string;
  high: string;
  intimate?: boolean;
}

export const WANTS: Record<Relation, WantDef[]> = {
  namoro: [
    { id: 'carinho', label: 'Carinho', low: 'Menos', high: 'Mais' },
    { id: 'atencao', label: 'Atenção / conversa', low: 'Quero espaço', high: 'Quero grude' },
    { id: 'comida', label: 'Comida', low: 'Menos', high: 'Mais' },
    { id: 'sexo', label: 'Sexo', low: 'Menos', high: 'Mais', intimate: true },
    { id: 'intensidade', label: 'Intensidade', low: 'Mais suave', high: 'Mais intenso', intimate: true },
  ],
  amizade: [
    { id: 'carinho', label: 'Carinho / apoio', low: 'Menos', high: 'Mais' },
    { id: 'conversa', label: 'Conversa', low: 'Quero espaço', high: 'Bora conversar' },
    { id: 'presente', label: 'Presente / mimo', low: 'Nada', high: 'Me mima' },
    { id: 'role', label: 'Rolê / comida', low: 'Ficar em casa', high: 'Bora sair' },
  ],
};

export const isIntimateWant = (id: string) => id === 'sexo' || id === 'intensidade';

export interface Person {
  /** uid da outra pessoa (ou código do convite, se ainda pendente). */
  id: string;
  name: string;
  relation: Relation;
  confirmedByMe: boolean;
  confirmedByThem: boolean;
  /** Convite enviado e ainda não aceito. */
  pending?: boolean;
  inviteCode?: string;
  mood: Mood | null;
  topic: string | null;
  when: string | null;
  theirWants: Record<string, number>;
  myWants: Record<string, number>;
}

export const bothConfirmed = (p: Person) => p.confirmedByMe && p.confirmedByThem;
export const intimateOpen = (p: Person) => p.relation === 'namoro' && bothConfirmed(p);

/** Humor criado pelo usuário. */
export interface CustomMood {
  id: Mood;
  label: string;
  emoji: string;
}

/** Como o usuário personalizou os humores: nomes, fotos e humores novos. */
export interface MoodPrefs {
  labels: Partial<Record<Mood, string>>;
  photos: Partial<Record<Mood, string>>;
  custom: CustomMood[];
}

export const EMPTY_MOOD_PREFS: MoodPrefs = { labels: {}, photos: {}, custom: [] };

/** Rascunho do meu dia. Só vai pros outros quando eu clico em compartilhar. */
export interface MyDay {
  mood: Mood | null;
  note: string;
  topics: string[];
  viewers: string[];
  sharedAt: string | null;
}

export interface InvitePreview {
  code: string;
  fromName: string;
  relation: Relation;
  expired: boolean;
  used: boolean;
  mine: boolean;
}

export interface Backend {
  readonly kind: 'demo' | 'firestore';
  readonly me: Signal<MyDay>;
  readonly people: Signal<Person[]>;
  readonly moodPrefs: Signal<MoodPrefs>;
  /** Fotos e humores novos (por enquanto só no modo demo). */
  readonly canCustomizeMoods: boolean;
  readonly loading: Signal<boolean>;
  readonly error: Signal<string | null>;

  start(user: AuthUser): Promise<void>;
  stop(): void;

  updateDraft(patch: Partial<Omit<MyDay, 'sharedAt'>>): void;
  shareMood(): Promise<void>;
  setMyWant(personId: string, wantId: string, value: number): void;
  renameMood(id: Mood, label: string): Promise<void>;
  setMoodPhoto(id: Mood, photo: string | null): Promise<void>;
  addMood(label: string, emoji: string): Promise<Mood>;
  removeMood(id: Mood): Promise<void>;

  createInvite(label: string, relation: Relation): Promise<string>;
  readInvite(code: string): Promise<InvitePreview | null>;
  acceptInvite(code: string): Promise<string>;
  cancelInvite(code: string): Promise<void>;

  proposeRelation(personId: string, relation: Relation): Promise<void>;
  setMyConfirmation(personId: string, confirmed: boolean): Promise<void>;
  disconnect(personId: string): Promise<void>;

  reset?(): void;
}

/** "há 20 min", "há 2 h", "ontem"… */
export function relativeTime(iso: string | null): string | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'ontem' : `há ${d} dias`;
}

export function newInviteCode(): string {
  const bytes = new Uint8Array(20);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => 'abcdefghijkmnpqrstuvwxyz23456789'[b % 32]).join('');
}
