window.onPostDataLoaded({
    "title": "The Serverless Death Spiral: Database Pool Exhaustion",
    "slug": "serverless-db-connection-death-spiral",
    "language": "Node.js / PostgreSQL",
    "code": "ConnectionLimitExceeded",
    "tags": [
        "Serverless",
        "AWS Lambda",
        "PostgreSQL",
        "Scalability",
        "Error Fix"
    ],
    "analysis": "<p>In traditional server-based environments, a small number of application instances maintain long-lived connection pools to the database. However, serverless functions like AWS Lambda scale horizontally by spawning thousands of independent containers.</p><p>The 'Connection Pool Death Spiral' happens when a traffic spike triggers massive concurrency. If 500 Lambda instances spin up and each initializes a default pool of 10 connections, they attempt to open 5,000 total connections. Most relational databases (PostgreSQL/MySQL) are configured with much lower limits (e.g., 100-500). Once the limit is hit, the database rejects new connections, causing function timeouts, which triggers retries, further burying the database in a feedback loop of failure.</p>",
    "root_cause": "Ephemeral compute scaling linearly while database connection limits remain static and vertically constrained.",
    "bad_code": "const { Pool } = require('pg');\n\n// BAD: Standard pooling logic in a serverless environment\n// Each Lambda instance creates up to 10 connections\nconst pool = new Pool({\n  user: 'dbuser',\n  host: 'database.cluster-xyz.rds.amazonaws.com',\n  database: 'mydb',\n  password: 'password',\n  port: 5432,\n  max: 10 // This is dangerous at scale\n});\n\nexports.handler = async (event) => {\n  const client = await pool.connect();\n  const res = await client.query('SELECT NOW()');\n  client.release();\n  return res.rows;\n};",
    "solution_desc": "Use a database proxy (like AWS RDS Proxy or PgBouncer) to multiplex connections. Additionally, configure the serverless client to use a 'max: 1' connection setting and define the pool outside the handler to take advantage of container reuse.",
    "good_code": "const { Pool } = require('pg');\n\n// GOOD: Connect to a Proxy and limit local pool size to 1\nconst pool = new Pool({\n  host: process.env.RDS_PROXY_ENDPOINT,\n  user: process.env.DB_USER,\n  password: process.env.DB_PASSWORD,\n  database: 'mydb',\n  max: 1, // Crucial: Only one connection per Lambda instance\n  idleTimeoutMillis: 1000\n});\n\nexports.handler = async (event) => {\n  // Connections are reused if the container is warm\n  const client = await pool.connect();\n  try {\n    const res = await client.query('SELECT NOW()');\n    return res.rows;\n  } finally {\n    client.release();\n  }\n};",
    "verification": "Perform a load test using a tool like k6 or Artillery to simulate 1,000 concurrent requests. Monitor the 'DatabaseConnections' metric in AWS CloudWatch to ensure it stays within the RDS Proxy max capacity rather than spiking to the DB instance limit.",
    "date": "2026-02-11",
    "id": 1770773787
});