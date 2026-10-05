import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthQueriesService } from '../../data/queries/auth.queries';
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

type MasterAuthTab = 'login-master' | 'register-master';

@Component({
  selector: 'app-auth',
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
  ],
  template: `
    <div class="min-h-[calc(100vh-64px)] flex items-center justify-center p-4 bg-[#110f0c]">
      <ui-card customClass="w-full max-w-lg border-[#3a322a] bg-[#1a1612]/95 backdrop-blur-md shadow-2xl shadow-black">
        <ui-card-header customClass="text-center items-center pb-3">
          <div class="text-4xl mb-1 filter drop-shadow-[0_0_12px_rgba(197,160,89,0.4)]">👑⚔️</div>
          <ui-badge variant="gold" customClass="mb-2">Portal Exclusivo do Mestre</ui-badge>
          <ui-card-title customClass="text-2xl font-bold font-rpg text-[#eae3d2] tracking-wider">
            RPG Party & Battlemap
          </ui-card-title>
          <ui-card-description customClass="text-[#a89b88] text-sm max-w-sm font-body">
            Faça login como Mestre para gerenciar suas festas, gerar links de convite para seus jogadores e conduzir a mesa tática com IA.
          </ui-card-description>
        </ui-card-header>

        <ui-card-content customClass="space-y-5 pt-2">
          <!-- Navigation Tabs Exclusivas do Mestre -->
          <div class="grid grid-cols-2 gap-1.5 bg-[#120f0c] p-1 rounded border border-[#3a322a]">
            <button
              type="button"
              class="py-2 px-3 rounded text-xs font-bold font-rpg uppercase tracking-wider transition-all text-center"
              [class.bg-[#251e17]]="activeTab() === 'login-master'"
              [class.text-[#c5a059]]="activeTab() === 'login-master'"
              [class.border]="activeTab() === 'login-master'"
              [class.border-[#3a322a]]="activeTab() === 'login-master'"
              [class.text-[#8c7f6f]]="activeTab() !== 'login-master'"
              (click)="activeTab.set('login-master')"
            >
              👑 Mestre (Entrar)
            </button>
            <button
              type="button"
              class="py-2 px-3 rounded text-xs font-bold font-rpg uppercase tracking-wider transition-all text-center"
              [class.bg-[#251e17]]="activeTab() === 'register-master'"
              [class.text-[#c5a059]]="activeTab() === 'register-master'"
              [class.border]="activeTab() === 'register-master'"
              [class.border-[#3a322a]]="activeTab() === 'register-master'"
              [class.text-[#8c7f6f]]="activeTab() !== 'register-master'"
              (click)="activeTab.set('register-master')"
            >
              ✨ Criar Conta
            </button>
          </div>

          @if (errorMessage()) {
            <div class="bg-[#8b0000]/20 border border-[#8b0000]/60 text-[#fca5a5] text-xs p-3 rounded font-body shadow-inner shadow-black">
              ⚠️ {{ errorMessage() }}
            </div>
          }

          <!-- Tab 1: Master Login -->
          @if (activeTab() === 'login-master') {
            <form (ngSubmit)="submitLoginMaster()" class="space-y-4">
              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Email ou Usuário de Mestre:</label>
                <input
                  type="text"
                  [(ngModel)]="loginForm.identifier"
                  name="loginIdentifier"
                  placeholder="mestre@rpg.com ou mestre_arthur"
                  class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Senha Secreta:</label>
                <input
                  type="password"
                  [(ngModel)]="loginForm.password"
                  name="loginPassword"
                  placeholder="Sua senha de acesso"
                  class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
                  required
                />
              </div>

              <div class="pt-2">
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="loginMasterMutation.isPending()"
                >
                  👑 Entrar no Painel do Mestre
                </app-button>
              </div>
            </form>
          }

          <!-- Tab 2: Master Register -->
          @if (activeTab() === 'register-master') {
            <form (ngSubmit)="submitRegisterMaster()" class="space-y-4">
              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Nome de Mestre (Username):</label>
                <input
                  type="text"
                  [(ngModel)]="registerForm.username"
                  name="regUsername"
                  placeholder="Ex: mestre_arthur"
                  class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Email do Mestre:</label>
                <input
                  type="email"
                  [(ngModel)]="registerForm.email"
                  name="regEmail"
                  placeholder="mestre@exemplo.com"
                  class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
                  required
                />
              </div>

              <div class="space-y-1.5">
                <label class="font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf]">Senha de Acesso:</label>
                <input
                  type="password"
                  [(ngModel)]="registerForm.password"
                  name="regPassword"
                  placeholder="Mínimo de 6 caracteres"
                  class="w-full bg-[#130f0c] border border-[#3a322a] rounded px-3.5 py-2 text-sm text-[#eae3d2] placeholder:text-[#786b59] placeholder:italic focus:outline-none focus:border-[#c5a059] focus:ring-1 focus:ring-[#c5a059] shadow-inner transition-all"
                  required
                />
              </div>

              <div class="pt-2">
                <app-button
                  type="submit"
                  variant="primary"
                  size="lg"
                  [fullWidth]="true"
                  [loading]="registerMasterMutation.isPending()"
                >
                  ✨ Cadastrar Mestre & Começar
                </app-button>
              </div>
            </form>
          }

          <!-- Rodapé Explicativo Para Jogadores -->
          <div class="border-t border-[#3a322a] pt-3 text-center">
            <p class="text-xs text-[#a89b88] font-body">
              🎲 <strong>Você é um jogador convidado?</strong>
              <br />
              Peça ao seu Mestre o link customizado da sala (ex: <code class="text-[#c5a059] font-mono">/party/join/CODIGO</code>) para ingressar diretamente na campanha.
            </p>
          </div>
        </ui-card-content>
      </ui-card>
    </div>
  `,
})
export class AuthComponent {
  private authQueries = inject(AuthQueriesService);
  private router = inject(Router);

  activeTab = signal<MasterAuthTab>('login-master');
  errorMessage = signal<string | null>(null);

  loginForm = {
    identifier: '',
    password: '',
  };

  registerForm = {
    username: '',
    email: '',
    password: '',
  };

  loginMasterMutation = this.authQueries.useLoginMasterMutation();
  registerMasterMutation = this.authQueries.useRegisterMasterMutation();

  async submitLoginMaster() {
    this.errorMessage.set(null);
    try {
      await this.loginMasterMutation.mutateAsync({
        identifier: this.loginForm.identifier.trim(),
        password: this.loginForm.password,
      });
      this.router.navigate(['/lobby']);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || err.message || 'Falha ao autenticar mestre.');
    }
  }

  async submitRegisterMaster() {
    this.errorMessage.set(null);
    try {
      await this.registerMasterMutation.mutateAsync({
        username: this.registerForm.username.trim(),
        email: this.registerForm.email.trim(),
        password: this.registerForm.password,
      });
      this.router.navigate(['/lobby']);
    } catch (err: any) {
      this.errorMessage.set(err.error?.message || err.message || 'Falha ao registrar mestre.');
    }
  }
}
