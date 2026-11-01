import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Manage multiple database connections for unified cross-application queries
export const dbConnections = {
  crm: null,
  website: null,
  analytics: null,
  central: null
};

export const connectionStatus = {
  crm: false,
  website: false,
  analytics: false,
  central: false
};

const options = {
  serverSelectionTimeoutMS: 5000,
  connectTimeoutMS: 5000
};

export async function initDatabases() {
  const unifiedUri = process.env.MONGODB_URI || process.env.CENTRAL_MONGODB_URI;

  if (unifiedUri) {
    let cleanUri = unifiedUri;
    if (cleanUri.endsWith('/')) {
      cleanUri = `${cleanUri}nexus_os?retryWrites=true&w=majority`;
    } else if (!cleanUri.includes('?') && !cleanUri.split('/').pop()) {
      cleanUri = `${cleanUri}/nexus_os`;
    }

    try {
      const conn = await mongoose.createConnection(cleanUri, options).asPromise();
      dbConnections.crm = conn;
      dbConnections.website = conn;
      dbConnections.analytics = conn;
      dbConnections.central = conn;

      connectionStatus.crm = true;
      connectionStatus.website = true;
      connectionStatus.analytics = true;
      connectionStatus.central = true;

      console.log(`[DB] Unified MongoDB cluster connected to '${conn.name}' for Central, CRM, Website & Analytics!`);
      return connectionStatus;
    } catch (err) {
      console.warn('[DB] Unified MongoDB connection deferred/fallback:', err.message);
    }
  }

  const promises = [];

  // 1. CRM Connection
  if (process.env.CRM_MONGODB_URI) {
    promises.push(
      mongoose.createConnection(process.env.CRM_MONGODB_URI, options)
        .asPromise()
        .then(conn => {
          dbConnections.crm = conn;
          connectionStatus.crm = true;
          console.log('[DB] CRM MongoDB cluster connected successfully');
        })
        .catch(err => {
          console.warn('[DB] CRM connection deferred/fallback:', err.message);
        })
    );
  }

  // 2. Website Builder Connection
  if (process.env.WEBSITE_MONGODB_URI) {
    promises.push(
      mongoose.createConnection(process.env.WEBSITE_MONGODB_URI, options)
        .asPromise()
        .then(conn => {
          dbConnections.website = conn;
          connectionStatus.website = true;
          console.log('[DB] Website Builder MongoDB cluster connected successfully');
        })
        .catch(err => {
          console.warn('[DB] Website Builder connection deferred/fallback:', err.message);
        })
    );
  }

  // 3. Business Analytics Connection
  if (process.env.ANALYTICS_MONGODB_URI) {
    promises.push(
      mongoose.createConnection(process.env.ANALYTICS_MONGODB_URI, options)
        .asPromise()
        .then(conn => {
          dbConnections.analytics = conn;
          connectionStatus.analytics = true;
          console.log('[DB] Business Analytics MongoDB cluster connected successfully');
        })
        .catch(err => {
          console.warn('[DB] Business Analytics connection deferred/fallback:', err.message);
        })
    );
  }

  await Promise.allSettled(promises);
  return connectionStatus;
}

