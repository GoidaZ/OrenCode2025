<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200 px-4">
    <div class="card w-full max-w-lg shadow-xl bg-base-100 p-6 space-y-4">
      <h2 class="text-4xl font-bold text-center mb-2">🔐 SecretManager</h2>
      <h4 class="text-sm text-center">
        Создать новый секрет
      </h4>
      <form @submit.prevent="submitSecret">
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Мастер-пароль</legend>
          <div class="join w-full">
            <input :type="showPassword ? 'text' : 'password'"
                   class="input input-bordered w-full join-item"
                   placeholder="12345"
                   v-model="password"
                   required />
            <button
                type="button"
                class="btn btn-soft join-item"
                @click="togglePassword"
            >
              <Icon :name="showPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-md" />
            </button>
          </div>
          <div>
            <legend class="fieldset-legend">ID</legend>
            <input
                type="text"
                v-model="id"
                class="input input-bordered w-full"
                placeholder="Уникальный идентификатор"
                required
            />
          </div>
          <div>
            <legend class="fieldset-legend">Описание</legend>
            <input
                type="text"
                v-model="description"
                class="input input-bordered w-full"
                placeholder="Описание секрета"
                required
            />
          </div>
          <div>
            <legend class="fieldset-legend">Значение секрета</legend>
            <div class="flex flex-col gap-2">
              <div v-for="(field, index) in fields" :key="index" class="flex gap-2">
                <input
                    type="text"
                    v-model="field.key"
                    placeholder="Ключ"
                    class="input input-bordered flex-1"
                    required
                />
                <input
                    type="text"
                    v-model="field.value"
                    placeholder="Значение"
                    class="input input-bordered flex-1"
                    required
                />
                <button
                    type="button"
                    class="btn btn-error btn-outline"
                    @click="removeField(index)"
                    :disabled="fields.length === 1"
                >
                  <Icon name="fa6-solid:trash" class="icon-sm"/>
                </button>
              </div>
              <button
                  type="button"
                  class="btn btn-soft btn-sm"
                  @click="addField"
              >
                Добавить поле <Icon name="fa6-solid:plus" class="icon-sm"/>
              </button>
            </div>
          </div>
          <div>
            <label class="label">Дата истечения (необязательно)</label>
            <input
                type="datetime-local"
                class="input w-full"
                v-model="expiresAt"
            />
          </div>
          <div class="flex gap-2 mt-2">
            <button type="submit" class="btn btn-primary flex-1">Создать</button>
            <button type="button" class="btn btn-error flex-1" @click="getCurrentWindow().destroy()">Отмена</button>
          </div>
        </fieldset>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from "@tauri-apps/plugin-dialog";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from '@tauri-apps/api/event';

const { addSecret, unlock } = await useVault()
const { createSecret } = await useAPI()

const id = ref('')
const description = ref('')
const expiresAt = ref<string | null>(null)
const password = ref('');
const showPassword = ref(false);

function togglePassword() {
  showPassword.value = !showPassword.value;
}

// Secret value as dynamic Record<string, string>
const fields = reactive<{ key: string; value: string }[]>([{ key: '', value: '' }])

function addField() {
  fields.push({ key: '', value: '' })
}

function removeField(index: number) {
  if (fields.length > 1) fields.splice(index, 1)
}

async function submitSecret() {
  const secretValue: Record<string, string> = {}
  for (const field of fields) {
    secretValue[field.key] = field.value
  }

  const result = await unlock(password.value);

  if (!result) {
    await message('Неверный пароль', { title: 'SecretManager', kind: 'error' });
    return;
  }

  const expiresDate = expiresAt.value ? new Date(expiresAt.value) : null

  try {
    await addSecret(id.value, description.value, secretValue, expiresDate)
  } catch {
    await message('Секрет с таким ID уже существует', { title: 'SecretManager', kind: 'error' });
    return;
  }

  const expiresDateStr = expiresAt.value ? new Date(expiresAt.value).toISOString() : null
  await createSecret(id.value, { data: secretValue, description: description.value, expireAt: expiresDateStr });

  await emit("refresh-vault", {});
  await getCurrentWindow().destroy();
}

definePageMeta({
  layout: 'empty'
});
</script>
