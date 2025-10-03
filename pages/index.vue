<template>
  <div class="p-5">
    <button class="btn btn-primary" @click="notify">Тест уведомления</button>
  </div>
</template>

<script setup lang="ts">
import { sendNotification } from '@tauri-apps/plugin-notification';

const notify = () => {
  sendNotification({
    title: 'SecretManager',
    body: 'ГОЙДА ZZZ ZOV 🇷🇺🇷🇺',
  });
};
</script>