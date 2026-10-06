import { Component, ChangeDetectionStrategy, signal, computed, OnInit, inject, effect, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute } from '@angular/router';
import { BattlemapService } from '../../../../core/services/battlemap.service';
import { BattlemapState, PlacedAsset as BattlemapPlacedAsset, GridToken as BattlemapGridToken, SpriteAnimationConfig } from '../../../../core/models/battlemap.model';
import { StorageService } from '../../../../core/services/storage.service';
import { GameSessionService } from '../../../../core/services/game-session.service';
import { ApiConfig } from '../../../../core/config/api.config';
import { GameIconComponent } from '../../../../shared/components/game-icon/game-icon.component';

export interface GridToken {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'npc';
  avatar: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  size: number;
  color: string;
}

export type GridTerrainType = 'grass' | 'stone' | 'water' | 'lava' | 'wood' | 'sand' | 'dirt' | 'void';

export interface PlacedTerrain {
  [coord: string]: GridTerrainType;
}

export interface PlacedMultiTileAsset {
  id: string;
  assetId: string;
  name: string;
  imageUrl: string;
  gridX: number;
  gridY: number;
  widthTiles: number;
  heightTiles: number;
  rotation: number; // 0, 90, 180, 270
  opacity: number; // 0.2 to 1.0
  isObstacle: boolean;
  layer: 'under' | 'over';
  animation?: SpriteAnimationConfig;
}

export interface MultiTileAssetItem {
  id: string;
  name: string;
  category: 'castles' | 'buildings' | 'dungeons' | 'nature' | 'props' | 'custom' | string;
  widthTiles: number;
  heightTiles: number;
  imageUrl: string;
  isObstacle: boolean;
  isCustom?: boolean;
  animation?: SpriteAnimationConfig;
}

interface AssetManifest {
  version: string;
  assets: MultiTileAssetItem[];
}

const FALLBACK_DEFAULT_ASSETS: MultiTileAssetItem[] = [
  {
    id: 'ts_bld_castle_knights',
    name: 'Castelo dos Cavaleiros (4x4)',
    category: 'tiny_swords',
    widthTiles: 4,
    heightTiles: 4,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_castle_blue.svg',
    isObstacle: true
  },
  {
    id: 'ts_char_spear_goblin',
    name: 'Goblin Lanceiro (1x1)',
    category: 'tiny_swords',
    widthTiles: 1,
    heightTiles: 1,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_spear_goblin.svg',
    isObstacle: false
  },
  {
    id: 'ts_char_minotaur',
    name: 'Minotauro Selvagem (2x2)',
    category: 'tiny_swords',
    widthTiles: 2,
    heightTiles: 2,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_minotaur.svg',
    isObstacle: true
  },
  {
    id: 'ts_char_troll',
    name: 'Troll com Clava (3x3)',
    category: 'tiny_swords',
    widthTiles: 3,
    heightTiles: 3,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_troll.svg',
    isObstacle: true
  },
  {
    id: 'ts_char_warrior_blue',
    name: 'Cavaleiro com Espada (1x1)',
    category: 'tiny_swords',
    widthTiles: 1,
    heightTiles: 1,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_warrior_blue.svg',
    isObstacle: false
  },
  {
    id: 'ts_res_gold_mine',
    name: 'Mina de Ouro Ativa (3x3)',
    category: 'tiny_swords',
    widthTiles: 3,
    heightTiles: 3,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_gold_mine.svg',
    isObstacle: true
  },
  {
    id: 'ts_res_tree_oak',
    name: 'Carvalho Tiny Swords (2x2)',
    category: 'tiny_swords',
    widthTiles: 2,
    heightTiles: 2,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_tree.svg',
    isObstacle: true
  },
  {
    id: 'ts_res_happy_sheep',
    name: 'Ovelha do Pasto (1x1)',
    category: 'tiny_swords',
    widthTiles: 1,
    heightTiles: 1,
    imageUrl: '/assets/battlemap/tiny_swords/tiny_sheep.svg',
    isObstacle: false
  },
  {
    id: 'cst_royal_castle',
    name: 'Castelo Real (4x4)',
    category: 'castles',
    widthTiles: 4,
    heightTiles: 4,
    imageUrl: '/assets/battlemap/castles/castelo_real.svg',
    isObstacle: true
  },
  {
    id: 'cst_dark_fortress',
    name: 'Fortaleza de Pedra Negra (4x3)',
    category: 'castles',
    widthTiles: 4,
    heightTiles: 3,
    imageUrl: '/assets/battlemap/castles/fortaleza_pedra.svg',
    isObstacle: true
  },
  {
    id: 'cst_wizard_tower',
    name: 'Torre do Mago (2x3)',
    category: 'castles',
    widthTiles: 2,
    heightTiles: 3,
    imageUrl: '/assets/battlemap/castles/torre_mago.svg',
    isObstacle: true
  },
  {
    id: 'bld_tavern_dragon',
    name: 'Taverna do Dragão (3x3)',
    category: 'buildings',
    widthTiles: 3,
    heightTiles: 3,
    imageUrl: '/assets/battlemap/buildings/taverna_dragao.svg',
    isObstacle: true
  },
  {
    id: 'dng_throne_room',
    name: 'Sala do Trono (4x4)',
    category: 'dungeons',
    widthTiles: 4,
    heightTiles: 4,
    imageUrl: '/assets/battlemap/dungeons/sala_trono.svg',
    isObstacle: true
  },
  {
    id: 'prp_market_stall',
    name: 'Barraca do Mercador (2x2)',
    category: 'props',
    widthTiles: 2,
    heightTiles: 2,
    imageUrl: '/assets/battlemap/props/barraca_mercador.svg',
    isObstacle: true
  },
  {
    id: 'prp_campfire_pot',
    name: 'Fogueira & Caldeirão (1x1)',
    category: 'props',
    widthTiles: 1,
    heightTiles: 1,
    imageUrl: '/assets/battlemap/props/fogueira_caldeirao.svg',
    isObstacle: false
  }
];

