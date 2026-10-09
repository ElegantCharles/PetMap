import fs from 'fs';
import path from 'path';
import { pool } from './pool';

export async function ensureDatabaseInitialized(): Promise<void> {
  const candidateDirs = [
    '/app/sql',
    path.resolve(__dirname, '../../../../base-de-datos/scripts'),
  ];

  const sqlDir = candidateDirs.find((dir) => fs.existsSync(dir));
  if (!sqlDir) {
    return;
  }

  const files = fs
    .readdirSync(sqlDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const fullPath = path.join(sqlDir, file);
    const content = fs.readFileSync(fullPath, 'utf8').replace(/^\uFEFF/, '');
    if (content.trim()) {
      await pool.query(content);
    }
  }
}
