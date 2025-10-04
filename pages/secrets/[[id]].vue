<template>
  <div class="flex min-h-screen items-center justify-center bg-base-200">
    <div class="card w-full max-w-lg shadow-xl bg-base-100 p-6">
      <h2 class="text-4xl font-bold text-center mb-4">🔐 SecretManager</h2>
      <h4 class="text-sm text-center">
        Просмотр значения {{ description }} (<code>{{ route.params.id }}</code>)
      </h4>
      <div class="space-y-4" v-if="!secret">
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
        <fieldset class="flex gap-2 mb-0">
          <button class="btn flex-1 btn-primary" @click="checkPassword">Просмотреть значение секрета</button>
          <button class="btn flex btn-error" @click="getCurrentWindow().destroy()">Отмена</button>
        </fieldset>
      </div>
      <div class="space-y-4" v-else>
        <fieldset class="fieldset text-sm">
          <div class="overflow-x-auto">
            <table class="table w-full">
              <thead>
              <tr>
                <th>Ключ</th>
                <th>Значение</th>
              </tr>
              </thead>
              <tbody>
              <tr v-for="(value, key) in secret" :key="key">
                <td>{{ key }}</td>
                <td class="join w-full">
                  <input :type="showSecret[key] ? 'text' : 'password'"
                         class="input input-bordered w-full join-item"
                         :value="value"
                         readonly />
                  <button class="btn btn-soft join-item" @click="toggleRow(key)">
                    <Icon :name="showSecret[key] ? 'fa6-solid:eye-slash' : 'fa6-solid:eye'" class="icon-sm" />
                  </button>
                  <button class="btn btn-soft btn-primary join-item" @click="copySingle(value)">
                    <Icon name="fa6-solid:copy" class="icon-sm" />
                  </button>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </fieldset>

        <p class="text-sm text-gray-500">
          Окно будет закрыто и буфер обмена будет очищен автоматически через {{ secondsLeft }} секунд.
        </p>

        <button class="btn btn-soft btn-error w-full" @click="cleanup">
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

const description = ref(await getCurrentWindow().title());
const secret = ref<Record<string, string> | null>(null);
const password = ref('');
const showPassword = ref(false);
const secondsLeft = ref(30);
const showSecret = ref<Record<string, boolean>>({});
let countdownTimer: number | null = null;

function togglePassword() {
  showPassword.value = !showPassword.value;
}

function toggleRow(key: string) {
  showSecret.value[key] = !showSecret.value[key];
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

  secondsLeft.value = 30;
  countdownTimer = window.setInterval(async () => {
    secondsLeft.value--;
    if (secondsLeft.value <= 0) {
      if (countdownTimer) clearInterval(countdownTimer);
      await cleanup();
    }
  }, 1000);
}

async function copySingle(value: string) {
  await writeText(value);
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