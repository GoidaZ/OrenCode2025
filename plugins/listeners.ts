import { getCurrentWindow } from "@tauri-apps/api/window";
import { listen } from '@tauri-apps/api/event';

export default defineNuxtPlugin(async (app) => {
  if (getCurrentWindow().label !== 'main') return;

  const { refresh } = await useVault();
  const { reload } = await useSettings();
  const { authorize } = await useAPI();

  const unlisten1 = await listen('refresh-vault', async (event) => {
    await refresh();
  });

  const unlisten2 = await listen('reload-settings', async (event) => {
    await reload();
  });

  onBeforeUnmount(unlisten1)
  onBeforeUnmount(unlisten2)
})