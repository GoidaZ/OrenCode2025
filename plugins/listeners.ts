import { getCurrentWindow } from "@tauri-apps/api/window";
import { message } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';

export default defineNuxtPlugin(async (app) => {
  if (getCurrentWindow().label !== 'main') return;

  const { refresh } = await useVault();
  const { reload } = await useSettings();
  const { authorize } = await useAuth();

  const unlisten1 = await listen('refresh-vault', async (event) => {
    await refresh();
  });

  const unlisten2 = await listen('reload-settings', async (event) => {
    await reload();
  });

  const unlisten3 = await listen('authorize', async (event) => {
    try {
      await authorize((event.payload as any).code as string);
    } catch (err: any) {
      console.log(err);
      await message(err.message || 'Произошла неизвестная ошибка во время авторизации', { title: 'SecretManager', kind: 'error' });
      return
    }
  });

  onBeforeUnmount(unlisten1)
  onBeforeUnmount(unlisten2)
  onBeforeUnmount(unlisten3)
})