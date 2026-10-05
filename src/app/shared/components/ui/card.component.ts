import { Component, Input } from '@angular/core';
import { cn } from '../../utils/cn';

/*
 * Família Card do shadcn adaptada para Dark Fantasy Medieval.
 * Molduras pesadas de ferro forjado, superfícies de madeira nobre/ardósia
 * e sombras volumétricas de masmorra.
 */

@Component({
  selector: 'ui-card',
  standalone: true,
  host: { class: 'contents' },
  template: `<div [class]="classes"><ng-content></ng-content></div>`,
})
export class CardComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn(
      'rounded-none border-2 border-[#3a322a] bg-[#16120e] text-[#eae3d2] shadow-[4px_4px_0px_0px_#000000] relative overflow-hidden',
      this.customClass
    );
  }
}

@Component({
  selector: 'ui-card-header',
  standalone: true,
  host: { class: 'contents' },
  template: `<div [class]="classes"><ng-content></ng-content></div>`,
})
export class CardHeaderComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn('flex flex-col space-y-1.5 p-5 border-b-2 border-[#2e261f] bg-[#1c1712]', this.customClass);
  }
}

@Component({
  selector: 'ui-card-title',
  standalone: true,
  host: { class: 'contents' },
  template: `<h3 [class]="classes"><ng-content></ng-content></h3>`,
})
export class CardTitleComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn('font-rpg text-lg font-bold leading-none tracking-wider text-[#eae3d2] drop-shadow', this.customClass);
  }
}

@Component({
  selector: 'ui-card-description',
  standalone: true,
  host: { class: 'contents' },
  template: `<p [class]="classes"><ng-content></ng-content></p>`,
})
export class CardDescriptionComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn('text-sm leading-relaxed text-[#a89b88] font-sans', this.customClass);
  }
}

@Component({
  selector: 'ui-card-content',
  standalone: true,
  host: { class: 'contents' },
  template: `<div [class]="classes"><ng-content></ng-content></div>`,
})
export class CardContentComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn('p-5 text-[#eae3d2]', this.customClass);
  }
}

@Component({
  selector: 'ui-card-footer',
  standalone: true,
  host: { class: 'contents' },
  template: `<div [class]="classes"><ng-content></ng-content></div>`,
})
export class CardFooterComponent {
  @Input() customClass = '';
  get classes(): string {
    return cn('flex items-center p-5 pt-3 border-t-2 border-[#2e261f]', this.customClass);
  }
}
