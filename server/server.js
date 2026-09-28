require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ message: 'server error' });
});

mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('MongoDB connected');
    app.listen(process.env.PORT || 5000, () => console.log('server running on port ${process.env.PORT ||5000}'));
}).catch((err) => console.error('DB connection error:', err))
    ;
