// server/authRoutes.js - MongoDB User Authentication & Synchronization
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const { isMongoConnected } = require('./db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'pulse-studio-secure-mongodb-secret-2026';

// Helper to sign JWT
function generateToken(user) {
  return jwt.sign(
    {
      id: user._id ? user._id.toString() : user.id,
      email: user.email,
      role: user.role || 'creator'
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
}

// In-memory / file fallback for users if MongoDB is temporarily connecting
const localUsersMemory = new Map();

// 1. REGISTER USER IN MONGODB
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      // Check if user already exists in MongoDB
      const existing = await User.findOne({ email: cleanEmail });
      if (existing) {
        return res.status(400).json({ error: 'An account already exists with this email in MongoDB.' });
      }

      // Create new user in MongoDB
      const newUser = new User({
        email: cleanEmail,
        password: password,
        displayName: displayName || cleanEmail.split('@')[0],
        authProvider: 'local',
        role: 'creator',
        lastLoginAt: new Date()
      });

      await newUser.save();
      console.log(`[Auth] Registered new user in MongoDB: ${cleanEmail}`);

      const token = generateToken(newUser);
      return res.status(201).json({
        token,
        user: newUser.toSafeObject(),
        storedIn: 'mongodb'
      });
    }

    // Local fallback if MongoDB is not connected
    if (localUsersMemory.has(cleanEmail)) {
      return res.status(400).json({ error: 'An account already exists with this email.' });
    }

    const fallbackUser = {
      id: 'usr_' + Date.now(),
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      photoURL: '',
      role: 'creator',
      authProvider: 'local',
      createdAt: new Date().toISOString()
    };
    localUsersMemory.set(cleanEmail, { ...fallbackUser, password });

    const token = generateToken(fallbackUser);
    res.status(201).json({
      token,
      user: fallbackUser,
      storedIn: 'local-resilient'
    });
  } catch (err) {
    console.error('[Auth /register] Error:', err);
    res.status(500).json({ error: 'Registration failed: ' + err.message });
  }
});

// 2. LOGIN USER FROM MONGODB
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      const user = await User.findOne({ email: cleanEmail });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password. No account found in MongoDB.' });
      }

      const isMatch = await user.comparePassword(password);
      if (!isMatch) {
        return res.status(401).json({ error: 'Invalid password. Please check your credentials.' });
      }

      user.lastLoginAt = new Date();
      await user.save();
      console.log(`[Auth] User logged in from MongoDB: ${cleanEmail}`);

      const token = generateToken(user);
      return res.json({
        token,
        user: user.toSafeObject(),
        storedIn: 'mongodb'
      });
    }

    // Local fallback
    const localUser = localUsersMemory.get(cleanEmail);
    if (!localUser || localUser.password !== password) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = generateToken(localUser);
    res.json({
      token,
      user: localUser,
      storedIn: 'local-resilient'
    });
  } catch (err) {
    console.error('[Auth /login] Error:', err);
    res.status(500).json({ error: 'Login failed: ' + err.message });
  }
});

// 3. SYNC FIREBASE / GOOGLE / QA USER TO MONGODB
// This endpoint guarantees that ANY user who logs in via Firebase or Google is stored in MongoDB!
router.post('/sync', async (req, res) => {
  try {
    const { email, displayName, photoURL, firebaseUid, authProvider } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'User email is required for database sync.' });
    }

    const cleanEmail = email.toLowerCase().trim();

    if (isMongoConnected()) {
      // Upsert into MongoDB
      const updatedUser = await User.findOneAndUpdate(
        { email: cleanEmail },
        {
          $set: {
            email: cleanEmail,
            displayName: displayName || cleanEmail.split('@')[0],
            photoURL: photoURL || '',
            firebaseUid: firebaseUid || '',
            authProvider: authProvider || 'firebase',
            lastLoginAt: new Date()
          },
          $setOnInsert: {
            role: cleanEmail.includes('qa') || cleanEmail.includes('admin') ? 'admin' : 'creator',
            createdAt: new Date()
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log(`[Auth] Synchronized user into MongoDB: ${cleanEmail} (Provider: ${authProvider || 'firebase'})`);
      const token = generateToken(updatedUser);

      return res.json({
        token,
        user: updatedUser.toSafeObject(),
        storedIn: 'mongodb'
      });
    }

    // Fallback response
    const safeUser = {
      id: firebaseUid || 'usr_' + Date.now(),
      email: cleanEmail,
      displayName: displayName || cleanEmail.split('@')[0],
      photoURL: photoURL || '',
      role: 'creator',
      authProvider: authProvider || 'guest'
    };

    res.json({
      token: generateToken(safeUser),
      user: safeUser,
      storedIn: 'local-resilient'
    });
  } catch (err) {
    console.error('[Auth /sync] Error:', err);
    res.status(500).json({ error: 'User sync failed: ' + err.message });
  }
});

// 4. GET CURRENT AUTHENTICATED USER
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No authentication token provided.' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (_err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (isMongoConnected()) {
      const user = await User.findById(decoded.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found in MongoDB.' });
      }
      return res.json({ user: user.toSafeObject(), storedIn: 'mongodb' });
    }

    res.json({ user: decoded, storedIn: 'local' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify session: ' + err.message });
  }
});

// 5. GET ALL USERS (FOR ADMIN & DATABASE STATS)
router.get('/users', async (req, res) => {
  try {
    if (isMongoConnected()) {
      const users = await User.find().sort({ createdAt: -1 }).select('-password').lean();
      return res.json({
        total: users.length,
        users: users.map(u => ({
          id: u._id.toString(),
          email: u.email,
          displayName: u.displayName,
          role: u.role,
          authProvider: u.authProvider,
          lastLoginAt: u.lastLoginAt,
          createdAt: u.createdAt
        }))
      });
    }

    res.json({
      total: localUsersMemory.size,
      users: Array.from(localUsersMemory.values()).map(u => ({
        id: u.id,
        email: u.email,
        displayName: u.displayName,
        role: u.role,
        authProvider: u.authProvider
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list users: ' + err.message });
  }
});

module.exports = router;
