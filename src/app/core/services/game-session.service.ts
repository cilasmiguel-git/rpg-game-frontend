import { Injectable, signal } from '@angular/core';
import { Character } from '../../data/schemas/character.schema';
import { Party } from '../../data/schemas/party.schema';
import { Phase } from '../../data/schemas/phase.schema';

export interface ChatMessage {
  id: string;
  sender: string;
  role: 'MASTER' | 'PLAYER' | 'SYSTEM';
  text: string;
  timestamp: string;
  isDice?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class GameSessionService {
  isInGame = signal<boolean>(false);
  activeParty = signal<Party | null>(null);
  characters = signal<Character[]>([]);
  currentPhase = signal<Phase | null>(null);
  selectedCharacter = signal<Character | null>(null);

  chatMessages = signal<ChatMessage[]>([
    {
      id: 'msg_init_1',
      sender: 'Sistema RPG',
      role: 'SYSTEM',
      text: 'A sessão foi iniciada no Battlemap.',
      timestamp: this.formatCurrentTime(),
    },
    {
      id: 'msg_init_2',
      sender: 'Sistema RPG',
      role: 'SYSTEM',
      text: 'Role os dados para testes de iniciativa e ataques.',
      timestamp: this.formatCurrentTime(),
    },
    {
      id: 'msg_init_3',
      sender: 'Sistema RPG',
      role: 'SYSTEM',
      text: 'Chat da sessão e chamada Jitsi Meet integrados!',
      timestamp: this.formatCurrentTime(),
    },
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

  addMessage(sender: string, text: string, role: 'MASTER' | 'PLAYER' | 'SYSTEM' = 'PLAYER', isDice = false) {
    const newMsg: ChatMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sender,
      role,
      text,
      timestamp: this.formatCurrentTime(),
      isDice,
    };
    this.chatMessages.update((list) => [...list, newMsg]);
  }

  addSystemLog(text: string) {
    this.addMessage('Sistema RPG', text, 'SYSTEM');
  }

  private formatCurrentTime(): string {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }
}
