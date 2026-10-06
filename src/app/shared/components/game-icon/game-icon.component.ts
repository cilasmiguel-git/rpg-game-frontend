import { Component, Input, computed, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import 'iconify-icon';

const ALIASES: Record<string, string> = {
  // Combat & Gear
  sword: 'game-icons:broadsword',
  swords: 'game-icons:crossed-swords',
  shield: 'game-icons:shield',
  axe: 'game-icons:battle-axe',
  bow: 'game-icons:bow-arrow',
  helmet: 'game-icons:visored-helm',
  armor: 'game-icons:breastplate',
  crown: 'game-icons:crown',
  
  // Game & Dice
  dice: 'game-icons:perspective-dice-six-faces-random',
  d20: 'game-icons:d20',
  cup: 'game-icons:trophy-cup',
  
  // Locations & Nature
  castle: 'game-icons:castle',
  tower: 'game-icons:tower-flag',
  dungeon: 'game-icons:dungeon-gate',
  tavern: 'game-icons:beer-stein',
  map: 'game-icons:treasure-map',
  tree: 'game-icons:tree-branch',
  water: 'game-icons:water-drop',
  fire: 'game-icons:flame',
  lava: 'game-icons:eruption',
  stone: 'game-icons:stone-block',
  grass: 'game-icons:grass',
  
  // Characters & Roles
  master: 'game-icons:crown',
  player: 'game-icons:knight-banner',
  party: 'game-icons:rally-the-troops',
  users: 'game-icons:rally-the-troops',
  wizard: 'game-icons:wizard-face',
  monster: 'game-icons:daemon-skull',
  skull: 'game-icons:skull-crossed-bones',
  
  // Items & Magic
  scroll: 'game-icons:scroll-quill',
  book: 'game-icons:spell-book',
  potion: 'game-icons:potion-ball',
  sparkles: 'game-icons:sparkles',
  magic: 'game-icons:magic-swirl',
  key: 'game-icons:old-key',
  chest: 'game-icons:treasure-chest',
  coin: 'game-icons:coins',
  gem: 'game-icons:cut-diamond',
  
  // System / UI actions
  settings: 'game-icons:gears',
  gear: 'game-icons:cog',
  trash: 'game-icons:trash-can',
  delete: 'game-icons:trash-can',
  rotate: 'game-icons:clockwise-rotation',
  rotate_left: 'game-icons:anticlockwise-rotation',
  hand: 'game-icons:grab',
  drag: 'game-icons:hand',
  link: 'game-icons:chain-link',
  camera: 'game-icons:camera',
  qr: 'game-icons:qr-code',
  save: 'game-icons:save',
  exit: 'game-icons:exit-door',
  door: 'game-icons:doorway',
  logout: 'game-icons:exit-door',
  check: 'game-icons:check-mark',
  hourglass: 'game-icons:sand-timer',
  plus: 'game-icons:health-normal',
  arrow_right: 'game-icons:right-arrow',
  arrow_left: 'game-icons:left-arrow',
  play: 'game-icons:play-button',
  rocket: 'game-icons:rocket',
  info: 'game-icons:info',
  pin: 'game-icons:push-pin',
  upload: 'game-icons:cloud-upload',
  download: 'game-icons:save-arrow',
  eye: 'game-icons:eyeball',
  visibility: 'game-icons:eyeball'
};

@Component({
  selector: 'game-icon',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <iconify-icon 
      [attr.icon]="resolvedIcon()" 
      [style.font-size.px]="size"
      [style.width.px]="size"
      [style.height.px]="size"
      [style.color]="color"
      [class]="extraClass"
      class="game-icon-element">
    </iconify-icon>
  `,
  styles: [`
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      vertical-align: middle;
      line-height: 1;
    }
    .game-icon-element {
      display: inline-block;
      vertical-align: middle;
      fill: currentColor;
    }
  `]
})
export class GameIconComponent {
  @Input() name = 'sword';
  @Input() size = 16;
  @Input() color = 'currentColor';
  @Input() extraClass = '';

  resolvedIcon = computed(() => {
    const raw = (this.name || 'sword').trim().toLowerCase();
    if (raw.startsWith('game-icons:')) {
      return raw;
    }
    return ALIASES[raw] || `game-icons:${raw}`;
  });
}
