
export enum Subject {
  KANJI = '한자',
  CHINESE = '중국어',
  JAPANESE = '일본어'
}

export enum ActivityType {
  INSTRUCTION = '지시문',
  HANDWRITING = '필기인식',
  VOICE_REC = '음성인식',
  DRAG_DROP = '드래그 드랍',
  LISTENING = '음성듣기'
}

export enum DataUnit {
  WORD = 'word',
  PHRASE = 'phrase',
  SENTENCE = 'sentence'
}

export interface ResourceData {
  id: string;
  linkedId?: string; // 공통 리소스 ID 연결용
  text: string;
  subText?: string;
  translation: string;
  audioFile?: string;
  audioUrl?: string; 
  imageFile?: string;
  imageUrl?: string; 
  dataUnit: DataUnit;
  isDirectInput?: boolean;
}

export interface StackData {
  id: string;
  index: number;
  activityType: ActivityType;
  items: ResourceData[];
}

export interface PageHierarchy {
  subject: Subject;
  level: string;
  set: string;
  page: string;
}

export type ViewMode = 'DASHBOARD' | 'COMMON_INPUT' | 'PAGE_EDITOR';
