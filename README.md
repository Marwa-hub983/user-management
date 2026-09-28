# Fetch & Store Petpooja Sales Data

A Node.js utility script designed to fetch sales data from the Petpooja POS API and persist it into a local SQLite database (`sales_data.db`).

---

## 📌 Features & Evaluation Criteria

- ✅ **Data Fetching & Storage**: Connects to Petpooja API, parses response JSON, and inserts records into SQLite.
- ✅ **Environment Variables**: Uses `.env` for API credentials (`app_key`, `app_secret`, `access_token`, `restID`, date filters).
- ✅ **API Retry Mechanism**: Implements an automatic retry loop with exponential backoff for network or transient HTTP errors.
- ✅ **Database Performance**: Uses SQLite transactions for efficient batch record insertion.
- ✅ **Database File Included**: Populated `sales_data.db` included in the repository.

---

## 🗄️ Database Schema (`sales_data`)

```sql
CREATE TABLE sales_data (
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
```

### Field Mapping

| API Field | SQLite Column | Type |
|---|---|---|
| `Receipt number` | `receipt_number` | TEXT |
| `Receipt Date` | `sale_date` | TEXT |
| `Transaction Time` | `transaction_time` | TEXT |
| `Invoice amount` | `sale_amount` | REAL |
| `Tax amount` | `tax_amount` | REAL |
| `Discount amount` | `discount_amount` | REAL |
| `Round Off` | `round_off` | REAL |
| `Net sale` | `net_sale` | REAL |
| `Payment Mode` | `payment_mode` | TEXT |
| `Order Type` | `order_type` | TEXT |
| `Transaction status` | `transaction_status` | TEXT |

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js**: v18.0.0 or higher

### 2. Environment Configuration

Create a `.env` file in the project root directory (or use the included `.env`):

```env
PETPOOJA_API_BASE_URL=http://api.petpooja.com/V1/orders/get_sales_data/
PETPOOJA_APP_KEY=a7rekz2c6uxy8m9nhqvpdi1tjbogf530
PETPOOJA_APP_SECRET=eef6364132970494fa4dfc2fb872f16642bc05c2
PETPOOJA_ACCESS_TOKEN=1de7f4c36e92fd556a46df761ba1f2536df93c68
PETPOOJA_REST_ID=51wok2zxnsad
FROM_DATE=2025-05-03 00:00:00
TO_DATE=2025-05-30 23:59:19
DB_FILE=sales_data.db
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Run the Script

To fetch sales records and populate `sales_data.db`:

```bash
node fetchSalesData.js
```

---

## 📊 Summary Output Example

```text
==================================================
       Petpooja Sales Data Fetcher & SQLite       
==================================================

[SQLite] Database connected: sales_data.db
[SQLite] Table "sales_data" verified/created successfully.
[API] Fetching sales data (Attempt 1/3)...
[API Success] Fetched 1287 records from Petpooja API.
[SQLite] Inserting sales records into database...
[SQLite Success] Successfully stored 1287 sales records in "sales_data.db".

--- Database Summary ---
Total Stored Rows: 1287
Total Revenue (Net Sale): ₹432102.00
------------------------
```
