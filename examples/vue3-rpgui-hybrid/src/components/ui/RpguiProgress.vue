<script setup lang="ts">
import { ref, onMounted, watch, nextTick } from 'vue';
import { ProgressRoot, type ProgressRootProps } from 'radix-vue';

interface Props extends /* @vue-ignore */ ProgressRootProps {
  modelValue?: number; // 0 a 100
  color?: 'red' | 'blue' | 'green' | 'golden';
  label?: string;
  showText?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: 0,
  color: 'red',
  showText: true,
});

const progressContainerRef = ref<HTMLElement | null>(null);

// Função segura para acionar o motor de animação do RPGUI
function updateRpguiProgress(val: number) {
  if (!progressContainerRef.value) return;

  // Normaliza o valor de 0 a 1.0 exigido pela função nativa do RPGUI
  const normalized = Math.max(0, Math.min(100, val)) / 100;

  if (window.RPGUI?.set_progress) {
    window.RPGUI.set_progress(progressContainerRef.value, normalized);
  } else {
    // Fallback caso o script JS do RPGUI ainda esteja em carregamento
    const track = progressContainerRef.value.querySelector('.rpgui-progress-fill') as HTMLElement;
    if (track) {
      track.style.width = `${normalized * 100}%`;
    }
  }
}

// Sincronização inicial com o Ciclo de Vida do Vue
onMounted(async () => {
  await nextTick();
  updateRpguiProgress(props.modelValue);
});

// Reatividade: Sempre que a prop do Vue mudar, atualiza o sprite nativo do RPGUI
watch(
  () => props.modelValue,
  (newVal) => {
    updateRpguiProgress(newVal);
  }
);
</script>

<template>
  <!-- 
    ProgressRoot (Shadcn/Radix): Fornece os atributos WAI-ARIA e controle semântico
    Classes RPGUI: Herdam as texturas e o estilo visual medieval em pixel-art
  -->
  <ProgressRoot
    :model-value="modelValue"
    :max="100"
    class="relative inline-block w-full select-none"
  >
    <!-- Contentor nativo que o RPGUI reconhece e estiliza -->
    <div
      ref="progressContainerRef"
      class="rpgui-progress"
      :class="color"
      data-rpgui="progress"
    >
      <div class="rpgui-progress-track">
        <div class="rpgui-progress-fill"></div>
      </div>
      <div v-if="showText || label" class="rpgui-progress-left-edge"></div>
      <div v-if="showText || label" class="rpgui-progress-right-edge"></div>
    </div>

    <!-- Label customizada em tipografia RPG sobreposta à barra -->
    <div
      v-if="showText || label"
      class="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-white drop-shadow-[0_2px_2px_rgba(0,0,0,1)] uppercase tracking-wider"
    >
      <span v-if="label">{{ label }}: </span>
      <span>{{ Math.round(modelValue) }}%</span>
    </div>
  </ProgressRoot>
</template>

<style scoped>
.rpgui-progress {
  width: 100% !important;
  margin: 0 !important;
}
</style>
