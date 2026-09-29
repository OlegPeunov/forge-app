import { readFileSync, renameSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

export type UserRecord = {
  id: string;
  email: string;
  passwordHash: string;
  completedSessionIds: string[];
};

type Database = {
  users: UserRecord[];
};

const databasePath = resolve(__dirname, '../data/db.json');
const temporaryDatabasePath = `${databasePath}.tmp`;

export const database = JSON.parse(
  readFileSync(databasePath, 'utf8'),
) as Database;

export function saveDatabase() {
  writeFileSync(
    temporaryDatabasePath,
    `${JSON.stringify(database, null, 2)}\n`,
    'utf8',
  );
  renameSync(temporaryDatabasePath, databasePath);
}
