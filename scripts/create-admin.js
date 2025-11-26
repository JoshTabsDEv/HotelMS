const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const path = require("path");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

async function createAdmin() {
  const email = process.argv[2];
  const password = process.argv[3];

  if (!email || !password) {
    console.error("Usage: node create-admin.js <email> <password>");
    console.error("Example: node create-admin.js admin@example.com mypassword");
    process.exit(1);
  }

  // Validate environment variables
  const host = process.env.MYSQL_HOST;
  const database = process.env.MYSQL_DATABASE;
  const user = process.env.MYSQL_USER;
  const dbPassword = process.env.MYSQL_PASSWORD;
  const port = Number(process.env.MYSQL_PORT || 3306);
  const sslRequired = process.env.MYSQL_SSL === "true";

  if (!host || !database || !user) {
    console.error("Error: Missing required environment variables!");
    console.error("Required: MYSQL_HOST, MYSQL_DATABASE, MYSQL_USER, MYSQL_PASSWORD");
    console.error("Optional: MYSQL_PORT (default: 3306), MYSQL_SSL (default: false)");
    console.error("\nMake sure your .env.local file exists and contains these variables.");
    process.exit(1);
  }

  console.log(`Connecting to database: ${host}:${port}/${database}`);
  if (sslRequired) {
    console.log("SSL enabled for DigitalOcean connection");
  }

  const poolConfig = {
    host,
    database,
    user,
    password: dbPassword,
    port,
    waitForConnections: true,
    connectionLimit: 1,
  };

  // Add SSL configuration if required (for DigitalOcean)
  if (sslRequired) {
    poolConfig.ssl = {
      rejectUnauthorized: false, // DigitalOcean uses self-signed certificates
    };
  }

  const pool = mysql.createPool(poolConfig);

  try {
    // Test connection first
    await pool.query("SELECT 1");
    console.log("✓ Database connection successful");

    // Check if users table exists
    try {
      await pool.query("SELECT 1 FROM users LIMIT 1");
    } catch (err) {
      console.error("\n✗ Error: 'users' table not found!");
      console.error("Please run the schema.sql file first to create the required tables.");
      console.error("Example: mysql -h <host> -P <port> -u <user> -p <database> < schema.sql");
      process.exit(1);
    }

    // Check if user already exists
    const [existing] = await pool.query(
      "SELECT id, role FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      console.log(`User ${email} already exists. Updating password and role...`);
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "UPDATE users SET password = ?, role = 'admin' WHERE email = ?",
        [hashedPassword, email]
      );
      console.log(`✓ Admin user ${email} updated successfully!`);
    } else {
      const hashedPassword = await bcrypt.hash(password, 10);
      await pool.query(
        "INSERT INTO users (email, password, role) VALUES (?, ?, 'admin')",
        [email, hashedPassword]
      );
      console.log(`✓ Admin user ${email} created successfully!`);
    }
  } catch (error) {
    console.error("\n✗ Error creating admin user:");
    if (error.code === "ECONNREFUSED") {
      console.error("  Connection refused. Check:");
      console.error("  - Database host and port are correct");
      console.error("  - Database server is running");
      console.error("  - Firewall allows connections from your IP");
      console.error("  - For DigitalOcean: Check 'Trusted Sources' in database settings");
    } else if (error.code === "ER_ACCESS_DENIED_ERROR") {
      console.error("  Access denied. Check:");
      console.error("  - Username and password are correct");
      console.error("  - User has permissions to access the database");
    } else if (error.code === "ENOTFOUND") {
      console.error("  Host not found. Check:");
      console.error("  - MYSQL_HOST is correct");
      console.error("  - DNS resolution is working");
    } else {
      console.error("  " + error.message);
      if (error.sql) {
        console.error("  SQL: " + error.sql);
      }
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createAdmin();

