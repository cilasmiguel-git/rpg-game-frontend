import { Component, Input, Output, EventEmitter, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Character } from '../../../../data/schemas/character.schema';
import { Party } from '../../../../data/schemas/party.schema';
import { Phase } from '../../../../data/schemas/phase.schema';
import { StorageService } from '../../../../core/services/storage.service';
import { GameSessionService } from '../../../../core/services/game-session.service';
import { QrCodeModalComponent } from '../../../../shared/components/ui';

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'MASTER' | 'PLAYER' | 'SYSTEM';
  text: string;
  timestamp: string;
  avatarLetter?: string;
  isDice?: boolean;
}

@Component({
  selector: 'app-party-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule, QrCodeModalComponent],
  template: `
    <aside class="sidebar-container">
      <!-- 1. Cabeçalho da Mesa (64px de altura para alinhar com o Header) -->
      <div class="party-header">
        <div class="party-title-group">
          <span class="theme-tag">🏰 {{ activeParty()?.themeTitle || activeParty()?.themeKey || 'RPG' }}</span>
          <h2 class="title">{{ activeParty()?.title || 'Sessão de Jogo' }}</h2>
        </div>
        <div class="header-code-actions">
          <div class="code-pill" (click)="copyCode()" title="Clique para copiar código">
            <span>SALA: <strong>{{ activeParty()?.code }}</strong></span>
            <button class="btn-icon">{{ copied() ? '✅' : '📋' }}</button>
          </div>
          <button
            type="button"
            class="qr-mini-btn"
            (click)="isQrModalOpen.set(true)"
            title="Exibir QR Code para Celular"
          >
            📱
          </button>
        </div>
      </div>

      <!-- 2. Abas de Controle: VÍDEO (JITSI) | CHAT | HERÓIS -->
      <nav class="sidebar-tabs">
        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'jitsi'"
          (click)="activeTab.set('jitsi')"
        >
          <span class="tab-icon">📹</span>
          <span class="tab-text">Chamada</span>
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'chat'"
          (click)="activeTab.set('chat')"
        >
          <span class="tab-icon">💬</span>
          <span class="tab-text">Chat</span>
          @if (unreadChatCount() > 0 && activeTab() !== 'chat') {
            <span class="unread-badge">{{ unreadChatCount() }}</span>
          }
        </button>

        <button
          type="button"
          class="tab-btn"
          [class.active]="activeTab() === 'heroes'"
          (click)="activeTab.set('heroes')"
        >
          <span class="tab-icon">👥</span>
          <span class="tab-text">Mesa ({{ activeCharacters().length }})</span>
        </button>
      </nav>

      <!-- 3. CONTEÚDO DA ABA SELECIONADA -->

      <!-- ABA 1: VÍDEO / JITSI MEET IFRAME -->
      @if (activeTab() === 'jitsi') {
        <div class="tab-panel jitsi-panel">
          <!-- Jitsi Top Toolbar -->
          <div class="jitsi-toolbar">
            <div class="room-info">
              <span class="live-dot"></span>
              <span class="room-name">Jitsi: {{ jitsiRoomName() }}</span>
            </div>
            <div class="toolbar-actions">
              <button
                class="jitsi-tool-btn"
                (click)="reloadJitsi()"
                title="Recarregar Chamada"
              >
                🔄 Recarregar
              </button>
              <a
                class="jitsi-tool-btn popout"
                [href]="rawJitsiUrl()"
                target="_blank"
                rel="noopener noreferrer"
                title="Abrir em Nova Aba / Pop-out"
              >
                ↗️ Pop-out
              </a>
            </div>
          </div>

          <!-- Jitsi Iframe Container -->
          <div class="iframe-wrapper">
            @if (jitsiSafeUrl(); as url) {
              <iframe
                #jitsiFrame
                [src]="url"
                class="jitsi-iframe"
                allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write; ambient-light-sensor"
                allowfullscreen
                title="Jitsi Meet Video Call"
              ></iframe>
            } @else {
              <div class="empty-state-box">
                <p>Carregando sala de vídeo conferência...</p>
              </div>
            }
          </div>

          <!-- Dica de microfone/câmera e WebRTC em HTTP -->
          <div class="jitsi-hint">
            <small>💡 Se o navegador bloquear WebRTC via IP/HTTP, use o botão <strong>[ ↗️ Pop-out ]</strong> acima para abrir a câmera diretamente!</small>
          </div>
        </div>
      }

      <!-- ABA 2: CHAT DA MESA -->
      @if (activeTab() === 'chat') {
        <div class="tab-panel chat-panel">
          <!-- Chat Messages Scroll -->
          <div class="chat-messages-container" #chatScroll>
            @for (msg of chatMessages(); track msg.id) {
              <div class="chat-msg" [class.system]="msg.role === 'SYSTEM'" [class.master]="msg.role === 'MASTER'">
                <div class="msg-header">
                  <span class="msg-sender" [class.gold]="msg.role === 'MASTER'">
                    {{ msg.role === 'MASTER' ? '👑 ' : '' }}{{ msg.sender }}
                  </span>
                  <span class="msg-time">{{ msg.timestamp }}</span>
                </div>
                <div class="msg-body" [class.dice-bubble]="msg.isDice">
                  {{ msg.text }}
                </div>
              </div>
            }
          </div>

          <!-- Chat Quick Actions (Dice & Emotes) -->
          <div class="chat-quick-actions">
            <button class="quick-btn" (click)="sendQuickDice(20)" title="Rolar D20 no Chat">🎲 D20</button>
            <button class="quick-btn" (click)="sendQuickDice(6)" title="Rolar D6 no Chat">🎲 D6</button>
            <button class="quick-btn" (click)="sendQuickAction('🛡️ Entrou em postura de Defesa!')">🛡️ Defesa</button>
            <button class="quick-btn" (click)="sendQuickAction('⚔️ Declarou Ataque contra o alvo!')">⚔️ Ataque</button>
          </div>

          <!-- Chat Input Row -->
          <form (ngSubmit)="sendChatMessage()" class="chat-input-form">
            <input
              type="text"
              [(ngModel)]="chatInputText"
              name="chatInput"
              placeholder="Mensagem ou /roll d20..."
              class="chat-input"
              autocomplete="off"
            />
            <button type="submit" class="chat-send-btn" [disabled]="!chatInputText.trim()">
              ➤
            </button>
          </form>
        </div>
      }

      <!-- ABA 3: HERÓIS & PERSONAGENS NA MESA -->
      @if (activeTab() === 'heroes') {
        <div class="tab-panel heroes-panel">
          <div class="characters-list">
            @for (char of activeCharacters(); track char.id) {
              <div
                class="character-card"
                [class.ready]="char.isReady"
                [class.selected]="selectedCharId() === char.id"
                (click)="selectChar(char)"
              >
                <!-- Avatar e Cores de Skin -->
                <div
                  class="avatar-circle"
                  [style.backgroundColor]="char.appearance?.skinColor || '#c5a059'"
                  [style.borderColor]="char.appearance?.outfitPrimaryColor || '#000'"
                >
                  <span>{{ char.name.charAt(0) }}</span>
                </div>

                <!-- Detalhes do Herói -->
                <div class="char-details">
                  <div class="char-name-row">
                    <span class="name">{{ char.name }}</span>
                    <span class="player-tag">({{ char.playerName || 'Jogador' }})</span>
                  </div>

                  <span class="class-info">{{ char.characterClass || 'Aventureiro' }} • {{ char.appearance?.race || 'Humano' }}</span>

                  <!-- Barras de HP e Mana/Energia (8-bit) -->
                  <div class="stats-row">
                    <div class="stat-bar hp" title="Vida (HP)">
                      <div class="stat-fill" [style.width.%]="(char.health / (char.maxHealth || 100)) * 100"></div>
                      <span class="stat-label">HP {{ char.health }}/{{ char.maxHealth || 100 }}</span>
                    </div>
                    <div class="stat-bar energy" title="Energia / Mana">
                      <div class="stat-fill" [style.width.%]="(char.energy / 100) * 100"></div>
                      <span class="stat-label">MP {{ char.energy || 0 }}</span>
                    </div>
                  </div>
                </div>

                <!-- Status Pronto -->
                <div class="ready-badge" [class.active]="char.isReady">
                  {{ char.isReady ? '✔ PRONTO' : '⏳ ESPERA' }}
                </div>
              </div>
            } @empty {
              <div class="empty-chars">
                Nenhum personagem registrado na mesa ainda.
              </div>
            }
          </div>
        </div>
      }

      <!-- Modal de QR Code da Mesa -->
      <app-qr-code-modal
        [isOpen]="isQrModalOpen()"
        [roomCode]="activeParty()?.code || ''"
        [roomTitle]="activeParty()?.title || ''"
        [inviteUrl]="getInviteLink()"
        (close)="isQrModalOpen.set(false)"
      ></app-qr-code-modal>
    </aside>
  `,
  styles: [`
    .sidebar-container {
      width: 380px;
      min-width: 380px;
      max-width: 380px;
      height: 100vh;
      background: #14100c;
      border-left: 3px solid #000000;
      box-shadow: -4px 0px 25px rgba(0, 0, 0, 0.9);
      display: flex;
      flex-direction: column;
      color: #eae3d2;
      overflow: hidden;
      box-sizing: border-box;
      flex-shrink: 0;
      z-index: 40;
    }

    /* Cabeçalho alinhado com a Navbar (64px) */
    .party-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 64px;
      box-sizing: border-box;
      background: #18130e;
      border-bottom: 3px solid #000000;
      padding: 0 0.85rem;
      gap: 0.5rem;
      flex-shrink: 0;
    }

    .party-title-group {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .theme-tag {
      font-size: 0.5rem;
      color: #110f0c;
      background: #c5a059;
      font-family: 'Press Start 2P', monospace;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.1rem 0.35rem;
      border: 1px solid #000000;
      width: fit-content;
    }

    .title {
      font-size: 0.75rem;
      font-weight: 700;
      color: #eae3d2;
      margin: 0;
      font-family: 'Press Start 2P', monospace;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .header-code-actions {
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }

    .code-pill {
      background: #0f0c09;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      padding: 0.3rem 0.5rem;
      font-size: 0.55rem;
      font-family: 'Press Start 2P', monospace;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      cursor: pointer;
      user-select: none;
      white-space: nowrap;
      color: #c5a059;
      transition: all 0.08s;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }
    }

    .qr-mini-btn {
      background: #241d17;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      color: #dfd5bf;
      padding: 0.3rem 0.45rem;
      font-size: 0.65rem;
      cursor: pointer;
      transition: all 0.08s;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #c5a059;
        color: #110f0c;
      }
    }

    .btn-icon {
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0;
      font-size: 0.75rem;
    }

    /* Abas de Navegação (8bitcn) */
    .sidebar-tabs {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      background: #0d0a08;
      border-bottom: 2px solid #000000;
      padding: 0.3rem;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .tab-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.25rem;
      padding: 0.45rem 0.1rem;
      background: #18130e;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      color: #a89b88;
      font-size: 0.5rem;
      font-family: 'Press Start 2P', monospace;
      text-transform: uppercase;
      cursor: pointer;
      position: relative;
      transition: all 0.08s;

      .tab-icon {
        font-size: 0.75rem;
      }

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #241d17;
        color: #eae3d2;
      }

      &.active {
        background: #c5a059;
        color: #110f0c;
        border-color: #000000;
        box-shadow: 3px 3px 0px 0px #000000;
      }
    }

    .unread-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      background: #8b0000;
      color: white;
      font-size: 0.5rem;
      padding: 1px 3px;
      border: 1px solid #000000;
    }

    /* Painéis */
    .tab-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-height: 0;
      overflow: hidden;
      background: #14100c;
    }

    /* --- ABA JITSI --- */
    .jitsi-panel {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .jitsi-toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #0f0c09;
      border: 2px solid #000000;
      padding: 0.35rem 0.5rem;
      font-size: 0.55rem;
      font-family: 'Press Start 2P', monospace;
    }

    .room-info {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: #c5a059;
    }

    .live-dot {
      width: 7px;
      height: 7px;
      background: #22c55e;
      border: 1px solid #000000;
    }

    .toolbar-actions {
      display: flex;
      gap: 0.35rem;
    }

    .jitsi-tool-btn {
      background: #241d17;
      border: 1px solid #000000;
      color: #dfd5bf;
      padding: 0.2rem 0.4rem;
      font-size: 0.5rem;
      font-family: 'Press Start 2P', monospace;
      text-decoration: none;
      cursor: pointer;

      &:hover {
        background: #c5a059;
        color: #110f0c;
      }
    }

    .iframe-wrapper {
      flex: 1;
      background: #000000;
      border: 2px solid #000000;
      box-shadow: inset 2px 2px 0px 0px #000000;
      overflow: hidden;
      position: relative;
    }

    .jitsi-iframe {
      width: 100%;
      height: 100%;
      border: none;
      display: block;
      background: #000000;
    }

    .jitsi-hint {
      background: #18130e;
      border: 1px solid #000000;
      padding: 0.4rem 0.5rem;
      font-size: 0.5rem;
      color: #a89b88;
      font-family: 'Press Start 2P', monospace;
      line-height: 1.5;
    }

    /* --- ABA CHAT --- */
    .chat-panel {
      padding: 0.5rem;
      gap: 0.4rem;
    }

    .chat-messages-container {
      flex: 1;
      overflow-y: auto;
      background: #0d0a08;
      border: 2px solid #000000;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .chat-msg {
      background: #1a1510;
      border: 1px solid #2a221b;
      padding: 0.4rem 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 2px;

      &.system {
        background: #141824;
        border-color: #243048;
        .msg-sender { color: #93c5fd; }
      }

      &.master {
        border-color: #c5a059;
      }
    }

    .msg-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.55rem;
      font-family: 'Press Start 2P', monospace;
    }

    .msg-sender {
      color: #dfd5bf;
      font-weight: 700;

      &.gold {
        color: #c5a059;
      }
    }

    .msg-time {
      color: #786b59;
      font-size: 0.45rem;
    }

    .msg-body {
      font-size: 0.6rem;
      color: #eae3d2;
      font-family: 'Press Start 2P', monospace;
      line-height: 1.4;
      word-break: break-word;

      &.dice-bubble {
        color: #facc15;
      }
    }

    .chat-quick-actions {
      display: flex;
      gap: 0.25rem;
      flex-wrap: wrap;
    }

    .quick-btn {
      background: #241d17;
      border: 1px solid #000000;
      color: #dfd5bf;
      padding: 0.25rem 0.4rem;
      font-size: 0.5rem;
      font-family: 'Press Start 2P', monospace;
      cursor: pointer;

      &:hover {
        background: #c5a059;
        color: #110f0c;
      }
    }

    .chat-input-form {
      display: flex;
      gap: 0.35rem;
    }

    .chat-input {
      flex: 1;
      background: #0f0c09;
      border: 2px solid #000000;
      color: #eae3d2;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      padding: 0.4rem 0.5rem;
      outline: none;

      &:focus {
        border-color: #c5a059;
      }
    }

    .chat-send-btn {
      background: #c5a059;
      border: 2px solid #000000;
      color: #110f0c;
      font-weight: 700;
      padding: 0 0.75rem;
      cursor: pointer;
      font-family: 'Press Start 2P', monospace;

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &:hover:not(:disabled) {
        background: #dfc282;
      }
    }

    /* --- ABA HERÓIS --- */
    .heroes-panel {
      padding: 0.5rem;
      overflow-y: auto;
    }

    .characters-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .character-card {
      background: #18130e;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.08s;

      &:hover {
        border-color: #c5a059;
      }

      &.selected {
        border-color: #c5a059;
        background: #241d15;
      }

      &.ready {
        border-left: 4px solid #22c55e;
      }
    }

    .avatar-circle {
      width: 32px;
      height: 32px;
      border: 2px solid #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.75rem;
      color: #110f0c;
      flex-shrink: 0;
    }

    .char-details {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .char-name-row {
      display: flex;
      align-items: center;
      gap: 0.3rem;

      .name {
        font-size: 0.65rem;
        font-weight: 700;
        font-family: 'Press Start 2P', monospace;
        color: #eae3d2;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .player-tag {
        font-size: 0.5rem;
        color: #8c7f6f;
        font-family: 'Press Start 2P', monospace;
      }
    }

    .class-info {
      font-size: 0.5rem;
      color: #a89b88;
      font-family: 'Press Start 2P', monospace;
    }

    .stats-row {
      display: flex;
      gap: 0.3rem;
      margin-top: 2px;
    }

    .stat-bar {
      flex: 1;
      height: 12px;
      background: #0a0806;
      border: 1px solid #000000;
      position: relative;
      overflow: hidden;

      &.hp .stat-fill { background: #9a1a1a; }
      &.energy .stat-fill { background: #1e40af; }
    }

    .stat-fill {
      height: 100%;
      transition: width 0.2s;
    }

    .stat-label {
      position: absolute;
      inset: 0;
      font-size: 6px;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 1px 2px #000000;
    }

    .ready-badge {
      font-size: 0.5rem;
      font-family: 'Press Start 2P', monospace;
      color: #8c7f6f;
      white-space: nowrap;

      &.active {
        color: #86efac;
      }
    }

    .empty-chars {
      color: #8c7f6f;
      font-size: 0.6rem;
      font-family: 'Press Start 2P', monospace;
      text-align: center;
      padding: 1.5rem 0.5rem;
    }
  `],
})
export class PartySidebarComponent {
  private sanitizer = inject(DomSanitizer);
  private storage = inject(StorageService);
  private gameSession = inject(GameSessionService);

