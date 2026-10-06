import { Injectable, signal, computed } from '@angular/core';

export interface MasterNote {
  id: string;
  title: string;
  content: string;
  category: 'plot' | 'npc' | 'secret' | 'loot' | 'general';
  partyCode?: string;
  updatedAt: number;
}

export interface DiceRollResult {
  id: string;
  notation: string;
  diceCount: number;
  sides: number;
  rolls: number[];
  modifier: number;
  total: number;
  isCritical: boolean;
  isFumble: boolean;
  timestamp: number;
}

export interface RecentRoom {
  code: string;
  title: string;
  themeTitle?: string;
  lastAccessed: number;
}

@Injectable({
  providedIn: 'root',
})
export class MasterToolsService {
  private readonly COLLAPSED_KEY = 'rpg_master_sidebar_collapsed';
  private readonly NOTES_KEY = 'rpg_master_notes_v1';
  private readonly RECENT_ROOMS_KEY = 'rpg_master_recent_rooms_v1';

  // Signals
  isCollapsed = signal<boolean>(this.loadInitialCollapsed());
  activeTab = signal<'parties' | 'players' | 'notes' | 'dice' | 'settings'>('parties');
  notes = signal<MasterNote[]>(this.loadInitialNotes());
  diceHistory = signal<DiceRollResult[]>([]);
  recentRooms = signal<RecentRoom[]>(this.loadInitialRecentRooms());

  // Settings & Preferences
  soundEffectsEnabled = signal<boolean>(this.loadPref('rpg_pref_sfx', true));
  crtScanlinesEnabled = signal<boolean>(this.loadPref('rpg_pref_scanlines', false));
  defaultBattlemapEngine = signal<'phaser' | 'dom'>(this.loadPref('rpg_pref_engine', 'phaser'));

  // Quick helper
  hasNotes = computed(() => this.notes().length > 0);

  constructor() {}

  toggleCollapsed(): void {
    const next = !this.isCollapsed();
    this.isCollapsed.set(next);
    localStorage.setItem(this.COLLAPSED_KEY, JSON.stringify(next));
  }

  setCollapsed(collapsed: boolean): void {
    this.isCollapsed.set(collapsed);
    localStorage.setItem(this.COLLAPSED_KEY, JSON.stringify(collapsed));
  }

  setActiveTab(tab: 'parties' | 'players' | 'notes' | 'dice' | 'settings'): void {
    this.activeTab.set(tab);
    if (this.isCollapsed()) {
      this.isCollapsed.set(false);
      localStorage.setItem(this.COLLAPSED_KEY, JSON.stringify(false));
    }
  }

  // --- Notes Management ---
  addNote(title: string, content: string, category: MasterNote['category'] = 'general', partyCode?: string): MasterNote {
    const newNote: MasterNote = {
      id: 'note_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      title: title.trim() || 'Nova Anotação',
      content: content.trim(),
      category,
      partyCode,
      updatedAt: Date.now(),
    };

    const updated = [newNote, ...this.notes()];
    this.notes.set(updated);
    this.persistNotes(updated);
    return newNote;
  }

  updateNote(id: string, partial: Partial<Omit<MasterNote, 'id' | 'updatedAt'>>): void {
    const updated = this.notes().map((n) =>
      n.id === id ? { ...n, ...partial, updatedAt: Date.now() } : n
    );
    this.notes.set(updated);
    this.persistNotes(updated);
  }

  deleteNote(id: string): void {
    const updated = this.notes().filter((n) => n.id !== id);
    this.notes.set(updated);
    this.persistNotes(updated);
  }

  private persistNotes(notesList: MasterNote[]): void {
    try {
      localStorage.setItem(this.NOTES_KEY, JSON.stringify(notesList));
    } catch (e) {
      console.error('Falha ao salvar notas do mestre:', e);
    }
  }

