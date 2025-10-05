import { load, Store } from '@tauri-apps/plugin-store';
import { reactive, watch } from 'vue';

type Settings = {
  apiBase: string;
  salt?: string;
  verifier?: string;
  user?: string;
  [key: string]: any;
};

let storeRef: Store;

export async function useSettings() {
  if (!storeRef) {
    storeRef = await load('settings.json');
  }

  const entries = await storeRef.entries();
  const defaultSettings: Settings = {
    apiBase: 'http://localhost:8091'
  };

  const plainSettings = Object.fromEntries(entries) as Record<string, unknown>;

  const settings = reactive<Settings>({
    ...defaultSettings,
    ...plainSettings,
  });

  watch(
    settings,
    async (newVal) => {
      for (const [key, val] of Object.entries(newVal)) {
        if (val === undefined) {
          await storeRef.delete(key);
          continue;
        }

        await storeRef.set(key, val);
      }
      await storeRef.save();
    },
    { deep: true }
  );

  async function reload() {
    await storeRef.reload();
    const updatedEntries = Object.fromEntries(await storeRef.entries());
    Object.assign(settings, updatedEntries);
  }

  async function set<K extends keyof Settings>(key: K, value: Settings[K]) {
    settings[key] = value;
    await storeRef.set(key as string, value);
    await storeRef.save();
  }

  async function get<K extends keyof Settings>(key: K) {
    return settings[key];
  }

  return {
    settings,
    reload,
    get,
    set,
  };
}
