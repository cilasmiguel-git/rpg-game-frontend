import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { MasterToolsService, MasterNote, DiceRollResult, RecentRoom } from '../../../core/services/master-tools.service';
import { PartyQueriesService } from '../../../data/queries/party.queries';
import { ThemeQueriesService } from '../../../data/queries/theme.queries';
import { StorageService } from '../../../core/services/storage.service';
import { GameSessionService } from '../../../core/services/game-session.service';
import { DialogComponent } from '../ui/dialog.component';
import { CreatePartyInput } from '../../../data/schemas/party.schema';

@Component({
  selector: 'app-master-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, DialogComponent],
  templateUrl: './master-sidebar.component.html',
  styleUrls: ['./master-sidebar.component.scss'],
})
export class MasterSidebarComponent {
  masterTools = inject(MasterToolsService);
  partyQueries = inject(PartyQueriesService);
  themeQueries = inject(ThemeQueriesService);
  storage = inject(StorageService);
  router = inject(Router);
  gameSession = inject(GameSessionService);

  // Track route to distinguish between Main/Lobby mode and In-Game mode
  currentUrl = signal<string>(typeof window !== 'undefined' ? window.location.pathname : '');
  isInGameSession = computed(() => {
    const url = this.currentUrl();
    return url.includes('/game');
  });

  // Active party tracking
  activePartyCode = signal<string>(this.storage.getActiveParty()?.partyCode || '');
  partyQuery = this.partyQueries.useParty(() => this.activePartyCode());
  party = computed(() => this.partyQuery.data());
  characters = computed(() => this.party()?.characters || []);

  // List of all parties created by this Master from backend
  myPartiesQuery = this.partyQueries.useMyHostedParties();
  myParties = computed(() => this.myPartiesQuery.data() || []);

  themesQuery = this.themeQueries.useThemes();
  themes = computed(() => this.themesQuery.data() || []);

  createPartyMutation = this.partyQueries.useCreatePartyMutation();
  updateStatusMutation = this.partyQueries.useUpdatePartyStatusMutation();
  toggleReadyMutation = this.partyQueries.useToggleReadyMutation();

  // Local UI states
  isCreateModalOpen = signal<boolean>(false);
  isNoteEditorOpen = signal<boolean>(false);
  editingNoteId = signal<string | null>(null);

  // Note form
  noteForm = {
    title: '',
    content: '',
    category: 'general' as MasterNote['category'],
  };
  noteFilter = signal<string>('all');

  // Party form
  createPartyForm: CreatePartyInput = {
    title: '',
    themeKey: 'fantasia_medieval',
    description: '',
    password: '',
  };

  // Quick switch code input
  quickCodeInput = signal<string>('');

  // Copy feedback
  codeCopied = signal<boolean>(false);
  linkCopied = signal<boolean>(false);

