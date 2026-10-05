import { Component, Input } from '@angular/core';
import { cn } from '../../utils/cn';

/** 8bitcn/ui <Progress /> — 8-bit retro pixel Health/Mana/XP bars */
@Component({
  selector: 'ui-progress',
  standalone: true,
  host: { class: 'contents' },
  template: `
    <div [class]="trackClasses" role="progressbar" [attr.aria-valuenow]="value" [attr.aria-valuemax]="max">
      <div [class]="fillClasses" [style.width.%]="percent"></div>
      @if (label) {
        <span class="absolute inset-0 flex items-center justify-center font-pixel text-[7px] md:text-[8px] font-bold text-white drop-shadow-[0_1px_2px_#000000] uppercase tracking-wider select-none pointer-events-none">
          {{ label }}
        </span>
      }
    </div>
  `,
})
export class ProgressComponent {
  @Input() value = 0;
  @Input() max = 100;
  @Input() variant: 'default' | 'hp' | 'mp' | 'xp' | 'boss' = 'default';
  @Input() label = '';
  @Input() customClass = '';

  get percent() {
    return Math.max(0, Math.min(100, (this.value / (this.max || 1)) * 100));
  }

  get trackClasses() {
    return cn(
      'relative h-4 w-full overflow-hidden rounded-none bg-[#0a0806] border-2 border-[#110f0c] shadow-[2px_2px_0px_0px_#000000] p-0.5',
      this.customClass
    );
  }

  get fillClasses() {
    const fills = {
      default: 'bg-[#c5a059] border-r-2 border-[#f5d796]',
      hp: 'bg-[#9a1a1a] border-r-2 border-[#f87171] shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]',
      mp: 'bg-[#1e40af] border-r-2 border-[#60a5fa] shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]',
      xp: 'bg-[#b45309] border-r-2 border-[#fcd34d] shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]',
      boss: 'bg-[#701a75] border-r-2 border-[#f472b6] shadow-[inset_0_2px_0_rgba(255,255,255,0.25)]',
    };
    return cn('h-full transition-all duration-300', fills[this.variant]);
  }
}

/** 8bitcn/ui <Separator /> */
@Component({
  selector: 'ui-separator',
  standalone: true,
  host: { class: 'contents' },
  template: `<div [class]="classes" role="separator"></div>`,
})
export class SeparatorComponent {
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() customClass = '';
  get classes() {
    return cn(
      'shrink-0 bg-[#3a322a] border-b border-[#110f0c]',
      this.orientation === 'horizontal' ? 'h-[2px] w-full' : 'h-full w-[2px]',
      this.customClass
    );
  }
}
