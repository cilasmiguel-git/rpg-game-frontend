import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PartyQueriesService } from '../../data/queries/party.queries';
import { ThemeQueriesService } from '../../data/queries/theme.queries';
import { CharacterQueriesService } from '../../data/queries/character.queries';
import { StorageService } from '../../core/services/storage.service';
import { ButtonComponent } from '../../shared/components/ui';
import { CreateCharacterInput } from '../../data/schemas/character.schema';
import { Theme } from '../../data/schemas/theme.schema';
import { GameIconComponent } from '../../shared/components/game-icon/game-icon.component';

@Component({
  selector: 'app-character-creator',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonComponent, GameIconComponent],
  template: `
    <div class="creator-page">
      <div class="creator-container">
        <!-- Top Back Bar -->
        <div class="creator-topbar">
          <button class="back-link" (click)="goBack()">⬅ Voltar ao Lobby</button>
          <div class="topbar-title-group">
            <h1 class="creator-title flex items-center gap-2">
              <game-icon name="wizard" [size]="24"></game-icon> Forja de Heróis & Customização Visual
            </h1>
            <span class="theme-tag">Temática: {{ activeTheme()?.title || 'Fantasia' }}</span>
          </div>
        </div>

        <div class="creator-layout">
          <!-- Left: Customization Form -->
          <div class="creator-form-panel">
            <!-- 1. Identidade do Herói -->
            <section class="form-section">
              <h3 class="section-heading">1. Identidade & Classe</h3>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Nome do Personagem:</label>
                  <input
                    type="text"
                    [(ngModel)]="charForm.name"
                    name="charName"
                    placeholder="Ex: Eldrin Sombralonga"
                    required
                  />
                </div>
                <div class="form-group flex-1">
                  <label>Nome do Jogador:</label>
                  <input
                    type="text"
                    [(ngModel)]="charForm.playerName"
                    name="playerName"
                    placeholder="Ex: Carlos"
                    required
                  />
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Classe / Arquétipo:</label>
                  <input
                    type="text"
                    [(ngModel)]="charForm.characterClass"
                    name="charClass"
                    placeholder="Ex: Mago Elemental, Caçador Furtivo, Guerreiro Paladino"
                  />
                </div>
                <div class="form-group flex-1">
                  <label>Identidade / Gênero Visual:</label>
                  <select [(ngModel)]="charForm.appearance.sex" name="charSex">
                    <option value="MASCULINO">Masculino</option>
                    <option value="FEMININO">Feminino</option>
                    <option value="ANDROGINO">Andrógino</option>
                    <option value="OUTRO">Outro</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- 2. Linhagem & Corpo -->
            <section class="form-section">
              <h3 class="section-heading">2. Raça & Porte Físico</h3>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Raça / Linhagem:</label>
                  <select [(ngModel)]="charForm.appearance.race" name="charRace">
                    @for (race of activeTheme()?.races; track race.id) {
                      <option [value]="race.name">{{ race.name }}</option>
                    } @empty {
                      <option value="Humano">Humano</option>
                      <option value="Elfo">Elfo</option>
                      <option value="Anão">Anão</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label>Porte Físico:</label>
                  <select [(ngModel)]="charForm.appearance.bodyType" name="charBodyType">
                    @for (b of activeTheme()?.bodyTypes; track b.id) {
                      <option [value]="b.id">{{ b.name }}</option>
                    } @empty {
                      <option value="atletico">Atlético</option>
                      <option value="esguio">Esguio</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Paleta de Tom de Pele -->
              <div class="form-group">
                <label>Tom de Pele:</label>
                <div class="color-palette-row">
                  @for (color of activeTheme()?.skinPalettes; track color) {
                    <button
                      type="button"
                      class="color-circle"
                      [style.backgroundColor]="color"
                      [class.selected]="charForm.appearance.skinColor === color"
                      (click)="charForm.appearance.skinColor = color"
                    ></button>
                  }
                  <input
                    type="color"
                    [(ngModel)]="charForm.appearance.skinColor"
                    name="customSkin"
                    class="custom-color-picker"
                    title="Cor Customizada"
                  />
                </div>
              </div>
            </section>

            <!-- 3. Cabelo & Cores -->
            <section class="form-section">
              <h3 class="section-heading">3. Penteado & Cor do Cabelo</h3>
              <div class="form-group">
                <label>Estilo do Cabelo:</label>
                <select [(ngModel)]="charForm.appearance.hairStyle" name="charHairStyle">
                  @for (hair of activeTheme()?.hairStyles; track hair.id) {
                    <option [value]="hair.id">{{ hair.name }}</option>
                  } @empty {
                    <option value="curto">Curto</option>
                    <option value="longo">Longo</option>
                  }
                </select>
              </div>

              <div class="form-group">
                <label>Cor do Cabelo:</label>
                <div class="color-palette-row">
                  @for (color of activeTheme()?.hairPalettes; track color) {
                    <button
                      type="button"
                      class="color-circle"
                      [style.backgroundColor]="color"
                      [class.selected]="charForm.appearance.hairColor === color"
                      (click)="charForm.appearance.hairColor = color"
                    ></button>
                  }
                  <input
                    type="color"
                    [(ngModel)]="charForm.appearance.hairColor"
                    name="customHair"
                    class="custom-color-picker"
                    title="Cor Customizada"
                  />
                </div>
              </div>
            </section>

            <!-- 4. Vestimenta & Equipamentos -->
            <section class="form-section">
              <h3 class="section-heading">4. Traje, Armas & Acessórios</h3>
              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Tipo de Traje / Armadura:</label>
                  <select [(ngModel)]="charForm.appearance.outfitType" name="charOutfitType">
                    @for (outfit of activeTheme()?.outfitTypes; track outfit.id) {
                      <option [value]="outfit.id">{{ outfit.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label>Arma Principal:</label>
                  <select [(ngModel)]="charForm.appearance.mainWeapon" name="charMainWeapon">
                    @for (w of activeTheme()?.mainWeapons; track w.id) {
                      <option [value]="w.name">{{ w.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <div class="form-row">
                <div class="form-group flex-1">
                  <label>Elmo / Chapéu / Cabeça:</label>
                  <select [(ngModel)]="charForm.appearance.headgear" name="charHeadgear">
                    @for (h of activeTheme()?.headgears; track h.id) {
                      <option [value]="h.name">{{ h.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group flex-1">
                  <label>Acessório Especial:</label>
                  <select [(ngModel)]="charForm.appearance.accessory" name="charAccessory">
                    @for (acc of activeTheme()?.accessories; track acc.id) {
                      <option [value]="acc.name">{{ acc.name }}</option>
                    }
                  </select>
                </div>
              </div>

              <!-- Paleta de Cores do Traje -->
              <div class="form-group">
                <label>Cor Primária do Traje / Armadura:</label>
                <div class="color-palette-row">
                  @for (color of activeTheme()?.clothingPalettes; track color) {
                    <button
                      type="button"
                      class="color-circle"
                      [style.backgroundColor]="color"
                      [class.selected]="charForm.appearance.outfitPrimaryColor === color"
                      (click)="charForm.appearance.outfitPrimaryColor = color"
                    ></button>
                  }
                  <input
                    type="color"
                    [(ngModel)]="charForm.appearance.outfitPrimaryColor"
                    name="customOutfit"
                    class="custom-color-picker"
                    title="Cor Customizada"
                  />
                </div>
              </div>
            </section>
          </div>

          <!-- Right: Live Token & Hero Card Preview -->
          <div class="creator-preview-panel">
            <div class="preview-card">
              <span class="preview-badge">Visualização ao Vivo</span>

              <!-- Dynamic Avatar Token -->
              <div
                class="live-token-preview"
                [style.backgroundColor]="charForm.appearance.skinColor"
                [style.borderColor]="charForm.appearance.outfitPrimaryColor"
              >
                <span class="live-token-letter">{{ charForm.name ? charForm.name.charAt(0) : '?' }}</span>
                <div class="live-hp-bar">
                  <div class="hp-fill"></div>
                </div>
              </div>

              <div class="preview-hero-info">
                <h2 class="preview-name">{{ charForm.name || 'Nome do Herói' }}</h2>
                <span class="preview-class">
                  {{ charForm.characterClass || 'Classe do Personagem' }} • {{ charForm.appearance.race }}
                </span>
                <span class="preview-player">Jogador: {{ charForm.playerName || 'Seu Nome' }}</span>
              </div>

              <div class="preview-details-list">
                <div class="detail-row">
                  <span>Arma:</span>
                  <strong>{{ charForm.appearance.mainWeapon || 'Não definida' }}</strong>
                </div>
                <div class="detail-row">
                  <span>Vestimenta:</span>
                  <strong>{{ charForm.appearance.outfitType || 'Básica' }}</strong>
                </div>
                <div class="detail-row">
                  <span>Cabeça:</span>
                  <strong>{{ charForm.appearance.headgear || 'Nenhum' }}</strong>
                </div>
                <div class="detail-row">
                  <span>Acessório:</span>
                  <strong>{{ charForm.appearance.accessory || 'Nenhum' }}</strong>
                </div>
              </div>

              <!-- Stats Preview -->
              <div class="preview-stats">
                <div class="stat-box hp">
                  <span class="stat-title">Vida Inicial</span>
                  <span class="stat-number">100 HP</span>
                </div>
                <div class="stat-box mp">
                  <span class="stat-title">Mana / Energia</span>
                  <span class="stat-number">50 MP</span>
                </div>
              </div>

              <!-- Create Hero Button -->
              <div class="preview-actions">
                <app-button
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="createCharMutation.isPending()"
                  (onClick)="submitCharacter()"
                >
                  <game-icon name="swords" [size]="16"></game-icon> Forjar Herói & Entrar no Lobby
                </app-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .creator-page {
      min-height: calc(100vh - 64px);
      padding: 1.5rem;
      background: radial-gradient(circle at 50% 10%, #151a28 0%, #080a0f 100%);
      color: #f1f5f9;
    }

    .creator-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .creator-topbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #11141e;
      border: 1px solid #232c3f;
      padding: 1rem 1.5rem;
      border-radius: 1rem;
    }

    .back-link {
      background: #181d2a;
      border: 1px solid #2b354b;
      color: #94a3b8;
      padding: 0.4rem 0.8rem;
      border-radius: 6px;
      font-size: 0.825rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s ease;

      &:hover {
        background: #252e42;
        color: #fff;
      }
    }

    .topbar-title-group {
      text-align: right;
    }

    .creator-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
    }

    .theme-tag {
      font-size: 0.75rem;
      color: #f59e0b;
      font-weight: 700;
      text-transform: uppercase;
    }

    .creator-layout {
      display: grid;
      grid-template-columns: 1fr 380px;
      gap: 1.5rem;
    }

    .creator-form-panel {
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .form-section {
      background: #11151f;
      border: 1px solid #202738;
      border-radius: 1rem;
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .section-heading {
      font-size: 1.05rem;
      font-weight: 700;
      color: #f59e0b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .form-row {
      display: flex;
      gap: 1rem;
    }

    .flex-1 {
      flex: 1;
    }

    .form-group {
      display: flex;
      flex-direction: column;
      gap: 0.4rem;

      label {
        font-size: 0.825rem;
        font-weight: 600;
        color: #cbd5e1;
      }

      input, select {
        background: #090c12;
        border: 1px solid #232c3f;
        border-radius: 8px;
        padding: 0.65rem 0.85rem;
        color: #f1f5f9;
        font-family: inherit;
        font-size: 0.9rem;
        outline: none;

        &:focus {
          border-color: #6366f1;
        }
      }
    }

    .color-palette-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .color-circle {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.2);
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &:hover {
        transform: scale(1.15);
      }

      &.selected {
        border-color: #fff;
        box-shadow: 0 0 10px rgba(255, 255, 255, 0.6);
        transform: scale(1.2);
      }
    }

    .custom-color-picker {
      width: 34px;
      height: 34px;
      border: none;
      background: transparent;
      cursor: pointer;
    }

    .creator-preview-panel {
      position: sticky;
      top: 1.5rem;
      height: fit-content;
    }

    .preview-card {
      background: #11141e;
      border: 1px solid #232b3d;
      border-radius: 1.25rem;
      padding: 1.75rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
    }

    .preview-badge {
      font-size: 0.7rem;
      color: #6366f1;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .live-token-preview {
      width: 110px;
      height: 110px;
      border-radius: 50%;
      border: 4px solid #eab308;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.8), 0 0 20px rgba(234, 179, 8, 0.3);
      position: relative;
      transition: all 0.3s ease;
    }

    .live-token-letter {
      font-size: 2.5rem;
      font-weight: 800;
      color: #0f172a;
      text-shadow: 0 1px 3px rgba(255, 255, 255, 0.4);
    }

    .live-hp-bar {
      position: absolute;
      bottom: -6px;
      width: 85%;
      height: 8px;
      background: #1e293b;
      border-radius: 4px;
      overflow: hidden;
      border: 1px solid #000;
    }

    .hp-fill {
      height: 100%;
      width: 100%;
      background: linear-gradient(90deg, #16a34a, #22c55e);
    }

    .preview-hero-info {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .preview-name {
      font-size: 1.35rem;
      font-weight: 800;
      color: #f8fafc;
      margin: 0;
    }

    .preview-class {
      font-size: 0.85rem;
      color: #f59e0b;
      font-weight: 600;
    }

    .preview-player {
      font-size: 0.75rem;
      color: #64748b;
    }

    .preview-details-list {
      width: 100%;
      background: #0c0f17;
      border: 1px solid #1c2230;
      border-radius: 0.6rem;
      padding: 0.75rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.4rem;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.8rem;
      color: #94a3b8;

      strong {
        color: #e2e8f0;
      }
    }

    .preview-stats {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      width: 100%;
    }

    .stat-box {
      background: #171c28;
      border: 1px solid #252e42;
      border-radius: 0.6rem;
      padding: 0.6rem;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;

      &.hp .stat-number { color: #f87171; }
      &.mp .stat-number { color: #60a5fa; }
    }

    .stat-title {
      font-size: 0.7rem;
      color: #94a3b8;
      text-transform: uppercase;
    }

    .stat-number {
      font-size: 1.1rem;
      font-weight: 800;
    }

    .preview-actions {
      width: 100%;
    }

    @media (max-width: 900px) {
      .creator-layout {
        grid-template-columns: 1fr;
      }
      .creator-preview-panel {
        position: static;
      }
    }
  `]
})
export class CharacterCreatorComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private partyQueries = inject(PartyQueriesService);
  private themeQueries = inject(ThemeQueriesService);
  private characterQueries = inject(CharacterQueriesService);
  private storage = inject(StorageService);

  partyCode = signal<string>(
    this.route.snapshot.paramMap.get('code') ||
      this.storage.getActiveParty()?.partyCode ||
      ''
  );

  partyQuery = this.partyQueries.useParty(() => this.partyCode());
  party = computed(() => this.partyQuery.data());

  themesQuery = this.themeQueries.useThemes();
  themes = computed(() => this.themesQuery.data() || []);

  activeTheme = computed<Theme | undefined>(() => {
    const list = this.themes();
    const pTheme = this.party()?.themeKey;
    if (pTheme) {
      const match = list.find((t) => t.key === pTheme);
      if (match) return match;
    }
    return list[0];
  });

  createCharMutation = this.characterQueries.useCreateCharacterMutation();

  charForm: CreateCharacterInput = {
    playerName: this.storage.getUser()?.playerName || this.storage.getUser()?.username || 'Aventureiro',
    name: 'Eldrin Valente',
    characterClass: 'Guerreiro / Paladino',
    appearance: {
      sex: 'MASCULINO',
      race: 'Humano',
      skinColor: '#e4b590',
      hairStyle: 'curto_desalinhado',
      hairColor: '#7b4c27',
      eyeColor: '#3b82f6',
      bodyType: 'atletico',
      outfitType: 'armadura_placas',
      outfitPrimaryColor: '#1e293b',
      outfitSecondaryColor: '#7c2d12',
      mainWeapon: 'Espada Longa de Duas Mãos',
      headgear: 'Elmo Fechado de Cavaleiro',
      accessory: 'Capa Longa Resistente a Chuva',
    },
    stats: {
      health: 100,
      maxHealth: 100,
      energy: 50,
      bio: '',
    },
  };

  ngOnInit() {
    const user = this.storage.getUser();
    if (user?.playerName) {
      this.charForm.playerName = user.playerName;
    }
    const theme = this.activeTheme();
    if (theme) {
      this.applyThemeDefaults(theme);
    }
  }

  applyThemeDefaults(t: Theme) {
    if (t.races?.length) this.charForm.appearance.race = t.races[0].name;
    if (t.skinPalettes?.length) this.charForm.appearance.skinColor = t.skinPalettes[0];
    if (t.hairPalettes?.length) this.charForm.appearance.hairColor = t.hairPalettes[0];
    if (t.clothingPalettes?.length) this.charForm.appearance.outfitPrimaryColor = t.clothingPalettes[0];
    if (t.mainWeapons?.length) this.charForm.appearance.mainWeapon = t.mainWeapons[0].name;
    if (t.outfitTypes?.length) this.charForm.appearance.outfitType = t.outfitTypes[0].name;
  }

  async submitCharacter() {
    const party = this.party();
    if (!party?.id) {
      alert('Sala não encontrada para associar o personagem.');
      return;
    }

    try {
      await this.createCharMutation.mutateAsync({
        partyId: party.id,
        character: this.charForm,
      });
      this.router.navigate(['/lobby', party.code]);
    } catch (err: any) {
      alert('Erro ao criar herói: ' + (err.error?.message || err.message));
    }
  }

  goBack() {
    const code = this.partyCode();
    if (code) {
      this.router.navigate(['/lobby', code]);
    } else {
      this.router.navigate(['/lobby']);
    }
  }
}
