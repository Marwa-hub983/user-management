require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_FILE_PATH = path.resolve(__dirname, process.env.DB_FILE || 'sales_data.db');

const db = new sqlite3.Database(DB_FILE_PATH, (err) => {
  if (err) {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  }
});

console.log('====================================================');
console.log('         Sales Data SQLite Database Viewer          ');
console.log('====================================================\n');

// 1. Overall Summary Statistics
db.get(
  `SELECT 
    COUNT(*) as total_orders, 
    SUM(sale_amount) as total_invoice, 
    SUM(tax_amount) as total_tax, 
    SUM(discount_amount) as total_discount, 
    SUM(net_sale) as total_revenue 
   FROM sales_data`,
  [],
  (err, summary) => {
    if (err) {
      console.error('Error fetching summary:', err.message);
      db.close();
      return;
    }

    console.log('--- Summary Metrics ---');
    console.log(`Total Orders       : ${summary.total_orders}`);
    console.log(`Total Invoice      : ₹${summary.total_invoice ? summary.total_invoice.toFixed(2) : '0.00'}`);
    console.log(`Total Tax          : ₹${summary.total_tax ? summary.total_tax.toFixed(2) : '0.00'}`);
    console.log(`Total Discount     : ₹${summary.total_discount ? summary.total_discount.toFixed(2) : '0.00'}`);
    console.log(`Total Net Revenue  : ₹${summary.total_revenue ? summary.total_revenue.toFixed(2) : '0.00'}`);
    console.log('-----------------------\n');

    // 2. Recent 10 Orders Table
    console.log('--- Sample Sales Data (Latest 10 Rows) ---');
    db.all(
      `SELECT receipt_number, sale_date, transaction_time, sale_amount, tax_amount, net_sale, payment_mode, order_type, transaction_status 
       FROM sales_data 
       LIMIT 10`,
      [],
      (err, rows) => {
        if (err) {
          console.error('Error fetching rows:', err.message);
        } else {
          console.table(rows);
        }

        console.log('\n====================================================');
        db.close();
      }
    );
  }
);
