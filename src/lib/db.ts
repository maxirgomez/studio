import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "104.197.5.8",
  database: "prefapp",
  password: "lenovo",
  port: 5432,
});

export default pool; 