import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export default async function useDatabase() {
  if (db) return db;
  db = await Database.load('sqlite:main.db');
  return db;
}
