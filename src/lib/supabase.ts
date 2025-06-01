import { Pool } from "pg";

const connectionString = process.env.CONNECTION_STRING;

export const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});
