<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
      <tr>
        <th>ID</th>
        <th>Описание</th>
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
          <code>{{ secret.id }}</code>
        </td>
        <td>
          {{ secret.description }}
        </td>
        <th class="w-full text-right">
          <div class="join">
            <button class="join-item btn btn-sm btn-primary btn-outline">
              <Icon name="fa6-solid:eye" class="icon-xs"/>
            </button>
            <button class="join-item btn btn-sm btn-error btn-outline">
              <Icon name="fa6-solid:trash" class="icon-xs"/>
            </button>
          </div>
        </th>
      </tr>
      </tbody>
    </table>
    <button class="btn btn-primary" @click="notify">Тест уведомления</button>
  </div>
</template>

<script setup lang="ts">
import { sendNotification } from '@tauri-apps/plugin-notification';

const secrets = [
  {"id": "test-0", "description": "Test 1"},
  {"id": "test-1", "description": "Test 2"},
  {"id": "test-2", "description": "Test 3"},
  {"id": "test-3", "description": "Test 4"},
  {"id": "test-4", "description": "Test 5"},
  {"id": "test-5", "description": "Test 6"},
  {"id": "test-6", "description": "Test 7"},
  {"id": "test-7", "description": "Test 8"},
  {"id": "test-8", "description": "Test 9"},
  {"id": "test-9", "description": "Test 10"},
  {"id": "test-10", "description": "Test 11"},
  {"id": "test-11", "description": "Test 12"},
  {"id": "test-12", "description": "Test 13"},
  {"id": "test-13", "description": "Test 14"},
  {"id": "test-14", "description": "Test 15"},
  {"id": "test-15", "description": "Test 16"}
]

const notify = () => {
  sendNotification({
    title: 'SecretManager',
    body: 'ГОЙДА ZZZ ZOV 🇷🇺🇷🇺',
  });
};
</script>