# Componentes Híbridos Vue 3 (Shadcn Vue + RPGUI)

Esta pasta contém o pacote pronto com os componentes híbridos solicitados, combinando a infraestrutura de acessibilidade do **Shadcn Vue (Radix Vue)** com as texturas medievais e sprites do **RPGUI (`rpgui.css` / `rpgui.js`)**.

## 📁 Estrutura dos Ficheiros

```
examples/vue3-rpgui-hybrid/
├── README.md
└── src/
    ├── types/
    │   └── rpgui.d.ts                 # Tipagem TypeScript do window.RPGUI
    ├── components/
    │   └── ui/
    │       ├── RpguiProgress.vue       # Progress Bar (Radix ProgressRoot + RPGUI Sprite)
    │       └── RpguiDialog.vue         # Modal Dialog (Radix Dialog + Moldura Framed RPGUI)
    └── views/
        └── BattleHudDemo.vue           # Demonstração reativa prática
```

## 🚀 Como Integrar no seu Projeto Vue 3 (Vite + TypeScript)

### 1. Dependências do Shadcn Vue (Radix)
No seu projeto Vue 3, garanta que tem instalado o `radix-vue`:
```bash
npm install radix-vue
```

### 2. Inclusão dos Assets do RPGUI no `index.html`
Certifique-se de que os arquivos do RPGUI estão referenciados no seu `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ronenness/RPGUI/dist/rpgui.min.css">
<script src="https://cdn.jsdelivr.net/gh/ronenness/RPGUI/dist/rpgui.min.js"></script>
```

### 3. Utilização dos Componentes
Copie a pasta `components/ui/` e `types/` diretamente para o seu projeto `src/` e use:
```vue
<script setup lang="ts">
import { ref } from 'vue';
import RpguiProgress from '@/components/ui/RpguiProgress.vue';

const hp = ref(85);
</script>

<template>
  <RpguiProgress v-model="hp" color="red" label="Vida (HP)" />
</template>
```
