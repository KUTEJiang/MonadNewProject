// SQLite database for Doubao image history
// This feature is temporary and may be removed later
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database | null = null;

function getDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'data', 'doubao-images.db');

    // Ensure data directory exists
    const dataDir = path.dirname(dbPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    db = new Database(dbPath);

    // Create table if not exists
    db.exec(`
      CREATE TABLE IF NOT EXISTS doubao_images (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        prompt TEXT NOT NULL,
        image_url TEXT NOT NULL,
        minio_url TEXT NOT NULL,
        file_name TEXT NOT NULL,
        size TEXT DEFAULT '1024x1024',
        seed INTEGER DEFAULT 42,
        created_at INTEGER NOT NULL
      )
    `);

    console.log('✅ Doubao image database initialized:', dbPath);
  }

  return db;
}

export interface DoubaoImageRecord {
  id?: number;
  prompt: string;
  image_url: string;
  minio_url: string;
  file_name: string;
  size?: string;
  seed?: number;
  created_at: number;
}

export function saveDoubaoImage(data: Omit<DoubaoImageRecord, 'id'>): number {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO doubao_images (prompt, image_url, minio_url, file_name, size, seed, created_at)
    VALUES (@prompt, @image_url, @minio_url, @file_name, @size, @seed, @created_at)
  `);

  const result = stmt.run({
    prompt: data.prompt,
    image_url: data.image_url,
    minio_url: data.minio_url,
    file_name: data.file_name,
    size: data.size || '1024x1024',
    seed: data.seed || 42,
    created_at: data.created_at,
  });

  console.log(`✅ Doubao image saved to DB: ${data.file_name}`);
  return result.lastInsertRowid as number;
}

export function getRecentDoubaoImages(limit: number = 50): DoubaoImageRecord[] {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT * FROM doubao_images
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return stmt.all(limit) as DoubaoImageRecord[];
}

export function deleteDoubaoImage(id: number): void {
  const db = getDatabase();
  const stmt = db.prepare('DELETE FROM doubao_images WHERE id = ?');
  stmt.run(id);
  console.log(`✅ Doubao image deleted from DB: ${id}`);
}
