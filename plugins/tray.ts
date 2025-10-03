import { TrayIcon, type TrayIconOptions } from '@tauri-apps/api/tray';
import { Menu } from '@tauri-apps/api/menu';
import { defaultWindowIcon } from '@tauri-apps/api/app';
import { getCurrentWindow } from "@tauri-apps/api/window";
import { exit } from '@tauri-apps/plugin-process';

export default defineNuxtPlugin(async (app) => {
    const menu = await Menu.new({
        items: [
            {
                id: 'open',
                text: 'SecretManager',
                action: async () => {
                    await getCurrentWindow().show();
                }
            },
            {
                item: 'Separator',
            },
            {
                id: 'quit',
                text: 'Выйти',
                action: async () => {
                    await exit(0);
                }
            }
        ],
    });

    const options: TrayIconOptions = {
        menu,
        showMenuOnLeftClick: false,
        icon: await defaultWindowIcon() || undefined,
        title: "SecretManager",
        action: async (event) => {
            if (event.type == "Click" && event.button == "Left") {
                await getCurrentWindow().show();
            }
        },
    };

    await TrayIcon.new(options);
})