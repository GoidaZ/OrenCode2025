<template>
  <div class="p-5">
    <h2 class="text-2xl font-bold">Настройки</h2>
    <div class="divider my-2"></div>
    <fieldset class="fieldset text-sm pb-3">
      <legend class="fieldset-legend">URL сервера</legend>
      <input type="text" class="input" placeholder="https://127.0.0.1:8091" v-model="settings.apiBase" />
    </fieldset>
    <div class="form-control">
      <label class="label cursor-pointer input-md">
        <input type="checkbox" class="checkbox checkbox-primary checkbox-md" v-model="autostart" />
        <span class="text-white">Автозагрузка</span>
      </label>
    </div>
    <div class="mt-2">
      <button class="btn btn-error" @click="deleteExisting">Удалить кошелек</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
import { ask } from "@tauri-apps/plugin-dialog";

const { reset } = await useVault();
const { settings } = await useSettings();

const autostart = ref(false);

onMounted(async () => {
  autostart.value = await isEnabled();
});

async function deleteExisting() {
  const answer = await ask(
      'Вы уверены, что хотите удалить свой кошелек?\nЭто действие нельзя отменить.',
      { title: 'SecretManager', kind: 'warning', cancelLabel: 'Отменить', okLabel: 'Удалить' }
  );

  if (answer) {
    await reset();
    await navigateTo('/');
  }
}

watch(autostart, async (value) => {
  if (value) {
    await enable();
  } else {
    await disable();
  }
});
</script>