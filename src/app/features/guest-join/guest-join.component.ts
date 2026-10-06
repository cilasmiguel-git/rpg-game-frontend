import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthQueriesService } from '../../data/queries/auth.queries';
import { PartyQueriesService } from '../../data/queries/party.queries';
import { StorageService } from '../../core/services/storage.service';
import {
  ButtonComponent,
  CardComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardDescriptionComponent,
  CardContentComponent,
  BadgeComponent,
} from '../../shared/components/ui';
import { GameIconComponent } from '../../shared/components/game-icon/game-icon.component';

type PlayerJoinMode = 'register' | 'login' | 'guest';

@Component({
  selector: 'app-guest-join',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonComponent,
    CardComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardDescriptionComponent,
    CardContentComponent,
    BadgeComponent,
    GameIconComponent,
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#110f0c]">
      <ui-card customClass="w-full max-w-md border-[#3a322a] bg-[#1a1612]/95 backdrop-blur-md shadow-2xl shadow-black">
        <ui-card-header customClass="text-center items-center pb-2">
          <div class="mb-2 filter drop-shadow-[0_0_12px_rgba(197,160,89,0.4)]">
            <game-icon name="scroll" [size]="40" color="#c5a059"></game-icon>
          </div>
          
          <ui-badge variant="gold" customClass="mb-2">Convite Para Campanha</ui-badge>

          <ui-card-title customClass="text-2xl font-bold font-rpg text-[#eae3d2] tracking-wider">
            {{ party()?.title || 'Festa de RPG' }}
          </ui-card-title>

          <ui-card-description customClass="text-[#a89b88] text-sm max-w-sm font-body">
            @if (party()?.description) {
              "{{ party()?.description }}"
            } @else {
              Você foi convidado pelo Mestre para participar desta aventura.
            }
          </ui-card-description>

          <div class="mt-2 flex items-center gap-2">
            <span class="text-xs text-[#8c7f6f] font-rpg uppercase">Temática:</span>
            <span class="text-xs font-bold text-[#c5a059] uppercase tracking-wider font-rpg">
              {{ party()?.themeTitle || party()?.themeKey || 'Fantasia' }}
            </span>
          </div>
        </ui-card-header>

        <ui-card-content customClass="space-y-4 pt-3">
          <div class="grid grid-cols-3 gap-1.5 bg-[#120f0c] p-1 rounded border border-[#3a322a]">
            <button
              type="button"
              class="py-2 px-2 rounded text-xs font-bold font-rpg uppercase tracking-wider transition-all"
              [class.bg-[#251e17]]="mode() === 'register'"
              [class.text-[#c5a059]]="mode() === 'register'"
              [class.border]="mode() === 'register'"
              [class.border-[#3a322a]]="mode() === 'register'"
              [class.text-[#8c7f6f]]="mode() !== 'register'"
              (click)="mode.set('register')"
            >Criar conta</button>
            <button
              type="button"
              class="py-2 px-2 rounded text-xs font-bold font-rpg uppercase tracking-wider transition-all"
              [class.bg-[#251e17]]="mode() === 'login'"
              [class.text-[#c5a059]]="mode() === 'login'"
              [class.border]="mode() === 'login'"
              [class.border-[#3a322a]]="mode() === 'login'"
              [class.text-[#8c7f6f]]="mode() !== 'login'"
              (click)="mode.set('login')"
            >Entrar</button>
            <button
              type="button"
              class="py-2 px-2 rounded text-xs font-bold font-rpg uppercase tracking-wider transition-all"
              [class.bg-[#251e17]]="mode() === 'guest'"
              [class.text-[#c5a059]]="mode() === 'guest'"
              [class.border]="mode() === 'guest'"
              [class.border-[#3a322a]]="mode() === 'guest'"
              [class.text-[#8c7f6f]]="mode() !== 'guest'"
              (click)="mode.set('guest')"
            >Convidado</button>
          </div>

          @if (errorMessage()) {
            <div class="bg-[#8b0000]/20 border border-[#8b0000]/60 text-[#fca5a5] text-xs p-3 rounded font-body shadow-inner shadow-black flex items-center gap-2">
              <game-icon name="shield" [size]="14" color="#fca5a5"></game-icon>
              <span>{{ errorMessage() }}</span>
            </div>
          }

          <form (ngSubmit)="submitJoin()" class="space-y-4">
            @if (mode() === 'guest') {
              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Seu Nome ou Apelido de Aventureiro:</label>
                <input type="text" [(ngModel)]="playerName" name="playerName" placeholder="Ex: Carlos o Ladino" class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all" required />
              </div>
            } @else {
              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Usuário:</label>
                <input type="text" [(ngModel)]="playerUsername" name="playerUsername" placeholder="Seu nome de usuário" class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all" required />
              </div>
              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Senha da sua conta:</label>
                <input type="password" [(ngModel)]="playerAccountPassword" name="playerAccountPassword" [placeholder]="mode() === 'register' ? 'Mínimo de 6 caracteres' : 'Sua senha de jogador'" class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all" required />
              </div>
            }

            <div class="space-y-1.5">
              <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">
                Código da Sala (Vinculado pelo link):
              </label>
              <input
                type="text"
                [value]="partyCode()"
                disabled
                class="w-full bg-[#0f0c09] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#c5a059] font-mono font-bold tracking-widest cursor-not-allowed opacity-90"
              />
            </div>

            <div class="space-y-1.5">
              <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">
                Senha da Sala:
              </label>
              <input
                type="password"
                [(ngModel)]="partyPassword"
                name="partyPassword"
                placeholder="Informe se o Mestre configurou uma senha"
                class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
              />
            </div>

            <div class="pt-2">
              <app-button
                type="submit"
                variant="primary"
                size="lg"
                [fullWidth]="true"
                [loading]="isSubmitting()"
              >
                <div class="flex items-center justify-center gap-2">
                  <game-icon name="swords" [size]="16"></game-icon>
                  @if (mode() === 'register') { <span>Criar conta e entrar</span> }
                  @else if (mode() === 'login') { <span>Entrar na sala</span> }
                  @else { <span>Ingressar como convidado</span> }
                </div>
              </app-button>
            </div>
          </form>
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class GuestJoinComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authQueries = inject(AuthQueriesService);
  private partyQueries = inject(PartyQueriesService);
  private storage = inject(StorageService);

  partyCode = signal<string>('');
  mode = signal<PlayerJoinMode>('register');
  playerName = '';
  playerUsername = '';
  playerAccountPassword = '';
  partyPassword = '';
  errorMessage = signal<string | null>(null);

  partyQuery = this.partyQueries.useParty(() => this.partyCode());
  party = this.partyQuery.data;

  joinGuestMutation = this.authQueries.useJoinGuestMutation();
  registerPlayerMutation = this.authQueries.useRegisterPlayerMutation();
  loginPlayerMutation = this.authQueries.useLoginPlayerMutation();

  isSubmitting() {
    return this.mode() === 'register'
      ? this.registerPlayerMutation.isPending()
      : this.mode() === 'login'
        ? this.loginPlayerMutation.isPending()
        : this.joinGuestMutation.isPending();
  }

  ngOnInit() {
    const code = this.route.snapshot.paramMap.get('code');
    if (code) {
      this.partyCode.set(code.toUpperCase());
    } else {
      this.router.navigate(['/auth']);
    }
  }

  async submitJoin() {
    this.errorMessage.set(null);
    try {
      let res;
      if (this.mode() === 'guest') {
        if (!this.playerName.trim()) {
          this.errorMessage.set('Por favor, informe seu nome de aventureiro.');
          return;
        }
        res = await this.joinGuestMutation.mutateAsync({
          playerName: this.playerName.trim(),
          partyCode: this.partyCode(),
          partyPassword: this.partyPassword || undefined,
        });
      } else {
        if (!this.playerUsername.trim() || !this.playerAccountPassword) {
          this.errorMessage.set('Informe seu usuário e senha.');
          return;
        }
        const payload = {
          username: this.playerUsername.trim(),
          password: this.playerAccountPassword,
          partyCode: this.partyCode(),
          partyPassword: this.partyPassword || undefined,
        };
        res = this.mode() === 'register'
          ? await this.registerPlayerMutation.mutateAsync(payload)
          : await this.loginPlayerMutation.mutateAsync(payload);
      }

      // Salva a festa ativa
      const pCode = res.party?.code || this.partyCode();
      const pId = res.party?.id || '';
      this.storage.setActiveParty(pId, pCode);

      // Leva direto para criação do herói específico daquela festa
      this.router.navigate(['/character-creator', pCode]);
    } catch (err: any) {
      this.errorMessage.set(
        err.error?.message || err.message || 'Senha incorreta ou erro ao entrar na festa.'
      );
    }
  }
}
