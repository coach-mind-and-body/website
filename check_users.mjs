import mysql from 'mysql2/promise';

const connection = await mysql.createConnection(process.env.DATABASE_URL);

const [rows] = await connection.execute(
  'SELECT id, email, role, name FROM users WHERE email IN (?, ?)',
  ['carter@inseitzmarketing.com', 'coach@mindandbodyresetcoach.com']
);

console.log('Admin users found:');
console.log(JSON.stringify(rows, null, 2));

await connection.end();
