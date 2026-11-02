import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ObjectId } from 'mongodb';
import { dbConnections, connectionStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BACKUP_FILE = path.join(__dirname, '..', 'data', 'user_access_requests.json');

// Master Super Admin who is permanently approved
export const MASTER_ADMIN_EMAIL = 'dharmik.tarasaka@gmail.com';

// Ensure backup folder exists
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
    console.warn('[UserAccess] Error reading backup file:', e.message);
  }
  return [];
}

// Save local backup file
function saveBackup(list) {
  ensureBackupDir();
  try {
    fs.writeFileSync(BACKUP_FILE, JSON.stringify(list, null, 2), 'utf8');
  } catch (e) {
    console.warn('[UserAccess] Error saving backup file:', e.message);
  }
}

// Helper to get collection if Mongo is available
function getCollection() {
  if (dbConnections.central && connectionStatus.central) {
    return dbConnections.central.collection('user_access_requests');
  }
  if (dbConnections.crm && connectionStatus.crm) {
    return dbConnections.crm.collection('user_access_requests');
  }
  return null;
}

/**
 * Record or update a user access request when someone attempts to log in or register.
 */
export async function recordAccessRequest({ uid, email, displayName, photoURL, provider = 'email' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required for access request');
  }

  const isMasterAdmin = normalizedEmail === MASTER_ADMIN_EMAIL;
  const col = getCollection();

  if (col) {
    try {
      const existing = await col.findOne({ email: normalizedEmail });
      const now = new Date();

      if (existing) {
        // If master admin, ensure always approved
        const status = isMasterAdmin ? 'APPROVED' : existing.status;
        const role = isMasterAdmin ? 'ADMIN' : (existing.role || 'USER');

        await col.updateOne(
          { _id: existing._id },
          {
            $set: {
              uid: uid || existing.uid,
              displayName: displayName || existing.displayName || normalizedEmail.split('@')[0],
              photoURL: photoURL || existing.photoURL || null,
              provider: provider || existing.provider || 'email',
              status,
              role,
              lastRequestedAt: now
            }
          }
        );

        return { ...existing, status, role, lastRequestedAt: now };
      }

      // New request record
      const initialStatus = isMasterAdmin ? 'APPROVED' : 'PENDING';
      const initialRole = isMasterAdmin ? 'ADMIN' : 'USER';

      const newRecord = {
        uid: uid || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        email: normalizedEmail,
        displayName: displayName || normalizedEmail.split('@')[0],
        photoURL: photoURL || null,
        provider,
        status: initialStatus,
        role: initialRole,
        requestedAt: now,
        lastRequestedAt: now,
        reviewedAt: isMasterAdmin ? now : null,
        reviewedBy: isMasterAdmin ? 'SYSTEM' : null
      };

      const result = await col.insertOne(newRecord);
      newRecord._id = result.insertedId;
      return newRecord;
    } catch (err) {
      console.warn('[UserAccess] Mongo error, falling back to local file:', err.message);
    }
  }

  // Local backup fallback
  const list = readBackup();
  let existingIndex = list.findIndex(r => r.email === normalizedEmail);
  const now = new Date().toISOString();

  if (existingIndex !== -1) {
    const existing = list[existingIndex];
    const status = isMasterAdmin ? 'APPROVED' : existing.status;
    const role = isMasterAdmin ? 'ADMIN' : (existing.role || 'USER');

    list[existingIndex] = {
      ...existing,
      uid: uid || existing.uid,
      displayName: displayName || existing.displayName,
      photoURL: photoURL || existing.photoURL,
      provider: provider || existing.provider,
      status,
      role,
      lastRequestedAt: now
    };
    saveBackup(list);
    return list[existingIndex];
  }

  const initialStatus = isMasterAdmin ? 'APPROVED' : 'PENDING';
  const initialRole = isMasterAdmin ? 'ADMIN' : 'USER';
  const newRecord = {
    _id: `rec_${Date.now()}`,
    uid: uid || `usr_${Date.now()}`,
    email: normalizedEmail,
    displayName: displayName || normalizedEmail.split('@')[0],
    photoURL: photoURL || null,
    provider,
    status: initialStatus,
    role: initialRole,
    requestedAt: now,
    lastRequestedAt: now,
    reviewedAt: isMasterAdmin ? now : null,
    reviewedBy: isMasterAdmin ? 'SYSTEM' : null
  };

  list.push(newRecord);
  saveBackup(list);
  return newRecord;
}

/**
 * Check approval status of a user.
 */
export async function checkUserStatus(email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  if (normalizedEmail === MASTER_ADMIN_EMAIL) {
    return { status: 'APPROVED', role: 'ADMIN', isMasterAdmin: true };
  }

  const col = getCollection();
  if (col) {
    try {
      const record = await col.findOne({ email: normalizedEmail });
      if (record) {
        return {
          status: record.status || 'PENDING',
          role: record.role || 'USER',
          record
        };
      }
    } catch (e) {
      // Fallback to local
    }
  }

  const list = readBackup();
  const record = list.find(r => r.email === normalizedEmail);
  if (record) {
    return {
      status: record.status || 'PENDING',
      role: record.role || 'USER',
      record
    };
  }

  return { status: 'PENDING', role: 'USER', record: null };
}

