<script setup lang="ts">
import { ref } from 'vue';
import RpguiProgress from '../components/ui/RpguiProgress.vue';
import RpguiDialog from '../components/ui/RpguiDialog.vue';

const heroHealth = ref(78);
const heroMana = ref(60);
const isSecretModalOpen = ref(false);

function takeDamage() {
  heroHealth.value = Math.max(0, heroHealth.value - 15);
}

function healHero() {
  heroHealth.value = Math.min(100, heroHealth.value + 20);
}

function spendMana() {
  heroMana.value = Math.max(0, heroMana.value - 10);
}

function restoreMana() {
  heroMana.value = Math.min(100, heroMana.value + 15);
}
</script>

<template>
  <div class="rpgui-content p-8 min-h-screen bg-[#110f0c] text-white flex flex-col gap-8 max-w-xl mx-auto">
    <!-- Painel de Status do Aventureiro com moldura RPGUI -->
    <div class="rpgui-container framed flex flex-col gap-4">
      <h2 class="text-xl font-bold text-yellow-400">⚔️ Guerreiro Eldrin (Nível 5)</h2>

      <!-- Componente Híbrido: Vida (HP) com cor 'red' -->
      <div class="space-y-1">
        <span class="text-xs font-bold text-stone-300">Pontos de Vida</span>
        <RpguiProgress
          v-model="heroHealth"
          color="red"
          label="HP"
        />
      </div>

      <!-- Componente Híbrido: Mana (MP) com cor 'blue' -->
      <div class="space-y-1">
        <span class="text-xs font-bold text-stone-300">Mana Arcana</span>
        <RpguiProgress
          v-model="heroMana"
          color="blue"
          label="MP"
        />
      </div>

      <!-- Controles de Ação com Botões RPGUI -->
      <div class="grid grid-cols-2 gap-3 mt-2">
        <button type="button" class="rpgui-button" @click="takeDamage">
          <p>Dano (-15)</p>
        </button>

        <button type="button" class="rpgui-button" @click="healHero">
          <p>Curar (+20)</p>
        </button>

        <button type="button" class="rpgui-button" @click="spendMana">
          <p>Gastar MP (-10)</p>
        </button>

        <button type="button" class="rpgui-button" @click="restoreMana">
          <p>Elixir (+15)</p>
        </button>
      </div>
    </div>

    <!-- Modal Híbrido com Radix Dialog + Estilo RPGUI -->
    <RpguiDialog
      v-model:open="isSecretModalOpen"
      title="🗝️ Grimório Secreto do Mestre"
      description="Segredos arcanos protegidos por runas ancestrais."
      frame-style="framed-golden"
    >
      <template #trigger>
        <button type="button" class="rpgui-button golden w-full">
          <p>Abrir Grimório Secreto</p>
        </button>
      </template>

      <div class="space-y-3 text-sm font-serif">
        <p>
          O dragão ancião é vulnerável a dano de gelo. A chave da masmorra está escondida sob o altar leste.
        </p>
        <div class="rpgui-container framed-grey p-3">
          <p class="text-xs text-yellow-200">Recompensa: 500 Moedas de Ouro e 1x Anel de Proteção +2</p>
        </div>
      </div>

      <template #footer>
        <button
          type="button"
          class="rpgui-button"
          @click="isSecretModalOpen = false"
        >
          <p>Fechar Grimório</p>
        </button>
      </template>
    </RpguiDialog>
  </div>
</template>
