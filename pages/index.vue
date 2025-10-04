<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <div class="card w-full max-w-sm shadow-xl bg-base-100 p-6">
      <h2 class="text-4xl font-bold text-center mb-4">🔐 SecretManager</h2>
      <div class="space-y-4" v-if="!isNewVault">
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Введите мастер-пароль:</legend>
          <div class="join w-full">
            <input :type="showPassword ? 'text' : 'password'"
                   class="input input-bordered join-item"
                   placeholder="12345"
                   v-model="password" />
            <button
                type="button"
                class="btn btn-soft join-item"
                @click="togglePassword"
            >
              <Icon :name="showPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-md" />
            </button>
          </div>
        </fieldset>
        <div class="flex gap-2">
          <button class="btn btn-primary flex-1" @click="loadExisting">Открыть</button>
          <button class="btn btn-error flex-1" @click="deleteExisting">Удалить</button>
        </div>
      </div>
      <div class="space-y-4" v-else>
        <fieldset class="fieldset text-sm mb-0">
          <legend class="fieldset-legend">Придумайте новый мастер-пароль:</legend>
          <div class="join w-full">
            <input :type="showPassword ? 'text' : 'password'"
                   class="input input-bordered join-item"
                   placeholder="12345"
                   v-model="password" />
            <button
                type="button"
                class="btn btn-soft join-item"
                @click="togglePassword"
            >
              <Icon :name="showPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-md" />
            </button>
          </div>
        </fieldset>
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Подтвердите новый мастер-пароль:</legend>
          <div class="join w-full">
            <input :type="showPasswordConfirm ? 'text' : 'password'"
                   class="input input-bordered join-item"
                   placeholder="12345"
                   v-model="passwordConfirm" />
            <button
                type="button"
                class="btn btn-soft join-item"
                @click="togglePasswordConfirm"
            >
              <Icon :name="showPasswordConfirm ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-md" />
            </button>
          </div>
        </fieldset>
        <fieldset class="fieldset mb-0">
          <button class="btn btn-primary w-full" @click="loadNew">Создать кошелек</button>
        </fieldset>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ask, message } from '@tauri-apps/plugin-dialog';

const { unlock, reset, exists } = await useVault();
const isNewVault = ref(!exists());

const password = ref('')
const passwordConfirm = ref('')

const showPassword = ref(false)
const showPasswordConfirm = ref(false)

function togglePassword() {
  showPassword.value = !showPassword.value
}

function togglePasswordConfirm() {
  showPasswordConfirm.value = !showPasswordConfirm.value
}

async function deleteExisting() {
  const answer = await ask(
    'Вы уверены, что хотите удалить свой кошелек?\nЭто действие нельзя отменить.',
    { title: 'SecretManager', kind: 'warning', cancelLabel: 'Отменить', okLabel: 'Удалить' }
  );

  if (answer) {
    await reset();
    isNewVault.value = true;
  }
}

async function loadExisting() {
  if (!password.value) {
    await message('Вы не ввели пароль', { title: 'SecretManager', kind: 'error' });
    return
  }

  const result = await unlock(password.value);

  if (!result) {
    await message('Неверный пароль', { title: 'SecretManager', kind: 'error' });
    return
  }

  await navigateTo('/wallet');
}

async function loadNew() {
  if (password.value.length < 8) {
    await message('Минимальная длина пароля 8 символов', { title: 'SecretManager', kind: 'error' });
    return
  }

  if (password.value != passwordConfirm.value) {
    await message('Пароли не совпадают', { title: 'SecretManager', kind: 'error' });
    return
  }

  await unlock(password.value);
  await navigateTo('/wallet');
}

definePageMeta({
  layout: 'empty'
})
</script>
