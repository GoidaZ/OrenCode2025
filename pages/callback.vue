<template>
  <div class="flex flex-col h-screen">
    <div class="flex-grow flex justify-center items-center relative gap-2">
      <template>
        <span class="loading loading-spinner loading-xl"></span>
        Загрузка
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from '@tauri-apps/api/event';

const route = useRoute();

onMounted(async () => {
  const code = route.query.code as string;
  await emit("authorize", { "code": code });
  await getCurrentWindow().close();
});

definePageMeta({
  layout: 'empty'
})
</script>