/**
 * Get all access requests with optional status filtering.
 */
export async function getAllRequests(statusFilter = null) {
  const col = getCollection();
  if (col) {
    try {
      const query = statusFilter ? { status: statusFilter } : {};
      const requests = await col.find(query).sort({ requestedAt: -1 }).toArray();
      return requests;
    } catch (err) {
      console.warn('[UserAccess] Mongo find error:', err.message);
    }
  }

  let list = readBackup();
  if (statusFilter) {
    list = list.filter(r => r.status === statusFilter);
  }
  return list.sort((a, b) => new Date(b.requestedAt || 0) - new Date(a.requestedAt || 0));
}

/**
 * Approve a user access request.
 */
export async function approveRequest(id, adminEmail = 'Super Admin') {
  const now = new Date();
  const col = getCollection();

  if (col) {
    try {
      const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
      const query = isObjId ? { _id: new ObjectId(id) } : { _id: id };

      const result = await col.findOneAndUpdate(
        query,
        {
          $set: {
            status: 'APPROVED',
            reviewedAt: now,
            reviewedBy: adminEmail
          }
        },
        { returnDocument: 'after' }
      );

      if (result) return result;
    } catch (err) {
      console.warn('[UserAccess] Mongo approve error:', err.message);
    }
  }

  const list = readBackup();
  const index = list.findIndex(r => String(r._id) === String(id) || String(r.uid) === String(id) || r.email === id);
  if (index !== -1) {
    list[index].status = 'APPROVED';
    list[index].reviewedAt = now.toISOString();
    list[index].reviewedBy = adminEmail;
    saveBackup(list);
    return list[index];
  }

  return null;
}

/**
 * Reject a user access request.
 */
export async function rejectRequest(id, adminEmail = 'Super Admin', reason = '') {
  const now = new Date();
  const col = getCollection();

  if (col) {
    try {
      const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
      const query = isObjId ? { _id: new ObjectId(id) } : { _id: id };

      const result = await col.findOneAndUpdate(
        query,
        {
          $set: {
            status: 'REJECTED',
            rejectionReason: reason || 'Access request was declined by the administrator.',
            reviewedAt: now,
            reviewedBy: adminEmail
          }
        },
        { returnDocument: 'after' }
      );

      if (result) return result;
    } catch (err) {
      console.warn('[UserAccess] Mongo reject error:', err.message);
    }
  }

  const list = readBackup();
  const index = list.findIndex(r => String(r._id) === String(id) || String(r.uid) === String(id) || r.email === id);
  if (index !== -1) {
    list[index].status = 'REJECTED';
    list[index].rejectionReason = reason || 'Access request was declined by the administrator.';
    list[index].reviewedAt = now.toISOString();
    list[index].reviewedBy = adminEmail;
    saveBackup(list);
    return list[index];
  }

  return null;
}

/**
 * Revoke or set an approved user back to PENDING.
 */
export async function revokeRequest(id, adminEmail = 'Super Admin') {
  const now = new Date();
  const col = getCollection();

  if (col) {
    try {
      const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
      const query = isObjId ? { _id: new ObjectId(id) } : { _id: id };

      const result = await col.findOneAndUpdate(
        query,
        {
          $set: {
            status: 'PENDING',
            reviewedAt: now,
            reviewedBy: adminEmail
          }
        },
        { returnDocument: 'after' }
      );

      if (result) return result;
    } catch (err) {
      console.warn('[UserAccess] Mongo revoke error:', err.message);
    }
  }

  const list = readBackup();
  const index = list.findIndex(r => String(r._id) === String(id) || String(r.uid) === String(id) || r.email === id);
  if (index !== -1) {
    list[index].status = 'PENDING';
    list[index].reviewedAt = now.toISOString();
    list[index].reviewedBy = adminEmail;
    saveBackup(list);
    return list[index];
  }

  return null;
}

/**
 * Delete access request.
 */
export async function deleteRequest(id) {
  const col = getCollection();
  if (col) {
    try {
      const isObjId = ObjectId.isValid(id) && String(new ObjectId(id)) === id;
      const query = isObjId ? { _id: new ObjectId(id) } : { _id: id };
      const res = await col.deleteOne(query);
      if (res.deletedCount > 0) return true;
    } catch (err) {
      console.warn('[UserAccess] Mongo delete error:', err.message);
    }
  }

  let list = readBackup();
  const before = list.length;
  list = list.filter(r => String(r._id) !== String(id) && String(r.uid) !== String(id) && r.email !== id);
  saveBackup(list);
  return list.length < before;
}

/**
 * Summary statistics.
 */
export async function getAccessStats() {
  const all = await getAllRequests();
  return {
    total: all.length,
    pending: all.filter(r => r.status === 'PENDING').length,
    approved: all.filter(r => r.status === 'APPROVED').length,
    rejected: all.filter(r => r.status === 'REJECTED').length
  };
}
