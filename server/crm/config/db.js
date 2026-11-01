const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');
const dns = require('dns');

// Set public DNS resolvers to ensure MongoDB Atlas SRV lookup succeeds on Windows networks
try {
  dns.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);
} catch (dnsErr) {
  console.warn('Unable to set custom DNS servers:', dnsErr.message);
}

if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config({ path: path.join(__dirname, '../.env') });

const { autoSeedIfEmpty } = require('../utils/autoSeed');
const { backfillLeadsUser } = require('../utils/backfillLeadsUser');

const connectDB = async () => {
  try {
    const connStr = process.env.MONGODB_URI ;
    console.log(`Connecting to MongoDB...`);
    const conn = await mongoose.connect(connStr, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    await autoSeedIfEmpty();
    await backfillLeadsUser();
  } catch (error) {
    console.warn(`Standard MongoDB connection failed (${error.message}). Initializing Persistent MongoDB Server...`);
    try {
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const dataDir = path.join(__dirname, '../data_db');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      const mongoServer = await MongoMemoryServer.create({
        instance: {
          dbPath: dataDir
        }
      });
      const uri = mongoServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`Persistent MongoDB Server Connected successfully: ${conn.connection.host}`);
      await autoSeedIfEmpty();
      await backfillLeadsUser();
    } catch (memError) {
      console.error(`Database connection error: ${memError.message}`);
      process.exit(1);
    }
  }
};

module.exports = connectDB;

