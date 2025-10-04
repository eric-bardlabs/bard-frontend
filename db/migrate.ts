import 'dotenv/config';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import { db } from './dbClient';

async function main() {
  console.log('Running migrations...');
  await migrate(db, { migrationsFolder: './db/drizzle/migrations' });
  console.log('Completed running migrations...');
}

main().then(() => process.exit(0));
