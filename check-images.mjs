import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

const connection = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await connection.execute('SELECT title, slug, coverImage FROM blog_posts ORDER BY id DESC LIMIT 5');
console.log(rows);
await connection.end();
