import { Component, inject, signal, computed, effect, untracked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PartyQueriesService } from '../../data/queries/party.queries';
import { ThemeQueriesService } from '../../data/queries/theme.queries';
import { StorageService } from '../../core/services/storage.service';
import { MasterToolsService } from '../../core/services/master-tools.service';
import { ButtonComponent, BadgeComponent, CardComponent, DialogComponent, QrCodeModalComponent } from '../../shared/components/ui';
import { Character } from '../../data/schemas/character.schema';
import { CreatePartyInput } from '../../data/schemas/party.schema';
import { GameIconComponent } from '../../shared/components/game-icon/game-icon.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, DialogComponent, QrCodeModalComponent, GameIconComponent],
  template: `
    <div class="lobby-page">
      <div class="lobby-container">
        <!-- Central View Switcher Tabs (Salas vs Configurações) -->
        @if (isMaster) {
          <div class="lobby-view-switcher">
            <button
              type="button"
              class="view-pill-btn"
              [class.active]="masterTools.activeTab() === 'parties'"
              (click)="masterTools.setActiveTab('parties')"
            >
              <span class="pill-icon"><game-icon name="castle" [size]="16"></game-icon></span>
              <span class="pill-label">Salas & Campanhas</span>
            </button>
            <button
              type="button"
              class="view-pill-btn"
              [class.active]="masterTools.activeTab() === 'settings'"
              (click)="masterTools.setActiveTab('settings')"
            >
              <span class="pill-icon"><game-icon name="settings" [size]="16"></game-icon></span>
              <span class="pill-label">Configurações do Sistema</span>
            </button>
          </div>
        }

        <!-- ================= ABA 1: SALAS & CAMPANHAS ================= -->
        @if (masterTools.activeTab() === 'parties' || !isMaster) {
          <!-- Top Status & Actions Header -->
          <div class="lobby-header-card">
            <div class="header-left">
              <span class="theme-pill flex items-center gap-1.5">
                <game-icon name="crossed-swords" [size]="13"></game-icon>
                {{ party()?.themeTitle || party()?.themeKey || 'RPG Party' }}
              </span>
              <h1 class="party-title">{{ party()?.title || 'Sala de Espera do RPG' }}</h1>
              <p class="party-desc">{{ party()?.description || 'Aguarde os aventureiros entrarem e ficarem prontos.' }}</p>
            </div>

            <div class="header-right">
              @if (party()?.code) {
                <div class="share-box">
                  <span class="share-label">Código & QR Code:</span>
                  <div class="flex items-center gap-2">
                    <div class="code-copy-row" (click)="copyPartyCode()">
                      <span class="party-code">{{ party()?.code }}</span>
                      <button class="copy-btn">
                        @if (codeCopied()) {
                          <game-icon name="check" [size]="12"></game-icon> Copiado!
                        } @else {
                          <game-icon name="scroll" [size]="12"></game-icon> Copiar
                        }
                      </button>
                    </div>
                    <button
                      type="button"
                      class="qr-header-btn flex items-center gap-1"
                      (click)="isQrModalOpen.set(true)"
                      title="Exibir QR Code para Celular"
                    >
                      <game-icon name="camera" [size]="14"></game-icon> QR Code
                    </button>
                  </div>
                </div>
              }

              <div class="action-buttons">
                @if (isMaster) {
                  <app-button variant="secondary" size="md" (onClick)="isCreatePartyModalOpen.set(true)">
                    <game-icon name="plus" [size]="14"></game-icon> Nova Sala
                  </app-button>
                  <app-button
                    variant="primary"
                    size="md"
                    [disabled]="!party()?.code"
                    (onClick)="startAdventure()"
                  >
                    <game-icon name="spear-feather" [size]="14"></game-icon> Iniciar Aventura
                  </app-button>
                } @else {
                  <app-button
                    variant="primary"
                    size="md"
                    [disabled]="!party()?.code"
                    (onClick)="goToGame()"
                  >
                    <game-icon name="treasure-map" [size]="14"></game-icon> Ir para o Battlemap
                  </app-button>
                }
              </div>
            </div>
          </div>

          @if (party()?.code && isMaster) {
            <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-lg">
              <div class="flex items-center gap-3">
                <game-icon name="link" [size]="24" color="#f59e0b"></game-icon>
                <div>
                  <div class="text-sm font-bold text-amber-300 font-rpg">Link Customizado & QR Code Para os Jogadores</div>
                  <div class="text-xs text-muted-foreground font-mono select-all mt-0.5">{{ getInviteLink() }}</div>
                  <div class="text-[11px] text-muted-foreground mt-0.5">Envie este link ou mostre o QR Code para seus amigos entrarem instantaneamente pelo celular.</div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <app-button variant="secondary" size="sm" (onClick)="isQrModalOpen.set(true)">
                  <game-icon name="camera" [size]="13"></game-icon> Ver QR Code
                </app-button>
                <app-button variant="primary" size="sm" (onClick)="copyInviteLink()">
                  @if (linkCopied()) {
                    <game-icon name="check" [size]="12"></game-icon> Link Copiado!
                  } @else {
                    <game-icon name="scroll" [size]="12"></game-icon> Copiar Link Customizado
                  }
                </app-button>
              </div>
            </div>
          }

          @if (myParties().length > 0 && isMaster) {
            <div class="my-parties-card">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h2 class="text-xl font-bold font-rpg text-amber-400 flex items-center gap-2">
                    <game-icon name="crown" [size]="18" color="#f1c40f"></game-icon> Suas Campanhas Criadas ({{ myParties().length }})
                  </h2>
                  <p class="text-xs text-muted-foreground">Selecione uma das suas salas para gerenciar os heróis e iniciar a aventura:</p>
                </div>
                <app-button variant="primary" size="sm" (onClick)="isCreatePartyModalOpen.set(true)">
                  <game-icon name="plus" [size]="13"></game-icon> Nova Sala
                </app-button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                @for (p of myParties(); track p.id) {
                  <div
                    class="bg-[#131926] border border-[#232e44] hover:border-amber-500/50 rounded-xl p-4 transition-all cursor-pointer flex flex-col justify-between gap-3 shadow-lg"
                    [class.border-amber-500]="p.code === party()?.code"
                    (click)="selectHostedParty(p.code)"
                  >
                    <div>
                      <div class="flex items-center justify-between gap-2 mb-2">
                        <span class="text-[11px] font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                          <game-icon name="crossed-swords" [size]="11"></game-icon> {{ p.themeTitle || p.themeKey }}
                        </span>
                        <span
                          class="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                          [class]="p.status === 'IN_PROGRESS' ? 'bg-green-500/20 text-green-400' : 'bg-slate-800 text-slate-400'"
                        >
                          {{ p.status === 'IN_PROGRESS' ? 'Em Aventura' : 'No Lobby' }}
                        </span>
                      </div>
                      <h3 class="text-base font-bold text-slate-100 font-rpg">{{ p.title }}</h3>
                      @if (p.description) {
                        <p class="text-xs text-slate-400 line-clamp-2 mt-1">{{ p.description }}</p>
                      }
                    </div>

                    <div class="flex items-center justify-between pt-2 border-t border-slate-800 text-xs">
                      <span class="font-mono text-amber-300 font-bold tracking-wider">Código: {{ p.code }}</span>
                      <span class="text-slate-400 flex items-center gap-1">
                        <game-icon name="users" [size]="12"></game-icon> {{ p.characters?.length || 0 }} heróis
                      </span>
                    </div>
                  </div>
                }
              </div>
            </div>
          } @else if (!party()?.code && isMaster) {
            <!-- Master without party banner -->
            <div class="no-party-card">
              <div class="empty-icon"><game-icon name="castle" [size]="48" color="#475569"></game-icon></div>
              <h2>Você ainda não criou uma sala ativa</h2>
              <p>Crie uma sala de RPG, escolha a temática (Fantasia Sombria, Cyberpunk, Terror) e compartilhe o código com seus amigos!</p>
              <app-button variant="primary" size="lg" (onClick)="isCreatePartyModalOpen.set(true)">
                <game-icon name="sparkles" [size]="14"></game-icon> Criar Primeira Sala
              </app-button>
            </div>
          }

          <!-- Characters and Ready Status Section -->
          <div class="players-section">
            <div class="section-title-bar">
              <div>
                <h2 class="section-title">Heróis na Mesa ({{ characters().length }})</h2>
                <span class="subtext">Todos os personagens criados nesta sessão</span>
              </div>

              <div class="section-actions">
                <app-button
                  variant="secondary"
                  size="sm"
                  (onClick)="goToCharacterCreator()"
                >
                  <game-icon name="wizard" [size]="14"></game-icon> Criar Novo Herói
                </app-button>
              </div>
            </div>

            <div class="characters-grid">
              @for (char of characters(); track char.id) {
                <div class="hero-card" [class.ready]="char.isReady">
                  <div class="hero-card-header">
                    <div
                      class="hero-avatar"
                      [style.backgroundColor]="char.appearance.skinColor"
                      [style.borderColor]="char.appearance.outfitPrimaryColor"
                    >
                      {{ char.name.charAt(0) }}
                    </div>
                    <div class="hero-title-group">
                      <h3 class="hero-name">{{ char.name }}</h3>
                      <span class="hero-player">Jogador: <strong>{{ char.playerName }}</strong></span>
                    </div>
                    <div class="ready-tag" [class.is-ready]="char.isReady">
                      @if (char.isReady) {
                        <game-icon name="check" [size]="10"></game-icon> PRONTO
                      } @else {
                        <game-icon name="hourglass" [size]="10"></game-icon> PREPARANDO
                      }
                    </div>
                  </div>

                  <div class="hero-card-body">
                    <div class="stat-pill">
                      <span>Classe:</span>
                      <strong>{{ char.characterClass || 'Guerreiro' }}</strong>
                    </div>
                    <div class="stat-pill">
                      <span>Raça:</span>
                      <strong>{{ char.appearance.race }}</strong>
                    </div>
                    <div class="stat-pill">
                      <span>Arma:</span>
                      <strong>{{ char.appearance.mainWeapon || 'Arma Base' }}</strong>
                    </div>
                    <div class="stat-pill">
                      <span>Traje:</span>
                      <strong>{{ char.appearance.outfitType }}</strong>
                    </div>

                    <div class="hp-energy-row">
                      <div class="bar-container hp">
                        <div class="bar-fill" [style.width.%]="(char.health / char.maxHealth) * 100"></div>
                        <span class="bar-text">HP {{ char.health }}/{{ char.maxHealth }}</span>
                      </div>
                      <div class="bar-container energy">
                        <div class="bar-fill" [style.width.%]="(char.energy / 100) * 100"></div>
                        <span class="bar-text">MP {{ char.energy }}</span>
                      </div>
                    </div>
                  </div>

                  <div class="hero-card-footer">
                    <button
                      class="toggle-ready-btn"
                      [class.active]="char.isReady"
                      (click)="toggleReady(char.id)"
                    >
                      {{ char.isReady ? 'Desmarcar Pronto' : 'Ficar Pronto' }}
                    </button>
                  </div>
                </div>
              } @empty {
                <div class="no-heroes-card">
                  <p>Nenhum personagem foi criado ainda.</p>
                  <app-button variant="primary" size="md" (onClick)="goToCharacterCreator()">
                    <game-icon name="wizard" [size]="14"></game-icon> Criar Primeiro Herói
                  </app-button>
                </div>
              }
            </div>
          </div>
        }

        <!-- ================= ABA 2: CONFIGURAÇÕES DO SISTEMA ================= -->
        @if (masterTools.activeTab() === 'settings' && isMaster) {
          <div class="central-settings-container">
            <div class="settings-header-card">
              <div class="icon"><game-icon name="settings" [size]="24"></game-icon></div>
              <div>
                <h1 class="settings-page-title">Painel de Configurações do Sistema</h1>
                <p class="settings-page-desc">Personalize o comportamento do áudio retro, efeitos visuais 8-bit e o motor gráfico da sua mesa.</p>
              </div>
            </div>

            <div class="settings-grid">
              <!-- Card 1: Áudio & Efeitos Sonoros -->
              <div class="central-setting-card">
                <div class="card-icon"><game-icon name="game-icons:sound-waves" [size]="24"></game-icon></div>
                <div class="card-content">
                  <h3 class="setting-title">Efeitos Sonoros 8-Bit</h3>
                  <p class="setting-desc">Toca efeitos sonoros sintetizados estilo chiptune ao rolar dados e executar ações táticas.</p>
                </div>
                <div class="card-action">
                  <button
                    type="button"
                    class="arcade-toggle-btn"
                    [class.active]="masterTools.soundEffectsEnabled()"
                    (click)="masterTools.setSoundEffects(!masterTools.soundEffectsEnabled())"
                  >
                    {{ masterTools.soundEffectsEnabled() ? 'ATIVADO' : 'DESATIVADO' }}
                  </button>
                </div>
              </div>

              <!-- Card 2: Filtro CRT Scanlines -->
              <div class="central-setting-card">
                <div class="card-icon"><game-icon name="game-icons:retro-controller" [size]="24"></game-icon></div>
                <div class="card-content">
                  <h3 class="setting-title">Scanlines CRT Retrô</h3>
                  <p class="setting-desc">Aplica uma textura suave de linhas de varredura CRT sobre a interface para a autêntica sensação de TV arcade dos anos 90.</p>
                </div>
                <div class="card-action">
                  <button
                    type="button"
                    class="arcade-toggle-btn"
                    [class.active]="masterTools.crtScanlinesEnabled()"
                    (click)="masterTools.setCrtScanlines(!masterTools.crtScanlinesEnabled())"
                  >
                    {{ masterTools.crtScanlinesEnabled() ? 'ATIVADO' : 'DESATIVADO' }}
                  </button>
                </div>
              </div>

              <!-- Card 4: Perfil do Mestre & Permissões -->
              <div class="central-setting-card wide profile-card">
                <div class="card-icon"><game-icon name="crown" [size]="24" color="#f1c40f"></game-icon></div>
                <div class="card-content">
                  <h3 class="setting-title">Credenciais da Mesa</h3>
                  <p class="setting-desc">Informações da sessão ativa e autenticação do Mestre no MongoDB Atlas.</p>
                  <div class="credentials-table">
                    <div class="cred-row">
                      <span class="k">Mestre da Sessão:</span>
                      <span class="v gold">{{ currentUser?.username || 'Mestre' }}</span>
                    </div>
                    <div class="cred-row">
                      <span class="k">Papel Administrativo:</span>
                      <span class="v">MASTER (Controle Total)</span>
                    </div>
                    <div class="cred-row">
                      <span class="k">Estilo Visual:</span>
                      <span class="v">8bitcn/ui Pixel Art (Press Start 2P)</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Card 5: Limpeza e Manutenção -->
              <div class="central-setting-card wide danger-card">
                <div class="card-icon"><game-icon name="game-icons:broom" [size]="24"></game-icon></div>
                <div class="card-content">
                  <h3 class="setting-title">Manutenção Local & Cache</h3>
                  <p class="setting-desc">Limpe histórico de salas recentes ou rolagens de dados armazenadas localmente no navegador.</p>
                </div>
                <div class="danger-btns-group">
                  <button type="button" class="danger-action-btn" (click)="masterTools.clearAllRecentRooms()">
                    Limpar Histórico de Salas
                  </button>
                  <button type="button" class="danger-action-btn" (click)="masterTools.clearDiceHistory()">
                    Limpar Histórico de Dados
                  </button>
                </div>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Modal de QR Code da Sala -->
      <app-qr-code-modal
        [isOpen]="isQrModalOpen()"
        [roomCode]="party()?.code || partyCode()"
        [roomTitle]="party()?.title || ''"
        [inviteUrl]="getInviteLink()"
        (close)="isQrModalOpen.set(false)"
      ></app-qr-code-modal>

      <!-- Modal de Criação de Sala pelo Mestre -->
      <app-modal
        [isOpen]="isCreatePartyModalOpen()"
        title="Criar Nova Campanha de RPG"
        maxWidth="600px"
        (close)="isCreatePartyModalOpen.set(false)"
      >
        <form (ngSubmit)="submitCreateParty()" class="party-modal-form">
          <div class="form-group">
            <label>Título da Campanha:</label>
            <input
              type="text"
              [(ngModel)]="createPartyForm.title"
              name="partyTitle"
              placeholder="Ex: A Maldição de Ravenloft"
              required
            />
          </div>

          <div class="form-group">
            <label>Selecione a Temática Visual e Narrativa:</label>
            <select [(ngModel)]="createPartyForm.themeKey" name="partyTheme" required>
              @for (theme of themes(); track theme.key) {
                <option [value]="theme.key">{{ theme.title }} ({{ theme.genre }})</option>
              }
            </select>
          </div>

          <div class="form-group">
            <label>Descrição ou Premissa Inicial:</label>
            <textarea
              [(ngModel)]="createPartyForm.description"
              name="partyDesc"
              rows="3"
              placeholder="Uma breve introdução sobre o que espera os jogadores nesta aventura..."
            ></textarea>
          </div>

          <div class="form-group">
            <label>Senha da Sala (Opcional):</label>
            <input
              type="password"
              [(ngModel)]="createPartyForm.password"
              name="partyPass"
              placeholder="Deixe em branco para permitir entrada livre com código"
            />
          </div>

          <div class="modal-actions">
            <app-button variant="secondary" type="button" (onClick)="isCreatePartyModalOpen.set(false)">
              Cancelar
            </app-button>
            <app-button variant="primary" type="submit" [loading]="createPartyMutation.isPending()">
              <game-icon name="sparkles" [size]="14"></game-icon> Criar Sala
            </app-button>
          </div>
        </form>
      </app-modal>
    </div>
  `,
  styles: [`
    .lobby-page {
      min-height: calc(100vh - 64px);
      padding: 2rem 1.5rem;
      background: radial-gradient(circle at 50% 10%, #1a1612 0%, #110f0c 100%);
      color: #eae3d2;
    }

    .lobby-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }

    .lobby-header-card {
      background: #18130e;
      border: 4px solid #000000;
      border-radius: 0;
      padding: 1.5rem 1.75rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1.5rem;
      box-shadow: 6px 6px 0px 0px #000000;
      flex-wrap: wrap;
    }

    .header-left {
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      max-width: 600px;
    }

    .theme-pill {
      font-size: 0.6rem;
      color: #110f0c;
      background: #c5a059;
      font-family: 'Press Start 2P', monospace;
      font-weight: 700;
      text-transform: uppercase;
      padding: 0.25rem 0.5rem;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      display: inline-block;
      width: fit-content;
    }

    .party-title {
      font-size: 1.35rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #eae3d2;
      margin: 0;
      text-shadow: 2px 2px 0px #000000;
      line-height: 1.4;
    }

    .party-desc {
      font-size: 0.7rem;
      color: #a89b88;
      font-family: 'Press Start 2P', monospace;
      margin: 0;
      line-height: 1.6;
    }

    .header-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 1rem;
    }

    .share-box {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.35rem;
    }

    .share-label {
      font-size: 0.6rem;
      color: #8c7f6f;
      text-transform: uppercase;
      font-family: 'Press Start 2P', monospace;
      font-weight: 700;
    }

    .code-copy-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: #0f0c09;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      padding: 0.4rem 0.85rem;
      border-radius: 0;
      cursor: pointer;
      transition: all 0.08s ease;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #1c1611;
      }
    }

    .party-code {
      font-family: 'Press Start 2P', monospace;
      font-size: 1rem;
      font-weight: 700;
      color: #c5a059;
    }

    .copy-btn {
      background: #241d17;
      border: 1px solid #000000;
      color: #dfd5bf;
      font-size: 0.55rem;
      font-family: 'Press Start 2P', monospace;
      cursor: pointer;
      font-weight: 700;
      padding: 0.2rem 0.4rem;
    }

    .qr-header-btn {
      background: #241d17;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      color: #c5a059;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      font-weight: 700;
      padding: 0.4rem 0.65rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      transition: all 0.08s ease;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #c5a059;
        color: #110f0c;
      }
    }

    .action-buttons {
      display: flex;
      gap: 0.75rem;
    }

    .no-party-card {
      background: #17130f;
      border: 3px dashed #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      border-radius: 0;
      padding: 3rem 2rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      .empty-icon {
        font-size: 2.5rem;
      }
      h2 {
        font-size: 1.1rem;
        font-family: 'Press Start 2P', monospace;
        margin: 0;
        color: #eae3d2;
      }
      p {
        color: #a89b88;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.65rem;
        line-height: 1.6;
        max-width: 550px;
        margin: 0;
      }
    }

    .players-section {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .section-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000000;
      padding-bottom: 0.75rem;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #eae3d2;
      margin: 0;
    }

    .subtext {
      font-size: 0.6rem;
      color: #8c7f6f;
      font-family: 'Press Start 2P', monospace;
    }

    .characters-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 1.25rem;
    }

    .hero-card {
      background: #17130f;
      border: 3px solid #000000;
      box-shadow: 4px 4px 0px 0px #000000;
      border-radius: 0;
      padding: 1.25rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
      transition: transform 0.08s ease;

      &:hover {
        border-color: #c5a059;
      }

      &.ready {
        border-color: #2b633b;
      }
    }

    .hero-card-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .hero-avatar {
      width: 44px;
      height: 44px;
      border-radius: 0;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 1rem;
      color: #110f0c;
      flex-shrink: 0;
    }

    .hero-title-group {
      flex: 1;
      min-width: 0;
    }

    .hero-name {
      font-size: 0.85rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #eae3d2;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hero-player {
      font-size: 0.6rem;
      color: #a89b88;
      font-family: 'Press Start 2P', monospace;
      margin-top: 4px;
    }

    .ready-tag {
      font-size: 0.55rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      padding: 0.25rem 0.5rem;
      border-radius: 0;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      background: #221c16;
      color: #a89b88;

      &.is-ready {
        background: #1b4329;
        color: #86efac;
      }
    }

    .hero-card-body {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .stat-pill {
      display: flex;
      justify-content: space-between;
      font-size: 0.6rem;
      font-family: 'Press Start 2P', monospace;
      color: #a89b88;
      border-bottom: 1px dashed rgba(58, 50, 42, 0.6);
      padding-bottom: 0.25rem;

      strong {
        color: #eae3d2;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.65rem;
      }
    }

    .hp-energy-row {
      display: flex;
      gap: 0.5rem;
      margin-top: 0.4rem;
    }

    .bar-container {
      flex: 1;
      height: 16px;
      background: #0a0806;
      border-radius: 0;
      position: relative;
      overflow: hidden;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;

      &.hp .bar-fill { background: #9a1a1a; }
      &.energy .bar-fill { background: #1e40af; }
    }

    .bar-fill {
      height: 100%;
      transition: width 0.3s ease;
    }

    .bar-text {
      position: absolute;
      inset: 0;
      font-size: 7px;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      text-shadow: 0 1px 2px #000000;
    }

    .hero-card-footer {
      display: flex;
      justify-content: flex-end;
    }

    .toggle-ready-btn {
      background: #241d17;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      color: #eae3d2;
      padding: 0.4rem 0.75rem;
      border-radius: 0;
      font-size: 0.6rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      text-transform: uppercase;
      cursor: pointer;
      transition: all 0.08s ease;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #352c24;
        color: #fff;
      }

      &.active {
        background: #1b4329;
        border-color: #000000;
        color: #86efac;
      }
    }

    .no-heroes-card {
      grid-column: 1 / -1;
      background: #17130f;
      border: 1px dashed #3a322a;
      border-radius: 0.75rem;
      padding: 3rem 1.5rem;
      text-align: center;
      color: #8c7f6f;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .party-modal-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;

      .form-group {
        display: flex;
        flex-direction: column;
        gap: 0.4rem;

        label {
          font-size: 0.8rem;
          font-weight: 700;
          font-family: 'Cinzel', serif;
          color: #dfd5bf;
        }

        input, select, textarea {
          background: #0f0c09;
          border: 1px solid #3a322a;
          border-radius: 4px;
          padding: 0.65rem 0.85rem;
          color: #eae3d2;
          font-family: 'EB Garamond', serif;
          font-size: 0.95rem;
          outline: none;

          &:focus {
            border-color: #c5a059;
            box-shadow: 0 0 10px rgba(197, 160, 89, 0.25);
          }
        }
      }

      .modal-actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
      }
    }

      /* --- Central View Switcher Tabs (Salas vs Configurações) --- */
      .lobby-view-switcher {
        display: flex;
        gap: 0.75rem;
        background: #0f0c09;
        border: 3px solid #000000;
        box-shadow: 4px 4px 0px 0px #000000;
        padding: 0.4rem;
        width: fit-content;
      }

      .view-pill-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: #18130e;
        border: 2px solid #000000;
        box-shadow: 2px 2px 0px 0px #000000;
        color: #a89b88;
        padding: 0.6rem 1rem;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.65rem;
        font-weight: 700;
        text-transform: uppercase;
        cursor: pointer;
        transition: all 0.08s ease;

        .pill-icon {
          font-size: 1rem;
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

      /* --- Central Settings Dashboard (Aba 2) --- */
      .central-settings-container {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
      }

      .settings-header-card {
        background: #18130e;
        border: 4px solid #000000;
        box-shadow: 6px 6px 0px 0px #000000;
        padding: 1.5rem 1.75rem;
        display: flex;
        align-items: center;
        gap: 1.25rem;

        .icon {
          font-size: 2.2rem;
          filter: drop-shadow(3px 3px 0px #000000);
        }

        .settings-page-title {
          font-size: 1.2rem;
          font-weight: 700;
          font-family: 'Press Start 2P', monospace;
          color: #eae3d2;
          margin: 0;
          line-height: 1.4;
        }

        .settings-page-desc {
          font-size: 0.65rem;
          color: #a89b88;
          font-family: 'Press Start 2P', monospace;
          margin-top: 0.4rem;
          line-height: 1.6;
        }
      }

      .settings-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
        gap: 1.5rem;
      }

      .central-setting-card {
        background: #17130f;
        border: 3px solid #000000;
        box-shadow: 4px 4px 0px 0px #000000;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        gap: 1.25rem;

        &.wide {
          grid-column: 1 / -1;
        }

        .card-icon {
          font-size: 1.8rem;
          filter: drop-shadow(2px 2px 0px #000000);
        }

        .card-content {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .setting-title {
          font-size: 0.85rem;
          font-weight: 700;
          font-family: 'Press Start 2P', monospace;
          color: #eae3d2;
          margin: 0;
        }

        .setting-desc {
          font-size: 0.6rem;
          color: #a89b88;
          font-family: 'Press Start 2P', monospace;
          line-height: 1.6;
          margin: 0;
        }
      }

      .arcade-toggle-btn {
        background: #0d0a08;
        border: 3px solid #000000;
        box-shadow: 3px 3px 0px 0px #000000;
        color: #8c7f6f;
        padding: 0.65rem 1.25rem;
        font-size: 0.75rem;
        font-family: 'Press Start 2P', monospace;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.08s ease;

        &:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px #000000;
        }

        &.active {
          background: #15803d;
          color: #ffffff;
          box-shadow: 3px 3px 0px 0px #000000;
        }
      }

      .engine-pills-row {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
        gap: 1rem;
      }

      .engine-choice-btn {
        background: #0f0c09;
        border: 3px solid #000000;
        box-shadow: 3px 3px 0px 0px #000000;
        padding: 1rem;
        display: flex;
        align-items: flex-start;
        gap: 0.75rem;
        cursor: pointer;
        text-align: left;
        transition: all 0.08s ease;

        .engine-icon {
          font-size: 1.5rem;
          flex-shrink: 0;
        }

        .engine-texts {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .title {
            font-size: 0.75rem;
            font-weight: 700;
            font-family: 'Press Start 2P', monospace;
            color: #eae3d2;
          }

          .subtitle {
            font-size: 0.55rem;
            color: #8c7f6f;
            font-family: 'Press Start 2P', monospace;
            line-height: 1.5;
          }
        }

        &:active {
          transform: translate(2px, 2px);
          box-shadow: 1px 1px 0px 0px #000000;
        }

        &:hover {
          background: #241d17;
          border-color: #c5a059;
        }

        &.active {
          background: #241d17;
          border-color: #c5a059;
          box-shadow: 4px 4px 0px 0px #000000;

          .title {
            color: #c5a059;
          }
        }
      }

      .credentials-table {
        margin-top: 0.75rem;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        background: #0d0a08;
        border: 2px solid #000000;
        padding: 0.85rem;
        font-family: 'Press Start 2P', monospace;
        font-size: 0.65rem;

        .cred-row {
          display: flex;
          justify-content: space-between;
          padding: 0.25rem 0;
          border-bottom: 1px dashed rgba(58, 50, 42, 0.6);

          &:last-child {
            border-bottom: none;
          }

          .k { color: #8c7f6f; }
          .v { color: #eae3d2; }
          .gold { color: #c5a059; }
        }
      }

      .danger-card {
        border-color: #450a0a;
      }

      .danger-btns-group {
        display: flex;
        gap: 1rem;
        flex-wrap: wrap;

        .danger-action-btn {
          background: #241d17;
          border: 2px solid #000000;
          box-shadow: 2px 2px 0px 0px #000000;
          color: #f87171;
          font-family: 'Press Start 2P', monospace;
          font-size: 0.6rem;
          font-weight: 700;
          padding: 0.6rem 1rem;
          cursor: pointer;
          transition: all 0.08s ease;

          &:hover {
            background: #450a0a;
            color: #fecaca;
          }
        }
      }
    `]
})
export class LobbyComponent {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private partyQueries = inject(PartyQueriesService);
  private themeQueries = inject(ThemeQueriesService);
  private storage = inject(StorageService);
  masterTools = inject(MasterToolsService);