  @Input() party?: Party | null;
  @Input() characters: Character[] = [];
  @Input() currentPhase?: Phase | null;
  @Input() isMaster = false;
  @Input() selectedCharacterId?: string;

  @Output() characterSelected = new EventEmitter<Character>();
  @Output() onNewPhase = new EventEmitter<void>();

  activeTab = signal<'jitsi' | 'chat' | 'heroes'>('jitsi');
  copied = signal<boolean>(false);
  isQrModalOpen = signal<boolean>(false);
  unreadChatCount = signal<number>(0);
  jitsiReloadKey = signal<number>(1);

  // Computed fallbacks to GameSessionService if not passed via Input
  activeParty = computed(() => this.party || this.gameSession.activeParty() || null);
  activeCharacters = computed(() => (this.characters && this.characters.length > 0) ? this.characters : this.gameSession.characters());
  selectedCharId = computed(() => this.selectedCharacterId || this.gameSession.selectedCharacter()?.id);

  // Chat local state
  chatInputText = '';
  chatMessages = signal<ChatMessage[]>([
    {
      id: 'msg_init',
      sender: 'Sistema RPG',
      role: 'SYSTEM',
      text: '⚔️ Chat da sessão e chamada Jitsi Meet integrados!',
      timestamp: this.formatTime(),
    },
  ]);

