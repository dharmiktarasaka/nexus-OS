"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = connectDB;
exports.isUsingFallbackStore = isUsingFallbackStore;
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("../config/env.js");
// Resolve MongoDB Atlas SRV records reliably even if local DNS rejects SRV lookups (ECONNREFUSED)
try {
    dns_1.default.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
}
catch (e) {
    console.warn('Could not set custom DNS servers:', e.message);
}
let isConnected = false;
let isInMemoryFallback = !env_js_1.config.mongoUri;
async function connectDB() {
    if (isConnected)
        return true;
    if (!env_js_1.config.mongoUri) {
        console.warn('⚠️ [MongoDB] MONGODB_URI not set. Running in resilient In-Memory Store mode for development.');
        isInMemoryFallback = true;
        return false;
    }
    try {
        const conn = await mongoose_1.default.connect(env_js_1.config.mongoUri, {
            dbName: 'stratiq_db',
            serverSelectionTimeoutMS: 10000,
            autoIndex: true
        });
        isConnected = true;
        isInMemoryFallback = false;
        console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host} (DB: ${conn.connection.name})`);
        return true;
    }
    catch (error) {
        console.error('❌ [MongoDB] Connection error:', error.message);
        console.warn('⚠️ [MongoDB] Switching to In-Memory Store fallback to keep application fully functional.');
        isInMemoryFallback = true;
        return false;
    }
}
function isUsingFallbackStore() {
    if (!env_js_1.config.mongoUri)
        return true;
    return isInMemoryFallback;
}