  partyCode = signal<string>(
    this.route.snapshot.paramMap.get('code') ||
      this.storage.getActiveParty()?.partyCode ||
      ''
  );

  codeCopied = signal<boolean>(false);
  isCreatePartyModalOpen = signal<boolean>(false);
  isQrModalOpen = signal<boolean>(false);

  partyQuery = this.partyQueries.useParty(() => this.partyCode());
  party = computed(() => this.partyQuery.data());

  characters = computed(() => this.party()?.characters || []);

  myPartiesQuery = this.partyQueries.useMyHostedParties();
  myParties = computed(() => this.myPartiesQuery.data() || []);

  themesQuery = this.themeQueries.useThemes();
  themes = computed(() => this.themesQuery.data() || []);

  createPartyMutation = this.partyQueries.useCreatePartyMutation();
  updateStatusMutation = this.partyQueries.useUpdatePartyStatusMutation();
  toggleReadyMutation = this.partyQueries.useToggleReadyMutation();

  createPartyForm: CreatePartyInput = {
    title: '',
    themeKey: 'fantasia_medieval',
    description: '',
    password: '',
  };

  constructor() {
    // Sync with router param
    this.route.paramMap.subscribe((params) => {
      const code = params.get('code');
      if (code) {
        this.partyCode.set(code);
        this.storage.setActiveParty('', code);
      }
    });

    // Auto-select latest hosted party if on /lobby without code
    effect(() => {
      const code = untracked(() => this.partyCode());
      if (!code && this.isMaster) {
        const hosted = this.myParties();
        if (hosted.length > 0) {
          const first = hosted[0];
          this.partyCode.set(first.code);
          this.storage.setActiveParty(first.id, first.code);
        }
      }
    });
  }

