import { Component, Input, Output, EventEmitter } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-none font-rpg uppercase tracking-wider text-xs md:text-sm font-bold border-2 transition-all duration-75 select-none cursor-pointer disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none active:translate-x-[2px] active:translate-y-[2px] active:shadow-none focus-visible:outline-none',
  {
    variants: {
      variant: {
        default:
          'bg-[#c5a059] text-[#110f0c] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#d4af37]',
        primary:
          'bg-[#c5a059] text-[#110f0c] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#d4af37]',
        rpg:
          'bg-[#b8860b] text-[#110f0c] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#c5a059]',
        arcane:
          'bg-[#3a205a] text-[#f3e8ff] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#4d2a78]',
        destructive:
          'bg-[#8b0000] text-[#fdeded] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#a31515]',
        danger:
          'bg-[#8b0000] text-[#fdeded] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#a31515]',
        success:
          'bg-[#1b4329] text-[#dcfce7] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#235534]',
        outline:
          'border-2 border-[#c5a059] bg-[#16120e] text-[#c5a059] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#c5a059] hover:text-[#110f0c]',
        secondary:
          'bg-[#26201a] text-[#eae3d2] border-[#110f0c] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#352c24] hover:text-white',
        ghost:
          'border-transparent bg-transparent text-[#a89b88] hover:bg-[#26201a] hover:text-[#eae3d2] hover:border-[#3a322a] shadow-none',
        link:
          'border-transparent bg-transparent text-[#c5a059] underline-offset-4 hover:underline hover:text-[#dfc282] shadow-none',
        pixel:
          'bg-[#dfd5bf] text-[#110f0c] border-[#110f0c] font-pixel text-[10px] shadow-[3px_3px_0px_0px_#000000] hover:bg-[#eae3d2]',
      },
      size: {
        default: 'h-9 px-4 py-2',
        md: 'h-9 px-4 py-2',
        sm: 'h-7 px-2.5 text-[11px] tracking-wider',
        lg: 'h-11 px-7 text-sm tracking-widest',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  }
);

export type ButtonVariantProps = VariantProps<typeof buttonVariants>;

@Component({
  selector: 'ui-button, app-button',
  standalone: true,
  host: { class: 'contents' },
  template: `
    <button [type]="type" [disabled]="disabled || loading" (click)="onClick.emit($event)" [class]="classes">
      @if (loading) {
        <span class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>
      }
      <ng-content></ng-content>
    </button>
  `,
})
export class ButtonComponent {
  @Input() variant: ButtonVariantProps['variant'] = 'default';
  @Input() size: ButtonVariantProps['size'] = 'default';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;
  @Input() customClass = '';
  @Output() onClick = new EventEmitter<MouseEvent>();

  get classes(): string {
    return cn(buttonVariants({ variant: this.variant, size: this.size }), this.fullWidth && 'w-full', this.customClass);
  }
}
