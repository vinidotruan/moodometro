export type Mood = 'alegre' | 'choroso' | 'cansado' | 'carente' | 'irritado' | 'animado';

export interface MoodDef {
  id: Mood;
  label: string;
  /** Path SVG da boca do gatinho (viewBox 0 0 40 40). */
  mouth: string;
}

export const MOODS: readonly MoodDef[] = [
  { id: 'alegre', label: 'Alegre', mouth: 'M15 26 Q20 31 25 26' },
  { id: 'choroso', label: 'Choroso', mouth: 'M15 29 Q20 24 25 29 M14 23 L14 27' },
  { id: 'cansado', label: 'Cansado', mouth: 'M16 27 L24 27' },
  { id: 'carente', label: 'Carente', mouth: 'M16 28 Q20 25 24 28' },
  { id: 'irritado', label: 'Irritado', mouth: 'M15 28 L18 26 L22 28 L25 26' },
  { id: 'animado', label: 'Animado', mouth: 'M14 25 Q20 33 26 25 Z' },
];

export const moodDef = (id: Mood): MoodDef => MOODS.find((m) => m.id === id) ?? MOODS[0];

export type Relation = 'namoro' | 'amizade';

export const RELATION_LABEL: Record<Relation, string> = {
  namoro: 'Namoro',
  amizade: 'Amizade',
};
