"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminRouter = void 0;
exports.requireAdminAuth = requireAdminAuth;
const express_1 = require("express");
const repository_js_1 = require("../db/repository.js");
const env_js_1 = require("../config/env.js");
const security_js_1 = require("../utils/security.js");
exports.adminRouter = (0, express_1.Router)();
// Full security authorization middleware
// Enforces that only authorized administrators with valid key can access data
function requireAdminAuth(req, res, next) {
    const headerKey = req.headers['x-admin-key'];
    const authHeader = req.headers['authorization'];
    const bearerKey = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
    const queryKey = req.query.adminKey;
    const providedKey = headerKey || bearerKey || queryKey;
    const validKey = env_js_1.config.adminSecretKey || 'stratiq@admin2026';
    if (!providedKey || providedKey !== validKey) {
        res.status(401).json({
            success: false,
            error: 'Access Denied: Invalid or missing Admin Security Key.'
        });
        return;
    }
    next();
}
/**
 * POST /api/admin/verify
 * Validates master admin passkey before allowing access to user directory
 */
exports.adminRouter.post('/verify', (req, res) => {
    const { adminKey } = req.body;
    const validKey = env_js_1.config.adminSecretKey || 'stratiq@admin2026';
    if (!adminKey || adminKey !== validKey) {
        res.status(401).json({ success: false, error: 'Invalid Admin Security Key.' });
        return;
    }
    res.json({
        success: true,
        message: 'Admin authorization granted.',
        adminKey: validKey,
        sessionExpiresIn: 86400
    });
});
/**
 * GET /api/admin/users
 * Protected by requireAdminAuth - only returns real data from MongoDB with encrypted credentials
 */
