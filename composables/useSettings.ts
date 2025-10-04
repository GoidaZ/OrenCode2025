import { load, Store } from '@tauri-apps/plugin-store';
import { reactive, watch } from 'vue';

type Settings = {
  api_base?: string;
  [key: string]: any;
};

let initialized = false;
let storeRef: Store;

export async function useSettings() {
  const settings = reactive<Settings>({});

  if (!initialized) {
    initialized = true;
    storeRef = await load('settings.json');

    const entries = await storeRef.entries();
    Object.assign(settings, Object.fromEntries(entries));

    watch(
      settings,
      async (newVal) => {
        for (const [key, val] of Object.entries(newVal)) {
          await storeRef.set(key, val);
        }
        await storeRef.save();
      },
      { deep: true }
    );
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
    get,
    set,
  };
}
