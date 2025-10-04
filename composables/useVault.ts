import Database from "@tauri-apps/plugin-sql";

export type SecretRecord = {
  id: string;
  description?: string;
  value: string;
  nonce: string;
  salt: string;
  created_at?: string;
  expires_at?: string | null;
};

export default async function useVault() {
  const db = await useDatabase();
  const { settings } = await useSettings();
  const key = useState("vault_key", () => null as CryptoKey | null)

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

  async function encryptSecret(plaintext: string) {
    if (!key.value) throw new Error('Unlock vault first');
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const nonce = crypto.getRandomValues(new Uint8Array(12));

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: nonce },
      key.value,
      encoder.encode(plaintext)
    );

    return {
      value: uint8ArrayToBase64(new Uint8Array(ciphertext)),
      nonce: uint8ArrayToBase64(nonce),
      salt: uint8ArrayToBase64(salt),
    };
  }

  async function decryptSecret(record: SecretRecord) {
    if (!key.value) throw new Error('Unlock vault first');
    const salt = base64ToUint8Array(record.salt);
    const nonce = base64ToUint8Array(record.nonce);
    const ciphertext = base64ToUint8Array(record.value);

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key.value,
      ciphertext
    );
    return decoder.decode(decrypted);
  }

  async function addSecret(description: string, plaintext: string, expiresAt?: string | null) {
    const enc = await encryptSecret(plaintext);
    const id = crypto.randomUUID();

    await db?.execute(
      'INSERT INTO secrets (id, description, value, nonce, salt, created_at, expires_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)',
      [id, description, enc.value, enc.nonce, enc.salt, expiresAt]
    );

    return id;
  }

  async function getSecret(id: string): Promise<string | null> {
    const result = await db?.select<SecretRecord[]>('SELECT * FROM secrets WHERE id = ?', [id]);
    if (!result || result.length === 0) return null;

    const record = result[0];
    if (!record) return null;

    if (record.expires_at && new Date() > new Date(record.expires_at)) throw new Error('Secret has expired');

    return decryptSecret(record);
  }

  async function removeSecret(id: string): Promise<void> {
    await db?.execute('DELETE FROM secrets WHERE id = ?', [id]);
  }

  async function reset(): Promise<void> {
    await db?.execute('DELETE FROM secrets');
    settings.salt = undefined;
    settings.verifier = undefined;
    lock();
  }

  return {
    unlock,
    lock,
    reset,
    exists,
    addSecret,
    getSecret,
    removeSecret
  };
}
