# User Management & Petpooja Sales System 🚀

A full-stack web application featuring **User & Admin Authentication**, **Full User CRUD Operations**, and a **Node.js Petpooja POS Sales Fetcher & SQLite Database System**.

---

## 🌟 Features

### 👤 User & Admin Management (Full Stack)
- 🔐 **Authentication**: User Signup, Login, Profile updates, and JWT Token-based session management.
- 🛡️ **Role-Based Access Control**:
  - **User Role**: View & update personal profile, delete self account.
  - **Admin Role**: Complete User Management System with full **CRUD Operations** (Create, Read, Update, Delete system users).
- 🎨 **Modern Dark UI**: Built with React (Vite), responsive layouts, smooth micro-animations, and glassmorphism styling.

### 📊 Petpooja Sales Data Fetcher & SQLite DB
- 📡 **Data Fetching**: Connects to Petpooja POS API with automatic retry logic and exponential backoff.
- 💾 **SQLite Storage**: Stores sales records in `sales_data.db` using efficient database transactions.
- 📈 **CLI Database Viewer**: `viewSales.js` script to inspect summary statistics and transaction tables in the terminal.

---

## 🛠️ Tech Stack

- **Frontend**: React.js (Vite), React Router v6, Axios, Vanilla CSS.
- **Backend**: Node.js, Express.js, MongoDB (Mongoose with `MongoMemoryServer` fallback), JWT, BcryptJS.
- **Data Scripting**: SQLite3, Dotenv.

---

## 📁 Directory Structure

```text
user-management/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── api/axios.js        # Axios instance with JWT interceptors
│   │   ├── components/         # Reusable UI (Navbar, Loader, ErrorMessage)
│   │   ├── context/            # AuthContext provider
│   │   ├── pages/              # Signup, Login, Dashboard (CRUD), Profile
│   │   ├── App.jsx             # React Router setup
│   │   └── index.css           # Global Dark Theme CSS
│   └── package.json
├── server/                     # Backend Express API Server
│   ├── middleware/auth.js      # Auth & Admin security middleware
│   ├── models/User.js          # Mongoose User model
│   ├── routes/
│   │   ├── auth.js             # /api/auth (Login & Signup)
│   │   └── users.js            # /api/users (Full User CRUD operations)
│   ├── server.js               # Express app entry point
│   └── package.json
├── fetchSalesData.js           # Script: Fetch Petpooja API -> Store in SQLite
├── viewSales.js                # Script: View SQLite database statistics
├── sales_data.db               # SQLite database file
├── .env                        # Environment variables configuration
└── package.json                # Root package.json with runner scripts
```

---

## ⚡ Quick Start & Run Instructions

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher installed.

---

### 2. Environment Setup

Check or create the `.env` file in the project root:

```env
# Backend API & Server Config
PORT=5001
JWT_SECRET=supersecretjwtkey_123456789
MONGO_URI=mongodb://127.0.0.1:27017/usermanagement

# Petpooja Sales API Credentials
PETPOOJA_API_BASE_URL=http://api.petpooja.com/V1/orders/get_sales_data/
PETPOOJA_APP_KEY=a7rekz2c6uxy8m9nhqvpdi1tjbogf530
PETPOOJA_APP_SECRET=eef6364132970494fa4dfc2fb872f16642bc05c2
PETPOOJA_ACCESS_TOKEN=1de7f4c36e92fd556a46df761ba1f2536df93c68
PETPOOJA_REST_ID=51wok2zxnsad
FROM_DATE=2025-05-03 00:00:00
TO_DATE=2025-05-30 23:59:19
DB_FILE=sales_data.db
```

---

### 3. Installation

Run the following commands in the project root directory to install all required dependencies:

```bash
# Install root dependencies
npm install

# Install server dependencies
npm install --prefix server

# Install client dependencies
npm install --prefix client
```

---

### 4. Running the Web Application (Frontend + Backend)

#### Option A: Run Both Simultaneously (Recommended)
From the project root directory, run:
```bash
npm run dev
```
- **Backend API**: Running at `http://localhost:5001`
- **Frontend App**: Running at `http://localhost:5173`

---

#### Option B: Run Server and Client Separately

* **To start the Express Backend Server only**:
  ```bash
  npm run dev:server
  ```
  *(or `cd server && npm run dev`)*

* **To start the React Frontend Client only**:
  ```bash
  npm run dev:client
  ```
  *(or `cd client && npm run dev`)*

---

### 5. Running the Petpooja Sales Scripts

* **To fetch sales records from Petpooja API and store them in SQLite**:
  ```bash
  npm run fetch-sales
  # or: node fetchSalesData.js
  ```

* **To view sales summary statistics and transaction tables in the terminal**:
  ```bash
  npm run view-sales
  # or: node viewSales.js
  ```

---

## 🛠️ API Reference (Backend Endpoints)

### Auth Routes (`/api/auth`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register a new user | Public |
| `POST` | `/api/auth/login` | Login user & return JWT token | Public |

### User Routes (`/api/users`)
| Method | Endpoint | Description | Access |
|---|---|---|---|
| `GET` | `/api/users` | List all users (Admin dashboard) | Admin |
| `POST` | `/api/users` | **Create** a new user | Admin |
| `GET` | `/api/users/profile` | Get current user profile | Authenticated |
| `PUT` | `/api/users/profile` | Update current user profile | Authenticated |
| `PUT` | `/api/users/:id` | **Update** any user by ID | Admin |
| `DELETE` | `/api/users/:id` | **Delete** user by ID | Admin / Self |

---

## 🗄️ SQLite Database Schema (`sales_data`)

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

---

## 📝 License
ISC License
