import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterOutlet, NavigationEnd } from '@angular/router';
import { StorageService } from './core/services/storage.service';
import { PartyQueriesService } from './data/queries/party.queries';
import { ApiConfig } from './core/config/api.config';
import { MasterSidebarComponent } from './shared/components/master-sidebar/master-sidebar.component';
import { PartySidebarComponent } from './features/game-session/components/party-sidebar/party-sidebar.component';
import { GameSessionService } from './core/services/game-session.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, MasterSidebarComponent, PartySidebarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent {
  storage = inject(StorageService);
  private partyQueries = inject(PartyQueriesService);
  private router = inject(Router);
  gameSession = inject(GameSessionService);

  // Rastrear rota para saber se está na sessão de jogo
  currentUrl = signal<string>(typeof window !== 'undefined' ? window.location.pathname : '');

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      }
    });
  }

  isInGameSession = computed(() => {
    const url = this.currentUrl();
    return url.includes('/game');
  });


  currentUser = computed(() => this.storage.currentUser());
  isMaster = computed(() => this.storage.isMaster());

  apiUrl = ApiConfig.getBaseUrl();

  logout() {
    this.storage.clearSession();
    this.router.navigate(['/auth']);
  }
}
