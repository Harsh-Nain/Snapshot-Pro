import dotenv from "dotenv";
dotenv.config();

export default {
  out: "./drizzle/output",
  schema: "./drizzle/schema.js",
  dialect: "mysql",
  dbCredentials: {
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "15648", 10),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: {
      rejectUnauthorized: true,
      ca: process.env.DB_CA
    },
  },
};