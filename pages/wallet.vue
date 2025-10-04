<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
      <tr>
        <th>Описание</th>
        <th>Дата истечения</th>
        <th class="w-full text-right">
          <button class="btn btn-sm btn-accent btn-outline w-26">
            Добавить <Icon name="fa6-solid:plus" class="icon-sm"/>
          </button>
        </th>
      </tr>
      </thead>
      <tbody>
      <tr class="whitespace-nowrap" v-for="(secret, index) in secrets">
        <td>
          {{ secret.description }}
        </td>
        <td>
          {{ secret.expires_at == null ? "никогда" : secret.expires_at.toLocaleString() }}
        </td>
        <th class="w-full text-right">
          <div class="join">
            <button class="join-item btn btn-sm btn-primary btn-outline" @click="viewSecret(secret)">
              <Icon name="fa6-solid:eye" class="icon-xs"/>
            </button>
            <button class="join-item btn btn-sm btn-error btn-outline" @click="deleteSecret(secret)">
              <Icon name="fa6-solid:trash" class="icon-xs"/>
            </button>
          </div>
        </th>
      </tr>
      </tbody>
    </table>
    <div class="flex gap-2">
      <button class="btn btn-primary" @click="notify">Тест уведомления</button>
      <button class="btn btn-primary" @click="addTestData">Добавить тестовые секреты</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { sendNotification } from '@tauri-apps/plugin-notification';
import { ask } from '@tauri-apps/plugin-dialog';
import type { SecretRecord } from "~/composables/useVault";

const { secrets, addSecret, removeSecret } = await useVault();

function notify() {
  sendNotification({
    title: 'SecretManager',
    body: 'ГОЙДА ZZZ ZOV 🇷🇺🇷🇺',
  });
}

async function deleteSecret(secret: Omit<SecretRecord, 'value' | 'nonce' | 'salt'>) {
  const confirmed = await ask(
      `Вы уверены, что хотите удалить секрет:\n"${secret.description}" (ID: ${secret.id})\nЭто действие нельзя отменить!`,
      { title: 'SecretManager', kind: 'warning', cancelLabel: 'Отменить', okLabel: 'Удалить' }
  );

  if (confirmed) {
    await removeSecret(secret.id);
  }
}

function viewSecret(secret: Omit<SecretRecord, 'value' | 'nonce' | 'salt'>) {
  const webview = new WebviewWindow(`secret-${secret.id}`, {
    url: `/secrets/${secret.id}`,
    title: secret.description,
    width: 500,
    height: 400
  });

  webview.once('tauri://error', function (e) {
    console.error(e);
  });
}

function addTestData() {
  addSecret("test-1", "Weather API Key", "abcd1234efgh5678ijkl9012", null);
  addSecret("test-2", "Database Connection String", "Server=localhost;Database=testdb;User Id=admin;Password=P@ssw0rd;", null);
  addSecret("test-3", "JWT Signing Key", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9", null);
  addSecret("test-4", "OAuth Client Secret", "client-secret-8u29xndk23", null);
  addSecret("test-5", "SMTP Server Password", "mail$erverP@ss2024!", null);
  addSecret("test-6", "Slack Webhook URL", "https://hooks.slack.com/services/T000/B000/XXXX", null);
  addSecret("test-7", "AWS Access Key", "AKIAIOSFODNN7EXAMPLE", null);
  addSecret("test-8", "AWS Secret Key", "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY", null);
  addSecret("test-9", "AES Encryption Key", "00112233445566778899aabbccddeeff", null);
  addSecret("test-10", "Redis Password", "redisP@ss123!", null);
  addSecret("test-11", "Google Maps API Key", "AIzaSyD-EXAMPLE1234567890abcd", null);
  addSecret("test-12", "GitHub Token", "ghp_16EXAMPLETOKEN1234567890", null);
  addSecret("test-13", "FTP Password", "ftpP@ss9876", null);
  addSecret("test-14", "Stripe Secret Key", "sk_test_4eC39HqLyjWDarjtT1zdp7dc", null);
  addSecret("test-15", "Telegram Bot Token", "123456789:AAEXAMPLETOKENabcdef123456", null);
  addSecret("test-16", "Admin Password", "Admin!234567", null);
  addSecret("test-17", "Yandex API Key", "y0_abcdef1234567890", null);
  addSecret("test-18", "MongoDB Password", "mongoP@ss2025", null);
  addSecret("test-19", "Firebase Secret Key", "AIzaSyEXAMPLEKEY1234567890", null);
  addSecret("test-20", "Test Service Token", "test-token-0987654321", null);
}
</script>