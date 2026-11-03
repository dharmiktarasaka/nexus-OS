"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dns_1 = __importDefault(require("dns"));
const mongoose_1 = __importDefault(require("mongoose"));
const env_js_1 = require("./config/env.js");
dns_1.default.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
async function main() {
    const uri = env_js_1.config.mongoUri;
    console.log('Connecting with URI length:', uri ? uri.length : 0);
    const conn = await mongoose_1.default.connect(uri, {
        dbName: 'stratiq_db',
        serverSelectionTimeoutMS: 10000
    });
    console.log('Connected! Host:', conn.connection.host, 'DB:', conn.connection.name);
    const collections = await mongoose_1.default.connection.db?.listCollections().toArray();
    console.log('Collections:', collections?.map(c => c.name));
    if (collections) {
        for (const c of collections) {
            const count = await mongoose_1.default.connection.db?.collection(c.name).countDocuments();
            console.log(` - ${c.name}: ${count} documents`);
        }
    }
    await mongoose_1.default.disconnect();
}
main().catch(err => {
    console.error('Atlas error:', err.message);
    process.exit(1);
});
