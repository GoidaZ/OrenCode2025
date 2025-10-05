<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Описание</th>
        <th>Дата истечения</th>
        <th class="w-full text-right">
          <NuxtLink to="/requests/list" class="btn btn-sm btn-secondary btn-outline w-24 mr-2" v-if="loggedIn">
            Заявки <Icon name="fa6-solid:list" class="icon-sm"/>
          </NuxtLink>
          <button class="btn btn-sm btn-accent btn-outline w-26" @click="createSecret">
            Добавить <Icon name="fa6-solid:plus" class="icon-sm"/>
          </button>
        </th>
      </tr>
      </thead>
      <tbody>
      <tr class="whitespace-nowrap" v-for="(secret, index) in filteredSecrets" :key="secret.id">
        <td>
          <code>{{ secret.id }}</code>
        </td>
        <td>
          {{ secret.description }}
        </td>
        <td>
          {{ formatDate(secret.expires_at) }}
        </td>
        <th class="w-full text-right">
          <div class="join">
            <button class="join-item btn btn-sm btn-primary btn-outline" @click="viewSecret(secret)">
              <Icon name="fa6-solid:eye" class="icon-sm"/>
            </button>
            <button class="join-item btn btn-sm btn-error btn-outline" @click="deleteSecret(secret)">
              <Icon name="fa6-solid:trash" class="icon-sm"/>
            </button>
          </div>
        </th>
      </tr>
      </tbody>
    </table>
    <div class="flex gap-2 mt-5">
      <button class="btn btn-primary" @click="addTestData">Добавить тестовые секреты</button>
    </div>
  </div>
  <div class="toast toast-end">
    <div role="alert" class="alert alert-soft" v-if="syncing">
      <span class="loading loading-spinner loading-md"></span>
      Синхронизация...
    </div>
  </div>
</template>

<script setup lang="ts">
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { ask } from '@tauri-apps/plugin-dialog';
import type { SecretRecord } from "~/composables/useVault";

const { secrets, addSecret, removeSecret } = await useVault()
const { search } = useNavbarSearch()
const { syncing, deleteSecret: deleteRemote, loggedIn } = await useAPI()

const filteredSecrets = computed(() => {
  const searchValue = search?.value.toLowerCase() || ''
  if (!searchValue) return secrets.value

  const keywords = searchValue.split(/\s+/).filter(k => k.length > 0)
  return secrets.value.filter(s => `${s.id} ${s.description}`.toLowerCase().includes(keywords.join(' ')))
})

function formatDate(date: Date | null | undefined) {
  if (date === null || date === undefined) return "никогда";
  const pad = (n: number) => n.toString().padStart(2, '0');

  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
}

async function deleteSecret(secret: Omit<SecretRecord, 'value' | 'nonce' | 'salt'>) {
  const confirmed = await ask(
      `Вы уверены, что хотите удалить секрет:\n"${secret.description}" (ID: ${secret.id})\nЭто действие нельзя отменить!`,
      { title: 'SecretManager', kind: 'warning', cancelLabel: 'Отменить', okLabel: 'Удалить' }
  );

  if (confirmed) {
    await removeSecret(secret.id);
    await deleteRemote(secret.id);
  }
}

async function viewSecret(secret: Omit<SecretRecord, 'value' | 'nonce' | 'salt'>) {
  const webview = new WebviewWindow(`secret-${secret.id}`, {
    url: `/secrets/${secret.id}`,
    title: secret.description,
    minWidth: 600,
    minHeight: 600,
    width: 600,
    height: 600,
  });

  await webview.once('tauri://error', function (e) {
    console.error(e);
  });
}

function createSecret() {
  const webview = new WebviewWindow(`new-secret`, {
    url: `/secrets/new`,
    title: "Создать новый секрет",
    minWidth: 600,
    minHeight: 600,
    width: 600,
    height: 800,
  });

  webview.once('tauri://error', function (e) {
    console.error(e);
  });
}

function addTestData() {
  addSecret("test-1", "Weather API Key", { token: "abcd1234efgh5678ijkl9012" }, null);
  addSecret("test-2", "Database Connection", { username: "admin", password: "P@ssw0rd", host: "localhost" }, null);
  addSecret("test-3", "JWT Signing Key", { token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" }, null);
  addSecret("test-4", "OAuth Client Secret", { token: "client-secret-8u29xndk23" }, null);
  addSecret("test-5", "SMTP Server", { username: "mailer", password: "mail$erverP@ss2024!" }, null);
  addSecret("test-6", "Slack Webhook", { token: "https://hooks.slack.com/services/T000/B000/XXXX" }, null);
  addSecret("test-7", "AWS Access Key", { token: "AKIAIOSFODNN7EXAMPLE" }, null);
  addSecret("test-8", "AWS Secret Key", { token: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY" }, null);
  addSecret("test-9", "AES Encryption Key", { token: "00112233445566778899aabbccddeeff" }, null);
  addSecret("test-10", "Redis Server", { username: "redis", password: "redisP@ss123!", host: "127.0.0.1" }, null);
  addSecret("test-11", "Google Maps API", { token: "AIzaSyD-EXAMPLE1234567890abcd" }, null);
  addSecret("test-12", "GitHub Token", { token: "ghp_16EXAMPLETOKEN1234567890" }, null);
  addSecret("test-13", "FTP Server", { username: "ftpuser", password: "ftpP@ss9876", host: "ftp.example.com" }, null);
  addSecret("test-14", "Stripe Secret Key", { token: "sk_test_4eC39HqLyjWDarjtT1zdp7dc" }, null);
  addSecret("test-15", "Telegram Bot", { token: "123456789:AAEXAMPLETOKENabcdef123456" }, null);
  addSecret("test-16", "Admin Account", { username: "admin", password: "Admin!234567" }, null);
  addSecret("test-17", "Yandex API", { token: "y0_abcdef1234567890" }, null);
  addSecret("test-18", "MongoDB Server", { username: "mongouser", password: "mongoP@ss2025", host: "127.0.0.1" }, null);
  addSecret("test-19", "Firebase Secret Key", { token: "AIzaSyEXAMPLEKEY1234567890" }, null);
  addSecret("test-20", "Test Service Token", { token: "test-token-0987654321" }, null);
}
</script>