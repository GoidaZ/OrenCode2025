import Database from "@tauri-apps/plugin-sql";

export type SecretRecord = {
  id: string;
  description?: string;
  value: string;
  nonce: string;
  salt: string;
  created_at?: Date;
  expires_at?: Date | null;
};

export default async function useVault() {
  const db = await useDatabase();
  const { settings } = await useSettings();
  const key = useState("vault_key", () => null as CryptoKey | null)
  const secrets = useState<Omit<SecretRecord, 'value' | 'nonce' | 'salt'>[]>('vault_secrets', () => []);

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  function uint8ArrayToBase64(bytes: Uint8Array) {
    return btoa(String.fromCharCode(...bytes));
  }

  function base64ToUint8Array(base64: string) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  async function deriveKey(masterPassword: string, salt: Uint8Array) {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(masterPassword),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 250000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  function exists(): boolean {
    return !(!settings.salt && !settings.verifier);
  }

  async function unlock(masterPassword: string): Promise<boolean> {
    if (exists()) {
      return await unlockExisting(masterPassword)
    }

    await initVault(masterPassword);
    return true;
  }

  function lock() {
    key.value = null;
  }

  async function initVault(masterPassword: string) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    key.value = await deriveKey(masterPassword, salt);

    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const data = encoder.encode('vault-verifier');
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key.value,
      data
    );

    const combined = new Uint8Array(nonce.byteLength + ciphertext.byteLength);
    combined.set(nonce, 0);
    combined.set(new Uint8Array(ciphertext), nonce.byteLength);

    settings.salt = uint8ArrayToBase64(salt);
    settings.verifier = uint8ArrayToBase64(combined);
  }

  async function unlockExisting(masterPassword: string): Promise<boolean> {
    if (await verifyPassword(masterPassword)) {
      secrets.value = await listSecrets();
      return true;
    }

    return false;
  }

  async function refresh() {
    secrets.value = await listSecrets();
  }

  async function verifyPassword(masterPassword: string): Promise<boolean> {
    const salt = base64ToUint8Array(settings.salt || '');
    const tmpKey = await deriveKey(masterPassword, salt);

    const combined = base64ToUint8Array(settings.verifier || '');
    const nonce = combined.slice(0, 12);
    const ciphertext = combined.slice(12);

    try {
      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: nonce },
        tmpKey,
        ciphertext
      );

      if (decoder.decode(decrypted) === 'vault-verifier') {
        key.value = tmpKey;
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }

  async function encryptSecret(plaintext: Record<string, string>) {
    if (!key.value) throw new Error('Unlock vault first');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key.value,
      encoder.encode(JSON.stringify(plaintext))
    );

    return {
      value: uint8ArrayToBase64(new Uint8Array(ciphertext)),
      nonce: uint8ArrayToBase64(nonce),
      salt: uint8ArrayToBase64(salt),
    };
  }

  async function decryptSecret(record: SecretRecord) {
    if (!key.value) throw new Error('Unlock vault first');
    const nonce = base64ToUint8Array(record.nonce);
    const ciphertext = base64ToUint8Array(record.value);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key.value,
      ciphertext
    );
    return JSON.parse(decoder.decode(decrypted)) as Record<string, string>;
  }

  async function addSecret(id: string, description: string, plaintext: Record<string, string>, expiresAt?: Date | null) {
    const existing = await db?.select<SecretRecord[]>('SELECT id FROM secrets WHERE id = ?', [id]);
    if (existing && existing.length > 0) throw new Error(`Secret with ID "${id}" already exists`);

    const enc = await encryptSecret(plaintext);

    await db?.execute(
      'INSERT INTO secrets (id, description, value, nonce, salt, created_at, expires_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
      [id, description, enc.value, enc.nonce, enc.salt, expiresAt]
    );

    secrets.value.push({
      id,
      description,
      created_at: new Date(),
      expires_at: expiresAt || null,
    });

    return id;
  }

  async function getSecret(id: string): Promise<Record<string, string> | null> {
    const result = await db?.select<SecretRecord[]>('SELECT * FROM secrets WHERE id = ?', [id]);
    if (!result || result.length === 0) return null;

    const record = result[0];
    if (!record) return null;

    return decryptSecret(record);
  }

  async function removeSecret(id: string): Promise<void> {
    await db?.execute('DELETE FROM secrets WHERE id = ?', [id]);
    secrets.value = secrets.value.filter(s => s.id !== id);
  }

  async function listSecrets(): Promise<Omit<SecretRecord, 'value' | 'nonce' | 'salt'>[]> {
    const results = await db?.select<SecretRecord[]>(
      'SELECT id, description, created_at, expires_at FROM secrets'
    );

    if (!results) return [];

    return results.map(r => ({
      id: r.id,
      description: r.description,
      created_at: r.created_at ? new Date(r.created_at) : undefined,
      expires_at: r.expires_at ? new Date(r.expires_at) : null,
    }));
  }

  async function reset(): Promise<void> {
    await db?.execute('DELETE FROM secrets');
    settings.salt = undefined;
    settings.verifier = undefined;
    secrets.value = [];
    lock();
  }

  return {
    unlock,
    lock,
    reset,
    exists,
    secrets,
    refresh,
    verifyPassword,
    addSecret,
    getSecret,
    removeSecret
  };
}