  // Dice custom modifier
  diceModifier = signal<number>(0);
  diceCount = signal<number>(1);
  latestRoll = signal<DiceRollResult | null>(null);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      }
    });

    // Auto-fallback tab when returning to Lobby mode if currently in game-only tabs
    effect(() => {
      const inGame = this.isInGameSession();
      const currentTab = this.masterTools.activeTab();
      if (!inGame && (currentTab === 'players' || currentTab === 'notes' || currentTab === 'dice')) {
        untracked(() => this.masterTools.setActiveTab('parties'));
      }
    });

    // Keep activePartyCode in sync with storage, or auto-select from hosted parties
    effect(() => {
      const active = this.storage.getActiveParty()?.partyCode;
      const current = untracked(() => this.activePartyCode());
      if (active) {
        if (active !== current) {
          this.activePartyCode.set(active);
        }
      } else {
        const hosted = this.myParties();
        if (hosted.length > 0 && !current) {
          const first = hosted[0];
          this.storage.setActiveParty(first.id, first.code);
          this.activePartyCode.set(first.code);
        }
      }
    });

    // Record recent room if active party exists
    effect(() => {
      const p = this.party();
      if (p?.code) {
        untracked(() => {
          this.masterTools.addRecentRoom(p.code, p.title, p.themeTitle);
        });
      }
    });
  }

  // --- Getters & Helpers ---
  get isCollapsed(): boolean {
    return this.masterTools.isCollapsed();
  }

  get activeTab(): 'parties' | 'players' | 'notes' | 'dice' | 'settings' {
    return this.masterTools.activeTab();
  }

  get currentUser() {
    return this.storage.currentUser();
  }

  get filteredNotes(): MasterNote[] {
    const filter = this.noteFilter();
    const all = this.masterTools.notes();
    if (filter === 'all') return all;
    return all.filter((n) => n.category === filter);
  }

  get readyCount(): number {
    return this.characters().filter((c) => c.isReady).length;
  }

  get inviteLink(): string {
    const code = this.party()?.code || this.activePartyCode();
    if (!code) return '';
    return `${window.location.origin}/party/join/${code}`;
  }

  // --- Actions ---
  toggleCollapse(): void {
    this.masterTools.toggleCollapsed();
  }

  selectTab(tab: 'parties' | 'players' | 'notes' | 'dice' | 'settings'): void {
    this.masterTools.setActiveTab(tab);
  }

  copyCode(): void {
    const code = this.party()?.code || this.activePartyCode();
    if (code) {
      navigator.clipboard.writeText(code);
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 2000);
    }
  }

  copyInvite(): void {
    const link = this.inviteLink;
    if (link) {
      navigator.clipboard.writeText(link);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    }
  }

  switchParty(code: string): void {
    if (!code) return;
    const cleanCode = code.trim().toUpperCase();
    this.storage.setActiveParty('', cleanCode);
    this.activePartyCode.set(cleanCode);
    this.quickCodeInput.set('');
    this.router.navigate(['/lobby', cleanCode]);
  }

  goToLobby(): void {
    const code = this.party()?.code || this.activePartyCode();
    if (code) {
      this.router.navigate(['/lobby', code]);
    } else {
      this.router.navigate(['/lobby']);
    }
  }

  goToGame(): void {
    const code = this.party()?.code || this.activePartyCode();
    if (code) {
      this.router.navigate(['/game', code]);
    }
  }

  async startAdventure(): Promise<void> {
    const p = this.party();
    if (!p) return;
    try {
      await this.updateStatusMutation.mutateAsync({
        partyId: p.id,
        status: 'IN_PROGRESS',
      });
      this.goToGame();
    } catch (err: any) {
      alert('Erro ao iniciar aventura: ' + (err.message || 'Falha de comunicação'));
    }
  }

  async toggleHeroReady(charId: string): Promise<void> {
    try {
      await this.toggleReadyMutation.mutateAsync(charId);
    } catch (err: any) {
      alert('Erro ao alternar status do herói: ' + err.message);
    }
  }

  // --- Party Creation ---
  openCreateParty(): void {
    this.createPartyForm = {
      title: '',
      themeKey: 'fantasia_medieval',
      description: '',
      password: '',
    };
    this.isCreateModalOpen.set(true);
  }

  async submitCreateParty(): Promise<void> {
    try {
      const newParty = await this.createPartyMutation.mutateAsync(this.createPartyForm);
      this.isCreateModalOpen.set(false);
      this.storage.setActiveParty(newParty.id, newParty.code);
      this.activePartyCode.set(newParty.code);
      this.masterTools.addRecentRoom(newParty.code, newParty.title, newParty.themeTitle);
      this.router.navigate(['/lobby', newParty.code]);
    } catch (err: any) {
      alert('Erro ao criar sala: ' + (err.error?.message || err.message));
    }
  }

  // --- Notes Actions ---
  openNewNote(): void {
    this.editingNoteId.set(null);
    this.noteForm = {
      title: '',
      content: '',
      category: 'general',
    };
    this.isNoteEditorOpen.set(true);
  }

  editNote(note: MasterNote): void {
    this.editingNoteId.set(note.id);
    this.noteForm = {
      title: note.title,
      content: note.content,
      category: note.category,
    };
    this.isNoteEditorOpen.set(true);
  }

  saveNote(): void {
    if (!this.noteForm.title && !this.noteForm.content) {
      this.isNoteEditorOpen.set(false);
      return;
    }

    const currentId = this.editingNoteId();
    if (currentId) {
      this.masterTools.updateNote(currentId, {
        title: this.noteForm.title || 'Anotação sem título',
        content: this.noteForm.content,
        category: this.noteForm.category,
      });
    } else {
      this.masterTools.addNote(
        this.noteForm.title || 'Nova Anotação',
        this.noteForm.content,
        this.noteForm.category,
        this.activePartyCode()
      );
    }
    this.isNoteEditorOpen.set(false);
  }

  deleteNote(id: string): void {
    if (confirm('Tem certeza que deseja apagar esta anotação secreta?')) {
      this.masterTools.deleteNote(id);
    }
  }

  // --- Dice Rolling ---
  roll(sides: number): void {
    const count = this.diceCount() || 1;
    const mod = this.diceModifier() || 0;
    const res = this.masterTools.rollDice(sides, count, mod);
    this.latestRoll.set(res);
  }

  setModifier(val: number): void {
    this.diceModifier.set(val);
  }

  adjustModifier(delta: number): void {
    this.diceModifier.update((v) => v + delta);
  }

  setDiceCount(count: number): void {
    this.diceCount.set(Math.max(1, Math.min(10, count)));
  }
}
