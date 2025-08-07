// server/database.cjs - CommonJS para ser usado por gameServer.cjs
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

const connectionOptions = {
  connectionString: process.env.DATABASE_URL,
};

// In production environments (like Railway), cloud databases often require SSL.
if (process.env.NODE_ENV === 'production') {
  connectionOptions.ssl = {
    rejectUnauthorized: false,
  };
}

const pool = new Pool(connectionOptions);

// Test connection
pool.on('connect', () => {
  console.log('🐘 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('💥 PostgreSQL connection error:', err);
});

module.exports = { pool };
