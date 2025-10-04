<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Описание</th>
          <th>Значение</th>
          <th class="w-full text-right">
            <button class="btn btn-sm btn-accent btn-outline w-26">
              Добавить <Icon name="fa6-solid:plus" class="icon-sm" />
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
          <td>
            {{ secret.value }}
          </td>
          <th class="w-full text-right">
            <div class="join">
              <button class="join-item btn btn-sm btn-primary btn-outline">
                <Icon name="fa6-solid:eye" class="icon-xs" />
              </button>
              <button class="join-item btn btn-sm btn-error btn-outline">
                <Icon name="fa6-solid:trash" class="icon-xs" />
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
import { sendNotification } from "@tauri-apps/plugin-notification";

const secrets = [
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
  { id: "test-0", description: "Test 1", value: "test" },
];

const notify = () => {
  sendNotification({
    title: "SecretManager",
    body: "ГОЙДА ZZZ ZOV 🇷🇺🇷🇺",
  });
};
</script>
