<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Ресурс</th>
        <th>Описание</th>
        <th>Причина</th>
        <th>Статус</th>
        <th class="w-full text-right">
          <NuxtLink to="/wallet" class="btn btn-sm btn-secondary btn-outline w-26 mr-2">
            Кошелек <Icon name="fa6-solid:wallet" class="icon-sm"/>
          </NuxtLink>
          <button class="btn btn-sm btn-accent btn-outline w-24" @click="createSecret">
            Создать <Icon name="fa6-solid:plus" class="icon-sm"/>
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
          <code>{{ secret.resource }}</code>
        </td>
        <td>
          {{ secret.description }}
        </td>
        <td>
          {{ secret.reason }}
        </td>
        <td>
          {{ formatStatus(secret.status) }}
        </td>
        <th class="w-full text-right">

        </th>
      </tr>
      </tbody>
    </table>
  </div>
  <div v-if="loading">
    <span class="loading loading-spinner loading-md"></span>
    Загрузка заявок...
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
import { sendNotification } from '@tauri-apps/plugin-notification';
import {ask, message} from '@tauri-apps/plugin-dialog';
import type { SecretRecord } from "~/composables/useVault";
import type {RequestInfo} from "~/composables/useAPI";
import {listen} from "@tauri-apps/api/event";

const { search } = useNavbarSearch()
const { syncing, loggedIn, listRequests, createRequest } = await useAPI()

const loading = ref(true);
const secrets = ref<RequestInfo[]>([]);
let refreshTimer: number | null = null;

const filteredSecrets = computed(() => {
  const searchValue = search?.value.toLowerCase() || ''
  if (!searchValue) return secrets.value

  const keywords = searchValue.split(/\s+/).filter(k => k.length > 0)
  return secrets.value.filter(s => `${s.id} ${s.description}`.toLowerCase().includes(keywords.join(' ')))
})

async function refreshRequests() {
  secrets.value = await listRequests();
  loading.value = false;
}

onMounted(async () => {
  await refreshRequests();
  refreshTimer = window.setInterval(refreshRequests, 5000);
});

const unlisten = await listen('create-request', async (event) => {
  const result = await createRequest(event.payload);

  if (!result) {
    await message('Не удалось создать запрос', { title: 'SecretManager', kind: 'error' });
    return;
  }

  await refreshRequests();
});

onBeforeUnmount(async () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }

  await unlisten();
});

watch(loggedIn, (newValue) => {
  if (!newValue) navigateTo('/wallet')
})

function formatStatus(status: string) {
  if (status === 'PENDING') return "На рассмотрении";
  if (status === 'ACCEPT') return "Принята";
  if (status === 'REJECT') return "Отклонена";
  return status;
}

function createSecret() {
  const webview = new WebviewWindow(`new-request`, {
    url: `/requests/new`,
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
</script>