  private loadInitialNotes(): MasterNote[] {
    try {
      const raw = localStorage.getItem(this.NOTES_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}

    // Default starting notes to assist Master
    return [
      {
        id: 'default_1',
        title: 'Encontro com Emboscada',
        content: '3 Goblins arqueiros escondidos nas árvores (CA 13, HP 7 cada). O líder possui um pergaminho arcano com símbolos desconhecidos.',
        category: 'plot',
        updatedAt: Date.now(),
      },
      {
        id: 'default_2',
        title: 'Segredo da Masmorra',
        content: 'A tocha de ferro na parede leste aciona uma passagem secreta que leva ao baú contendo a Espada Rúnica.',
        category: 'secret',
        updatedAt: Date.now(),
      },
    ];
  }

  // --- Dice Roller ---
  rollDice(sides: number, count = 1, modifier = 0): DiceRollResult {
    const rolls: number[] = [];
    let sum = 0;

    for (let i = 0; i < count; i++) {
      const val = Math.floor(Math.random() * sides) + 1;
      rolls.push(val);
      sum += val;
    }

    const total = sum + modifier;
    const isCritical = sides === 20 && count === 1 && rolls[0] === 20;
    const isFumble = sides === 20 && count === 1 && rolls[0] === 1;

    const notation = `${count}d${sides}${modifier !== 0 ? (modifier > 0 ? `+${modifier}` : `${modifier}`) : ''}`;

    const result: DiceRollResult = {
      id: 'roll_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      notation,
      diceCount: count,
      sides,
      rolls,
      modifier,
      total,
      isCritical,
      isFumble,
      timestamp: Date.now(),
    };

    this.diceHistory.set([result, ...this.diceHistory().slice(0, 24)]);
    return result;
  }

  clearDiceHistory(): void {
    this.diceHistory.set([]);
  }

  // --- Recent Rooms ---
  addRecentRoom(code: string, title: string, themeTitle?: string): void {
    if (!code) return;
    const current = this.recentRooms();
    const cleanCode = code.toUpperCase();
    const cleanTitle = title || 'Campanha';

    if (
      current.length > 0 &&
      current[0].code.toUpperCase() === cleanCode &&
      current[0].title === cleanTitle &&
      current[0].themeTitle === themeTitle
    ) {
      return;
    }

    const filtered = current.filter((r) => r.code.toUpperCase() !== cleanCode);
    const updated: RecentRoom[] = [
      { code: cleanCode, title: cleanTitle, themeTitle, lastAccessed: Date.now() },
      ...filtered.slice(0, 9),
    ];
    this.recentRooms.set(updated);
    try {
      localStorage.setItem(this.RECENT_ROOMS_KEY, JSON.stringify(updated));
    } catch {}
  }

  setSoundEffects(enabled: boolean): void {
    this.soundEffectsEnabled.set(enabled);
    localStorage.setItem('rpg_pref_sfx', JSON.stringify(enabled));
    if (enabled) this.play8BitSound(440, 0.1, 'square');
  }

  setCrtScanlines(enabled: boolean): void {
    this.crtScanlinesEnabled.set(enabled);
    localStorage.setItem('rpg_pref_scanlines', JSON.stringify(enabled));
    if (typeof document !== 'undefined') {
      if (enabled) {
        document.body.classList.add('crt-scanlines');
      } else {
        document.body.classList.remove('crt-scanlines');
      }
    }
  }

  setDefaultBattlemapEngine(engine: 'phaser' | 'dom'): void {
    this.defaultBattlemapEngine.set(engine);
    localStorage.setItem('rpg_pref_engine', JSON.stringify(engine));
  }

  clearAllRecentRooms(): void {
    this.recentRooms.set([]);
    try {
      localStorage.removeItem(this.RECENT_ROOMS_KEY);
    } catch {}
  }

  play8BitSound(freq: number, duration: number, type: OscillatorType = 'square'): void {
    if (!this.soundEffectsEnabled()) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch {}
  }

  private loadPref<T>(key: string, defaultValue: T): T {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return JSON.parse(val);
    } catch {}
    return defaultValue;
  }

  private loadInitialRecentRooms(): RecentRoom[] {
    try {
      const raw = localStorage.getItem(this.RECENT_ROOMS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  private loadInitialCollapsed(): boolean {
    try {
      const raw = localStorage.getItem(this.COLLAPSED_KEY);
      return raw ? JSON.parse(raw) : false;
    } catch {
      return false;
    }
  }
}
