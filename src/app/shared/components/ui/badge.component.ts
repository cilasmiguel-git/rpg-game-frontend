import { Component, Input } from '@angular/core';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils/cn';

export const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-none border-2 px-2 py-0.5 font-rpg text-[10px] font-bold uppercase tracking-widest shadow-[2px_2px_0px_0px_#000000] select-none transition-colors',
  {
    variants: {
      variant: {
        default: 'border-[#110f0c] bg-[#c5a059] text-[#110f0c]',
        secondary: 'border-[#110f0c] bg-[#221c16] text-[#eae3d2]',
        destructive: 'border-[#110f0c] bg-[#8b0000] text-[#fdeded]',
        outline: 'border-2 border-[#c5a059] text-[#dfc282] bg-[#16120e]',
        gold: 'border-[#110f0c] bg-[#dfc282] text-[#110f0c]',
        green: 'border-[#110f0c] bg-[#2b633b] text-[#dcfce7]',
        blue: 'border-[#110f0c] bg-[#2c4f85] text-[#dbeafe]',
        purple: 'border-[#110f0c] bg-[#6b3ba7] text-[#f3e8ff]',
        red: 'border-[#110f0c] bg-[#8b0000] text-[#fdeded]',
        pixel: 'border-[#110f0c] bg-[#dfd5bf] text-[#110f0c] font-pixel text-[8px]',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export type BadgeVariantProps = VariantProps<typeof badgeVariants>;

@Component({
  selector: 'ui-badge, app-badge',
  standalone: true,
  host: { class: 'contents' },
  template: `<span [class]="classes"><ng-content></ng-content></span>`,
})
export class BadgeComponent {
  @Input() variant: BadgeVariantProps['variant'] = 'default';
  @Input() customClass = '';
  get classes(): string {
    return cn(badgeVariants({ variant: this.variant }), this.customClass);
  }
}
