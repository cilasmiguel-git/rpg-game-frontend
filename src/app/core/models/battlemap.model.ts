export interface SpriteAnimationConfig {
  isAnimated: boolean;
  frames: number;
  orientation: 'horizontal' | 'vertical';
  duration?: string; // Ex: "0.8s"
}

export interface PlacedAsset {
  id: string; // Ex: "placed_1728169000_a1b2"
  assetId: string; // Ex: "ts_bld_castle_knights"
  name: string;
  imageUrl: string; // Caminho estático ("/assets/..."), URL web ("https://...") ou Base64 ("data:image/...")
  gridX: number;
  gridY: number;
  widthTiles: number;
  heightTiles: number;
  rotation?: number; // 0, 90, 180, 270 (padrão 0)
  opacity?: number; // 0.0 a 1.0 (padrão 1.0)
  isObstacle: boolean; // Se bloqueia movimentação
  layer: 'under' | 'over'; // under = abaixo dos tokens, over = acima dos tokens
  animation?: SpriteAnimationConfig;
}

export interface GridToken {
  id: string;
  name: string;
  type: 'player' | 'monster' | 'npc';
  avatar: string;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  size: number; // Em blocos (1, 2, 3...)
  color: string;
}

export interface BattlemapState {
  gridSize: number; // Padrão: 18 (grade 18x18)
  terrain: Record<string, string>; // Ex: { "0-0": "grass", "1-0": "stone", "5-5": "water" }
  placedAssets: PlacedAsset[];
  tokens: GridToken[];
}

export interface SaveBattlemapResponse {
  success: boolean;
  message: string;
  battlemapState?: BattlemapState;
  updatedAt?: string;
}
