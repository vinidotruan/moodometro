export type Mood = 'alegre' | 'choroso' | 'cansado' | 'carente' | 'irritado' | 'animado';

export interface MoodDef {
  id: Mood;
  label: string;
  /** Emoji que representa o humor. */
  emoji: string;
}

export const MOODS: readonly MoodDef[] = [
  { id: 'alegre', label: 'Alegre', emoji: '😊' },
  { id: 'choroso', label: 'Choroso', emoji: '😢' },
  { id: 'cansado', label: 'Cansado', emoji: '😴' },
  { id: 'carente', label: 'Carente', emoji: '🥺' },
  { id: 'irritado', label: 'Irritado', emoji: '😠' },
  { id: 'animado', label: 'Animado', emoji: '🤩' },
];

export const moodDef = (id: Mood): MoodDef => MOODS.find((m) => m.id === id) ?? MOODS[0];

export type Relation = 'namoro' | 'amizade';

export const RELATION_LABEL: Record<Relation, string> = {
  namoro: 'Namoro',
  amizade: 'Amizade',
};
