require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Configuration from environment variables
const API_BASE_URL = process.env.PETPOOJA_API_BASE_URL || 'http://api.petpooja.com/V1/orders/get_sales_data/';
const APP_KEY = process.env.PETPOOJA_APP_KEY;
const APP_SECRET = process.env.PETPOOJA_APP_SECRET;
const ACCESS_TOKEN = process.env.PETPOOJA_ACCESS_TOKEN;
const REST_ID = process.env.PETPOOJA_REST_ID;
const FROM_DATE = process.env.FROM_DATE || '2025-05-03 00:00:00';
const TO_DATE = process.env.TO_DATE || '2025-05-30 23:59:19';
const DB_FILE_PATH = path.resolve(__dirname, process.env.DB_FILE || 'sales_data.db');

/**
 * Fetch sales data with retry mechanism for transient network or API failures
 */
async function fetchSalesDataWithRetry(url, maxRetries = 3, initialDelayMs = 1000) {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    attempt++;
    try {
      console.log(`[API] Fetching sales data (Attempt ${attempt}/${maxRetries})...`);
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error(`[API Warning] Attempt ${attempt} failed: ${err.message}`);
      if (attempt >= maxRetries) {
        throw new Error(`Failed to fetch sales data after ${maxRetries} attempts: ${err.message}`);
      }
      console.log(`[API Retry] Waiting ${delay}ms before retrying...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2; // Exponential backoff
    }
  }
}

/**
 * Initialize SQLite database connection and create table
 */
function initDatabase(dbPath) {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) return reject(err);
      console.log(`[SQLite] Database connected: ${dbPath}`);

      const createTableSql = `
        CREATE TABLE IF NOT EXISTS sales_data (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          receipt_number TEXT,
          sale_date TEXT,
          transaction_time TEXT,
          sale_amount REAL,
          tax_amount REAL,
          discount_amount REAL,
          round_off REAL,
          net_sale REAL,
          payment_mode TEXT,
          order_type TEXT,
          transaction_status TEXT
        );
      `;

      db.run(createTableSql, (tableErr) => {
        if (tableErr) return reject(tableErr);
        console.log('[SQLite] Table "sales_data" verified/created successfully.');
        resolve(db);
      });
    });
  });
}

/**
 * Insert sales records into SQLite database using transactions
 */
function insertSalesRecords(db, records) {
  return new Promise((resolve, reject) => {
    if (!Array.isArray(records) || records.length === 0) {
      console.log('[SQLite] No records to insert.');
      return resolve(0);
    }

    const insertSql = `
      INSERT INTO sales_data (
        receipt_number,
        sale_date,
        transaction_time,
        sale_amount,
        tax_amount,
        discount_amount,
        round_off,
        net_sale,
        payment_mode,
        order_type,
        transaction_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);
    `;

    db.serialize(() => {
      db.run('BEGIN TRANSACTION;', (err) => {
        if (err) return reject(err);
      });

      const stmt = db.prepare(insertSql);
      let insertedCount = 0;

      for (const record of records) {
        stmt.run(
          [
            record['Receipt number'] || '',
            record['Receipt Date'] || '',
            record['Transaction Time'] || '',
            parseFloat(record['Invoice amount']) || 0,
            parseFloat(record['Tax amount']) || 0,
            parseFloat(record['Discount amount']) || 0,
            parseFloat(record['Round Off']) || 0,
            parseFloat(record['Net sale']) || 0,
            record['Payment Mode'] || '',
            record['Order Type'] || '',
            record['Transaction status'] || '',
          ],
          (runErr) => {
            if (runErr) {
              console.error(`[SQLite Error] Failed to insert record ${record['Receipt number']}:`, runErr.message);
            } else {
              insertedCount++;
            }
          }
        );
      }

      stmt.finalize((finalizeErr) => {
        if (finalizeErr) return reject(finalizeErr);

        db.run('COMMIT;', (commitErr) => {
          if (commitErr) return reject(commitErr);
          resolve(insertedCount);
        });
      });
    });
  });
}

/**
 * Main execution script
 */
async function main() {
  console.log('==================================================');
  console.log('       Petpooja Sales Data Fetcher & SQLite       ');
  console.log('==================================================\n');

  if (!APP_KEY || !APP_SECRET || !ACCESS_TOKEN || !REST_ID) {
    console.error('[Config Error] Missing required API credentials in environment variables.');
    process.exit(1);
  }

  // Construct URL with query parameters
  const queryParams = new URLSearchParams({
    app_key: APP_KEY,
    app_secret: APP_SECRET,
    access_token: ACCESS_TOKEN,
    restID: REST_ID,
    from_date: FROM_DATE,
    to_date: TO_DATE,
  });

  const fullApiUrl = `${API_BASE_URL}?${queryParams.toString()}`;
  let db;

  try {
    // 1. Initialize SQLite Database
    db = await initDatabase(DB_FILE_PATH);

    // 2. Fetch Sales Data with retry mechanism
    const apiResponse = await fetchSalesDataWithRetry(fullApiUrl, 3, 1000);

    const records = apiResponse.Records || apiResponse.data || [];
    console.log(`[API Success] Fetched ${records.length} records from Petpooja API.`);

    // 3. Store Sales Data in SQLite Database
    console.log('[SQLite] Inserting sales records into database...');
    const insertedCount = await insertSalesRecords(db, records);
    console.log(`[SQLite Success] Successfully stored ${insertedCount} sales records in "sales_data.db".`);

    // 4. Print Summary Query
    db.get('SELECT COUNT(*) as total, SUM(net_sale) as total_revenue FROM sales_data', [], (err, row) => {
      if (!err && row) {
        console.log('\n--- Database Summary ---');
        console.log(`Total Stored Rows: ${row.total}`);
        console.log(`Total Revenue (Net Sale): ₹${row.total_revenue ? row.total_revenue.toFixed(2) : '0.00'}`);
        console.log('------------------------\n');
      }

      db.close(() => {
        console.log('[SQLite] Database connection closed.');
        console.log('==================================================');
      });
    });
  } catch (error) {
    console.error('\n[Fatal Error]:', error.message);
    if (db) db.close();
    process.exit(1);
  }
}

// Execute script
main();
