// Declaração de tipos para o objeto global RPGUI injetado pelo rpgui.js
declare interface Window {
  RPGUI?: {
    init: () => void;
    set_progress: (element: HTMLElement | string, value: number) => void; // Aceita 0.0 a 1.0
  };
}
