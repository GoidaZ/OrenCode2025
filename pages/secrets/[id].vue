<template>
  <div class="p-5">
    <h2 class="text-2xl font-bold">{{ key?.path }}</h2>
    <div class="divider my-2"></div>
    <table class="table" v-if="key">
      <thead>
        <tr>
          <th>Ключ</th>
          <th>Значение</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="([keyName, value], index) in Object.entries(key.data.data)"
          :key="index"
          class="whitespace-nowrap"
        >
          <td>
            <code>{{ keyName }}</code>
          </td>
          <td>
            <code>{{ value }}</code>
          </td>
          <!-- TODO: Добавить мб скрытие и кнопку копирования -->
        </tr>
      </tbody>
    </table>
  </div>
</template>
<script setup lang="ts">
import type { IKeyDetail } from "~/interfaces/Keys.interface";

const {
  data: key,
  error,
  refresh,
} = await useApiFetch<IKeyDetail>("/key/get", {
  params: {
    id: useRoute().params.id,
  },
});
</script>
