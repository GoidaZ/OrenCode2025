<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <div class="card w-full max-w-md shadow-xl bg-base-100 p-6">
      <h2 class="text-4xl font-bold text-center mb-4">🔐 SecretManager</h2>
      <div class="space-y-4" v-if="!showSecret">
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Введите мастер-пароль:</legend>
          <div class="join w-full">
            <input :type="showPassword ? 'text' : 'password'"
                   class="input input-bordered w-full join-item"
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
        <fieldset class="fieldset mb-0">
          <button class="btn btn-primary w-full" @click="checkPassword">Просмотреть значение секрета</button>
        </fieldset>
      </div>
      <div class="space-y-4" v-else>
        <fieldset class="fieldset text-sm">
          <legend class="fieldset-legend">Значение секрета:</legend>
          <div class="join w-full">
            <input :type="showPassword ? 'text' : 'password'"
                   class="input input-bordered join-item"
                   placeholder="12345"
                   v-model="secret"
                   readonly />
            <button
                type="button"
                class="btn btn-soft join-item"
                @click="togglePassword"
            >
              <Icon :name="showPassword ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-md" />
            </button>
            <button
                type="button"
                class="btn btn-soft btn-primary join-item"
                @click="copySecret"
            >
              <Icon name="fa6-solid:copy" class="icon-md" />
            </button>
          </div>
        </fieldset>

        <p class="text-sm text-gray-500">
          Окно закроется и буфер обмена будет очищен автоматически через {{ secondsLeft }} секунд.
        </p>

        <button class="btn btn-outline w-full" @click="cleanup">
          Закрыть сейчас
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { message } from '@tauri-apps/plugin-dialog';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { writeText, clear } from '@tauri-apps/plugin-clipboard-manager';

const { verifyPassword, getSecret } = await useVault();
const route = useRoute();

const secret = ref<string | null>(null);
const password = ref('');
const showPassword = ref(false);
const showSecret = ref(false);
const secondsLeft = ref(30);
let countdownTimer: number | null = null;

function togglePassword() {
  showPassword.value = !showPassword.value;
}

async function checkPassword() {
  if (!password.value) {
    await message('Вы не ввели пароль', { title: 'SecretManager', kind: 'error' });
    return;
  }

  const result = await verifyPassword(password.value);

  if (!result) {
    await message('Неверный пароль', { title: 'SecretManager', kind: 'error' });
    return;
  }

  const id = route.params.id as string;
  secret.value = await getSecret(id);
  showSecret.value = true;

  secondsLeft.value = 30;
  countdownTimer = window.setInterval(async () => {
    secondsLeft.value--;
    if (secondsLeft.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      await cleanup();
    }
  }, 1000);
}

async function copySecret() {
  await writeText(secret.value || '');
}

async function cleanup() {
  await clear();
  await getCurrentWindow().destroy();
}

onBeforeUnmount(() => {
  if (countdownTimer) clearInterval(countdownTimer);
});

getCurrentWindow().onCloseRequested(async (event) => {
  event.preventDefault();
  await cleanup();
});

definePageMeta({
  layout: 'empty'
});
</script>