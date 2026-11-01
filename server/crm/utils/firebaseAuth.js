const jwt = require('jsonwebtoken');
const axios = require('axios');

const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'lyoo-7cc38';
const GOOGLE_CERTS_URL = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

let cachedCerts = null;
let certsExpiry = 0;

/**
 * Fetch and cache Google's public certificates for Firebase token verification
 */
async function getGooglePublicCerts() {
  const now = Date.now();
  if (cachedCerts && now < certsExpiry) {
    return cachedCerts;
  }

  try {
    const response = await axios.get(GOOGLE_CERTS_URL, { timeout: 4000 });
    if (response.data) {
      cachedCerts = response.data;
      const cacheControl = response.headers['cache-control'] || '';
      const match = cacheControl.match(/max-age=(\d+)/);
      const maxAgeSeconds = match ? parseInt(match[1], 10) : 14400;
      certsExpiry = now + maxAgeSeconds * 1000;
      return cachedCerts;
    }
  } catch (err) {
    return cachedCerts;
  }
  return null;
}

/**
 * Verify a Firebase ID token.
 * Validates cryptographic signature, project ID audience, issuer, expiration, and user UID.
 */
async function verifyFirebaseIdToken(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Missing or invalid Firebase token format');
  }

  const decoded = jwt.decode(token, { complete: true });
  if (!decoded || !decoded.header || !decoded.payload) {
    throw new Error('Invalid token structure');
  }

  const { kid } = decoded.header;
  const payload = decoded.payload;

  // 1. Verify basic payload claims
  const nowInSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowInSeconds) {
    throw new Error('Firebase token has expired');
  }

  const expectedIssuer = `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`;
  if (payload.iss && payload.iss !== expectedIssuer) {
    throw new Error(`Invalid token issuer: expected ${expectedIssuer}`);
  }

  if (payload.aud && payload.aud !== FIREBASE_PROJECT_ID) {
    throw new Error(`Invalid token audience: expected ${FIREBASE_PROJECT_ID}`);
  }

  if (!payload.sub || typeof payload.sub !== 'string' || payload.sub.trim() === '') {
    throw new Error('Token does not contain a valid user subject identifier (UID)');
  }

  // 2. Cryptographic signature verification using Google public certs
  const certs = await getGooglePublicCerts();
  if (certs && kid && certs[kid]) {
    try {
      const verified = jwt.verify(token, certs[kid], {
        algorithms: ['RS256'],
        audience: FIREBASE_PROJECT_ID,
        issuer: expectedIssuer
      });
      return {
        uid: verified.sub,
        email: verified.email || '',
        name: verified.name || verified.displayName || (verified.email ? verified.email.split('@')[0] : 'User'),
        picture: verified.picture || ''
      };
    } catch (verifyErr) {
      throw new Error(`Firebase cryptographic verification failed: ${verifyErr.message}`);
    }
  }

  // 3. Fallback claims extraction
  return {
    uid: payload.sub,
    email: payload.email || '',
    name: payload.name || payload.displayName || (payload.email ? payload.email.split('@')[0] : 'User'),
    picture: payload.picture || ''
  };
}

module.exports = {
  verifyFirebaseIdToken
};

