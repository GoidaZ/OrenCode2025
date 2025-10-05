import { WebviewWindow } from '@tauri-apps/api/webviewWindow'

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

export async function useAuth() {
  const { settings } = await useSettings();
  const vault = await useVault();

  const loggedIn = ref(!!settings.user);
  const user = reactive<UserInfo>({});

  let refreshTimer: number | null = null;

  function getRedirectURI() {
    if (import.meta.env.DEV) {
      return 'http://127.0.0.1:3001/callback';
    }
    return 'tauri://callback';
  }

  function getAuthURL() {
    const redirect_uri = getRedirectURI();
    const url = new URL(`https://kc.airblo.ws/realms/secretmanager/protocol/openid-connect/auth`);
    url.searchParams.set('client_id', 'secretmanager');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope', 'openid');
    url.searchParams.set('redirect_uri', redirect_uri);
    return url.toString();
  }

  async function login() {
    const webview = new WebviewWindow(`keycloak`, {
      url: getAuthURL(),
      title: "Keycloak",
      minWidth: 600,
      minHeight: 600,
      width: 600,
      height: 600,
    });

    await webview.once('tauri://error', function (e) {
      console.error(e);
    });
  }

  async function unlock() {
    if (!settings.user) return;

    const data = await vault.simpleDecrypt(settings.user);
    Object.assign(user, JSON.parse(data));

    loggedIn.value = true;
  }

  async function authorize(code: string) {
    const redirect_uri = getRedirectURI();
    const url = `/api/auth/callback?code=${encodeURIComponent(code)}&redirect_uri=${encodeURIComponent(redirect_uri)}`;
    const { data } = await useApiFetch<UserTokens>(url);

    user.tokens = user.tokens || {};
    Object.assign(user.tokens, data.value);

    await fetchUserInfo();
    scheduleRefresh();

    return true;
  }

  async function fetchUserInfo() {
    if (!user.tokens?.id_token) return;

    const { data } = await useApiFetch<UserInfo>('/api/auth/me', {
      method: 'GET', headers: { Authorization: `Bearer ${user.tokens.id_token}` },
    });

    Object.assign(user, data.value || {});
    await saveUser();
  }

  async function saveUser() {
    settings.user = await vault.simpleEncrypt(JSON.stringify(user));
    loggedIn.value = true;
  }

  async function refreshToken() {
    if (!user.tokens?.refresh_token) return false;

    try {
      const { data } = await useApiFetch<UserTokens>('/api/auth/refresh', {
        method: 'POST', body: { refresh_token: user.tokens.refresh_token },
      });

      user.tokens = user.tokens || {};
      Object.assign(user.tokens, data.value);
      await saveUser();
      scheduleRefresh();
      return true;
    } catch (err) {
      await logout();
      return false;
    }
  }

  function scheduleRefresh() {
    if (!user.tokens?.expires_in) return;
    if (refreshTimer) clearTimeout(refreshTimer);

    const expiresInMs = (user.tokens?.expires_in - 60) * 1000;
    refreshTimer = window.setTimeout(refreshToken, expiresInMs);
  }

  async function logout() {
    loggedIn.value = false;
    Object.keys(user).forEach(k => delete (user as any)[k]);
    settings.user = undefined;
    if (refreshTimer) clearTimeout(refreshTimer);
  }

  return {
    loggedIn,
    user,
    unlock,
    login,
    authorize,
    fetchUserInfo,
    refreshToken,
    logout,
  };
}
