<template>
  <div class="p-5">
    <h2 class="text-2xl font-bold">Настройки</h2>
    <div class="divider my-2"></div>
    <fieldset class="fieldset text-sm pb-3">
      <legend class="fieldset-legend">URL сервера</legend>
      <input type="text" class="input" placeholder="https://127.0.0.1:5859" v-model="settings.api_base" />
    </fieldset>
    <div class="form-control">
      <label class="label cursor-pointer input-md">
        <input type="checkbox" class="checkbox checkbox-primary checkbox-md" v-model="autostart" />
        <span class="text-white">Автозагрузка</span>
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
import { enable, isEnabled, disable } from '@tauri-apps/plugin-autostart';
const { settings } = await useSettings();

const autostart = ref(false);

onMounted(async () => {
  autostart.value = await isEnabled();
});

watch(autostart, async (value) => {
  if (value) {
    await enable();
  } else {
    await disable();
  }
});
</script>