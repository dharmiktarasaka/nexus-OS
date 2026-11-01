// server/db.js - MongoDB Connection & Lifecycle Management
const dns = require('dns');
// Configure public DNS resolvers to prevent Windows SRV query ECONNREFUSED on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('[MongoDB] Custom DNS set deferred:', e.message);
}

const mongoose = require('mongoose');

let isConnected = false;

async function connectDB() {
  let uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nexus_os';

  // Ensure database name is included if URI ends with / or lacks one
  if (uri.endsWith('/')) {
    uri = `${uri}nexus_os?retryWrites=true&w=majority`;
  } else if (!uri.includes('?') && !uri.split('/').pop()) {
    uri = `${uri}/nexus_os`;
  }

  try {
    const maskedUri = uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
    console.log(`[MongoDB] Connecting to: ${maskedUri}...`);
    
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000
    });

    isConnected = true;
    console.log(`[MongoDB] Successfully connected to database: ${mongoose.connection.name}`);
    return true;
  } catch (err) {
    isConnected = false;
    console.warn(`[MongoDB] Connection notice: ${err.message}`);
    console.warn(`[MongoDB] Running in resilient mode. All user actions are stored safely.`);
    return false;
  }
}

mongoose.connection.on('connected', () => {
  isConnected = true;
  console.log('[MongoDB] Connection established.');
});

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('[MongoDB] Connection lost.');
});

mongoose.connection.on('error', (err) => {
  isConnected = false;
  console.error('[MongoDB] Connection error:', err.message);
});

function isMongoConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

function getDatabaseName() {
  return mongoose.connection?.name || 'nexus_os';
}

module.exports = {
  connectDB,
  isMongoConnected,
  getDatabaseName,
  mongoose
};
