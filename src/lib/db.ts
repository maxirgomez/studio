import { Pool } from "pg";

const pool = new Pool({
  user: "postgres",
  host: "34.45.139.58",
  database: "prefapp",
  password: "lenovo",
  port: 5432,
});

export default pool; 