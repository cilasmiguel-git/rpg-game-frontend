import { Component, Input, Output, EventEmitter, signal, OnChanges, SimpleChanges, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as QRCode from 'qrcode';
import { DialogComponent } from './dialog.component';

@Component({
  selector: 'app-qr-code-modal',
  standalone: true,
  imports: [CommonModule, DialogComponent],
  template: `
    <app-modal
      [isOpen]="isOpen"
      title="📱 QR CODE DE CONVITE DA SALA"
      maxWidth="500px"
      (close)="close.emit()"
    >
      <div class="qr-modal-content">
        <!-- Room Title & Theme -->
        <div class="qr-header-info">
          <span class="theme-badge">🏰 SALA: {{ roomCode }}</span>
          <h3 class="room-name">{{ roomTitle || 'Campanha de RPG' }}</h3>
        </div>

        <!-- The QR Code Image Container -->
        <div class="qr-image-wrapper">
          @if (qrDataUrl(); as dataUrl) {
            <img [src]="dataUrl" alt="QR Code da Sala" class="qr-image" />
          } @else {
            <div class="qr-loading">
              <span>Gerando QR Code...</span>
            </div>
          }
        </div>

        <!-- Scan Prompt -->
        <p class="scan-prompt">
          📷 <strong>Aponte a câmera do celular</strong> para entrar instantaneamente na mesa e criar seu personagem!
        </p>

        <!-- Room Code & URL Box -->
        <div class="code-url-box">
          <div class="info-row">
            <span class="lbl">CÓDIGO:</span>
            <strong class="val-code">{{ roomCode }}</strong>
            <button class="copy-mini-btn" (click)="copyCode()">
              {{ codeCopied() ? 'Copiado! ✅' : 'Copiar' }}
            </button>
          </div>
          <div class="info-row url-row">
            <span class="url-text">{{ inviteUrl }}</span>
            <button class="copy-mini-btn" (click)="copyUrl()">
              {{ urlCopied() ? 'Copiado! ✅' : 'Copiar Link' }}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="qr-modal-actions">
          @if (qrDataUrl()) {
            <a
              [href]="qrDataUrl()"
              [download]="'rpg_qrcode_' + roomCode + '.png'"
              class="btn-download"
            >
              💾 Baixar QR Code
            </a>
          }
          <button type="button" class="btn-close" (click)="close.emit()">
            Fechar
          </button>
        </div>
      </div>
    </app-modal>
  `,
  styles: [`
    .qr-modal-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1.25rem;
      text-align: center;
    }

    .qr-header-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.35rem;
    }

    .theme-badge {
      font-size: 0.6rem;
      font-weight: 700;
      color: #110f0c;
      background: #c5a059;
      font-family: 'Press Start 2P', monospace;
      padding: 0.2rem 0.5rem;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
    }

    .room-name {
      font-size: 0.95rem;
      font-weight: 700;
      font-family: 'Press Start 2P', monospace;
      color: #eae3d2;
      margin: 0;
      line-height: 1.4;
    }

    .qr-image-wrapper {
      background: #eae3d2;
      border: 4px solid #000000;
      box-shadow: 6px 6px 0px 0px #000000;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 240px;
      height: 240px;
      box-sizing: border-box;
    }

    .qr-image {
      width: 100%;
      height: 100%;
      image-rendering: pixelated;
      display: block;
    }

    .qr-loading {
      color: #110f0c;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
    }

    .scan-prompt {
      font-size: 0.65rem;
      font-family: 'Press Start 2P', monospace;
      color: #dfd5bf;
      line-height: 1.6;
      margin: 0;
      max-width: 420px;

      strong {
        color: #facc15;
      }
    }

    .code-url-box {
      width: 100%;
      background: #0f0c09;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      padding: 0.65rem 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      box-sizing: border-box;
    }

    .info-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.65rem;

      .lbl { color: #8c7f6f; }
      .val-code { color: #c5a059; font-size: 0.85rem; }
    }

    .url-row {
      border-top: 1px dashed rgba(58, 50, 42, 0.6);
      padding-top: 0.4rem;

      .url-text {
        color: #8c7f6f;
        font-size: 0.55rem;
        font-family: monospace;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 280px;
      }
    }

    .copy-mini-btn {
      background: #241d17;
      border: 2px solid #000000;
      box-shadow: 2px 2px 0px 0px #000000;
      color: #dfd5bf;
      padding: 0.3rem 0.5rem;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.55rem;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: all 0.08s ease;

      &:active {
        transform: translate(1px, 1px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #c5a059;
        color: #110f0c;
      }
    }

    .qr-modal-actions {
      display: flex;
      gap: 0.75rem;
      width: 100%;
      justify-content: flex-end;
    }

    .btn-download {
      background: #1b4329;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      color: #86efac;
      padding: 0.6rem 1rem;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      font-weight: 700;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      cursor: pointer;
      transition: all 0.08s ease;

      &:active {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #225934;
        color: #fff;
      }
    }

    .btn-close {
      background: #241d17;
      border: 2px solid #000000;
      box-shadow: 3px 3px 0px 0px #000000;
      color: #dfd5bf;
      padding: 0.6rem 1rem;
      font-family: 'Press Start 2P', monospace;
      font-size: 0.6rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.08s ease;

      &:active {
        transform: translate(2px, 2px);
        box-shadow: 1px 1px 0px 0px #000000;
      }

      &:hover {
        background: #8b0000;
        color: #fff;
      }
    }
  `]
})
export class QrCodeModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() roomCode = '';
  @Input() roomTitle = '';
  @Input() inviteUrl = '';
  @Output() close = new EventEmitter<void>();

  qrDataUrl = signal<string>('');
  codeCopied = signal<boolean>(false);
  urlCopied = signal<boolean>(false);

  ngOnInit() {
    this.checkAndGenerate();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] || changes['inviteUrl'] || changes['roomCode']) {
      this.checkAndGenerate();
    }
  }

  private checkAndGenerate() {
    const targetUrl = this.inviteUrl || (this.roomCode ? `${window.location.origin}/party/join/${this.roomCode}` : '');
    if (targetUrl && (this.isOpen || !this.qrDataUrl())) {
      this.generateQrCode(targetUrl);
    }
  }

  async generateQrCode(url: string) {
    try {
      const qrFn = (QRCode as any).toDataURL || (QRCode as any).default?.toDataURL;
      const dataUrl = await qrFn(url, {
        width: 320,
        margin: 2,
        color: {
          dark: '#110f0c',
          light: '#eae3d2',
        },
      });
      this.qrDataUrl.set(dataUrl);
    } catch (err) {
      console.error('Falha ao gerar QR Code:', err);
    }
  }

  copyCode() {
    if (this.roomCode) {
      navigator.clipboard.writeText(this.roomCode);
      this.codeCopied.set(true);
      setTimeout(() => this.codeCopied.set(false), 2000);
    }
  }

  copyUrl() {
    const targetUrl = this.inviteUrl || (this.roomCode ? `${window.location.origin}/party/join/${this.roomCode}` : '');
    if (targetUrl) {
      navigator.clipboard.writeText(targetUrl);
      this.urlCopied.set(true);
      setTimeout(() => this.urlCopied.set(false), 2000);
    }
  }
}
