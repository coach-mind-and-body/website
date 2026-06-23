import { getDb } from './server/db';
import { sql } from 'drizzle-orm';
import 'dotenv/config';

async function run() {
    const db = await getDb();
    if (!db) {
        console.error('No DB connected.');
        process.exit(1);
    }
    try {
        await db.execute(sql`ALTER TABLE users ADD COLUMN shareHabitsWithCoach BOOLEAN NOT NULL DEFAULT FALSE;`);
        console.log('Column shareHabitsWithCoach added successfully.');
    } catch (e) {
        console.error('Migration failed or column already exists', e);
    }
    process.exit(0);
}
run();
