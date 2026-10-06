import { Component, inject, signal, computed, effect, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BattlemapGridComponent } from './components/battlemap-grid/battlemap-grid.component';
import { PhaseNarrativeComponent } from './components/phase-narrative/phase-narrative.component';
import { ButtonComponent, DialogComponent } from '../../shared/components/ui';
import { GameIconComponent } from '../../shared/components/game-icon/game-icon.component';
import { PartyQueriesService } from '../../data/queries/party.queries';
import { PhaseQueriesService } from '../../data/queries/phase.queries';
import { CharacterQueriesService } from '../../data/queries/character.queries';
import { StorageService } from '../../core/services/storage.service';
import { GameSessionService } from '../../core/services/game-session.service';
import { Character } from '../../data/schemas/character.schema';
import { CreatePhaseInput } from '../../data/schemas/phase.schema';

@Component({
  selector: 'app-game-session',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    BattlemapGridComponent,
    PhaseNarrativeComponent,
    DialogComponent,
    ButtonComponent,
    GameIconComponent,
  ],
  templateUrl: './game-session.component.html',
  styleUrls: ['./game-session.component.scss'],
})
export class GameSessionComponent implements OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private partyQueries = inject(PartyQueriesService);
  private phaseQueries = inject(PhaseQueriesService);
  private characterQueries = inject(CharacterQueriesService);
  storage = inject(StorageService);
  gameSession = inject(GameSessionService);

  // Código da sala da URL ou storage
  partyCode = signal<string>(
    this.route.snapshot.paramMap.get('code') ||
      this.storage.getActiveParty()?.partyCode ||
      ''
  );

  // TanStack Queries
  partyQuery = this.partyQueries.useParty(() => this.partyCode());
  party = computed(() => this.partyQuery.data());
  partyId = computed(() => this.party()?.id || '');

  charactersQuery = this.characterQueries.useCharacters(() => this.partyId());
  characters = computed(() => {
    const list = this.charactersQuery.data();
    if (list && list.length > 0) return list;
    return this.party()?.characters || [];
  });

  currentPhaseQuery = this.phaseQueries.useCurrentPhase(() => this.partyId());
  currentPhase = computed(() => this.currentPhaseQuery.data());

  // Mutations
  createPhaseMutation = this.phaseQueries.useCreatePhaseMutation();
  generateImageMutation = this.phaseQueries.useGenerateImageMutation();
  publishPhaseMutation = this.phaseQueries.usePublishPhaseMutation();

  // Estados locais
  selectedCharacter = signal<Character | null>(null);
  isPhaseModalOpen = signal<boolean>(false);
  isLoreModalOpen = signal<boolean>(false);

  // Sistema de Dados D20 / RPG
  lastDiceRoll = signal<{ dice: string; value: number; critical: boolean; text: string } | null>(null);

  // Form para nova fase
  newPhaseForm: CreatePhaseInput = {
    title: '',
    masterNotes: '',
    autoGenerateImage: true,
  };

  constructor() {
    this.gameSession.setInGame(true);

    effect(() => {
      const p = this.party();
      if (p) this.gameSession.setActiveParty(p);
    });

    effect(() => {
      const chars = this.characters();
      this.gameSession.setCharacters(chars);
    });

    effect(() => {
      const phase = this.currentPhase();
      this.gameSession.setCurrentPhase(phase || null);
    });
  }

  ngOnDestroy() {
    this.gameSession.setInGame(false);
  }

  get isMaster(): boolean {
    return this.storage.isMaster();
  }

  onSelectCharacter(char: Character) {
    this.selectedCharacter.set(char);
  }

  onCharacterMoved(evt: { character: Character; x: number; y: number }) {
    const col = String.fromCharCode(65 + evt.x);
    const row = evt.y + 1;
    this.addLog(`${evt.character.name} moveu-se para a coordenada ${col}${row}.`);
  }

  onTacticalAction(evt: { action: string; character: Character }) {
    if (evt.action === 'attack') {
      const roll = Math.floor(Math.random() * 20) + 1;
      const crit = roll === 20;
      this.addLog(`${evt.character.name} atacou! Teste de acerto D20: [${roll}] ${crit ? 'CRÍTICO!' : ''}`);
      this.lastDiceRoll.set({
        dice: 'D20 (Ataque)',
        value: roll,
        critical: crit,
        text: crit ? 'Acerto Crítico!' : roll >= 10 ? 'Acerto no Alvo!' : 'Errou o golpe!',
      });
    } else if (evt.action === 'skill') {
      this.addLog(`${evt.character.name} conjurou uma técnica especial!`);
    } else if (evt.action === 'defend') {
      this.addLog(`${evt.character.name} assumiu postura defensiva (+2 CA).`);
    }
  }

  rollDice(sides: number) {
    const val = Math.floor(Math.random() * sides) + 1;
    const crit = sides === 20 && val === 20;
    const fumble = sides === 20 && val === 1;

    let text = `Resultado: ${val}`;
    if (crit) text = 'Sucesso Crítico!';
    if (fumble) text = 'Falha Crítica!';

    this.lastDiceRoll.set({
      dice: `D${sides}`,
      value: val,
      critical: crit,
      text,
    });

    this.addLog(`Rolagem D${sides}: resultado [${val}] — ${text}`);
  }

  openPhaseModal() {
    this.newPhaseForm = {
      title: `Ato ${((this.party()?.currentPhaseNumber || 1) + 1)}: `,
      masterNotes: '',
      autoGenerateImage: true,
    };
    this.isPhaseModalOpen.set(true);
  }

  async submitNewPhase() {
    if (!this.partyId()) return;
    try {
      await this.createPhaseMutation.mutateAsync({
        partyId: this.partyId(),
        phase: this.newPhaseForm,
      });
      this.isPhaseModalOpen.set(false);
      this.addLog(`O Mestre publicou uma nova fase: "${this.newPhaseForm.title}"!`);
    } catch (err: any) {
      alert('Erro ao criar fase: ' + (err.message || 'Verifique a conexão'));
    }
  }

  async onGenerateImage(phaseId: string) {
    try {
      await this.generateImageMutation.mutateAsync(phaseId);
      this.addLog('Nova ilustração de cenário foi gerada pela IA!');
    } catch (err: any) {
      alert('Erro ao gerar imagem: ' + err.message);
    }
  }

  returnToLobby() {
    this.router.navigate(['/lobby']);
  }

  private addLog(entry: string) {
    this.gameSession.addSystemLog(entry);
  }
}
