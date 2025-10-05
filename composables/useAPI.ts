import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import {listen, TauriEvent} from '@tauri-apps/api/event';
import { start, cancel, onUrl } from '@fabianlars/tauri-plugin-oauth';
import {message} from "@tauri-apps/plugin-dialog";

export type UserTokens = {
  access_token?: string;
  id_token?: string;
  refresh_token?: string;
  expires_in?: number;
}

export type UserInfo = {
  sub?: string;
  email?: string;
  preferred_username?: string;
  name?: string;
  realmRoles?: string[];
  tokens?: UserTokens;
};

export type KeyInfo = {
  id: string;
  description?: string;
  expire_at?: string | null;
};

export type SecretData = Record<string, any>;

export type SecretWriteRequest = {
  data: Record<string, any>;
  description: string;
  expireAt?: string | null;
};

export type RequestInfo = {
  id: string;
  creator: string;
  resource: string;
  description: string;
  reason: string;
  validFor?: string;
  status: 'PENDING' | 'ACCEPT' | 'REJECT';
  createdAt: string;
};

export type CreateRequestInput = {
  resource: string;
  description: string;
  reason: string;
  validFor?: string;
};

let authState: any = null;

export async function useAPI() {
  if (authState) return authState;

  const { settings } = await useSettings();
  const vault = await useVault();

  const loggedIn = ref(!!settings.user);
  const user = reactive<UserInfo>({});

  let refreshTimer: number | null = null;

  await listen('reset', async (event) => logout());

  async function login() {
    const port = await start();

    const redirect_uri = `http://localhost:${port}/callback`;
    const url = new URL(`https://kc.airblo.ws/realms/secretmanager/protocol/openid-connect/auth`);
    url.searchParams.set('client_id', 'secretmanager');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid offline_access');
    url.searchParams.set('redirect_uri', redirect_uri);

    const webview = new WebviewWindow(`keycloak`, {
      url: url.toString(),
      title: "Keycloak",
      minWidth: 600,
      minHeight: 600,
      width: 600,
      height: 600,
      incognito: true
    });

    await webview.once('tauri://error', function (e) {
      console.error(e);
    });

    await webview.once("tauri://destroyed", async function (e) {
      await cancel(port);
    });

    await onUrl(async (target) => {
      try {
        const callbackUrl = new URL(target);
        const code = callbackUrl.searchParams.get('code');
        await authorize(code as string, redirect_uri);
      } catch (err: any) {
        console.log(err);
        await message(err.message || 'Произошла неизвестная ошибка во время авторизации', { title: 'SecretManager', kind: 'error' });
        return
      }
      await webview.close();
      await cancel(port);
    });
  }

  async function unlock() {
    if (!settings.user) return;

    try {
      const data = await vault.simpleDecrypt(settings.user);
      Object.assign(user, JSON.parse(data));
      loggedIn.value = true;
      await refreshToken();
      console.log('id_token:', user.tokens?.id_token)
      console.log('access_token:', user.tokens?.access_token)
    } catch (e) {
      console.error('failed to decrypt:', e);
      logout();
    }
  }

  async function authorize(code: string, redirect_uri: string) {
    const data = await $fetch<UserTokens>(`${settings.apiBase}/api/auth/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirect_uri)}`);

    user.tokens = user.tokens || {};
    Object.assign(user.tokens, data);

    await fetchUserInfo();
    scheduleRefresh();

    return true;
  }

  async function fetchUserInfo() {
    if (!user.tokens?.access_token) return;

    const data = await $fetch<UserInfo>(`${settings.apiBase}/api/auth/me`, {
      method: 'GET', headers: { Authorization: `Bearer ${user.tokens.access_token}` },
    });

    Object.assign(user, data || {});
    await saveUser();
  }

  async function saveUser() {
    settings.user = await vault.simpleEncrypt(JSON.stringify(user));
    loggedIn.value = true;
  }

  async function refreshToken() {
    if (!user.tokens?.refresh_token) return false;

    try {
      const data = await $fetch<UserTokens>('/api/auth/refresh', {
        method: 'POST', body: { refresh_token: user.tokens.refresh_token },
      });

      user.tokens = user.tokens || {};
      Object.assign(user.tokens, data);
      await saveUser();
      scheduleRefresh();
      return true;
    } catch (err) {
      logout();
      return false;
    }
  }

  function scheduleRefresh() {
    if (!user.tokens?.expires_in) return;
    if (refreshTimer) clearTimeout(refreshTimer);

    const expiresInMs = (user.tokens?.expires_in - 60) * 1000;
    refreshTimer = window.setTimeout(refreshToken, expiresInMs);
  }

  function logout() {
    console.log('logging out')
    loggedIn.value = false;
    Object.keys(user).forEach(k => delete (user as any)[k]);
    settings.user = undefined;
    if (refreshTimer) clearTimeout(refreshTimer);
  }

  async function listSecrets(): Promise<KeyInfo[]> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      return await $fetch<KeyInfo[]>(`${settings.apiBase}/api/secret/list`, {
        headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err: any) {
      console.error(err);
      return [];
    }
  }

  async function getSecret(name: string): Promise<SecretData | null> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      return await $fetch<SecretData>(`${settings.apiBase}/api/secret/${encodeURIComponent(name)}`, {
        headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err: any) {
      console.error(err);
      return null;
    }
  }

  async function createSecret(name: string, body: SecretWriteRequest): Promise<void> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      await $fetch(`${settings.apiBase}/api/secret/${encodeURIComponent(name)}`, {
        method: 'POST', body, headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err: any) {
      console.error(err);
    }
  }

  async function deleteSecret(name: string): Promise<void> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      await $fetch(`${settings.apiBase}/api/secret/${encodeURIComponent(name)}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err: any) {
      console.error(err);
    }
  }

  async function createRequest(input: CreateRequestInput): Promise<RequestInfo | null> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      return await $fetch<RequestInfo>(`${settings.apiBase}/request/create`, {
        method: 'POST',
        body: input,
        headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err) {
      console.error('createRequest failed:', err);
      return null;
    }
  }

  async function listRequests(): Promise<RequestInfo[]> {
    if (!user.tokens?.access_token) throw new Error("login first");

    try {
      return await $fetch<RequestInfo[]>(`${settings.apiBase}/request/list`, {
        headers: { Authorization: `Bearer ${user.tokens.access_token}` },
      });
    } catch (err) {
      console.error('listRequests failed:', err);
      return [];
    }
  }

  authState = {
    loggedIn,
    user,
    unlock,
    login,
    authorize,
    logout,
    listSecrets,
    getSecret,
    createSecret,
    deleteSecret,
    createRequest,
    listRequests,
  };

  return authState;
}
