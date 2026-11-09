import dns from 'dns';
import mongoose from 'mongoose';

// Configure public DNS resolvers to prevent Windows SRV query ETIMEOUT / ECONNREFUSED on MongoDB Atlas
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
  console.warn('[Social DB] Custom DNS set deferred:', e.message);
}

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || process.env.CENTRAL_MONGODB_URI || 'mongodb+srv://dharmiktarasaka_db_user:Pt8l83Ppo5b02daJ@cluster0.9vpk7q2.mongodb.net/nexus_os?retryWrites=true&w=majority';
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 6000,
      connectTimeoutMS: 8000,
    });
    console.log(`[Social Service] MongoDB connected: ${conn.connection.host}`);

    // Drop legacy/conflicting indexes from accounts collection if they exist
    try {
      const db = conn.connection.db;
      const collections = await db.listCollections({ name: 'accounts' }).toArray();
      if (collections.length > 0) {
        const indexes = await db.collection('accounts').indexes();
        
        // 1. Drop incorrect email index
        const hasEmailIndex = indexes.some(idx => idx.name === 'email_1');
        if (hasEmailIndex) {
          console.log('[Social Service] Found incorrect email_1 index on accounts collection. Dropping it...');
          await db.collection('accounts').dropIndex('email_1');
          console.log('[Social Service] Successfully dropped email_1 index.');
        }

        // 2. Drop non-user-scoped platformUserId index to allow independent multi-user connections
        const hasLegacyPlatformIndex = indexes.some(idx => idx.name === 'platformUserId_1_platform_1');
        if (hasLegacyPlatformIndex) {
          console.log('[Social Service] Dropping legacy global platformUserId_1_platform_1 index to enforce strict multi-user isolation...');
          await db.collection('accounts').dropIndex('platformUserId_1_platform_1');
          console.log('[Social Service] Successfully dropped legacy global platform index.');
        }
      }
    } catch (indexError) {
      console.warn('[Social Service] Warning: Could not manage legacy indexes on accounts:', indexError.message);
    }
  } catch (error) {
    console.warn(`[Social Service] MongoDB connection notice: ${error.message}. Running in resilient mode.`);
  }
};
