const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'APLBilling Backend is running.' });
});

// Import Routes
const authRoutes = require('./routes/authRoutes');
const masterRoutes = require('./routes/masterRoutes');
const billRoutes = require('./routes/billRoutes');
const reportRoutes = require('./routes/reportRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/masters', masterRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
