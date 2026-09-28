require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(cors()); // Allow requests from any client origin in development
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/sales', require('./routes/sales'));

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ message: 'server error' });
});

const startServer = async () => {
  const port = process.env.PORT || 5001;

  try {
    // Attempt connecting to configured MONGO_URI with short timeout
    await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 2000 });
    console.log('MongoDB connected successfully');
  } catch (err) {
    console.warn('Local MongoDB not accessible. Starting MongoMemoryServer fallback...');
    try {
      const mongod = await MongoMemoryServer.create();
      const mongoUri = mongod.getUri();
      await mongoose.connect(mongoUri);
      console.log('MongoDB Memory Server started & connected successfully');
    } catch (memErr) {
      console.error('Fatal MongoDB connection error:', memErr);
      process.exit(1);
    }
  }

  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
};

startServer();
