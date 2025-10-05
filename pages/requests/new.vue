<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
    <div class="card w-full max-w-lg shadow-xl bg-base-100 p-6 space-y-4">
      <h2 class="text-4xl font-bold text-center mb-2">🔐 SecretManager</h2>
      <h4 class="text-sm text-center">
        Создать новый запрос на секрет
      </h4>
      <form @submit.prevent="submitRequest">
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Ресурс</legend>
          <input
              type="text"
              v-model="resource"
              class="input input-bordered w-full"
              placeholder="Идентификатор ресурса"
              required
          />

          <legend class="fieldset-legend mt-2">Описание</legend>
          <input
              type="text"
              v-model="description"
              class="input input-bordered w-full"
              placeholder="Описание запроса"
              required
          />

          <legend class="fieldset-legend mt-2">Причина</legend>
          <textarea
              v-model="reason"
              class="textarea textarea-bordered w-full"
              placeholder="Причина запроса"
              required
          ></textarea>

          <legend class="fieldset-legend mt-2">Действителен до (необязательно)</legend>
          <input
              type="datetime-local"
              class="input w-full"
              v-model="validFor"
          />

          <div class="flex gap-2 mt-4">
            <button type="submit" class="btn btn-primary flex-1">Создать</button>
            <button type="button" class="btn btn-error flex-1" @click="getCurrentWindow().destroy()">Отмена</button>
          </div>
        </fieldset>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { emit } from '@tauri-apps/api/event';

const resource = ref('');
const description = ref('');
const reason = ref('');
const validFor = ref<string | null>(null);

async function submitRequest() {
  const input = {
    resource: resource.value,
    description: description.value,
    reason: reason.value,
    validFor: validFor.value ? new Date(validFor.value).toISOString() : undefined
  };

  await emit('create-request', input);
  await getCurrentWindow().destroy();
}

definePageMeta({
  layout: 'empty'
});
</script>
