import { warn, debug, info, error } from '@tauri-apps/plugin-log';
import { stringify } from 'flatted';

export default defineNuxtPlugin((app) => {
    function forwardConsole(
        fnName: 'log' | 'debug' | 'info' | 'warn' | 'error',
        logger: (...args: any[]) => Promise<void>
    ) {
        const original = console[fnName];

        console[fnName] = (...args: any[]) => {
            original(...args);

            const message = args
                .map((arg) => {
                    if (typeof arg === 'string') return arg;
                    if (arg instanceof Error) return arg.stack || arg.message;
                    try {
                        return stringify(arg);
                    } catch {
                        return '[Unable to serialize object]';
                    }
                })
                .join(' ');

            logger(message);
        };
    }

    forwardConsole('log', info);
    forwardConsole('debug', debug);
    forwardConsole('info', info);
    forwardConsole('warn', warn);
    forwardConsole('error', error);
})