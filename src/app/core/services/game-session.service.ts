import { Injectable, signal, computed } from '@angular/core';
import { Character } from '../../data/schemas/character.schema';
import { Party } from '../../data/schemas/party.schema';
import { Phase } from '../../data/schemas/phase.schema';

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {
  isInGame = signal<boolean>(false);
  activeParty = signal<Party | null>(null);
  characters = signal<Character[]>([]);
  currentPhase = signal<Phase | null>(null);
  selectedCharacter = signal<Character | null>(null);
  sessionLogs = signal<string[]>([
    '⚔️ A sessão foi iniciada no Battlemap.',
    '🎲 Role os dados para testes de iniciativa e ataques.',
  ]);

  setInGame(inGame: boolean) {
    this.isInGame.set(inGame);
  }

  setActiveParty(party: Party | null) {
    this.activeParty.set(party);
  }

  setCharacters(chars: Character[]) {
    this.characters.set(chars);
  }

  setCurrentPhase(phase: Phase | null) {
    this.currentPhase.set(phase);
  }

  selectCharacter(char: Character | null) {
    this.selectedCharacter.set(char);
  }

  addLog(entry: string) {
    this.sessionLogs.update((logs) => [entry, ...logs.slice(0, 29)]);
  }
}