  get currentUser() {
    return this.storage.currentUser();
  }

  get displayName(): string {
    const u = this.currentUser;
    return u?.username || u?.playerName || (this.isMaster ? 'Mestre da Mesa' : 'Aventureiro');
  }

  jitsiRoomName = computed(() => {
    const code = this.activeParty()?.code?.toUpperCase() || this.storage.getActiveParty()?.partyCode?.toUpperCase() || 'LOBBY';
    return `RPG_Battlemap_${code}`;
  });

  rawJitsiUrl = computed(() => {
    const room = this.jitsiRoomName();
    const name = encodeURIComponent(this.displayName);
    return `https://meet.jit.si/${room}#userInfo.displayName="${name}"&config.prejoinPageEnabled=false&config.startWithAudioMuted=false&config.startWithVideoMuted=false&interfaceConfig.SHOW_JITSI_WATERMARK=false`;
  });

  jitsiSafeUrl = computed<SafeResourceUrl>(() => {
    this.jitsiReloadKey();
    return this.sanitizer.bypassSecurityTrustResourceUrl(this.rawJitsiUrl());
  });

  reloadJitsi() {
    this.jitsiReloadKey.update((k) => k + 1);
  }

  getInviteLink(): string {
    const code = this.activeParty()?.code || this.storage.getActiveParty()?.partyCode;
    if (!code) return '';
    return `${window.location.origin}/party/join/${code}`;
  }

