require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const rateLimit = require('express-rate-limit');
const fileUpload = require('express-fileupload');
const path = require('path');
const connectDB = require('./config/db');

const app = express();
connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(mongoSanitize());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: { success: false, message: 'Too many requests.' } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(fileUpload({ useTempFiles: true, tempFileDir: '/tmp/', limits: { fileSize: 10 * 1024 * 1024 } }));
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
  process.env.FRONTEND_URL_PROD, // set this to your Vercel URL after deploying
].filter(Boolean);
app.use(cors({ origin: allowedOrigins, credentials: true, methods: ['GET','POST','PUT','DELETE','PATCH'], allowedHeaders: ['Content-Type','Authorization'] }));
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth',          require('./routes/auth'));
app.use('/api/events',        require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/certificates',  require('./routes/certificates'));
app.use('/api/gallery',       require('./routes/gallery'));
app.use('/api/users',         require('./routes/users'));
app.use('/api/dashboard',     require('./routes/dashboard'));
app.use('/api/waitlist',      require('./routes/waitlist'));
app.use('/api/feedback',      require('./routes/feedback'));

app.get('/api/health', (req, res) => res.json({ success: true, message: 'BBA Apex API running 🚀' }));
app.use('*', (req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.statusCode || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 BBA Apex Server running on port ${PORT}`));
