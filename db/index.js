import mysql2 from "mysql2/promise.js"
import { drizzle } from "drizzle-orm/mysql2";
import { configDotenv } from "dotenv";
configDotenv()
const pool = mysql2.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "15648", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: {
    rejectUnauthorized: true,
    ca: process.env.DB_CA
  },
});

export const db = drizzle(pool);