  copyCode() {
    const code = this.activeParty()?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    }
  }

  selectChar(char: Character) {
    this.characterSelected.emit(char);
    this.gameSession.selectCharacter(char);
  }

  sendChatMessage() {
    const text = this.chatInputText.trim();
    if (!text) return;

    if (text.startsWith('/roll')) {
      const parts = text.split(' ');
      const diceParam = parts[1] || 'd20';
      const sides = parseInt(diceParam.replace('d', ''), 10) || 20;
      const roll = Math.floor(Math.random() * sides) + 1;
      this.addMessage(this.displayName, `🎲 Rolou D${sides} e obteve [ ${roll} ]!`, this.isMaster ? 'MASTER' : 'PLAYER', true);
    } else {
      this.addMessage(this.displayName, text, this.isMaster ? 'MASTER' : 'PLAYER');
    }

    this.chatInputText = '';
  }

  sendQuickDice(sides: number) {
    const roll = Math.floor(Math.random() * sides) + 1;
    this.addMessage(this.displayName, `🎲 Rolou D${sides}: resultado [ ${roll} ]!`, this.isMaster ? 'MASTER' : 'PLAYER', true);
  }

  sendQuickAction(actionText: string) {
    this.addMessage(this.displayName, actionText, this.isMaster ? 'MASTER' : 'PLAYER');
  }

  private addMessage(sender: string, text: string, role: 'MASTER' | 'PLAYER' | 'SYSTEM', isDice = false) {
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender,
      role,
      text,
      timestamp: this.formatTime(),
      isDice,
    };
    this.chatMessages.update((list) => [...list, newMsg]);

    if (this.activeTab() !== 'chat') {
      this.unreadChatCount.update((c) => c + 1);
    }
  }

  private formatTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}
