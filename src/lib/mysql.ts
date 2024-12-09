import { createPool } from 'mysql2';

export const mysql = createPool({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  port: Number(process.env.DATABASE_PORT),
  database: process.env.DATABASE_SCHEMA,
});
