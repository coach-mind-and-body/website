import { getDb } from './server/db';
import { programModules } from './drizzle/schema';
import 'dotenv/config';

async function run() {
  try {
    const db = await getDb();
    if (!db) {
      console.log('No DB connected.');
      process.exit(1);
    }
    const count = await db.select().from(programModules);
    if(count.length === 0) {
      const modules = Array.from({length: 6}).map((_, i) => ({
        title: `Module ${i+1}`,
        description: 'Placeholder description.',
        order: i+1,
        isPublished: true
      }));
      await db.insert(programModules).values(modules);
      console.log('Inserted 6 modules.');
    } else {
      console.log('Modules already exist.');
    }
    process.exit(0);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
}
run();
