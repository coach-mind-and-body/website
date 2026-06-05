import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  
  const [rows] = await connection.execute('SELECT title, publishedAt FROM blog_posts ORDER BY publishedAt ASC');
  console.log("All Blog Posts in Database:");
  rows.forEach((r, i) => {
    console.log(`${i+1}. [${new Date(r.publishedAt).toLocaleDateString()}] ${r.title}`);
  });
  
  await connection.end();
}

run().catch(console.error);
