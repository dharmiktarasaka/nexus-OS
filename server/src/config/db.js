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

