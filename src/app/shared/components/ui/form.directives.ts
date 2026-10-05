import { Directive, Input, HostBinding } from '@angular/core';
import { cn } from '../../utils/cn';

/*
 * Diretivas de formulários 8bitcn/ui — Dark Fantasy Pixel Art.
 * Entradas de texto e campos com bordas 2px e sombras inset retro.
 */

const fieldBase =
  'flex w-full rounded-none border-2 border-[#3a322a] bg-[#0f0c09] px-3.5 py-2 text-sm text-[#eae3d2] shadow-[inset_2px_2px_0px_0px_#000000] transition-all placeholder:text-[#786b59] placeholder:italic font-sans focus-visible:outline-none focus-visible:border-[#c5a059] focus-visible:shadow-[inset_2px_2px_0px_0px_#000000,_2px_2px_0px_0px_rgba(197,160,89,0.5)] disabled:cursor-not-allowed disabled:opacity-50';

/** 8bitcn/ui <Input />  →  <input uiInput /> */
@Directive({ selector: 'input[uiInput]', standalone: true })
export class InputDirective {
  @Input() class = '';
  @HostBinding('class') get classes() {
    return cn(fieldBase, 'h-10', this.class);
  }
}

/** 8bitcn/ui <Textarea />  →  <textarea uiTextarea></textarea> */
@Directive({ selector: 'textarea[uiTextarea]', standalone: true })
export class TextareaDirective {
  @Input() class = '';
  @HostBinding('class') get classes() {
    return cn(fieldBase, 'min-h-[96px] resize-y leading-relaxed', this.class);
  }
}

/** 8bitcn/ui <Select />  →  <select uiSelect></select> */
@Directive({ selector: 'select[uiSelect]', standalone: true })
export class SelectDirective {
  @Input() class = '';
  @HostBinding('class') get classes() {
    return cn(fieldBase, 'h-10 cursor-pointer appearance-none bg-[#0f0c09] pr-8', this.class);
  }
}

/** 8bitcn/ui <Label />  →  <label uiLabel></label> */
@Directive({ selector: 'label[uiLabel]', standalone: true })
export class LabelDirective {
  @Input() class = '';
  @HostBinding('class') get classes() {
    return cn(
      'font-rpg text-xs font-bold uppercase tracking-wider text-[#dfd5bf] leading-none peer-disabled:opacity-60 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]',
      this.class
    );
  }
}
