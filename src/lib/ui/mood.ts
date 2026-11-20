/** Os 6 humores padrão (cada um tem cor própria no tema). */
export type DefaultMood = 'alegre' | 'choroso' | 'cansado' | 'carente' | 'irritado' | 'animado';

/** Id de humor: um dos padrão ou um criado pelo usuário ("c-…"). */
export type Mood = DefaultMood | (string & {});

export interface MoodDef {
  id: Mood;
  label: string;
  /** Emoji que representa o humor. */
  emoji: string;
  /** Foto escolhida pelo usuário (data URL); quando existe, aparece no lugar do emoji. */
  photo?: string;
  /** Humor criado pelo usuário (pode ser apagado). */
  custom?: boolean;
}

export const MOODS: readonly MoodDef[] = [
  { id: 'alegre', label: 'Alegre', emoji: '😊' },
  { id: 'choroso', label: 'Choroso', emoji: '😢' },
  { id: 'cansado', label: 'Cansado', emoji: '😴' },
  { id: 'carente', label: 'Carente', emoji: '🥺' },
  { id: 'irritado', label: 'Irritado', emoji: '😠' },
  { id: 'animado', label: 'Animado', emoji: '🤩' },
];

/** Procura o humor na lista do usuário e, se não achar, nos padrão. */
export const moodDef = (id: Mood, list: readonly MoodDef[] = MOODS): MoodDef =>
  list.find((m) => m.id === id) ?? MOODS.find((m) => m.id === id) ?? { id, label: 'Humor', emoji: '🙂' };

/** Cor do humor no tema; humores criados pelo usuário usam a cor primária. */
export const moodColor = (id: Mood): string => `var(--mm-mood-${id}, var(--mm-primary))`;

export type Relation = 'namoro' | 'amizade';

export const RELATION_LABEL: Record<Relation, string> = {
  namoro: 'Namoro',
  amizade: 'Amizade',
};
