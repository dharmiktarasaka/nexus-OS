// Database Organization and Seeding Script for Nexus OS
const mongoose = require('mongoose');
const dns = require('dns');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (e) {}

const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '../../.env') });

const URI = process.env.MONGODB_URI;
if (!URI) {
  console.error('❌ MONGODB_URI is not defined. Please set it in your .env file.');
  process.exit(1);
}

async function organizeDatabase() {
  console.log('===============================================================');
  console.log('📦 Nexus OS • Database Organizer & Schema Initializer');
  console.log('===============================================================');
  console.log(`Connecting to: ${URI.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@')} ...`);

  await mongoose.connect(URI, { serverSelectionTimeoutMS: 10000 });
  const db = mongoose.connection.db;
  console.log(`✅ Connected to database: "${mongoose.connection.name}"`);

  // 1. Organize 'users' Collection (CRM Team & Admin Users)
  console.log('\n[1/7] Organizing CRM users collection...');
  const usersCol = db.collection('users');
  await usersCol.createIndex({ email: 1 }, { unique: true });
  await usersCol.createIndex({ role: 1 });
  await usersCol.createIndex({ companyId: 1 });

  const userCount = await usersCol.countDocuments();
  if (userCount === 0) {
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('tarasaka$admin2028', salt);
    const salesPass = await bcrypt.hash('tarasaka$dharmik2028', salt);

    await usersCol.insertMany([
      {
        name: 'Admin Manager',
        email: 'admin@crm.com',
        password: adminPass,
        role: 'ADMIN',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'Dharmik Patel',
        email: 'dharmik@crm.com',
        password: salesPass,
        role: 'SALES',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('   └── Created initial admin accounts (admin@crm.com, dharmik@crm.com)');
  } else {
    console.log(`   └── ${userCount} existing users verified.`);
  }

  // 2. Organize 'website_users' Collection (Website Studio Creators)
  console.log('\n[2/7] Organizing website_users collection...');
  const webUsersCol = db.collection('website_users');
  await webUsersCol.createIndex({ email: 1 }, { unique: true });
  await webUsersCol.createIndex({ firebaseUid: 1 });
  console.log('   └── website_users indexes established.');

  // 3. Organize 'projects' Collection (AI Generated Websites)
  console.log('\n[3/7] Organizing projects collection...');
  const projectsCol = db.collection('projects');
  await projectsCol.createIndex({ id: 1 }, { unique: true });
  await projectsCol.createIndex({ userId: 1 });
  await projectsCol.createIndex({ ownerId: 1 });
  await projectsCol.createIndex({ category: 1 });

  // Migrate any local website projects if available
  const localProjectsFile = path.join(__dirname, '../website/data/projects.json');
  if (fs.existsSync(localProjectsFile)) {
    try {
      const localData = JSON.parse(fs.readFileSync(localProjectsFile, 'utf8'));
      if (Array.isArray(localData) && localData.length > 0) {
        for (const p of localData) {
          if (p.id) {
            await projectsCol.updateOne({ id: p.id }, { $set: p }, { upsert: true });
          }
        }
        console.log(`   └── Migrated ${localData.length} projects from local storage into MongoDB.`);
      }
    } catch (e) {
      console.warn('   └── Project file read deferred:', e.message);
    }
  }
  const projectCount = await projectsCol.countDocuments();
  console.log(`   └── Total active website projects in database: ${projectCount}`);

  // 4. Organize 'folders' Collection (CRM Lead Categories)
  console.log('\n[4/7] Organizing folders collection...');
  const foldersCol = db.collection('folders');
  await foldersCol.createIndex({ name: 1 });
  await foldersCol.createIndex({ category: 1 });

  const folderCount = await foldersCol.countDocuments();
  if (folderCount === 0) {
    await foldersCol.insertMany([
      {
        name: 'India Tech & SaaS Startups',
        description: 'Verified founders and CEOs in Bangalore & Mumbai',
        color: '#4F46E5',
        category: 'INDIA',
        datasetCount: 0,
        totalRecords: 0,
        leadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        name: 'US HealthCare Providers',
        description: 'Medical and healthcare clinics in California',
        color: '#059669',
        category: 'INTERNATIONAL',
        datasetCount: 0,
        totalRecords: 0,
        leadCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
    console.log('   └── Created default categorized folders (India & International).');
  } else {
    console.log(`   └── ${folderCount} folders verified.`);
  }

  // 5. Organize 'leads' Collection (CRM Pipeline)
  console.log('\n[5/7] Organizing leads collection...');
  const leadsCol = db.collection('leads');
  await leadsCol.createIndex({ email: 1 });
  await leadsCol.createIndex({ status: 1 });
  await leadsCol.createIndex({ phone: 1 });
  await leadsCol.createIndex({ userId: 1 });
  const leadCount = await leadsCol.countDocuments();
  console.log(`   └── ${leadCount} leads in database.`);

  // 6. Organize 'dynamic_records' & 'datasets' (Excel import system)
  console.log('\n[6/7] Organizing dataset & dynamic record collections...');
  const datasetsCol = db.collection('datasets');
  await datasetsCol.createIndex({ folderId: 1 });
  await datasetsCol.createIndex({ userId: 1 });

  const recordsCol = db.collection('dynamic_records');
  await recordsCol.createIndex({ datasetId: 1 });
  await recordsCol.createIndex({ folderId: 1 });
  console.log('   └── Dataset & dynamic records schema prepared.');

  // 7. Organize Cross-platform Activity & Reports Collections
  console.log('\n[7/7] Organizing platform activities, analytics & social collections...');
  const activitiesCol = db.collection('activities');
  await activitiesCol.createIndex({ createdAt: -1 });
  await activitiesCol.createIndex({ appId: 1 });

  const reportsCol = db.collection('reports');
  await reportsCol.createIndex({ businessName: 1 });

  const socialCol = db.collection('social_posts');
  await socialCol.createIndex({ platform: 1 });
  await socialCol.createIndex({ scheduledFor: 1 });

  // List all collections in nexus_os
  const collections = await db.listCollections().toArray();
  console.log('\n===============================================================');
  console.log(`🎉 Single Database "${mongoose.connection.name}" is now fully organized!`);
  console.log('Collections in database:');
  collections.forEach(c => console.log(`   • ${c.name}`));
  console.log('===============================================================\n');

  await mongoose.disconnect();
}

organizeDatabase().catch(err => {
  console.error('Database organization failed:', err);
  process.exit(1);
});
