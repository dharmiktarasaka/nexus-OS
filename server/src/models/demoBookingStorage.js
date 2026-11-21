import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import { dbConnections, connectionStatus } from '../config/db.js';

const ObjectId = mongoose.Types.ObjectId;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'demo_bookings.json');

// Ensure data backup folder exists
function ensureBackupDir() {
  const dir = path.dirname(BACKUP_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Read local backup file
function readBackup() {
  ensureBackupDir();
  try {
    if (fs.existsSync(BACKUP_FILE)) {
      const data = fs.readFileSync(BACKUP_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.warn('[DemoBooking] Error reading backup file:', e.message);
  }
  return [];
}

// Save local backup file
function saveBackup(list) {
  ensureBackupDir();
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[DemoBooking] Error saving backup file:', e.message);
  }
}

// Helper to get collection if Mongo is available
function getCollection() {
  if (dbConnections.central && connectionStatus.central) {
    return dbConnections.central.collection('demo_bookings');
  }
  if (dbConnections.crm && connectionStatus.crm) {
    return dbConnections.crm.collection('demo_bookings');
  }
  return null;
}

/**
 * Create a new demo booking inquiry
 */
export async function createDemoBooking({
  name,
  email,
  phone,
  company = '',
  preferredDate = '',
  notes = '',
  source = 'main-website'
}) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const trimmedName = (name || '').trim();
  const trimmedPhone = (phone || '').trim();

  if (!trimmedName) throw new Error('User name is required');
  if (!normalizedEmail) throw new Error('Gmail / Email address is required');
  if (!trimmedPhone) throw new Error('Contact number is required');

  const now = new Date();
  const bookingData = {
    name: trimmedName,
    email: normalizedEmail,
    phone: trimmedPhone,
    company: (company || '').trim(),
    preferredDate: (preferredDate || '').trim(),
    notes: (notes || '').trim(),
    source: source || 'main-website',
    status: 'NEW', // 'NEW' | 'CONTACTED' | 'SCHEDULED' | 'COMPLETED'
    adminNotes: '',
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  const col = getCollection();

  if (col) {
    try {
      const res = await col.insertOne(bookingData);
      bookingData._id = res.insertedId.toString();

      // Mirror to local backup
      const local = readBackup();
      local.unshift(bookingData);
      saveBackup(local);

      // Optionally insert into CRM leads as well if CRM db connected
      if (dbConnections.crm && connectionStatus.crm) {
        try {
          const leadsCol = dbConnections.crm.collection('leads');
          await leadsCol.insertOne({
            name: trimmedName,
            email: normalizedEmail,
            phone: trimmedPhone,
            company: company || 'Demo Prospect',
            status: 'NEW',
            source: `Demo Booking (${source})`,
            value: 0,
            notes: notes || 'Booked demo via SYS platform',
            createdAt: now,
            updatedAt: now
          });
        } catch (crmErr) {
          // Non-critical
        }
      }

      return bookingData;
    } catch (err) {
      console.warn('[DemoBooking] Mongo write failed, falling back to local file:', err.message);
    }
  }

  // Local storage fallback
  const local = readBackup();
  bookingData._id = `demo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  local.unshift(bookingData);
  saveBackup(local);

  return bookingData;
}

/**
 * Retrieve all demo bookings with optional status filter
 */
export async function getAllDemoBookings(statusFilter = null) {
  const col = getCollection();

  if (col) {
    try {
      const query = statusFilter && statusFilter !== 'ALL' ? { status: statusFilter } : {};
      const items = await col.find(query).sort({ createdAt: -1 }).toArray();
      return items.map(doc => ({
        ...doc,
        _id: doc._id.toString()
      }));
    } catch (err) {
      console.warn('[DemoBooking] Mongo read failed, using backup:', err.message);
    }
  }

  const local = readBackup();
  if (!statusFilter || statusFilter === 'ALL') {
    return local;
  }
  return local.filter(b => b.status === statusFilter);
}

/**
 * Update demo booking status and optional admin notes
 */
export async function updateDemoBookingStatus(id, status, adminNotes = null) {
  const col = getCollection();
  const now = new Date().toISOString();

  if (col) {
    try {
      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch {
        query = { _id: id };
      }

      const updateFields = {
        status,
        updatedAt: now
      };
      if (adminNotes !== null && adminNotes !== undefined) {
        updateFields.adminNotes = adminNotes;
      }

      await col.updateOne(query, { $set: updateFields });
    } catch (err) {
      console.warn('[DemoBooking] Mongo status update failed:', err.message);
    }
  }

  // Update in local backup
  const local = readBackup();
  const index = local.findIndex(b => b._id === id || b._id?.toString() === id);
  if (index !== -1) {
    local[index].status = status;
    local[index].updatedAt = now;
    if (adminNotes !== null && adminNotes !== undefined) {
      local[index].adminNotes = adminNotes;
    }
    saveBackup(local);
    return local[index];
  }

  return null;
}

/**
 * Delete a demo booking
 */
export async function deleteDemoBooking(id) {
  const col = getCollection();

  if (col) {
    try {
      let query;
      try {
        query = { _id: new ObjectId(id) };
      } catch {
        query = { _id: id };
      }
      await col.deleteOne(query);
    } catch (err) {
      console.warn('[DemoBooking] Mongo delete failed:', err.message);
    }
  }

  const local = readBackup();
  const next = local.filter(b => b._id !== id && b._id?.toString() !== id);
  saveBackup(next);
  return true;
}

/**
 * Aggregate counts for the admin dashboard
 */
export async function getDemoBookingStats() {
  const all = await getAllDemoBookings();
  const counts = {
    total: all.length,
    newCount: 0,
    contacted: 0,
    scheduled: 0,
    completed: 0
  };

  all.forEach(b => {
    const s = (b.status || 'NEW').toUpperCase();
    if (s === 'NEW') counts.newCount++;
    else if (s === 'CONTACTED') counts.contacted++;
    else if (s === 'SCHEDULED') counts.scheduled++;
    else if (s === 'COMPLETED') counts.completed++;
  });

  return counts;
}