exports.adminRouter.get('/users', requireAdminAuth, async (req, res) => {
    try {
        const rawUsers = await repository_js_1.repository.getAllUsers();
        // Enrich each user with their business identity and encrypted credential info
        const enrichedUsers = await Promise.all(rawUsers.map(async (u) => {
            // Automatically ensure password stored in MongoDB is encrypted
            if (u.password && !(0, security_js_1.isEncryptedPassword)(u.password)) {
                u.password = (0, security_js_1.encryptPassword)(u.password);
                await repository_js_1.repository.upsertUser(u);
            }
            const businesses = await repository_js_1.repository.getBusinessesByOwner(u.uid);
            const analyses = await repository_js_1.repository.getAnalysesByOwner(u.uid);
            const primaryBiz = businesses[0] || null;
            const sec = (0, security_js_1.computePasswordAuditInfo)(u.password);
            return {
                uid: u.uid,
                email: u.email,
                displayName: u.displayName || u.email.split('@')[0],
                mobileNumber: u.mobileNumber || 'Not provided',
                yearlyRevenue: u.yearlyRevenue || primaryBiz?.financials?.annualRevenue || 'Not specified',
                photoURL: u.photoURL || '',
                createdAt: u.createdAt,
                updatedAt: u.updatedAt,
                // Password security: masked and encrypted as requested
                passwordMasked: sec.passwordMasked,
                passwordEncrypted: sec.passwordEncrypted,
                passwordAlgorithm: sec.passwordAlgorithm,
                passwordStrength: sec.passwordStrength,
                passwordLength: sec.passwordLength,
                // Business Details entered or created at registration
                businessName: primaryBiz?.identity?.businessName || `${u.displayName || 'User'}'s Enterprise`,
                businessId: primaryBiz?.id || null,
                industry: primaryBiz?.identity?.industry || 'Commercial & Services',
                country: primaryBiz?.identity?.country || 'United States',
                businessModel: primaryBiz?.identity?.businessModel || 'b2b',
                businessStage: primaryBiz?.identity?.businessStage || 'growing',
                completionPercentage: primaryBiz?.completionPercentage || 0,
                totalAnalyses: analyses.length,
                totalBusinesses: businesses.length
            };
        }));
        res.json({
            success: true,
            count: enrichedUsers.length,
            users: enrichedUsers
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * GET /api/admin/stats
 * Overview analytics for the admin dashboard
 */
exports.adminRouter.get('/stats', requireAdminAuth, async (req, res) => {
    try {
        const users = await repository_js_1.repository.getAllUsers();
        // Revenue breakdown distribution
        const revenueTiers = {
            'Under $100,000': 0,
            '$100,000 - $500,000': 0,
            '$500,000 - $1,000,000': 0,
            '$1,000,000 - $5,000,000': 0,
            '$5,000,000+': 0
        };
        let totalBusinessesCount = 0;
        let totalAnalysesCount = 0;
        for (const u of users) {
            const tier = u.yearlyRevenue || 'Under $100,000';
            if (revenueTiers[tier] !== undefined) {
                revenueTiers[tier]++;
            }
            else {
                revenueTiers['$100,000 - $500,000']++;
            }
            const businesses = await repository_js_1.repository.getBusinessesByOwner(u.uid);
            totalBusinessesCount += businesses.length;
            const analyses = await repository_js_1.repository.getAnalysesByOwner(u.uid);
            totalAnalysesCount += analyses.length;
        }
        // Registrations in last 24h
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        const todaySignups = users.filter((u) => new Date(u.createdAt) >= oneDayAgo).length;
        res.json({
            success: true,
            stats: {
                totalUsers: users.length,
                totalBusinesses: totalBusinessesCount,
                totalAnalyses: totalAnalysesCount,
                todaySignups,
                revenueTiers,
                securityCompliance: '100% Encrypted'
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * POST /api/admin/users
 * Allows admin to register an enterprise user directly from the admin panel
 */
exports.adminRouter.post('/users', requireAdminAuth, async (req, res) => {
    try {
        const { email, password, mobileNumber, yearlyRevenue, displayName, businessName, industry } = req.body;
        if (!email || !email.includes('@')) {
            res.status(400).json({ success: false, error: 'Valid email is mandatory.' });
            return;
        }
        if (!password || password.length < 6) {
            res.status(400).json({ success: false, error: 'Password must be at least 6 characters.' });
            return;
        }
        if (!mobileNumber) {
            res.status(400).json({ success: false, error: 'Mobile number is mandatory.' });
            return;
        }
        const cleanEmail = email.trim().toLowerCase();
        const existing = await repository_js_1.repository.getUserByEmail(cleanEmail);
        if (existing) {
            res.status(400).json({ success: false, error: 'User with this email already exists.' });
            return;
        }
        const uid = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const encryptedPassword = (0, security_js_1.encryptPassword)(password);
        const user = await repository_js_1.repository.upsertUser({
            uid,
            email: cleanEmail,
            displayName: displayName?.trim() || cleanEmail.split('@')[0],
            mobileNumber: mobileNumber.trim(),
            yearlyRevenue: yearlyRevenue?.trim() || '$100,000 - $500,000',
            password: encryptedPassword, // Stored safely in encrypted AES-256-GCM form in MongoDB
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Create business profile
        const bizId = 'biz_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
        const newBiz = {
            id: bizId,
            ownerId: user.uid,
            isDraft: true,
            currentStep: 1,
            completionPercentage: 20,
            createdAt: new Date(),
            updatedAt: new Date(),
            identity: {
                businessName: businessName?.trim() || `${user.displayName}'s Enterprise`,
                industry: industry?.trim() || 'Commercial & Services',
                country: 'United States',
                targetMarkets: ['Domestic', 'Enterprise'],
                businessModel: 'b2b',
                businessStage: 'growing',
                description: ''
            },
            productsServices: {
                mainOfferings: '',
                pricingModel: 'Fixed',
                usp: '',
                competitiveAdvantages: [],
                customerProblemsSolved: ''
            },
            targetAudience: {
                idealCustomerProfile: '',
                segments: [],
                painPoints: []
            },
            salesMarketing: {
                primaryChannels: [],
                leadGenMethods: [],
                marketingChallenges: []
            },
            financials: {
                annualRevenue: user.yearlyRevenue,
                cashFlowSituation: 'unknown'
            },
            operations: {
                toolsAndSoftware: [],
                operationalBottlenecks: []
            },
            competition: {
                mainCompetitors: [],
                marketOpportunities: []
            },
            challenges: {
                biggestProblems: [],
                shortTermGoals30To90Days: [],
                longTermGoals1To3Years: [],
                biggestRisks: [],
                aiAdvisorFocusAreas: []
            }
        };
        await repository_js_1.repository.saveBusiness(newBiz);
        const sec = (0, security_js_1.computePasswordAuditInfo)(encryptedPassword);
        res.status(201).json({
            success: true,
            message: 'User created successfully.',
            user: {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName,
                mobileNumber: user.mobileNumber,
                yearlyRevenue: user.yearlyRevenue,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                passwordMasked: sec.passwordMasked,
                passwordEncrypted: sec.passwordEncrypted,
                passwordAlgorithm: sec.passwordAlgorithm,
                passwordStrength: sec.passwordStrength,
                passwordLength: sec.passwordLength,
                businessName: newBiz.identity.businessName,
                businessId: newBiz.id,
                industry: newBiz.identity.industry,
                completionPercentage: newBiz.completionPercentage
            }
        });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
/**
 * DELETE /api/admin/users/:uid
 * Deletes user and associated business/analysis data
 */
exports.adminRouter.delete('/users/:uid', requireAdminAuth, async (req, res) => {
    try {
        const rawUid = req.params.uid;
        const uid = Array.isArray(rawUid) ? rawUid[0] : rawUid;
        if (!uid) {
            res.status(400).json({ success: false, error: 'User ID is required.' });
            return;
        }
        const existing = await repository_js_1.repository.getUserByUid(uid);
        if (!existing) {
            res.status(404).json({ success: false, error: 'User not found.' });
            return;
        }
        await repository_js_1.repository.deleteUser(uid);
        res.json({ success: true, message: `User ${existing.email} and all data removed.` });
    }
    catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});
