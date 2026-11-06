
import express from 'express';
import multer from 'multer';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import adminUserRoutes from './routes/adminUserRoutes.js';
import donationRequestRoutes from './routes/donationRequestRoutes.js';
import donorRoutes from './routes/donorRoutes.js';
import fundingRoutes from './routes/fundingRoutes.js';
import contactRoutes from './routes/contactRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import { validateJwtConfiguration } from './utils/auth.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

const allowedOrigins = process.env.CLIENT_URL
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({ origin: allowedOrigins?.length ? allowedOrigins : true }));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));

app.use('/auth', authRoutes);
app.use('/admin', adminUserRoutes);
app.use('/donors', donorRoutes);
app.use('/donation-requests', donationRequestRoutes);
app.use('/funding', fundingRoutes);
app.use('/contact', contactRoutes);
app.use('/notifications', notificationRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    next(error);
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    res.status(400).json({ message: 'Request body must contain valid JSON.' });
    return;
  }

  if (error instanceof multer.MulterError) {
    const isTooLarge = error.code === 'LIMIT_FILE_SIZE';
    res.status(isTooLarge ? 413 : 400).json({
      message: isTooLarge
        ? 'Uploaded images must be no larger than 5 MB.'
        : 'Upload one PNG, JPEG, or WebP image using the expected file field.',
    });
    return;
  }

  if (error.name === 'ValidationError' || error.name === 'CastError') {
    res.status(400).json({ message: 'The submitted data is invalid.' });
    return;
  }

  console.error('Unhandled API error:', error.name || 'Error');
  res.status(500).json({ message: 'An unexpected server error occurred.' });
});

export async function connectToMongoDB() {
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI must be configured.');
    }

    console.log('Trying to connect MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully!');

    return mongoose.connection.getClient();
  } catch (err) {
    console.error('MongoDB connection failed:', err.name || 'Error');
    throw err;
  }
}

export async function startServer() {
  try {
    validateJwtConfiguration();
    await connectToMongoDB();

    app.listen(port, () => {
      console.log(`LifeDrop API is running on port ${port}`);
    });
  } catch (error) {
    const configurationErrors = [
      'JWT_SECRET must be configured with at least 32 characters.',
      'MONGODB_URI must be configured.',
    ];
    const message = configurationErrors.includes(error.message)
      ? error.message
      : 'Unable to start the API. Check server configuration and database availability.';
    console.error('Server startup failed:', message);
    process.exit(1);
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer();
}

export { app };
