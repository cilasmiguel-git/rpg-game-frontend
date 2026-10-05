<script setup lang="ts">
import {
  DialogRoot,
  DialogTrigger,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'radix-vue';

interface Props {
  open?: boolean;
  title: string;
  description?: string;
  frameStyle?: 'framed' | 'framed-golden' | 'framed-golden-2';
}

const props = withDefaults(defineProps<Props>(), {
  open: false,
  frameStyle: 'framed-golden',
});

const emit = defineEmits<{
  (e: 'update:open', val: boolean): void;
}>();
</script>

<template>
  <DialogRoot :open="open" @update:open="emit('update:open', $event)">
    <DialogTrigger as-child>
      <slot name="trigger" />
    </DialogTrigger>

    <DialogPortal>
      <!-- Backdrop escuro translúcido com efeito de névoa -->
      <DialogOverlay class="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm transition-all" />

      <!-- Conteúdo com moldura e textura nativa do RPGUI -->
      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 focus:outline-none"
      >
        <div class="rpgui-container" :class="frameStyle">
          <!-- Cabeçalho do Modal -->
          <div class="flex items-center justify-between pb-3 border-b border-black/30">
            <DialogTitle class="text-lg font-bold text-yellow-300 tracking-wider font-sans">
              {{ title }}
            </DialogTitle>
            <DialogClose class="rpgui-button text-xs !min-w-[32px] !h-[32px] flex items-center justify-center">
              <span>✕</span>
            </DialogClose>
          </div>

          <DialogDescription v-if="description" class="text-xs text-stone-300 mt-2 font-serif">
            {{ description }}
          </DialogDescription>

          <!-- Corpo do Modal -->
          <div class="py-4 text-stone-200">
            <slot />
          </div>

          <!-- Rodapé com Ações -->
          <div class="flex justify-end gap-3 pt-3 border-t border-black/30">
            <slot name="footer" />
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
