import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Phase } from '../../../../data/schemas/phase.schema';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { GameIconComponent } from '../../../../shared/components/game-icon/game-icon.component';

@Component({
  selector: 'app-phase-narrative',
  standalone: true,
  imports: [CommonModule, ButtonComponent, GameIconComponent],
  template: `
    <div class="narrative-modal-card">
      @if (phase) {
        <div class="phase-hero-image" [style.backgroundImage]="phase.imageUrl ? 'url(' + phase.imageUrl + ')' : 'none'">
          <div class="overlay">
            <span class="badge-phase">Fase {{ phase.phaseNumber }}</span>
            <h2 class="phase-title">{{ phase.title }}</h2>
          </div>
        </div>

        <div class="content-body">
          <div class="narration-box">
            <h4 class="section-label flex items-center gap-1.5">
              <game-icon name="scroll" [size]="14"></game-icon> Narração do Cenário (IA)
            </h4>
            <p class="narration-p">"{{ phase.formattedNarration }}"</p>
          </div>

          @if (phase.aiAtmosphere) {
            <div class="atmosphere-box">
              <span class="atmosphere-icon"><game-icon name="game-icons:candle-flame" [size]="14"></game-icon></span>
              <span class="atmosphere-text"><strong>Atmosfera Sensorial:</strong> {{ phase.aiAtmosphere }}</span>
            </div>
          }

          @if (phase.suggestedHooks && phase.suggestedHooks.length > 0) {
            <div class="hooks-box">
              <h4 class="section-label flex items-center gap-1.5">
                <game-icon name="game-icons:target-arrows" [size]="14"></game-icon> Ações e Ganchos Táticos Recomendados
              </h4>
              <div class="hooks-grid">
                @for (hook of phase.suggestedHooks; track $index) {
                  <div class="hook-card">
                    <span class="hook-num">#{{ $index + 1 }}</span>
                    <span class="hook-text">{{ hook }}</span>
                  </div>
                }
              </div>
            </div>
          }

          @if (isMaster) {
            <div class="master-tools">
              <h4 class="section-label flex items-center gap-1.5">
                <game-icon name="crown" [size]="14" color="#f1c40f"></game-icon> Painel do Mestre
              </h4>
              <div class="master-notes-preview">
                <strong>Suas Anotações:</strong> {{ phase.masterNotes }}
              </div>
              <div class="master-actions">
                <app-button
                  variant="secondary"
                  size="sm"
                  [loading]="isGeneratingImage"
                  (onClick)="onGenerateImage.emit(phase.id)"
                >
                  <game-icon name="game-icons:palette" [size]="14"></game-icon> Regenerar Ilustração IA
                </app-button>
                <app-button
                  variant="primary"
                  size="sm"
                  (onClick)="onAdvancePhase.emit()"
                >
                  <game-icon name="game-icons:fast-forward-button" [size]="14"></game-icon> Avançar para Nova Fase
                </app-button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .narrative-modal-card {
      background: #141721;
      border-radius: 0.75rem;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .phase-hero-image {
      height: 220px;
      background-size: cover;
      background-position: center;
      background-color: #1e2433;
      position: relative;
      border-radius: 0.5rem;
      overflow: hidden;
    }

    .overlay {
      position: absolute;
      inset: 0;
      background: linear-gradient(to top, rgba(14, 17, 24, 0.95) 0%, rgba(14, 17, 24, 0.3) 100%);
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      padding: 1.5rem;
      gap: 0.35rem;
    }

    .badge-phase {
      background: #4f46e5;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 0.2rem 0.6rem;
      border-radius: 9999px;
      width: fit-content;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    .phase-title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #fff;
      margin: 0;
    }

    .content-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      padding: 0 0.5rem 1rem 0.5rem;
    }

    .section-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #f59e0b;
      margin: 0 0 0.4rem 0;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .narration-box {
      background: #181d2a;
      border: 1px solid #232b3d;
      padding: 1rem;
      border-radius: 0.5rem;
    }

    .narration-p {
      color: #cbd5e1;
      font-style: italic;
      line-height: 1.6;
      margin: 0;
      font-size: 0.95rem;
    }

    .atmosphere-box {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.25);
      padding: 0.75rem 1rem;
      border-radius: 0.5rem;
      font-size: 0.85rem;
      color: #fde68a;
    }

    .atmosphere-icon {
      font-size: 1.2rem;
    }

    .hooks-grid {
      display: grid;
      gap: 0.5rem;
    }

    .hook-card {
      display: flex;
      align-items: flex-start;
      gap: 0.6rem;
      background: #181d2a;
      border: 1px solid #242d40;
      padding: 0.6rem 0.85rem;
      border-radius: 0.4rem;
    }

    .hook-num {
      color: #6366f1;
      font-weight: 700;
      font-size: 0.85rem;
    }

    .hook-text {
      color: #94a3b8;
      font-size: 0.85rem;
      line-height: 1.4;
    }

    .master-tools {
      background: #191624;
      border: 1px solid #3b2c56;
      padding: 1rem;
      border-radius: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .master-notes-preview {
      font-size: 0.85rem;
      color: #cbd5e1;
      background: #12101b;
      padding: 0.6rem;
      border-radius: 0.4rem;
    }

    .master-actions {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
    }
  `]
})
export class PhaseNarrativeComponent {
  @Input() phase?: Phase | null;
  @Input() isMaster = false;
  @Input() isGeneratingImage = false;

  @Output() onGenerateImage = new EventEmitter<string>();
  @Output() onAdvancePhase = new EventEmitter<void>();
}
