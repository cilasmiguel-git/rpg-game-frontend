import { Routes } from '@angular/router';
import { AuthComponent } from './features/auth/auth.component';
import { GuestJoinComponent } from './features/guest-join/guest-join.component';
import { LobbyComponent } from './features/lobby/lobby.component';
import { CharacterCreatorComponent } from './features/character-creator/character-creator.component';
import { GameSessionComponent } from './features/game-session/game-session.component';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'lobby', pathMatch: 'full' },
  // Portal exclusivo do Mestre
  { path: 'auth', component: AuthComponent },
  { path: 'master/login', component: AuthComponent },

  // Links customizados de convite para os Jogadores entrarem na festa
  { path: 'party/join/:code', component: GuestJoinComponent },
  { path: 'join/:code', component: GuestJoinComponent },

  // Criação de personagem vinculado à festa
  { path: 'character-creator/:code', component: CharacterCreatorComponent, canActivate: [authGuard] },
  { path: 'character-creator', component: CharacterCreatorComponent, canActivate: [authGuard] },
  { path: 'party/:code/create-character', component: CharacterCreatorComponent, canActivate: [authGuard] },

  // Lobby da sessão e Battlemap
  { path: 'lobby', component: LobbyComponent, canActivate: [authGuard] },
  { path: 'lobby/:code', component: LobbyComponent, canActivate: [authGuard] },
  { path: 'game', component: GameSessionComponent, canActivate: [authGuard] },
  { path: 'game/:code', component: GameSessionComponent, canActivate: [authGuard] },

  { path: '**', redirectTo: 'auth' },
];