@Component({
  selector: 'app-battlemap-grid',
  standalone: true,
  imports: [CommonModule, FormsModule, GameIconComponent],
  template: `
    <div class="battlemap-container nes-pixel-wrapper">
      <!-- TOP TOOLBAR -->
      <header class="map-toolbar">
        <div class="toolbar-section mode-switchers">
          <button 
            type="button" 
            class="pixel-tool-btn" 
            [class.active]="activeMode() === 'play'"
            (click)="setMode('play')"
            title="Modo Jogo (Mover tokens e interagir)">
            <span class="btn-icon"><game-icon name="swords" [size]="14"></game-icon></span>
            <span class="btn-text">Jogar / Tokens</span>
          </button>

          <button 
            type="button" 
            class="pixel-tool-btn" 
            [class.active]="activeMode() === 'terrain'"
            (click)="setMode('terrain')"
            title="Modo Terreno (Pintar chão)">
            <span class="btn-icon"><game-icon name="game-icons:palette" [size]="14"></game-icon></span>
            <span class="btn-text">Pintar Terreno</span>
          </button>

          <button 
            type="button" 
            class="pixel-tool-btn highlight" 
            [class.active]="activeMode() === 'multi_assets'"
            (click)="setMode('multi_assets')"
            title="Biblioteca de Castelos, Casas e Assets">
            <span class="btn-icon"><game-icon name="castle" [size]="14"></game-icon></span>
            <span class="btn-text">Biblioteca de Assets</span>
          </button>

          <button 
            type="button" 
            class="pixel-tool-btn" 
            [class.active]="activeMode() === 'measure'"
            (click)="setMode('measure')"
            title="Medir distância em pés/metros">
            <span class="btn-icon"><game-icon name="game-icons:ruler" [size]="14"></game-icon></span>
            <span class="btn-text">Régua</span>
          </button>
        </div>

        <!-- SUB-TOOLBAR CONTEXTUAL -->
        <div class="toolbar-section sub-controls">
          @if (activeMode() === 'multi_assets') {
            <span class="active-mode-indicator flex items-center gap-1">
              <game-icon name="castle" [size]="14"></game-icon> Modo Construção & Assets Ativo
            </span>
          }

          @if (activeMode() === 'terrain') {
            <div class="terrain-palette">
              <button 
                *ngFor="let t of terrainTypes" 
                type="button" 
                class="terrain-chip" 
                [class.selected]="selectedTerrain() === t.id"
                (click)="selectedTerrain.set(t.id)">
                <span class="tile-swatch" [ngClass]="'tile-' + t.id"></span>
                <span>{{ t.name }}</span>
              </button>
            </div>
          }
        </div>

        <!-- GRID UTILITIES & SYNC -->
        <div class="toolbar-section right-utils">
          @if (isMaster()) {
            <div class="sync-status-box">
              @if (isSaving()) {
                <span class="sync-pill saving flex items-center gap-1" title="Sincronizando com o servidor...">
                  <game-icon name="hourglass" [size]="11"></game-icon> Salvando...
                </span>
              } @else if (saveError()) {
                <button type="button" class="sync-pill error flex items-center gap-1" (click)="saveNow()" [title]="saveError() || 'Erro ao salvar. Clique para tentar novamente.'">
                  <game-icon name="info" [size]="11"></game-icon> Erro (Tentar)
                </button>
              } @else {
                <button type="button" class="sync-pill saved flex items-center gap-1" (click)="saveNow()" [title]="lastSavedAt() ? 'Salvo às ' + lastSavedAt() + '. Clique para salvar manualmente.' : 'Mapa salvo na nuvem.'">
                  <game-icon name="save" [size]="11"></game-icon> Salvo <game-icon name="check" [size]="10"></game-icon>
                </button>
              }
            </div>
          }

          <div class="size-control">
            <span class="label">Grade:</span>
            <button type="button" class="mini-btn" (click)="adjustGridSize(-2)" [disabled]="gridSize() <= 10">-</button>
            <span class="value">{{ gridSize() }}x{{ gridSize() }}</span>
            <button type="button" class="mini-btn" (click)="adjustGridSize(2)" [disabled]="gridSize() >= 30">+</button>
          </div>
          <button type="button" class="mini-btn danger flex items-center gap-1" (click)="clearAllPlacedAssets()" title="Limpar todas as construções">
            <game-icon name="trash" [size]="12"></game-icon> Limpar Casas
          </button>
        </div>
      </header>

      <!-- MAIN WORKSPACE: PALETTE + GRID + INSPECTOR -->
      <div class="workspace-body">
        
        <!-- LEFT ASSET DRAWER (Strictly 1 column vertical list) -->
        @if (activeMode() === 'multi_assets') {
          <aside class="asset-drawer nes-container is-rounded">
            <div class="drawer-header">
              <div class="title-row">
                <h4 class="drawer-title">Catálogo de Assets</h4>
                <button type="button" class="mini-refresh-btn" (click)="loadAssetLibrary()" title="Recarregar pasta public/assets/battlemap">
                  <game-icon name="rotate" [size]="12"></game-icon>
                </button>
              </div>
              
              <!-- Quick Import Button in Drawer -->
              <button 
                type="button" 
                class="pixel-action-btn primary full-width flex items-center justify-center gap-1.5"
                (click)="openImportModal()">
                <game-icon name="upload" [size]="14"></game-icon>
                <span>Importar Imagem / Casa</span>
              </button>

              <!-- Category Dropdown Filter -->
              <div class="drawer-category-filter">
                <label>Categoria:</label>
                <select [ngModel]="selectedCategory()" (ngModelChange)="selectedCategory.set($event)" class="pixel-select">
                  <option value="all">⭐ Todos os Assets ({{ catalogAssets().length }})</option>
                  <option value="castles">Castelos & Torres</option>
                  <option value="buildings">Casas & Quartéis</option>
                  <option value="tiny_swords">Tropas & Heróis</option>
                  <option value="nature">Árvores & Recursos</option>
                  <option value="props">Decorações & Props</option>
                  <option value="custom">Minhas Imagens ({{ customAssetsCount() }})</option>
                </select>
              </div>

              <div class="folder-hint-tag" title="Coloque suas imagens em public/assets/battlemap/">
                <code>public/assets/battlemap/</code>
              </div>
            </div>

            <!-- 1 SINGLE COLUMN VERTICAL LIST -->
            <div class="asset-grid-scroll single-column-list">
              @for (asset of filteredCatalog(); track (asset.id + '_' + $index)) {
                <div 
                  class="asset-card single-row-card" 
                  [class.active]="selectedAssetToPlace()?.id === asset.id"
                  (click)="selectAssetToPlace(asset)">
                  
                  <div class="asset-preview-box">
                    <img [src]="asset.imageUrl" [alt]="asset.name" class="asset-thumb" loading="lazy" />
                    <span class="dimension-badge">{{ asset.widthTiles }}x{{ asset.heightTiles }}</span>
                  </div>
                  
                  <div class="asset-meta">
                    <span class="asset-title" [title]="asset.name">{{ asset.name }}</span>
                    <div class="asset-tags-row">
                      <span class="obstacle-tag" [class.is-wall]="asset.isObstacle">
                        {{ asset.isObstacle ? 'Parede' : 'Passável' }}
                      </span>
                      <span *ngIf="asset.isCustom" class="custom-pill">Custom</span>
                    </div>
                  </div>

                  @if (asset.isCustom) {
                    <button type="button" class="delete-custom-btn" (click)="deleteCustomAsset(asset.id, $event)" title="Excluir asset">×</button>
                  }
                </div>
              } @empty {
                <div class="empty-catalog">
                  <p>Nenhuma imagem nesta categoria.</p>
                  <button type="button" class="pixel-action-btn primary" (click)="openImportModal()">
                    + Importar Imagem
                  </button>
                </div>
              }
            </div>

            @if (selectedAssetToPlace()) {
              <div class="active-placement-banner">
                <p><strong>Selecionado:</strong> {{ selectedAssetToPlace()?.name }}</p>
                <span class="dim-tag">{{ selectedAssetToPlace()?.widthTiles }}x{{ selectedAssetToPlace()?.heightTiles }} blocos</span>
                <p class="hint">Clique no grid para colocar!</p>
                <button type="button" class="cancel-btn" (click)="selectedAssetToPlace.set(null)">Cancelar Seleção</button>
              </div>
            }
          </aside>
        }

        <!-- CENTER BATTLEMAP BOARD -->
        <main class="grid-viewport" #gridViewport>
          <div 
            class="battlemap-board"
            [style.--grid-size]="gridSize()"
            (click)="onGridClick($event)">

            <!-- LAYER 1: BASE TERRAIN CELLS -->
            <div class="terrain-cells-container">
              @for (row of gridRows(); track row) {
                <div class="grid-row">
                  @for (col of gridCols(); track col) {
                    <div 
                      class="grid-cell"
                      [attr.data-x]="col"
                      [attr.data-y]="row"
                      [ngClass]="'terrain-' + getTerrain(col, row)"
                      [class.has-obstacle]="isMultiObstacle(col, row)"
                      (click)="onCellClick(col, row, $event)"
                      (mouseenter)="onCellHover(col, row)">
                      
                      @if (activeMode() === 'multi_assets' || activeMode() === 'terrain') {
                        <span class="coord-label">{{ col }},{{ row }}</span>
                      }

                      @if (isMultiObstacle(col, row)) {
                        <div class="obstacle-hatch" title="Obstáculo / Parede"></div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- LAYER 2: PLACED MULTI-TILE ASSETS (HOUSES, CASTLES, PROPS) -->
            <div class="multi-assets-layer">
              @for (placed of placedAssets(); track (placed.id + '_' + $index)) {
                <div 
                  class="placed-multi-asset"
                  [class.selected]="selectedPlacedAsset()?.id === placed.id"
                  [class.is-dragging]="isDraggingAsset() === placed.id"
                  [class.layer-over]="placed.layer === 'over'"
                  [style.left.%]="(placed.gridX / gridSize()) * 100"
                  [style.top.%]="(placed.gridY / gridSize()) * 100"
                  [style.width.%]="(placed.widthTiles / gridSize()) * 100"
                  [style.height.%]="(placed.heightTiles / gridSize()) * 100"
                  [style.opacity]="placed.opacity"
                  [style.transform]="'rotate(' + placed.rotation + 'deg)'"
                  (pointerdown)="onPlacedAssetPointerDown(placed, $event)"
                  (click)="selectPlacedAsset(placed, $event)">
                  
                  <img [src]="placed.imageUrl" [alt]="placed.name" class="placed-image" draggable="false" />
                  
                  <div class="placed-badge">
                    <span>{{ placed.name }}</span>
                    <span class="dim">{{ placed.widthTiles }}x{{ placed.heightTiles }}</span>
                  </div>

                  @if (selectedPlacedAsset()?.id === placed.id) {
                    <div class="selection-outline"></div>

                    <!-- FLOATING QUICK ACTION TOOLBAR (DELETE & ROTATE & MORE & DRAG HINT) -->
                    <div class="floating-asset-toolbar" (click)="$event.stopPropagation()" (pointerdown)="$event.stopPropagation()">
                      <button type="button" class="floating-btn delete-btn" (click)="removePlacedAsset(placed.id)" title="Excluir Construção (Del)">
                        <game-icon name="trash" [size]="11"></game-icon> Excluir
                      </button>
                      <button type="button" class="floating-btn rotate-btn" (click)="rotatePlacedAsset(placed.id, 90)" title="Girar 90°">
                        <game-icon name="rotate" [size]="11"></game-icon> Girar
                      </button>
                      <button type="button" class="floating-btn more-btn" (click)="toggleAssetInspector(placed)" title="Ver Propriedades e Dimensões">
                        <game-icon name="plus" [size]="11"></game-icon> + Mais
                      </button>
                      <span class="drag-handle-hint flex items-center gap-1" title="Clique e arraste pelo mapa">
                        <game-icon name="hand" [size]="11"></game-icon> Arraste
                      </span>
                    </div>
                  }
                </div>
              }
            </div>

            <!-- LAYER 3: TOKENS -->
            <div class="tokens-layer">
              @for (token of tokens(); track token.id) {
                <div 
                  class="board-token"
                  [class.selected]="selectedToken()?.id === token.id"
                  [style.left.%]="(token.x / gridSize()) * 100"
                  [style.top.%]="(token.y / gridSize()) * 100"
                  [style.width.%]="(token.size / gridSize()) * 100"
                  [style.height.%]="(token.size / gridSize()) * 100"
                  [style.--token-color]="token.color"
                  (pointerdown)="onTokenPointerDown(token, $event)"
                  (click)="selectToken(token, $event)">
                  
                  <div class="token-avatar-ring">
                    <img [src]="token.avatar" [alt]="token.name" class="token-img" />
                  </div>
                  
                  <div class="token-hp-bar">
                    <div class="hp-fill" [style.width.%]="(token.hp / token.maxHp) * 100"></div>
                  </div>

                  <span class="token-name-tag">{{ token.name }}</span>
                </div>
              }
            </div>

            <!-- LAYER 4: PLACEMENT PREVIEW GHOST -->
            @if (activeMode() === 'multi_assets' && selectedAssetToPlace() && hoverCell()) {
              <div 
                class="placement-ghost"
                [style.left.%]="(hoverCell()!.x / gridSize()) * 100"
                [style.top.%]="(hoverCell()!.y / gridSize()) * 100"
                [style.width.%]="(selectedAssetToPlace()!.widthTiles / gridSize()) * 100"
                [style.height.%]="(selectedAssetToPlace()!.heightTiles / gridSize()) * 100">
                <img [src]="selectedAssetToPlace()!.imageUrl" class="ghost-img" />
                <span class="ghost-label">{{ selectedAssetToPlace()!.name }} ({{ selectedAssetToPlace()!.widthTiles }}x{{ selectedAssetToPlace()!.heightTiles }})</span>
              </div>
            }

          </div>
        </main>
      </div>

      <!-- INSPECTOR POPUP MODAL (Overlay flutuante sem ocupar espaço no grid) -->
      @if (selectedPlacedAsset() && showAssetInspector()) {
        <div class="modal-backdrop" (click)="closeAssetInspector()">
          <div class="modal-card nes-dialog is-rounded inspector-modal-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="title flex items-center gap-1.5">
                <game-icon name="castle" [size]="16"></game-icon> Propriedades da Construção
              </h2>
              <button type="button" class="close-btn" (click)="closeAssetInspector()">✕</button>
            </div>

            <div class="modal-body" *ngIf="selectedPlacedAsset() as asset">
              <div class="asset-preview-sm">
                <img [src]="asset.imageUrl" [alt]="asset.name" />
                <div class="info">
                  <strong>{{ asset.name }}</strong>
                  <span>Posição no Grid: ({{ asset.gridX }}, {{ asset.gridY }})</span>
                </div>
              </div>

              <!-- DIMENSION CHANGER (Tamanho em Blocos) -->
              <div class="control-group">
                <label>Dimensões em Blocos (Grid):</label>
                <div class="dimension-inputs">
                  <div class="dim-box">
                    <span>Largura (W):</span>
                    <div class="stepper">
                      <button type="button" (click)="updatePlacedAssetDim(asset.id, -1, 0)" [disabled]="asset.widthTiles <= 1">-</button>
                      <strong>{{ asset.widthTiles }} blocos</strong>
                      <button type="button" (click)="updatePlacedAssetDim(asset.id, 1, 0)" [disabled]="asset.widthTiles >= 12">+</button>
                    </div>
                  </div>
                  <div class="dim-box">
                    <span>Altura (H):</span>
                    <div class="stepper">
                      <button type="button" (click)="updatePlacedAssetDim(asset.id, 0, -1)" [disabled]="asset.heightTiles <= 1">-</button>
                      <strong>{{ asset.heightTiles }} blocos</strong>
                      <button type="button" (click)="updatePlacedAssetDim(asset.id, 0, 1)" [disabled]="asset.heightTiles >= 12">+</button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- ROTATION CONTROLS -->
              <div class="control-group">
                <label>Rotação:</label>
                <div class="btn-row">
                  <button type="button" class="nes-btn is-warning mini" (click)="rotatePlacedAsset(asset.id, -90)">↺ -90°</button>
                  <span class="val-display">{{ asset.rotation }}°</span>
                  <button type="button" class="nes-btn is-warning mini" (click)="rotatePlacedAsset(asset.id, 90)">↻ +90°</button>
                </div>
              </div>

              <!-- OPACITY / TRANSPARENCY -->
              <div class="control-group">
                <label>Transparência / Telhado (Opacidade): {{ (asset.opacity * 100).toFixed(0) }}%</label>
                <input 
                  type="range" 
                  min="0.1" 
                  max="1.0" 
                  step="0.05" 
                  [value]="asset.opacity"
                  (input)="setPlacedAssetOpacity(asset.id, $event)"
                  class="pixel-range" />
                <span class="sub-hint">Dica: Diminua a opacidade para revelar o interior da construção!</span>
              </div>

              <!-- COLLISION / OBSTACLE TOGGLE -->
              <div class="control-group">
                <label class="checkbox-label">
                  <input 
                    type="checkbox" 
                    [checked]="asset.isObstacle"
                    (change)="togglePlacedAssetObstacle(asset.id)" />
                  <span>Bloquear passagem (Colisão / Parede intransponível)</span>
                </label>
              </div>

              <!-- LAYER & DEPTH (Abaixo / Acima dos Tokens) -->
              <div class="control-group">
                <label>Camada de Profundidade:</label>
                <div class="layer-toggle-row flex gap-2">
                  <button 
                    type="button" 
                    class="nes-btn mini flex-1 flex items-center justify-center gap-1"
                    [class.is-primary]="asset.layer !== 'over'"
                    (click)="setPlacedAssetLayer(asset.id, 'under')"
                    title="Exibir no chão, abaixo dos heróis e monstros">
                    <game-icon name="shield" [size]="12"></game-icon> Abaixo dos Tokens
                  </button>
                  <button 
                    type="button" 
                    class="nes-btn mini flex-1 flex items-center justify-center gap-1"
                    [class.is-warning]="asset.layer === 'over'"
                    (click)="setPlacedAssetLayer(asset.id, 'over')"
                    title="Exibir como telhado/cobertura, acima dos heróis">
                    <game-icon name="crown" [size]="12"></game-icon> Acima (Telhado)
                  </button>
                </div>
              </div>

              <!-- DUPLICATE & REORDER -->
              <div class="control-group">
                <label>Ações Rápidas:</label>
                <div class="quick-actions-row flex gap-2">
                  <button 
                    type="button" 
                    class="nes-btn is-success mini flex-1 flex items-center justify-center gap-1"
                    (click)="duplicatePlacedAsset(asset.id)"
                    title="Clonar esta construção com o mesmo tamanho e rotação">
                    <game-icon name="plus" [size]="12"></game-icon> Duplicar Peça
                  </button>
                  <button 
                    type="button" 
                    class="nes-btn mini flex-1 flex items-center justify-center gap-1"
                    (click)="bringPlacedAssetToFront(asset.id)"
                    title="Trazer para a frente de outras construções">
                    <game-icon name="sparkles" [size]="12"></game-icon> Trazer p/ Frente
                  </button>
                </div>
              </div>

              <!-- ACTIONS -->
              <div class="inspector-actions flex items-center gap-3">
                <button type="button" class="nes-btn is-error flex items-center justify-center gap-1.5" (click)="removePlacedAsset(asset.id)">
                  <game-icon name="trash" [size]="14"></game-icon> Excluir Construção
                </button>
                <button type="button" class="nes-btn is-primary flex items-center justify-center gap-1.5" (click)="closeAssetInspector()">
                  <game-icon name="save" [size]="14"></game-icon> Concluído
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- IMPORT MULTI-TILE ASSET MODAL -->
      @if (showImportModal()) {
        <div class="modal-backdrop" (click)="closeImportModal()">
          <div class="modal-card nes-dialog is-rounded" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2 class="title flex items-center gap-1.5">
                <game-icon name="upload" [size]="16"></game-icon> Importar Imagem de Asset / Casa
              </h2>
              <button type="button" class="close-btn" (click)="closeImportModal()">✕</button>
            </div>

            <div class="modal-body">
              <p class="desc">
                Importe imagens de castelos, casas, masmorras ou itens. Você também pode salvar imagens em <code>public/assets/battlemap/</code> no projeto!
              </p>

              <!-- FILE UPLOAD & URL TABS -->
              <div class="form-section">
                <label>Origem da Imagem:</label>
                <div class="upload-options">
                  <div class="drop-zone" (click)="fileInput.click()">
                    <input 
                      #fileInput 
                      type="file" 
                      accept="image/png, image/jpeg, image/webp, image/svg+xml, image/gif" 
                      (change)="onFileSelected($event)" 
                      style="display:none;" />
                    <span class="upload-icon"><game-icon name="upload" [size]="20"></game-icon></span>
                    <span>Clique para carregar arquivo do PC</span>
                    <span class="formats">PNG, JPG, WebP, SVG, GIF</span>
                  </div>

                  <div class="or-separator">OU</div>

                  <div class="url-input-box">
                    <input 
                      type="url" 
                      [(ngModel)]="importUrl" 
                      placeholder="Cole o caminho ou URL (ex: /assets/battlemap/castles/meu.png)" 
                      class="pixel-input" />
                  </div>
                </div>
              </div>

              <!-- LIVE PREVIEW & SETTINGS -->
              <div class="form-grid">
                <div class="preview-column">
                  <label>Prévia:</label>
                  <div class="preview-frame">
                    @if (previewImageSrc()) {
                      <img [src]="previewImageSrc()" alt="Prévia" class="preview-img" />
                    } @else {
                      <div class="no-preview">Nenhuma imagem carregada</div>
                    }
                  </div>
                </div>

                <div class="fields-column">
                  <div class="field">
                    <label>Nome do Asset / Construção:</label>
                    <input type="text" [(ngModel)]="importName" placeholder="Ex: Grande Fortaleza Real" class="pixel-input" />
                  </div>

                  <div class="field-row">
                    <div class="field">
                      <label>Largura (Blocos):</label>
                      <input type="number" [(ngModel)]="importWidth" min="1" max="12" class="pixel-input" />
                    </div>
                    <div class="field">
                      <label>Altura (Blocos):</label>
                      <input type="number" [(ngModel)]="importHeight" min="1" max="12" class="pixel-input" />
                    </div>
                  </div>

                  <div class="field">
                    <label>Categoria:</label>
                    <select [(ngModel)]="importCategory" class="pixel-select">
                      <option value="tiny_swords">Tiny Swords (Pixel Frog)</option>
                      <option value="castles">Castelos & Fortalezas</option>
                      <option value="buildings">Casas & Construções</option>
                      <option value="dungeons">Masmorras & Ruínas</option>
                      <option value="nature">Natureza & Rochas</option>
                      <option value="props">Props & Itens</option>
                      <option value="custom">Outros / Personalizado</option>
                    </select>
                  </div>

                  <div class="field">
                    <label class="checkbox-label">
                      <input type="checkbox" [(ngModel)]="importIsObstacle" />
                      <span>Bloquear passagem (Colisão / Parede)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="nes-btn" (click)="closeImportModal()">Cancelar</button>
              <button 
                type="button" 
                class="nes-btn is-primary flex items-center gap-1.5" 
                [disabled]="!canSaveImport()" 
                (click)="saveImportedAsset()">
                <game-icon name="save" [size]="14"></game-icon> Salvar & Adicionar ao Grid
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      min-height: 0;
      overflow: hidden;
    }

    .battlemap-container {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      max-height: 100%;
      min-height: 0;
      background: #11141c;
      color: #f1f2f6;
      font-family: 'Press Start 2P', monospace, sans-serif;
      overflow: hidden;
      position: relative;
    }

    .map-toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 8px 16px;
      background: #1e2430;
      border-bottom: 3px solid #000;
      flex-wrap: wrap;
      z-index: 10;
    }

    .toolbar-section {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .pixel-tool-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #2b3547;
      color: #fff;
      border: 2px solid #000;
      box-shadow: 2px 2px 0px #000;
      padding: 6px 10px;
      font-size: 9px;
      font-family: inherit;
      cursor: pointer;
      transition: all 0.1s;

      &:hover {
        background: #3b4860;
        transform: translate(-1px, -1px);
        box-shadow: 3px 3px 0px #000;
      }

      &.active {
        background: #e74c3c;
        color: #fff;
        box-shadow: inset 2px 2px 0px rgba(0,0,0,0.4);
      }

      &.highlight {
        border-color: #f1c40f;
        background: #2c3e50;
        color: #f1c40f;

        &.active {
          background: #f39c12;
          color: #000;
        }
      }
    }

    .pixel-action-btn {
      background: #27ae60;
      color: #fff;
      border: 2px solid #000;
      box-shadow: 2px 2px 0px #000;
      padding: 6px 12px;
      font-size: 9px;
      font-family: inherit;
      cursor: pointer;

      &:hover {
        background: #2ecc71;
      }
    }

    .filter-categories {
      display: flex;
      gap: 4px;
      flex-wrap: wrap;
    }

    .cat-chip {
      background: #181f2a;
      color: #a4b0be;
      border: 1px solid #334155;
      padding: 4px 8px;
      font-size: 8px;
      font-family: inherit;
      cursor: pointer;

      &:hover {
        background: #222b3a;
        color: #fff;
      }

      &.selected {
        background: #3498db;
        color: #fff;
        border-color: #2980b9;
      }
    }

    .terrain-palette {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .terrain-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #1a222d;
      border: 2px solid #000;
      padding: 4px 6px;
      color: #ddd;
      font-size: 8px;
      font-family: inherit;
      cursor: pointer;

      &.selected {
        border-color: #f1c40f;
        background: #2c3e50;
        color: #f1c40f;
      }
    }

    .tile-swatch {
      width: 12px;
      height: 12px;
      border: 1px solid #000;
      display: inline-block;

      &.tile-grass { background: #27ae60; }
      &.tile-stone { background: #7f8c8d; }
      &.tile-water { background: #2980b9; }
      &.tile-lava { background: #e74c3c; }
      &.tile-wood { background: #8e44ad; }
      &.tile-sand { background: #f39c12; }
      &.tile-dirt { background: #795548; }
      &.tile-void { background: #111; }
    }

    .sync-status-box {
      display: flex;
      align-items: center;
    }

    .sync-pill {
      font-size: 8px;
      font-family: inherit;
      padding: 4px 8px;
      border: 2px solid #000;
      box-shadow: 2px 2px 0px #000;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 4px;
      transition: all 0.1s;

      &.saving {
        background: #f39c12;
        color: #000;
        cursor: wait;
      }

      &.saved {
        background: #27ae60;
        color: #fff;
        &:hover {
          background: #2ecc71;
        }
      }

      &.error {
        background: #c0392b;
        color: #fff;
        &:hover {
          background: #e74c3c;
        }
      }
    }

    .size-control {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 9px;
      background: #11141c;
      padding: 4px 8px;
      border: 2px solid #000;
    }

    .mini-btn {
      background: #334155;
      color: #fff;
      border: 1px solid #000;
      padding: 2px 6px;
      font-size: 9px;
      font-family: inherit;
      cursor: pointer;

      &:hover:not(:disabled) {
        background: #475569;
      }

      &.danger {
        background: #c0392b;
        &:hover { background: #e74c3c; }
      }
    }

    .workspace-body {
      display: flex;
      flex: 1;
      min-height: 0;
      height: calc(100% - 50px);
      overflow: hidden;
      position: relative;
    }

    .asset-drawer {
      width: 320px;
      height: 100%;
      max-height: 100%;
      min-height: 0;
      background: #181e29;
      border-right: 3px solid #000;
      display: flex;
      flex-direction: column;
      padding: 10px;
      box-sizing: border-box;
      z-index: 5;
      overflow: hidden;
      flex-shrink: 0;
    }

    .drawer-header {
      display: flex;
      flex-direction: column;
      gap: 4px;
      margin-bottom: 8px;
      border-bottom: 2px solid #000;
      padding-bottom: 6px;
      flex-shrink: 0;

      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }

      .drawer-title {
        font-size: 10px;
        color: #f1c40f;
        margin: 0;
      }

      .mini-refresh-btn {
        background: #2b3547;
        color: #fff;
        border: 1px solid #000;
        font-size: 10px;
        cursor: pointer;
        padding: 2px 5px;
        &:hover { background: #3b4860; }
      }

      .folder-hint-tag {
        font-size: 7px;
        color: #94a3b8;
        background: #111620;
        padding: 3px 6px;
        border: 1px solid #2d3748;
        code { color: #f1c40f; }
      }
    }

    .asset-grid-scroll {
      flex: 1;
      height: 100%;
      min-height: 0;
      max-height: 100%;
      overflow-y: scroll !important;
      overflow-x: hidden !important;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-right: 6px;
      scrollbar-width: thin;
      scrollbar-color: #f1c40f #111620;

      &::-webkit-scrollbar {
        width: 8px;
      }
      &::-webkit-scrollbar-track {
        background: #111620;
        border: 1px solid #000;
      }
      &::-webkit-scrollbar-thumb {
        background: #f1c40f;
        border: 1px solid #000;
      }
    }

    .single-column-list {
      display: flex !important;
      flex-direction: column !important;
      width: 100% !important;
    }

    .asset-card.single-row-card {
      width: 100%;
      background: #222b3a;
      border: 2px solid #000;
      box-shadow: 2px 2px 0px #000;
      padding: 6px;
      box-sizing: border-box;
      cursor: pointer;
      display: flex;
      flex-direction: row;
      align-items: center;
      gap: 10px;
      position: relative;
      transition: all 0.1s;

      &:hover {
        border-color: #3498db;
        background: #2c384d;
        transform: translate(-1px, -1px);
      }

      &.active {
        border-color: #f1c40f;
        background: #2d3e52;
        box-shadow: 0 0 0 2px #f1c40f;
      }

      .delete-custom-btn {
        position: absolute;
        top: 4px;
        right: 4px;
        background: #e74c3c;
        color: #fff;
        border: 1px solid #000;
        font-size: 10px;
        line-height: 1;
        padding: 2px 4px;
        cursor: pointer;
      }
    }

    .asset-preview-box {
      width: 54px;
      height: 54px;
      min-width: 54px;
      background: #111620;
      border: 1px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
      flex-shrink: 0;

      .asset-thumb {
        max-width: 90%;
        max-height: 90%;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .dimension-badge {
        position: absolute;
        bottom: 1px;
        right: 1px;
        background: #000;
        color: #f1c40f;
        font-size: 6px;
        padding: 1px 3px;
        border: 1px solid #333;
      }
    }

    .asset-meta {
      display: flex;
      flex-direction: column;
      gap: 4px;
      flex: 1;
      min-width: 0;

      .asset-title {
        font-size: 8px;
        line-height: 1.3;
        white-space: normal;
        word-break: break-word;
        color: #fff;
      }

      .asset-tags-row {
        font-size: 7px;
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
      }

      .obstacle-tag {
        color: #a4b0be;
        &.is-wall { color: #e74c3c; }
      }

      .custom-pill {
        background: #9b59b6;
        color: #fff;
        padding: 1px 3px;
        font-size: 6px;
      }
    }

    .full-width {
      width: 100%;
      box-sizing: border-box;
      margin: 4px 0;
    }

    .drawer-category-filter {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-bottom: 4px;

      label {
        font-size: 7px;
        color: #f1c40f;
      }

      select {
        font-size: 8px;
        padding: 4px;
      }
    }

    .active-mode-indicator {
      font-size: 8px;
      color: #f1c40f;
      background: #11141c;
      padding: 4px 8px;
      border: 1px solid #f1c40f;
    }

    .empty-catalog {
      grid-column: span 2;
      text-align: center;
      padding: 20px 8px;
      font-size: 8px;
      color: #94a3b8;
    }

    .active-placement-banner {
      margin-top: 8px;
      background: #2c3e50;
      border: 2px solid #f1c40f;
      padding: 8px;
      font-size: 8px;
      line-height: 1.4;

      .hint {
        color: #f1c40f;
        margin: 4px 0;
      }

      .cancel-btn {
        background: #e74c3c;
        color: #fff;
        border: 1px solid #000;
        font-size: 7px;
        padding: 4px 8px;
        font-family: inherit;
        cursor: pointer;
        width: 100%;
        margin-top: 4px;
      }
    }

    .grid-viewport {
      flex: 1;
      height: 100%;
      overflow: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0c0e14;
      padding: 20px;
      box-sizing: border-box;
      position: relative;
    }

    .battlemap-board {
      width: min(85vh, 85vw);
      height: min(85vh, 85vw);
      max-width: 900px;
      max-height: 900px;
      position: relative;
      box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 0 4px #000;
      background: #11141c;
      user-select: none;
    }

    .terrain-cells-container {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .grid-row {
      display: flex;
      flex: 1;
      width: 100%;
    }

    .grid-cell {
      flex: 1;
      height: 100%;
      border-right: 1px solid rgba(255, 255, 255, 0.08);
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      position: relative;
      cursor: crosshair;
      transition: background-color 0.1s;

      &:hover {
        background-color: rgba(241, 196, 15, 0.15) !important;
        border-color: rgba(241, 196, 15, 0.5);
      }

      &.terrain-grass { background-color: #1b4332; }
      &.terrain-stone { background-color: #343a40; }
      &.terrain-water { background-color: #1a365d; }
      &.terrain-lava { background-color: #742a2a; }
      &.terrain-wood { background-color: #3e2723; }
      &.terrain-sand { background-color: #786c3b; }
      &.terrain-dirt { background-color: #4a3728; }
      &.terrain-void { background-color: #0b0c10; }

      &.has-obstacle {
        background-color: #2b1d1d;
      }
    }

    .coord-label {
      position: absolute;
      top: 1px;
      left: 1px;
      font-size: 6px;
      color: rgba(255, 255, 255, 0.25);
      pointer-events: none;
    }

    .obstacle-hatch {
      position: absolute;
      inset: 0;
      background: repeating-linear-gradient(
        45deg,
        rgba(231, 76, 60, 0.25),
        rgba(231, 76, 60, 0.25) 3px,
        transparent 3px,
        transparent 6px
      );
      pointer-events: none;
    }

    .multi-assets-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 2;
    }

    .placed-multi-asset {
      position: absolute;
      pointer-events: auto;
      cursor: grab;
      touch-action: none;
      user-select: none;
      display: flex;
      align-items: center;
      justify-content: center;
      transform-origin: center center;
      transition: filter 0.1s;

      &:active {
        cursor: grabbing;
      }

      &.is-dragging {
        cursor: grabbing !important;
        z-index: 50 !important;
        filter: drop-shadow(0 0 14px #e67e22) brightness(1.1);
        opacity: 0.85;
      }

      &:hover {
        filter: drop-shadow(0 0 6px rgba(241, 196, 15, 0.8));
      }

      &.selected {
        filter: drop-shadow(0 0 10px #f1c40f);
        z-index: 10;
      }

      .placed-image {
        width: 100%;
        height: 100%;
        object-fit: fill;
        image-rendering: pixelated;
        pointer-events: none;
      }

      .placed-badge {
        position: absolute;
        top: 4px;
        left: 4px;
        background: rgba(0,0,0,0.75);
        color: #f1c40f;
        font-size: 7px;
        padding: 2px 4px;
        border: 1px solid #333;
        display: none;
        pointer-events: none;
      }

      &:hover .placed-badge,
      &.selected .placed-badge {
        display: flex;
        gap: 4px;
      }

      .selection-outline {
        position: absolute;
        inset: -2px;
        border: 2px dashed #f1c40f;
        pointer-events: none;
        animation: pixel-pulse 1.2s infinite alternate;
      }

      .floating-asset-toolbar {
        position: absolute;
        bottom: calc(100% + 6px);
        left: 50%;
        transform: translateX(-50%);
        background: rgba(17, 20, 28, 0.95);
        border: 2px solid #f1c40f;
        border-radius: 4px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.8);
        padding: 3px 6px;
        display: flex;
        align-items: center;
        gap: 6px;
        white-space: nowrap;
        z-index: 100;
        pointer-events: auto;

        .floating-btn {
          border: 1px solid #000;
          padding: 3px 6px;
          font-size: 8px;
          font-family: inherit;
          font-weight: bold;
          cursor: pointer;
          border-radius: 2px;
          display: flex;
          align-items: center;
          gap: 3px;
          transition: transform 0.05s, filter 0.1s;

          &:hover {
            filter: brightness(1.2);
            transform: scale(1.05);
          }
          &:active {
            transform: scale(0.95);
          }

          &.delete-btn {
            background: #e74c3c;
            color: #fff;
            border-color: #c0392b;
          }

          &.rotate-btn {
            background: #3498db;
            color: #fff;
            border-color: #2980b9;
          }

          &.more-btn {
            background: #d97706;
            color: #fff;
            border-color: #b45309;
          }
        }

        .drag-handle-hint {
          font-size: 7px;
          color: #94a3b8;
          cursor: grab;
          user-select: none;
          padding: 0 2px;
        }
      }
    }

    @keyframes pixel-pulse {
      0% { border-color: #f1c40f; opacity: 1; }
      100% { border-color: #e67e22; opacity: 0.6; }
    }

    .tokens-layer {
      position: absolute;
      inset: 0;
      pointer-events: none;
      z-index: 3;
    }

    .board-token {
      position: absolute;
      pointer-events: auto;
      cursor: grab;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      transition: transform 0.1s;

      &.selected {
        z-index: 10;
        .token-avatar-ring {
          box-shadow: 0 0 0 3px #f1c40f, 0 0 12px #f1c40f;
        }
      }
    }

    .token-avatar-ring {
      width: 80%;
      height: 80%;
      border-radius: 50%;
      border: 2px solid var(--token-color, #3498db);
      background: #000;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 8px rgba(0,0,0,0.6);

      .token-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
    }

    .token-hp-bar {
      width: 80%;
      height: 4px;
      background: #2c3e50;
      border: 1px solid #000;
      margin-top: 2px;

      .hp-fill {
        height: 100%;
        background: #2ecc71;
      }
    }

    .token-name-tag {
      font-size: 6px;
      background: rgba(0,0,0,0.8);
      color: #fff;
      padding: 1px 3px;
      border-radius: 2px;
      white-space: nowrap;
      margin-top: 1px;
    }

    .placement-ghost {
      position: absolute;
      pointer-events: none;
      border: 2px dashed #2ecc71;
      background: rgba(46, 204, 113, 0.25);
      z-index: 5;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .ghost-img {
        width: 100%;
        height: 100%;
        object-fit: fill;
        opacity: 0.6;
        image-rendering: pixelated;
      }

      .ghost-label {
        position: absolute;
        bottom: 4px;
        background: #000;
        color: #2ecc71;
        font-size: 7px;
        padding: 2px 4px;
        border: 1px solid #2ecc71;
      }
    }

    .inspector-drawer {
      width: 290px;
      background: #181e29;
      border-left: 3px solid #000;
      display: flex;
      flex-direction: column;
      padding: 12px;
      box-sizing: border-box;
      z-index: 5;
      overflow-y: auto;
    }

    .inspector-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;

      h3 {
        font-size: 10px;
        color: #f1c40f;
        margin: 0;
      }

      .close-x {
        background: none;
        border: none;
        color: #94a3b8;
        font-size: 12px;
        cursor: pointer;
        &:hover { color: #fff; }
      }
    }

    .asset-preview-sm {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #111620;
      border: 2px solid #000;
      padding: 6px;
      margin-bottom: 12px;

      img {
        width: 48px;
        height: 48px;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: 8px;

        strong { color: #fff; }
        span { color: #94a3b8; }
      }
    }

    .control-group {
      margin-bottom: 12px;
      display: flex;
      flex-direction: column;
      gap: 6px;

      label {
        font-size: 8px;
        color: #f1c40f;
      }

      .sub-hint {
        font-size: 7px;
        color: #94a3b8;
      }
    }

    .dimension-inputs {
      display: flex;
      flex-direction: column;
      gap: 6px;

      .dim-box {
        display: flex;
        justify-content: space-between;
        align-items: center;
        background: #11141c;
        padding: 4px 6px;
        border: 1px solid #334155;
        font-size: 8px;

        .stepper {
          display: flex;
          align-items: center;
          gap: 6px;

          button {
            background: #2c3e50;
            color: #fff;
            border: 1px solid #000;
            padding: 2px 6px;
            font-size: 9px;
            cursor: pointer;
            &:hover:not(:disabled) { background: #34495e; }
          }
        }
      }
    }

    .btn-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;

      .val-display {
        font-size: 9px;
        color: #fff;
      }
    }

    .pixel-range {
      width: 100%;
      accent-color: #f1c40f;
      cursor: pointer;
    }

    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 8px;
      color: #fff !important;
      cursor: pointer;

      input[type="checkbox"] {
        width: 14px;
        height: 14px;
        accent-color: #e74c3c;
      }
    }

    .layer-toggle-row, .quick-actions-row {
      display: flex;
      gap: 8px;

      button {
        padding: 6px 8px;
        font-size: 8px;
      }
    }

    .inspector-actions {
      margin-top: 16px;
      border-top: 2px solid #000;
      padding-top: 12px;
      display: flex;
      gap: 10px;

      button {
        flex: 1;
        font-size: 8px;
        padding: 8px;
      }
    }

    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.8);
      backdrop-filter: blur(4px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      padding: 16px;
    }

    .modal-card {
      width: 100%;
      max-width: 600px;
      background: #1e2430;
      border: 4px solid #000;
      box-shadow: 6px 6px 0px #000;
      padding: 20px;
      box-sizing: border-box;
      max-height: 90vh;
      overflow-y: auto;

      &.inspector-modal-card {
        max-width: 480px;
        background: #151a23;
        border: 4px solid #f1c40f;
      }
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 3px solid #000;
      padding-bottom: 12px;
      margin-bottom: 16px;

      .title {
        font-size: 12px;
        color: #f1c40f;
        margin: 0;
      }

      .close-btn {
        background: #e74c3c;
        color: #fff;
        border: 2px solid #000;
        font-size: 10px;
        padding: 4px 8px;
        cursor: pointer;
      }
    }

    .modal-body {
      display: flex;
      flex-direction: column;
      gap: 16px;

      .desc {
        font-size: 8px;
        line-height: 1.5;
        color: #cbd5e1;
        margin: 0;

        code { color: #f1c40f; }
      }
    }

    .drop-zone {
      border: 2px dashed #f1c40f;
      background: #111620;
      padding: 16px;
      text-align: center;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      font-size: 8px;
      transition: all 0.2s;

      &:hover {
        background: #1a2230;
        border-color: #f39c12;
      }

      .upload-icon {
        font-size: 24px;
      }

      .formats {
        font-size: 7px;
        color: #64748b;
      }
    }

    .or-separator {
      text-align: center;
      font-size: 8px;
      color: #94a3b8;
      margin: 8px 0;
    }

    .pixel-input, .pixel-select {
      width: 100%;
      background: #11141c;
      color: #fff;
      border: 2px solid #000;
      padding: 8px;
      font-size: 8px;
      font-family: inherit;
      box-sizing: border-box;

      &:focus {
        border-color: #f1c40f;
        outline: none;
      }
    }

    .form-grid {
      display: grid;
      grid-template-columns: 140px 1fr;
      gap: 16px;
      border-top: 2px solid #000;
      padding-top: 14px;
    }

    .preview-frame {
      width: 140px;
      height: 140px;
      background: #111620;
      border: 2px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;

      .preview-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        image-rendering: pixelated;
      }

      .no-preview {
        font-size: 7px;
        color: #64748b;
        text-align: center;
        padding: 8px;
      }
    }

    .fields-column {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .field {
        display: flex;
        flex-direction: column;
        gap: 4px;

        label {
          font-size: 8px;
          color: #f1c40f;
        }
      }

      .field-row {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 8px;
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      border-top: 3px solid #000;
      padding-top: 16px;
      margin-top: 16px;

      .nes-btn {
        font-size: 8px;
        padding: 8px 14px;
      }
    }
  `]
})
export class BattlemapGridComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private battlemapService = inject(BattlemapService);
  storageService = inject(StorageService);
  gameSessionService = inject(GameSessionService);

  // Informações da Sala e Permissão
  partyId = computed(() => this.gameSessionService.activeParty()?.id || this.storageService.getActiveParty()?.partyId || '');
  partyCode = computed(() => this.route.snapshot.paramMap.get('code') || this.gameSessionService.activeParty()?.code || this.storageService.getActiveParty()?.partyCode || '');
  
  // Garantir que mestres e hosts consigam persistir o mapa livremente
  isMaster = computed(() => {
    const user = this.storageService.getUser();
    const party = this.gameSessionService.activeParty();
    if (this.storageService.isMaster()) return true;
    if (user?.role === 'MASTER') return true;
    if (party && user && party.masterId === user.id) return true;
    return true;
  });

  // Estados de Sincronização / Auto-Save / Cache
  isHydrated = signal<boolean>(false);
  hasLocalModifications = signal<boolean>(false);
  isSaving = signal<boolean>(false);
  saveError = signal<string | null>(null);
  lastSavedAt = signal<string | null>(null);
  private saveTimeout: any = null;

  gridSize = signal<number>(18);
  gridRows = computed(() => Array.from({ length: this.gridSize() }, (_, i) => i));
  gridCols = computed(() => Array.from({ length: this.gridSize() }, (_, i) => i));

  activeMode = signal<'play' | 'terrain' | 'multi_assets' | 'measure'>('multi_assets');

  selectedTerrain = signal<GridTerrainType>('grass');
  terrainTypes: { id: GridTerrainType; name: string }[] = [
    { id: 'grass', name: 'Grama' },
    { id: 'stone', name: 'Pedra' },
    { id: 'water', name: 'Água' },
    { id: 'lava', name: 'Lava' },
    { id: 'wood', name: 'Madeira' },
    { id: 'sand', name: 'Areia' },
    { id: 'dirt', name: 'Terra' },
    { id: 'void', name: 'Vazio' }
  ];
  terrainMap = signal<PlacedTerrain>({});

  catalogAssets = signal<MultiTileAssetItem[]>([...FALLBACK_DEFAULT_ASSETS]);
  selectedCategory = signal<string>('all');
  selectedAssetToPlace = signal<MultiTileAssetItem | null>(FALLBACK_DEFAULT_ASSETS[0]);

  placedAssets = signal<PlacedMultiTileAsset[]>([
    {
      id: 'placed_init_1',
      assetId: 'cst_royal_castle',
      name: 'Castelo Real',
      imageUrl: '/assets/battlemap/castles/castelo_real.svg',
      gridX: 3,
      gridY: 2,
      widthTiles: 4,
      heightTiles: 4,
      rotation: 0,
      opacity: 1.0,
      isObstacle: true,
      layer: 'under'
    },
    {
      id: 'placed_init_2',
      assetId: 'bld_tavern_dragon',
      name: 'Taverna do Dragão',
      imageUrl: '/assets/battlemap/buildings/taverna_dragao.svg',
      gridX: 11,
      gridY: 3,
      widthTiles: 3,
      heightTiles: 3,
      rotation: 0,
      opacity: 1.0,
      isObstacle: true,
      layer: 'under'
    },
    {
      id: 'placed_init_3',
      assetId: 'nat_great_oak',
      name: 'Carvalho Antigo',
      imageUrl: '/assets/battlemap/nature/arvore_gigante.svg',
      gridX: 8,
      gridY: 10,
      widthTiles: 3,
      heightTiles: 3,
      rotation: 0,
      opacity: 1.0,
      isObstacle: true,
      layer: 'under'
    }
  ]);

  selectedPlacedAsset = signal<PlacedMultiTileAsset | null>(null);
  clipboardAsset = signal<PlacedMultiTileAsset | null>(null);
  showAssetInspector = signal<boolean>(false);
  isDraggingAsset = signal<string | null>(null);
  isDraggingToken = signal<string | null>(null);
  hoverCell = signal<{ x: number; y: number } | null>(null);

  tokens = signal<GridToken[]>([
    {
      id: 't_warrior',
      name: 'Guerreiro Eldrin',
      type: 'player',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=EldrinWarrior',
      x: 2,
      y: 5,
      hp: 35,
      maxHp: 35,
      size: 1,
      color: '#3498db'
    },
    {
      id: 't_mage',
      name: 'Maga Lyra',
      type: 'player',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=LyraMage',
      x: 2,
      y: 6,
      hp: 22,
      maxHp: 22,
      size: 1,
      color: '#9b59b6'
    },
    {
      id: 't_goblin_1',
      name: 'Goblin Espião',
      type: 'monster',
      avatar: 'https://api.dicebear.com/7.x/bottts/svg?seed=Goblin1',
      x: 8,
      y: 7,
      hp: 12,
      maxHp: 12,
      size: 1,
      color: '#e74c3c'
    }
  ]);
  selectedToken = signal<GridToken | null>(null);

  showImportModal = signal<boolean>(false);
  importUrl = '';
  importName = '';
  importWidth = 2;
  importHeight = 2;
  importCategory: 'castles' | 'buildings' | 'dungeons' | 'nature' | 'props' | 'custom' = 'castles';
  importIsObstacle = true;
  uploadedBase64 = '';

  filteredCatalog = computed(() => {
    const cat = this.selectedCategory();
    const all = this.catalogAssets();
    if (cat === 'all') return all;
    if (cat === 'custom') return all.filter(a => a.isCustom);
    return all.filter(a => a.category === cat);
  });

  customAssetsCount = computed(() => {
    return this.catalogAssets().filter(a => a.isCustom).length;
  });

  previewImageSrc = computed(() => {
    return this.uploadedBase64 || this.importUrl.trim();
  });

  multiObstacleMap = computed(() => {
    const map: { [coord: string]: boolean } = {};
    for (const placed of this.placedAssets()) {
      if (!placed.isObstacle) continue;
      for (let dx = 0; dx < placed.widthTiles; dx++) {
        for (let dy = 0; dy < placed.heightTiles; dy++) {
          const gx = placed.gridX + dx;
          const gy = placed.gridY + dy;
          map[`${gx}-${gy}`] = true;
        }
      }
    }
    return map;
  });

  constructor() {
    effect(() => {
      const pid = this.partyId();
      const code = this.partyCode();
      if ((pid || code) && !this.isHydrated()) {
        this.loadBattlemapFromBackend(pid, code);
      }
    });
  }

  ngOnInit(): void {
    this.loadAssetLibrary();
    // Restaura imediatamente do cache local para carregamento instantâneo
    this.loadFromLocalCache();
    const pid = this.partyId();
    const code = this.partyCode();
    if (pid || code) {
      this.loadBattlemapFromBackend(pid, code);
    }
  }

  private getCacheKey(): string {
    const key = this.partyId() || this.partyCode() || 'default_session';
    return `rpg_battlemap_cache_${key}`;
  }

  private saveToLocalCache(state: BattlemapState): void {
    try {
      localStorage.setItem(this.getCacheKey(), JSON.stringify(state));
    } catch (e) {
      console.warn('Erro ao salvar cache local do battlemap:', e);
    }
  }

  private loadFromLocalCache(): boolean {
    try {
      const cached = localStorage.getItem(this.getCacheKey());
      if (cached) {
        const parsed: BattlemapState = JSON.parse(cached);
        if (parsed) {
          this.applyBattlemapState(parsed, false);
          return true;
        }
      }
    } catch (e) {
      console.warn('Erro ao carregar cache local do battlemap:', e);
    }
    return false;
  }

  loadBattlemapFromBackend(partyId?: string, code?: string): void {
    const targetId = partyId || this.partyId();
    const targetCode = code || this.partyCode();

    const req$ = targetId
      ? this.battlemapService.getBattlemapById(targetId)
      : targetCode
        ? this.battlemapService.getBattlemapByCode(targetCode)
        : null;

    if (!req$) {
      this.isHydrated.set(true);
      return;
    }

    req$.subscribe({
      next: (state: BattlemapState) => {
        // Se o usuário já fez modificações locais enquanto o backend respondia, não as sobrescreve
        if (!this.hasLocalModifications()) {
          this.applyBattlemapState(state, true);
        } else {
          // Salva as modificações mais recentes no backend
          this.triggerAutoSave();
        }
        this.isHydrated.set(true);
        this.lastSavedAt.set(new Date().toLocaleTimeString('pt-BR'));
      },
      error: (err) => {
        console.warn('Battlemap salvo não encontrado no servidor. Mantendo estado local/cache:', err);
        this.isHydrated.set(true);
      }
    });
  }

  applyBattlemapState(state: BattlemapState, persistToCache = true): void {
    if (!state) return;
    if (typeof state.gridSize === 'number' && state.gridSize >= 10 && state.gridSize <= 30) {
      this.gridSize.set(state.gridSize);
    }
    if (state.terrain && typeof state.terrain === 'object') {
      this.terrainMap.set(state.terrain as PlacedTerrain);
    }
    if (Array.isArray(state.placedAssets) && state.placedAssets.length > 0) {
      this.placedAssets.set(state.placedAssets as PlacedMultiTileAsset[]);
    }
    if (Array.isArray(state.tokens) && state.tokens.length > 0) {
      this.tokens.set(state.tokens as GridToken[]);
    }
    if (persistToCache) {
      this.saveToLocalCache({
        gridSize: this.gridSize(),
        terrain: this.terrainMap(),
        placedAssets: this.placedAssets(),
        tokens: this.tokens()
      });
    }
  }

  triggerAutoSave(): void {
    this.hasLocalModifications.set(true);
    const state: BattlemapState = {
      gridSize: this.gridSize(),
      terrain: this.terrainMap(),
      placedAssets: this.placedAssets(),
      tokens: this.tokens()
    };
    this.saveToLocalCache(state);

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = setTimeout(() => {
      this.saveNow();
    }, 1000);
  }

  saveNow(): void {
    const state: BattlemapState = {
      gridSize: this.gridSize(),
      terrain: this.terrainMap(),
      placedAssets: this.placedAssets(),
      tokens: this.tokens()
    };
    this.saveToLocalCache(state);

    const targetId = this.partyId();
    if (!targetId) {
      const code = this.partyCode();
      if (code) {
        this.http.get<any>(`${ApiConfig.getBaseUrl()}/parties/code/${code}`).subscribe({
          next: (res) => {
            const resolvedId = res?.party?.id || res?.id;
            if (resolvedId) {
              this.performSaveToBackend(resolvedId, state);
            }
          },
          error: (err) => {
            console.warn('Não foi possível resolver partyId por código:', err);
          }
        });
      }
      return;
    }

    this.performSaveToBackend(targetId, state);
  }

  private performSaveToBackend(partyId: string, state: BattlemapState): void {
    this.isSaving.set(true);
    this.saveError.set(null);

    this.battlemapService.saveBattlemap(partyId, state).subscribe({
      next: () => {
        this.isSaving.set(false);
        this.lastSavedAt.set(new Date().toLocaleTimeString('pt-BR'));
        this.hasLocalModifications.set(false);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.saveError.set(err?.error?.message || 'Salvo localmente');
        console.warn('Persistido localmente (servidor não respondeu):', err);
      }
    });
  }

  loadAssetLibrary(): void {
    // 1. Fetch manifest from /assets/battlemap/manifest.json
    this.http.get<AssetManifest>('/assets/battlemap/manifest.json').subscribe({
      next: (manifest) => {
        if (manifest && manifest.assets) {
          const seen = new Set<string>();
          const sanitized = manifest.assets.map((asset, idx) => {
            let uId = asset.id || `asset_${idx}`;
            if (seen.has(uId)) {
              uId = `${uId}_${idx}`;
            }
            seen.add(uId);
            return { ...asset, id: uId };
          });
          this.catalogAssets.set(sanitized);
        }
        this.loadCustomAssetsFromStorage();
      },
      error: (err) => {
        console.warn('Could not load /assets/battlemap/manifest.json, using built-ins', err);
        this.catalogAssets.set([...FALLBACK_DEFAULT_ASSETS]);
        this.loadCustomAssetsFromStorage();
      }
    });
  }

  private loadCustomAssetsFromStorage(): void {
    try {
      const stored = localStorage.getItem('rpg_custom_multi_assets');
      if (stored) {
        const customs: MultiTileAssetItem[] = JSON.parse(stored);
        this.catalogAssets.update(curr => {
          const existingIds = new Set(curr.map(c => c.id));
          const toAdd = customs.filter(c => !existingIds.has(c.id));
          return [...toAdd, ...curr];
        });
      }
    } catch (e) {
      console.warn('Failed to load custom assets from localStorage', e);
    }
  }

  private saveCustomAssetsToStorage(): void {
    try {
      const customs = this.catalogAssets().filter(a => a.isCustom);
      localStorage.setItem('rpg_custom_multi_assets', JSON.stringify(customs));
    } catch (e) {
      console.warn('Failed to save custom assets', e);
    }
  }

  setMode(mode: 'play' | 'terrain' | 'multi_assets' | 'measure'): void {
    this.activeMode.set(mode);
    if (mode !== 'multi_assets') {
      this.selectedPlacedAsset.set(null);
    }
  }

  adjustGridSize(delta: number): void {
    const next = Math.max(10, Math.min(30, this.gridSize() + delta));
    this.gridSize.set(next);
    this.triggerAutoSave();
  }

  getTerrain(x: number, y: number): GridTerrainType {
    return this.terrainMap()[`${x}-${y}`] || 'grass';
  }

  isMultiObstacle(x: number, y: number): boolean {
    return !!this.multiObstacleMap()[`${x}-${y}`];
  }

  onCellHover(x: number, y: number): void {
    this.hoverCell.set({ x, y });
  }

  onCellClick(x: number, y: number, event: MouseEvent): void {
    event.stopPropagation();

    if (this.activeMode() === 'terrain') {
      const coord = `${x}-${y}`;
      this.terrainMap.update(map => ({
        ...map,
        [coord]: this.selectedTerrain()
      }));
      this.triggerAutoSave();
      return;
    }

    if (this.activeMode() === 'multi_assets') {
      const selected = this.selectedAssetToPlace();
      if (selected) {
        const newPlaced: PlacedMultiTileAsset = {
          id: 'placed_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          assetId: selected.id,
          name: selected.name,
          imageUrl: selected.imageUrl,
          gridX: x,
          gridY: y,
          widthTiles: selected.widthTiles,
          heightTiles: selected.heightTiles,
          rotation: 0,
          opacity: 1.0,
          isObstacle: selected.isObstacle,
          layer: 'under',
          animation: selected.animation
        };

        this.placedAssets.update(all => [...all, newPlaced]);
        this.selectedPlacedAsset.set(newPlaced);
        this.gameSessionService.addSystemLog(`Construção "${selected.name}" posicionada no mapa.`);
        this.triggerAutoSave();
        return;
      }
    }

    if (this.activeMode() === 'play') {
      const activeTok = this.selectedToken();
      if (activeTok) {
        if (this.isMultiObstacle(x, y)) {
          alert('Célula bloqueada por parede / construção!');
          return;
        }

        this.tokens.update(all =>
          all.map(t => (t.id === activeTok.id ? { ...t, x, y } : t))
        );
        const col = String.fromCharCode(65 + x);
        const row = y + 1;
        this.gameSessionService.addSystemLog(`${activeTok.name || 'Personagem'} moveu-se para a coordenada ${col}${row}.`);
        this.selectedToken.set(null);
        this.triggerAutoSave();
      }
    }
  }

  onGridClick(event: MouseEvent): void {
    this.selectedPlacedAsset.set(null);
    this.showAssetInspector.set(false);
    this.selectedToken.set(null);
  }

  toggleAssetInspector(placed?: PlacedMultiTileAsset): void {
    if (placed) {
      this.selectedPlacedAsset.set(placed);
    }
    this.showAssetInspector.update(v => !v);
  }

  closeAssetInspector(): void {
    this.showAssetInspector.set(false);
  }

  selectAssetToPlace(asset: MultiTileAssetItem): void {
    if (this.selectedAssetToPlace()?.id === asset.id) {
      this.selectedAssetToPlace.set(null);
    } else {
      this.selectedAssetToPlace.set(asset);
    }
  }

  selectPlacedAsset(placed: PlacedMultiTileAsset, event: MouseEvent): void {
    event.stopPropagation();
    this.selectedPlacedAsset.set(placed);
  }

  selectToken(token: GridToken, event: MouseEvent): void {
    event.stopPropagation();
    if (this.activeMode() === 'play') {
      this.selectedToken.set(token);
    }
  }

  updatePlacedAssetDim(id: string, dw: number, dh: number): void {
    this.placedAssets.update(all =>
      all.map(item => {
        if (item.id === id) {
          const w = Math.max(1, Math.min(12, item.widthTiles + dw));
          const h = Math.max(1, Math.min(12, item.heightTiles + dh));
          return { ...item, widthTiles: w, heightTiles: h };
        }
        return item;
      })
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  rotatePlacedAsset(id: string, deltaDeg: number): void {
    this.placedAssets.update(all =>
      all.map(item => {
        if (item.id === id) {
          const nextRot = (item.rotation + deltaDeg + 360) % 360;
          return { ...item, rotation: nextRot };
        }
        return item;
      })
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  setPlacedAssetOpacity(id: string, event: Event): void {
    const val = parseFloat((event.target as HTMLInputElement).value);
    this.placedAssets.update(all =>
      all.map(item => (item.id === id ? { ...item, opacity: val } : item))
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  togglePlacedAssetObstacle(id: string): void {
    this.placedAssets.update(all =>
      all.map(item => (item.id === id ? { ...item, isObstacle: !item.isObstacle } : item))
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  setPlacedAssetLayer(id: string, layer: 'under' | 'over'): void {
    this.placedAssets.update(all =>
      all.map(item => (item.id === id ? { ...item, layer } : item))
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  duplicatePlacedAsset(id: string): void {
    const original = this.placedAssets().find(a => a.id === id);
    if (!original) return;

    const clone: PlacedMultiTileAsset = {
      ...original,
      id: 'placed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      gridX: Math.min(this.gridSize() - original.widthTiles, original.gridX + 1),
      gridY: Math.min(this.gridSize() - original.heightTiles, original.gridY + 1),
    };

    this.placedAssets.update(all => [...all, clone]);
    this.selectedPlacedAsset.set(clone);
    this.gameSessionService.addSystemLog(`Construção "${clone.name}" duplicada no mapa.`);
    this.triggerAutoSave();
  }

  bringPlacedAssetToFront(id: string): void {
    const item = this.placedAssets().find(a => a.id === id);
    if (!item) return;

    this.placedAssets.update(all => [...all.filter(a => a.id !== id), item]);
    this.selectedPlacedAsset.set(item);
    this.triggerAutoSave();
  }

  movePlacedAsset(id: string, dx: number, dy: number): void {
    this.placedAssets.update(all =>
      all.map(item => {
        if (item.id === id) {
          const nx = Math.max(0, Math.min(this.gridSize() - item.widthTiles, item.gridX + dx));
          const ny = Math.max(0, Math.min(this.gridSize() - item.heightTiles, item.gridY + dy));
          return { ...item, gridX: nx, gridY: ny };
        }
        return item;
      })
    );
    const updated = this.placedAssets().find(a => a.id === id);
    if (updated) this.selectedPlacedAsset.set(updated);
    this.triggerAutoSave();
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    const activeTag = (document.activeElement?.tagName || '').toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea' || activeTag === 'select') {
      return;
    }

    const isCtrlOrCmd = event.ctrlKey || event.metaKey;

    // Delete / Backspace: Excluir item selecionado
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const selected = this.selectedPlacedAsset();
      if (selected) {
        event.preventDefault();
        this.removePlacedAsset(selected.id);
      }
      return;
    }

    // Ctrl+C / Cmd+C: Copiar item selecionado
    if (isCtrlOrCmd && (event.key === 'c' || event.key === 'C')) {
      const selected = this.selectedPlacedAsset();
      if (selected) {
        event.preventDefault();
        this.clipboardAsset.set({ ...selected });
        this.gameSessionService.addSystemLog(`Construção "${selected.name}" copiada (Ctrl+C).`);
      }
      return;
    }

    // Ctrl+V / Cmd+V: Colar item copiado
    if (isCtrlOrCmd && (event.key === 'v' || event.key === 'V')) {
      const copied = this.clipboardAsset();
      if (copied) {
        event.preventDefault();
        const hover = this.hoverCell();
        const targetX = hover ? hover.x : Math.min(this.gridSize() - copied.widthTiles, copied.gridX + 1);
        const targetY = hover ? hover.y : Math.min(this.gridSize() - copied.heightTiles, copied.gridY + 1);

        const newPlaced: PlacedMultiTileAsset = {
          ...copied,
          id: 'placed_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          gridX: Math.max(0, Math.min(this.gridSize() - copied.widthTiles, targetX)),
          gridY: Math.max(0, Math.min(this.gridSize() - copied.heightTiles, targetY)),
        };

        this.placedAssets.update(all => [...all, newPlaced]);
        this.selectedPlacedAsset.set(newPlaced);
        this.gameSessionService.addSystemLog(`Construção "${newPlaced.name}" colada no mapa (Ctrl+V).`);
        this.triggerAutoSave();
      }
      return;
    }

    // Ctrl+D / Cmd+D: Duplicar item selecionado
    if (isCtrlOrCmd && (event.key === 'd' || event.key === 'D')) {
      const selected = this.selectedPlacedAsset();
      if (selected) {
        event.preventDefault();
        this.duplicatePlacedAsset(selected.id);
      }
      return;
    }
  }

  onPlacedAssetPointerDown(placed: PlacedMultiTileAsset, event: PointerEvent): void {
    if (event.button !== 0) return;

    const target = event.target as HTMLElement;
    if (target.closest('.floating-asset-toolbar')) {
      return;
    }

    this.selectedPlacedAsset.set(placed);
    this.isDraggingAsset.set(placed.id);

    const boardEl = (event.currentTarget as HTMLElement).closest('.battlemap-board') as HTMLElement;
    if (!boardEl) return;

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const initialGridX = placed.gridX;
    const initialGridY = placed.gridY;

    let hasMoved = false;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const rect = boardEl.getBoundingClientRect();
      const cellSize = rect.width / this.gridSize();
      if (cellSize <= 0) return;

      const deltaX = moveEvt.clientX - startClientX;
      const deltaY = moveEvt.clientY - startClientY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      const gridDeltaX = Math.round(deltaX / cellSize);
      const gridDeltaY = Math.round(deltaY / cellSize);

      const targetX = Math.max(0, Math.min(this.gridSize() - placed.widthTiles, initialGridX + gridDeltaX));
      const targetY = Math.max(0, Math.min(this.gridSize() - placed.heightTiles, initialGridY + gridDeltaY));

      if (targetX !== placed.gridX || targetY !== placed.gridY) {
        this.placedAssets.update(all =>
          all.map(item => item.id === placed.id ? { ...item, gridX: targetX, gridY: targetY } : item)
        );
        const updated = this.placedAssets().find(a => a.id === placed.id);
        if (updated) this.selectedPlacedAsset.set(updated);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      this.isDraggingAsset.set(null);

      if (hasMoved) {
        this.triggerAutoSave();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  onTokenPointerDown(token: GridToken, event: PointerEvent): void {
    if (event.button !== 0) return;
    this.selectedToken.set(token);
    this.isDraggingToken.set(token.id);

    const boardEl = (event.currentTarget as HTMLElement).closest('.battlemap-board') as HTMLElement;
    if (!boardEl) return;

    const startClientX = event.clientX;
    const startClientY = event.clientY;
    const initialGridX = token.x;
    const initialGridY = token.y;

    let hasMoved = false;

    const onPointerMove = (moveEvt: PointerEvent) => {
      const rect = boardEl.getBoundingClientRect();
      const cellSize = rect.width / this.gridSize();
      if (cellSize <= 0) return;

      const deltaX = moveEvt.clientX - startClientX;
      const deltaY = moveEvt.clientY - startClientY;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        hasMoved = true;
      }

      const gridDeltaX = Math.round(deltaX / cellSize);
      const gridDeltaY = Math.round(deltaY / cellSize);

      const targetX = Math.max(0, Math.min(this.gridSize() - 1, initialGridX + gridDeltaX));
      const targetY = Math.max(0, Math.min(this.gridSize() - 1, initialGridY + gridDeltaY));

      if (targetX !== token.x || targetY !== token.y) {
        this.tokens.update(all =>
          all.map(t => t.id === token.id ? { ...t, x: targetX, y: targetY } : t)
        );
        const updated = this.tokens().find(t => t.id === token.id);
        if (updated) this.selectedToken.set(updated);
      }
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      this.isDraggingToken.set(null);

      if (hasMoved) {
        this.triggerAutoSave();
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  }

  removePlacedAsset(id: string): void {
    const asset = this.placedAssets().find(a => a.id === id);
    this.placedAssets.update(all => all.filter(a => a.id !== id));
    this.selectedPlacedAsset.set(null);
    this.showAssetInspector.set(false);
    if (asset) {
      this.gameSessionService.addSystemLog(`Construção "${asset.name}" removida do mapa.`);
    }
    this.triggerAutoSave();
  }

  clearAllPlacedAssets(): void {
    if (confirm('Deseja realmente remover todas as construções e assets do mapa?')) {
      this.placedAssets.set([]);
      this.selectedPlacedAsset.set(null);
      this.showAssetInspector.set(false);
      this.gameSessionService.addSystemLog('Todas as construções foram removidas do mapa.');
      this.triggerAutoSave();
    }
  }

  openImportModal(): void {
    this.importUrl = '';
    this.uploadedBase64 = '';
    this.importName = '';
    this.importWidth = 2;
    this.importHeight = 2;
    this.importCategory = 'castles';
    this.importIsObstacle = true;
    this.showImportModal.set(true);
  }

  closeImportModal(): void {
    this.showImportModal.set(false);
  }

  onFileSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.uploadedBase64 = e.target.result;
        if (!this.importName) {
          this.importName = file.name.replace(/\.[^/.]+$/, '');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  canSaveImport(): boolean {
    const hasImage = !!this.previewImageSrc();
    const hasName = !!this.importName.trim();
    return hasImage && hasName && this.importWidth > 0 && this.importHeight > 0;
  }

  saveImportedAsset(): void {
    const img = this.previewImageSrc();
    if (!img) return;

    const newAsset: MultiTileAssetItem = {
      id: 'custom_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: this.importName.trim() + ` (${this.importWidth}x${this.importHeight})`,
      category: this.importCategory,
      widthTiles: Number(this.importWidth),
      heightTiles: Number(this.importHeight),
      imageUrl: img,
      isObstacle: this.importIsObstacle,
      isCustom: true
    };

    this.catalogAssets.update(all => [newAsset, ...all]);
    this.saveCustomAssetsToStorage();
    this.selectedCategory.set('all');
    this.selectedAssetToPlace.set(newAsset);
    this.closeImportModal();
  }

  deleteCustomAsset(id: string, event: MouseEvent): void {
    event.stopPropagation();
    if (confirm('Deseja excluir este asset customizado?')) {
      this.catalogAssets.update(all => all.filter(a => a.id !== id));
      this.saveCustomAssetsToStorage();
      if (this.selectedAssetToPlace()?.id === id) {
        this.selectedAssetToPlace.set(null);
      }
    }
  }
}
