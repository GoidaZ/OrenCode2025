<template>
  <div class="px-4 pt-2 pb-4">
    <table class="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Описание</th>
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
            <code>{{ secret.key }}</code>
          </td>
          <td>Описание</td>
          <th class="w-full text-right">
            <template v-if="secret.status === 'ACCEPT'">
              <router-link
                :to="`/secrets/${secret.key}`"
                class="flex justify-end"
              >
                <Icon
                  name="fa6-solid:arrow-right"
                  class="icon-sm text-primary"
                />
              </router-link>
            </template>

            <template v-else-if="secret.status === 'PENDING'">
              <div class="badge badge-warning">Ожидание</div>
            </template>

            <template v-else>
              <div class="badge badge-error">Доступ запрещён</div>
            </template>
          </th>
        </tr>
      </tbody>
    </table>
    <!-- <button class="btn btn-primary" @click="notify">Тест уведомления</button> -->
  </div>
</template>

<script setup lang="ts">
import { sendNotification } from "@tauri-apps/plugin-notification";
import type { IKey } from "~/interfaces/Keys.interface";

const secrets: IKey[] = [
  {
    id: 1,
    key: "test",
    creator: "058f1f46-8a10-4887-a185-29938ab8c3cb",
    status: "ACCEPT",
    created_at: "2025-10-04T00:20:00.603632+05:00",
  },
  {
    id: 2,
    key: "test2",
    creator: "058f1f46-8a10-4887-a185-29938ab8c3cb",
    status: "PENDING",
    created_at: "2025-10-04T00:20:00.603632+05:00",
  },
  {
    id: 3,
    key: "test3",
    creator: "058f1f46-8a10-4887-a185-29938ab8c3cb",
    status: "REJECT",
    created_at: "2025-10-04T00:20:00.603632+05:00",
  },
];

const notify = () => {
  sendNotification({
    title: "SecretManager",
    body: "ГОЙДА ZZZ ZOV 🇷🇺🇷🇺",
  });
};
</script>
