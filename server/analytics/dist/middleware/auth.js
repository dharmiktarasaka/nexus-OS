"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateToken = generateToken;
exports.verifyToken = verifyToken;
exports.requireAuth = requireAuth;
const crypto_1 = __importDefault(require("crypto"));
const repository_js_1 = require("../db/repository.js");
const JWT_SECRET = process.env.JWT_SECRET || 'stratiq_enterprise_secret_2026';
function generateToken(payload) {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
    const body = Buffer.from(JSON.stringify({ ...payload, exp: Date.now() + 30 * 24 * 60 * 60 * 1000 })).toString('base64url');
    const signature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
    return `${header}.${body}.${signature}`;
}
function verifyToken(token) {
    try {
        const parts = token.split('.');
        if (parts.length !== 3)
            return null;
        const [header, body, signature] = parts;
        const expectedSignature = crypto_1.default.createHmac('sha256', JWT_SECRET).update(`${header}.${body}`).digest('base64url');
        if (signature !== expectedSignature)
            return null;
        const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf-8'));
        if (payload.exp && Date.now() > payload.exp)
            return null;
        return payload;
    }
    catch {
        return null;
    }
}
async function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    const devUserIdHeader = req.headers['x-user-id'];
    const devUserEmailHeader = req.headers['x-user-email'];
    const devUserNameHeader = req.headers['x-user-name'];
    // 1. Verify Bearer token
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split('Bearer ')[1].trim();
        // Check custom JWT
        const decoded = verifyToken(token);
        if (decoded) {
            const dbUser = await repository_js_1.repository.getUserByUid(decoded.uid);
            req.user = {
                uid: decoded.uid,
                email: decoded.email,
                name: dbUser?.displayName || decoded.name || 'Executive User',
                mobileNumber: dbUser?.mobileNumber,
                yearlyRevenue: dbUser?.yearlyRevenue,
                picture: dbUser?.photoURL
            };
            return next();
        }
        // Support dev tokens or legacy base64 tokens
        if (token.startsWith('dev_token_') || token.startsWith('eyJ')) {
            try {
                const parts = token.split('.');
                if (parts.length >= 2) {
                    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
                    req.user = {
                        uid: payload.uid || payload.sub || 'dev_user_1',
                        email: payload.email || 'developer@example.com',
                        name: payload.name || 'Executive User'
                    };
                    return next();
                }
            }
            catch {
                // ignore
            }
        }
    }
    // 2. Fallback header for development
    if (devUserIdHeader) {
        const dbUser = await repository_js_1.repository.getUserByUid(devUserIdHeader);
        req.user = {
            uid: devUserIdHeader,
            email: devUserEmailHeader || dbUser?.email || 'user@example.com',
            name: devUserNameHeader || dbUser?.displayName || 'Executive Leader',
            mobileNumber: dbUser?.mobileNumber,
            yearlyRevenue: dbUser?.yearlyRevenue
        };
        return next();
    }
    res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in.'
    });
}
