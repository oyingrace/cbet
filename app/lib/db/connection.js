//app/lib/db/connection.js
import mongoose from 'mongoose';

// Connection options
const options = {
  bufferCommands: false,
  maxPoolSize: 10,
  minPoolSize: 5,
  socketTimeoutMS: 45000,
  family: 4,
};

// Global connection state
let isConnected = false;
let connectionPromise = null;

async function connectDB() {
  // Check for MONGODB_URI when the function is called, not at module load time
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env');
  }

  // If we're already connected, return the existing connection
  if (isConnected) {
    return mongoose.connection;
  }

  // If we're in the process of connecting, return the existing promise
  if (connectionPromise) {
    return connectionPromise;
  }

  // Create a new connection promise
  connectionPromise = mongoose
    .connect(MONGODB_URI, options)
    .then((mongoose) => {
      isConnected = true;
      console.log('MongoDB connected successfully');
      return mongoose.connection;
    })
    .catch((error) => {
      console.error('MongoDB connection error:', error);
      isConnected = false;
      connectionPromise = null;
      throw error;
    });

  return connectionPromise;
}

// Handle connection events
mongoose.connection.on('connected', () => {
  isConnected = true;
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  isConnected = false;
  connectionPromise = null;
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  connectionPromise = null;
});

export default connectDB;
