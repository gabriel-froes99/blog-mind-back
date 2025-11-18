#!/usr/bin/env node
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const dbName = process.env.DB_DATABASE || 'blogdb';

const configNoDB = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  port: Number(process.env.DB_PORT) || 3306,
  multipleStatements: true,
};

async function main() {
  console.log('Connecting to MySQL (no database specified)...');
  const connection = await mysql.createConnection(configNoDB);

  console.log(`Creating database if not exists: ${dbName}`);
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;`);
  await connection.query(`USE \`${dbName}\`;`);

  const sqlFile = path.resolve(__dirname, '..', 'dumpSQL', 'blogdb.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('SQL file not found:', sqlFile);
    await connection.end();
    process.exit(1);
  }

  console.log('Reading SQL file:', sqlFile);
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Executing SQL... (this may take a while)');
  try {
    await connection.query(sql);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error executing SQL file:', err);
    throw err;
  } finally {
    await connection.end();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