  selectHostedParty(code: string) {
    this.partyCode.set(code);
    this.storage.setActiveParty('', code);
    this.router.navigate(['/lobby', code]);
  }

  get isMaster(): boolean {
    return this.storage.isMaster();
  }

  get currentUser() {
    return this.storage.currentUser();
  }

  linkCopied = signal<boolean>(false);

  getInviteLink(): string {
    const code = this.party()?.code || this.partyCode();
    if (!code) return '';
    return `${window.location.origin}/party/join/${code}`;
  }

  copyInviteLink() {
    const link = this.getInviteLink();
    if (link) {
      navigator.clipboard.writeText(link);
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2500);
    }
  }

  copyPartyCode() {
    const code = this.party()?.code;
    if (code) {
      navigator.clipboard.writeText(code);
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 2000);
    }
  }

  async submitCreateParty() {
    try {
      const newParty = await this.createPartyMutation.mutateAsync(this.createPartyForm);
      this.isCreatePartyModalOpen.set(false);
      this.storage.setActiveParty(newParty.id, newParty.code);
      this.partyCode.set(newParty.code);
    } catch (err: any) {
      alert('Erro ao criar sala: ' + (err.error?.message || err.message));
    }
  }

  async toggleReady(characterId: string) {
    try {
      await this.toggleReadyMutation.mutateAsync(characterId);
    } catch (err: any) {
      alert('Erro ao alternar status de pronto: ' + err.message);
    }
  }

  async startAdventure() {
    const p = this.party();
    if (!p) return;
    try {
      await this.updateStatusMutation.mutateAsync({
        partyId: p.id,
        status: 'IN_PROGRESS',
      });
      this.router.navigate(['/game', p.code]);
    } catch (err: any) {
      alert('Erro ao iniciar aventura: ' + err.message);
    }
  }

  goToGame() {
    const code = this.party()?.code || this.partyCode();
    if (code) {
      this.router.navigate(['/game', code]);
    }
  }

  goToCharacterCreator() {
    const code = this.party()?.code || this.partyCode();
    this.router.navigate(['/character-creator', code]);
  }
}
