const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { authMiddleware } = require('../middleware/auth');

const DB_FILE_PATH = path.resolve(__dirname, '../../', process.env.DB_FILE || 'sales_data.db');

// Helper function to open database connection
function getDbConnection() {
  return new sqlite3.Database(DB_FILE_PATH);
}

// Ensure sales_data table exists
function initDb() {
  const db = getDbConnection();
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
  db.run(createTableSql, (err) => {
    if (err) console.error('[SQLite] Error initializing sales_data table:', err.message);
    db.close();
  });
}
initDb();

/**
 * GET /api/sales/summary
 * Returns overall metrics, payment mode breakdown, and order type breakdown
 */
router.get('/summary', authMiddleware, (req, res) => {
  const db = getDbConnection();

  const summaryQuery = `
    SELECT 
      COUNT(*) as total_orders, 
      COALESCE(SUM(sale_amount), 0) as total_invoice, 
      COALESCE(SUM(tax_amount), 0) as total_tax, 
      COALESCE(SUM(discount_amount), 0) as total_discount, 
      COALESCE(SUM(net_sale), 0) as total_revenue,
      COALESCE(AVG(net_sale), 0) as avg_order_value
    FROM sales_data
  `;

  const paymentModesQuery = `
    SELECT payment_mode, COUNT(*) as count, SUM(net_sale) as total
    FROM sales_data
    WHERE payment_mode IS NOT NULL AND payment_mode != ''
    GROUP BY payment_mode
    ORDER BY total DESC
  `;

  const orderTypesQuery = `
    SELECT order_type, COUNT(*) as count, SUM(net_sale) as total
    FROM sales_data
    WHERE order_type IS NOT NULL AND order_type != ''
    GROUP BY order_type
    ORDER BY total DESC
  `;

  db.get(summaryQuery, [], (err, summary) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error querying sales summary', error: err.message });
    }

    db.all(paymentModesQuery, [], (err2, paymentModes) => {
      if (err2) {
        db.close();
        return res.status(500).json({ message: 'Error querying payment modes', error: err2.message });
      }

      db.all(orderTypesQuery, [], (err3, orderTypes) => {
        db.close();
        if (err3) {
          return res.status(500).json({ message: 'Error querying order types', error: err3.message });
        }

        res.json({
          summary,
          paymentModes,
          orderTypes,
        });
      });
    });
  });
});

/**
 * GET /api/sales/transactions
 * Query sales transactions with optional search and pagination
 */
router.get('/transactions', authMiddleware, (req, res) => {
  const db = getDbConnection();
  const search = req.query.search || '';
  const paymentMode = req.query.payment_mode || '';
  const orderType = req.query.order_type || '';
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 15;
  const offset = (page - 1) * limit;

  let whereClauses = [];
  let params = [];

  if (search) {
    whereClauses.push('(receipt_number LIKE ? OR sale_date LIKE ?)');
    params.push(`%${search}%`, `%${search}%`);
  }

  if (paymentMode) {
    whereClauses.push('payment_mode = ?');
    params.push(paymentMode);
  }

  if (orderType) {
    whereClauses.push('order_type = ?');
    params.push(orderType);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countQuery = `SELECT COUNT(*) as count FROM sales_data ${whereSql}`;
  const dataQuery = `
    SELECT * FROM sales_data 
    ${whereSql} 
    ORDER BY id DESC 
    LIMIT ? OFFSET ?
  `;

  db.get(countQuery, params, (err, countRow) => {
    if (err) {
      db.close();
      return res.status(500).json({ message: 'Error counting sales records', error: err.message });
    }

    const totalRecords = countRow ? countRow.count : 0;
    const totalPages = Math.ceil(totalRecords / limit) || 1;

    db.all(dataQuery, [...params, limit, offset], (err2, rows) => {
      db.close();
      if (err2) {
        return res.status(500).json({ message: 'Error fetching sales records', error: err2.message });
      }

      res.json({
        transactions: rows,
        pagination: {
          totalRecords,
          totalPages,
          currentPage: page,
          limit,
        },
      });
    });
  });
});

/**
 * POST /api/sales/sync
 * Trigger sync from Petpooja API into SQLite database
 */
router.post('/sync', authMiddleware, async (req, res) => {
  const API_BASE_URL = process.env.PETPOOJA_API_BASE_URL || 'http://api.petpooja.com/V1/orders/get_sales_data/';
  const APP_KEY = process.env.PETPOOJA_APP_KEY;
  const APP_SECRET = process.env.PETPOOJA_APP_SECRET;
  const ACCESS_TOKEN = process.env.PETPOOJA_ACCESS_TOKEN;
  const REST_ID = process.env.PETPOOJA_REST_ID;
  const FROM_DATE = req.body.from_date || process.env.FROM_DATE || '2025-05-03 00:00:00';
  const TO_DATE = req.body.to_date || process.env.TO_DATE || '2025-05-30 23:59:19';

  if (!APP_KEY || !APP_SECRET || !ACCESS_TOKEN || !REST_ID) {
    return res.status(400).json({
      message: 'Missing Petpooja API credentials in environment variables (PETPOOJA_APP_KEY, PETPOOJA_APP_SECRET, etc.).',
    });
  }

  const queryParams = new URLSearchParams({
    app_key: APP_KEY,
    app_secret: APP_SECRET,
    access_token: ACCESS_TOKEN,
    restID: REST_ID,
    from_date: FROM_DATE,
    to_date: TO_DATE,
  });

  const fullApiUrl = `${API_BASE_URL}?${queryParams.toString()}`;

  try {
    const apiResponse = await fetch(fullApiUrl);
    if (!apiResponse.ok) {
      throw new Error(`Petpooja API error status: ${apiResponse.status} ${apiResponse.statusText}`);
    }

    const data = await apiResponse.json();
    const records = data.Records || data.data || [];

    if (!Array.isArray(records) || records.length === 0) {
      return res.json({
        message: 'Sync completed. No new records found from Petpooja API for the specified date range.',
        recordsSynced: 0,
      });
    }

    const db = getDbConnection();
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
      db.run('BEGIN TRANSACTION;');
      const stmt = db.prepare(insertSql);
      let insertedCount = 0;

      for (const record of records) {
        stmt.run([
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
        ], (err) => {
          if (!err) insertedCount++;
        });
      }

      stmt.finalize((err) => {
        if (err) {
          db.close();
          return res.status(500).json({ message: 'Failed finalizing sales insertion', error: err.message });
        }

        db.run('COMMIT;', (commitErr) => {
          db.close();
          if (commitErr) {
            return res.status(500).json({ message: 'Transaction commit failed', error: commitErr.message });
          }

          res.json({
            message: `Petpooja sales data synced successfully! ${insertedCount} records stored.`,
            recordsSynced: insertedCount,
          });
        });
      });
    });
  } catch (err) {
    res.status(500).json({
      message: 'Failed to sync sales data from Petpooja API',
      error: err.message,
    });
  }
});

module.exports = router;
