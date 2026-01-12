
import { Subject, ActivityType } from './types';

export const SUBJECTS = [Subject.KANJI, Subject.CHINESE, Subject.JAPANESE];
export const LEVELS = ['2A', '3A', '4A', '5A', '6A'];
export const SETS = Array.from({ length: 20 }, (_, i) => (i + 1).toString().padStart(3, '0'));
export const PAGES = Array.from({ length: 10 }, (_, i) => (i + 1).toString());
export const ACTIVITY_TYPES = [
  ActivityType.INSTRUCTION,
  ActivityType.HANDWRITING,
  ActivityType.VOICE_REC,
  ActivityType.DRAG_DROP,
  ActivityType.LISTENING
];

export const UI_COLORS = {
  primary: '#3b82f6',
  secondary: '#64748b',
  accent: '#10b981',
  danger: '#ef4444',
  bgMain: '#f1f5f9',
  cardHeader: '#3b82f6'
};
