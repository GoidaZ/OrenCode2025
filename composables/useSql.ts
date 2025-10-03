import Database from '@tauri-apps/plugin-sql';

export default async function useDatabase() {
  const db = useState('db', () => null as Database | null);
  if (!db.value) db.value = await Database.load('sqlite:main.db');
  return db.value;
}