export interface Stats {
  str: number;
  dex: number;
  int: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
}

export interface BonusDice {
  d6: number;
  d10: number;
  d20: number;
  d50: number;
}

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  description?: string;
}

export interface Player {
  name: string;
  race: string;
  gender: string;
  class: string;
  bio: string;
  stats: Stats;
  inventory: InventoryItem[];
  gold: number;
  bonusDice: BonusDice;
  level: number;
  exp: number;
}

export interface GameState {
  player: Player;
  location: string;
  history: LogEntry[];
  turnCount: number;
  isGameOver: boolean;
}

export interface LogEntry {
  id: string;
  type: 'narrative' | 'action' | 'system' | 'roll';
  text: string;
  timestamp: number;
}

export interface ActionOption {
  id: string;
  title: string;
  description: string;
}

export interface ItemFoundData {
  name: string;
  quantity: number;
  description?: string;
}

export interface AIResponse {
  narrative: string;
  options: ActionOption[];
  locationUpdate?: string;
  hpChange?: number;
  mpChange?: number;
  goldChange?: number;
  itemsFound?: ItemFoundData[];
  itemLost?: string; // Name of item to remove (1 qty)
}

export interface ApiConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
}

export interface ThemeColors {
  dark: string;
  panel: string;
  gold: string;
  red: string;
  blue: string;
  text: string;
  muted: string;
  diceBg: string;
  diceText: string;
  diceBorder: string;
}

export interface Theme {
  name: string;
  colors: ThemeColors;
}

export interface GameSettings {
  ttsEnabled: boolean;
  ttsVolume: number;
  ttsRate: number;
  uiScale: number;
  theme: Theme;
}