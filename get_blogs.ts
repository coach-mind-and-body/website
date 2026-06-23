import { getDb } from './server/db';
import { blogPosts } from './drizzle/schema';
import 'dotenv/config';

async function run() {
    const db = await getDb();
    if (db) {
        const blogs = await db.select({id: blogPosts.id, title: blogPosts.title}).from(blogPosts);
        console.log(JSON.stringify(blogs, null, 2));
    }
    process.exit(0);
}
run();
