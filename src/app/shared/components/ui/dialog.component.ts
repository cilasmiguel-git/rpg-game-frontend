import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { cn } from '../../utils/cn';

@Component({
  selector: 'ui-dialog, app-modal',
  standalone: true,
  host: { class: 'contents' },
  template: `
    @if (isOpen) {
      <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm animate-in fade-in-0" (click)="close.emit()">
        <div [class]="dialogClasses" [style.maxWidth]="maxWidth" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <div class="flex items-center justify-between border-b-2 border-[#110f0c] bg-[#1c1712] px-5 py-3">
            <h3 class="font-rpg text-base md:text-lg font-bold tracking-wider text-[#c5a059] uppercase">{{ title }}</h3>
            <button
              type="button"
              class="rounded-none border-2 border-[#110f0c] bg-[#26201a] px-2 py-0.5 text-xs font-pixel text-[#dfd5bf] shadow-[2px_2px_0px_0px_#000000] transition-transform active:translate-x-[1px] active:translate-y-[1px] active:shadow-none hover:bg-[#8b0000] hover:text-white"
              (click)="close.emit()"
              aria-label="Fechar"
            >✕</button>
          </div>
          <div class="max-h-[78vh] overflow-y-auto p-5 bg-[#16120e] text-[#eae3d2]">
            <ng-content></ng-content>
          </div>
        </div>
      </div>
    }
  `,
})
export class DialogComponent {
  @Input() isOpen = false;
  @Input() title = '';
  @Input() maxWidth = '550px';
  @Input() customClass = '';
  @Output() close = new EventEmitter<void>();

  @HostListener('document:keydown.escape')
  onEsc() {
    if (this.isOpen) this.close.emit();
  }

  get dialogClasses(): string {
    return cn(
      'relative w-full overflow-hidden rounded-none border-4 border-[#3a322a] bg-[#16120e] text-[#eae3d2] shadow-[6px_6px_0px_0px_#000000] animate-in zoom-in-95 fade-in-0',
      this.customClass
    );
  }
}
