const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "blob:", "https://maps.googleapis.com", "https://maps.gstatic.com", "https://*.googleapis.com", "https://*.gstatic.com", "https://*.google.com"],
        fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
        connectSrc: ["'self'", "http://localhost:5000", "https://maps.googleapis.com", "https://*.googleapis.com", "https://*.gstatic.com"],
        workerSrc: ["'self'", "blob:"],
        frameSrc: ["'self'", "https://www.google.com"]
      }
    }
  })
);
app.use(morgan('dev'));

// Serve static files - Configure correctly based on your project structure
// Main public frontend files
app.use(express.static(path.join(__dirname, '../client/public')));
// Admin panel files
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Database connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

// Testing route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is working' });
});

// Load API routes
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('Auth routes loaded successfully');
} catch (error) {
  console.error('Error loading auth routes:', error.message);
}

try {
  const quoteRoutes = require('./routes/quotes');
  app.use('/api/quotes', quoteRoutes);
  console.log('Quote routes loaded successfully');
} catch (error) {
  console.error('Error loading quote routes:', error.message);
}

try {
  const appointmentRoutes = require('./routes/appointments');
  app.use('/api/appointments', appointmentRoutes);
  console.log('Appointment routes loaded successfully');
} catch (error) {
  console.error('Error loading appointment routes:', error.message);
}

try {
  const serviceRoutes = require('./routes/services');
  app.use('/api/services', serviceRoutes);
  console.log('Service routes loaded successfully');
} catch (error) {
  console.error('Error loading service routes:', error.message);
}

try {
  const contactRoutes = require('./routes/contact');
  app.use('/api/contact', contactRoutes);
  console.log('Contact routes loaded successfully');
} catch (error) {
  console.error('Error loading contact routes:', error.message);
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('Admin routes loaded successfully');
} catch (error) {
  console.error('Error loading admin routes:', error.message);
}

// HTML routes
app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
});

app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

// Frontend routes for main site
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/public/index.html'));
});

// For any route starting with / (except /api and /admin), serve frontend
app.get(/^(?!\/api|\/admin).*/, (req, res) => {
  // For specific files like /quote.html, /contact.html, etc.
  // Check if the file exists in client/public
  const requestedFile = path.join(__dirname, '../client/public', req.path);
  if (fs.existsSync(requestedFile)) {
    res.sendFile(requestedFile);
  } else {
    // If file doesn't exist, send the index.html as fallback
    res.sendFile(path.join(__dirname, '../client/public/index.html'));
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Server error',
    error: process.env.NODE_ENV === 'production' ? {} : err
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Test API available at: http://localhost:${PORT}/api/quotes/test`);
  console.log(`Frontend available at: http://localhost:${PORT}/`);
  console.log(`Admin panel available at: http://localhost:${PORT}/admin/login`);
});

module.exports = app;