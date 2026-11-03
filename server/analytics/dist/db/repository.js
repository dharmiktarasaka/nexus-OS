"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.repository = void 0;
const schemas_js_1 = require("../models/schemas.js");
const connection_js_1 = require("./connection.js");
// In-Memory store tables for resilient local development / offline demo
class MemoryStorage {
    users = new Map();
    profiles = new Map();
    analyses = new Map();
    conversations = new Map();
    messages = new Map();
    reports = new Map();
    actionItems = new Map();
    settings = new Map();
}
const memoryStore = new MemoryStorage();
exports.repository = {
    // --- USERS ---
    async getAllUsers() {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.UserModel.find().sort({ createdAt: -1 }).lean();
                return (docs || []);
            }
            catch (err) {
                console.warn('Error querying MongoDB for getAllUsers:', err.message);
                return [];
            }
        }
        return Array.from(memoryStore.users.values()).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async deleteUser(uid) {
        await this.purgeAccount(uid);
        return true;
    },
    async upsertUser(user) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.UserModel.findOneAndUpdate({ uid: user.uid }, { $set: user }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for upsertUser:', err.message);
            }
        }
        memoryStore.users.set(user.uid, user);
        return user;
    },
    async getUserByUid(uid) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.UserModel.findOne({ uid }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getUserByUid:', err.message);
            }
        }
        return memoryStore.users.get(uid) || null;
    },
    async getUserByEmail(email) {
        const cleanEmail = email.trim().toLowerCase();
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.UserModel.findOne({ email: cleanEmail }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getUserByEmail:', err.message);
            }
        }
        for (const u of memoryStore.users.values()) {
            if (u.email.toLowerCase() === cleanEmail)
                return u;
        }
        return null;
    },
    // --- BUSINESS PROFILES ---
    async getBusinessesByOwner(ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.BusinessProfileModel.find({ ownerId }).sort({ updatedAt: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getBusinessesByOwner:', err.message);
            }
        }
        return Array.from(memoryStore.profiles.values())
            .filter((p) => p.ownerId === ownerId)
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    },
    async getBusinessById(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.BusinessProfileModel.findOne({ id, ownerId }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getBusinessById:', err.message);
            }
        }
        const item = memoryStore.profiles.get(id);
        if (item && item.ownerId === ownerId)
            return item;
        return null;
    },
    async saveBusiness(profile) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.BusinessProfileModel.findOneAndUpdate({ id: profile.id, ownerId: profile.ownerId }, { $set: profile }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveBusiness:', err.message);
            }
        }
        memoryStore.profiles.set(profile.id, profile);
        return profile;
    },
    async deleteBusiness(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                await Promise.all([
                    schemas_js_1.BusinessProfileModel.deleteOne({ id, ownerId }),
                    schemas_js_1.BusinessAnalysisModel.deleteMany({ businessId: id, ownerId }),
                    schemas_js_1.ConversationModel.deleteMany({ businessId: id, ownerId }),
                    schemas_js_1.ChatMessageModel.deleteMany({ businessId: id, ownerId }),
                    schemas_js_1.ReportModel.deleteMany({ businessId: id, ownerId }),
                    schemas_js_1.ActionItemModel.deleteMany({ businessId: id, ownerId })
                ]);
                return true;
            }
            catch (err) {
                console.warn('Fallback to memory for deleteBusiness:', err.message);
            }
        }
        memoryStore.profiles.delete(id);
        for (const [k, v] of memoryStore.analyses.entries()) {
            if (v.businessId === id && v.ownerId === ownerId)
                memoryStore.analyses.delete(k);
        }
        for (const [k, v] of memoryStore.conversations.entries()) {
            if (v.businessId === id && v.ownerId === ownerId)
                memoryStore.conversations.delete(k);
        }
        for (const [k, v] of memoryStore.messages.entries()) {
            if (v.businessId === id && v.ownerId === ownerId)
                memoryStore.messages.delete(k);
        }
        for (const [k, v] of memoryStore.reports.entries()) {
            if (v.businessId === id && v.ownerId === ownerId)
                memoryStore.reports.delete(k);
        }
        for (const [k, v] of memoryStore.actionItems.entries()) {
            if (v.businessId === id && v.ownerId === ownerId)
                memoryStore.actionItems.delete(k);
        }
        return true;
    },
    // --- ANALYSES ---
    async getAnalysesByOwner(ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.BusinessAnalysisModel.find({ ownerId }).sort({ createdAt: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getAnalysesByOwner:', err.message);
            }
        }
        return Array.from(memoryStore.analyses.values())
            .filter((a) => a.ownerId === ownerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async getAnalysesByBusiness(businessId, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.BusinessAnalysisModel.find({ businessId, ownerId }).sort({ createdAt: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getAnalysesByBusiness:', err.message);
            }
        }
        return Array.from(memoryStore.analyses.values())
            .filter((a) => a.businessId === businessId && a.ownerId === ownerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async getAnalysisById(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.BusinessAnalysisModel.findOne({ id, ownerId }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getAnalysisById:', err.message);
            }
        }
        const item = memoryStore.analyses.get(id);
        if (item && item.ownerId === ownerId)
            return item;
        return null;
    },
    async saveAnalysis(analysis) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.BusinessAnalysisModel.findOneAndUpdate({ id: analysis.id, ownerId: analysis.ownerId }, { $set: analysis }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveAnalysis:', err.message);
            }
        }
        memoryStore.analyses.set(analysis.id, analysis);
        return analysis;
    },
    // --- CONVERSATIONS & CHAT ---
    async getConversations(businessId, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.ConversationModel.find({ businessId, ownerId }).sort({ lastMessageAt: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getConversations:', err.message);
            }
        }
        return Array.from(memoryStore.conversations.values())
            .filter((c) => c.businessId === businessId && c.ownerId === ownerId)
            .sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    },
    async getConversationById(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ConversationModel.findOne({ id, ownerId }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getConversationById:', err.message);
            }
        }
        const item = memoryStore.conversations.get(id);
        if (item && item.ownerId === ownerId)
            return item;
        return null;
    },
    async saveConversation(conv) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ConversationModel.findOneAndUpdate({ id: conv.id, ownerId: conv.ownerId }, { $set: conv }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveConversation:', err.message);
            }
        }
        memoryStore.conversations.set(conv.id, conv);
        return conv;
    },
    async getMessagesByConversation(conversationId, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.ChatMessageModel.find({ conversationId, ownerId }).sort({ createdAt: 1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getMessagesByConversation:', err.message);
            }
        }
        return Array.from(memoryStore.messages.values())
            .filter((m) => m.conversationId === conversationId && m.ownerId === ownerId)
            .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    async saveChatMessage(message) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ChatMessageModel.findOneAndUpdate({ id: message.id, ownerId: message.ownerId }, { $set: message }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveChatMessage:', err.message);
            }
        }
        memoryStore.messages.set(message.id, message);
        return message;
    },
    // --- REPORTS ---
    async getReportsByBusiness(businessId, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.ReportModel.find({ businessId, ownerId }).sort({ version: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getReportsByBusiness:', err.message);
            }
        }
        return Array.from(memoryStore.reports.values())
            .filter((r) => r.businessId === businessId && r.ownerId === ownerId)
            .sort((a, b) => b.version - a.version);
    },
    async getReportById(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ReportModel.findOne({ id, ownerId }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getReportById:', err.message);
            }
        }
        const item = memoryStore.reports.get(id);
        if (item && item.ownerId === ownerId)
            return item;
        return null;
    },
    async saveReport(report) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ReportModel.findOneAndUpdate({ id: report.id, ownerId: report.ownerId }, { $set: report }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveReport:', err.message);
            }
        }
        memoryStore.reports.set(report.id, report);
        return report;
    },
    // --- ACTION ITEMS ---
    async getActionItems(businessId, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const docs = await schemas_js_1.ActionItemModel.find({ businessId, ownerId }).sort({ createdAt: -1 }).lean();
                return docs;
            }
            catch (err) {
                console.warn('Fallback to memory for getActionItems:', err.message);
            }
        }
        return Array.from(memoryStore.actionItems.values())
            .filter((a) => a.businessId === businessId && a.ownerId === ownerId)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    async saveActionItem(item) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.ActionItemModel.findOneAndUpdate({ id: item.id, ownerId: item.ownerId }, { $set: item }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for saveActionItem:', err.message);
            }
        }
        memoryStore.actionItems.set(item.id, item);
        return item;
    },
    async deleteActionItem(id, ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                await schemas_js_1.ActionItemModel.deleteOne({ id, ownerId });
                return true;
            }
            catch (err) {
                console.warn('Fallback to memory for deleteActionItem:', err.message);
            }
        }
        const item = memoryStore.actionItems.get(id);
        if (item && item.ownerId === ownerId) {
            memoryStore.actionItems.delete(id);
            return true;
        }
        return false;
    },
    // --- SETTINGS ---
    async getSettings(ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.UserSettingsModel.findOne({ ownerId }).lean();
                if (doc)
                    return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for getSettings:', err.message);
            }
        }
        const existing = memoryStore.settings.get(ownerId);
        if (existing)
            return existing;
        const defaultSettings = {
            ownerId,
            notificationsEnabled: true,
            emailReports: false,
            theme: 'dark',
            preferredCurrency: 'USD',
            aiCreativity: 'balanced',
            updatedAt: new Date()
        };
        memoryStore.settings.set(ownerId, defaultSettings);
        return defaultSettings;
    },
    async updateSettings(ownerId, partial) {
        const current = await this.getSettings(ownerId);
        const updated = { ...current, ...partial, updatedAt: new Date() };
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                const doc = await schemas_js_1.UserSettingsModel.findOneAndUpdate({ ownerId }, { $set: updated }, { upsert: true, new: true }).lean();
                return doc;
            }
            catch (err) {
                console.warn('Fallback to memory for updateSettings:', err.message);
            }
        }
        memoryStore.settings.set(ownerId, updated);
        return updated;
    },
    // --- COMPLETE ACCOUNT PURGE (GDPR / Privacy Compliance) ---
    async purgeAccount(ownerId) {
        if (!(0, connection_js_1.isUsingFallbackStore)()) {
            try {
                await Promise.all([
                    schemas_js_1.UserModel.deleteOne({ uid: ownerId }),
                    schemas_js_1.BusinessProfileModel.deleteMany({ ownerId }),
                    schemas_js_1.BusinessAnalysisModel.deleteMany({ ownerId }),
                    schemas_js_1.ConversationModel.deleteMany({ ownerId }),
                    schemas_js_1.ChatMessageModel.deleteMany({ ownerId }),
                    schemas_js_1.ReportModel.deleteMany({ ownerId }),
                    schemas_js_1.ActionItemModel.deleteMany({ ownerId }),
                    schemas_js_1.UserSettingsModel.deleteOne({ ownerId })
                ]);
            }
            catch (err) {
                console.warn('Fallback to memory for purgeAccount:', err.message);
            }
        }
        memoryStore.users.delete(ownerId);
        for (const [k, v] of memoryStore.profiles.entries())
            if (v.ownerId === ownerId)
                memoryStore.profiles.delete(k);
        for (const [k, v] of memoryStore.analyses.entries())
            if (v.ownerId === ownerId)
                memoryStore.analyses.delete(k);
        for (const [k, v] of memoryStore.conversations.entries())
            if (v.ownerId === ownerId)
                memoryStore.conversations.delete(k);
        for (const [k, v] of memoryStore.messages.entries())
            if (v.ownerId === ownerId)
                memoryStore.messages.delete(k);
        for (const [k, v] of memoryStore.reports.entries())
            if (v.ownerId === ownerId)
                memoryStore.reports.delete(k);
        for (const [k, v] of memoryStore.actionItems.entries())
            if (v.ownerId === ownerId)
                memoryStore.actionItems.delete(k);
        memoryStore.settings.delete(ownerId);
    }
};
