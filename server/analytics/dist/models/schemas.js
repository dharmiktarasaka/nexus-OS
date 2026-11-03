"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSettingsModel = exports.ActionItemModel = exports.ReportModel = exports.ChatMessageModel = exports.ConversationModel = exports.BusinessAnalysisModel = exports.BusinessProfileModel = exports.UserModel = void 0;
const mongoose_1 = __importStar(require("mongoose"));
// User Schema
const UserSchema = new mongoose_1.Schema({
    uid: { type: String, required: true, unique: true, index: true },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String, default: '' },
    displayName: { type: String, default: '' },
    mobileNumber: { type: String, default: '' },
    yearlyRevenue: { type: String, default: '' },
    photoURL: { type: String, default: '' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// Business Profile Schema
const BusinessProfileSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    isDraft: { type: Boolean, default: true },
    currentStep: { type: Number, default: 1 },
    completionPercentage: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    identity: {
        businessName: { type: String, required: true },
        industry: { type: String, required: true },
        subIndustry: { type: String },
        description: { type: String, default: '' },
        websiteUrl: { type: String },
        country: { type: String, required: true },
        city: { type: String },
        targetMarkets: [{ type: String }],
        businessModel: { type: String, default: 'b2b' },
        businessStage: { type: String, default: 'startup' },
        yearEstablished: { type: Number },
        numberOfEmployees: { type: String },
        ownershipStructure: { type: String }
    },
    productsServices: {
        mainOfferings: { type: String, default: '' },
        descriptions: { type: String },
        pricingModel: { type: String, default: 'Fixed' },
        avgSellingPrice: { type: String },
        primaryRevenueGenerator: { type: String },
        usp: { type: String, default: '' },
        competitiveAdvantages: [{ type: String }],
        customerProblemsSolved: { type: String, default: '' },
        profitabilityObservations: { type: String }
    },
    targetAudience: {
        idealCustomerProfile: { type: String, default: '' },
        demographics: { type: String },
        segments: [{ type: String }],
        customerLocations: { type: String },
        painPoints: [{ type: String }],
        buyingBehavior: { type: String },
        estimatedCac: { type: String },
        estimatedLtv: { type: String },
        retentionBehavior: { type: String }
    },
    salesMarketing: {
        primaryChannels: [{ type: String }],
        websiteAndSeo: { type: String },
        paidAdvertising: { type: String },
        socialMediaPresence: { type: String },
        leadGenMethods: [{ type: String }],
        salesFunnelAndConversion: { type: String },
        monthlyLeadsAndConversions: { type: String },
        salesCycleLength: { type: String },
        salesTeamStructure: { type: String },
        monthlyMarketingBudget: { type: String },
        marketingChallenges: [{ type: String }]
    },
    financials: {
        monthlyRevenue: { type: String },
        annualRevenue: { type: String },
        operatingExpenses: { type: String },
        approximateProfitMargin: { type: String },
        cashFlowSituation: { type: String, default: 'unknown' },
        pricingAndMarginsNotes: { type: String },
        outstandingDebt: { type: String },
        majorOperatingCosts: { type: String },
        financialGoals: { type: String }
    },
    operations: {
        teamStructure: { type: String },
        keyProcesses: { type: String },
        toolsAndSoftware: [{ type: String }],
        operationalBottlenecks: [{ type: String }],
        automationOpportunities: { type: String },
        supplierDependencies: { type: String },
        fulfillmentProcess: { type: String },
        productivityChallenges: { type: String }
    },
    competition: {
        mainCompetitors: [{ type: String }],
        competitorUrls: [{ type: String }],
        differentiators: { type: String },
        marketOpportunities: [{ type: String }],
        knownIndustryTrends: { type: String },
        barriersToEntry: { type: String },
        customerAlternatives: { type: String }
    },
    challenges: {
        biggestProblems: [{ type: String }],
        shortTermGoals30To90Days: [{ type: String }],
        longTermGoals1To3Years: [{ type: String }],
        revenueGrowthTargets: { type: String },
        expansionPlans: { type: String },
        desiredCustomerSegments: { type: String },
        biggestRisks: [{ type: String }],
        aiAdvisorFocusAreas: [{ type: String }]
    }
});
// Business Analysis Schema
const BusinessAnalysisSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    status: { type: String, enum: ['pending', 'running', 'completed', 'failed'], default: 'pending', index: true },
    currentStage: { type: String, default: 'Reading your business answers' },
    error: { type: String },
    createdAt: { type: Date, default: Date.now },
    completedAt: { type: Date },
    modelUsed: { type: String, default: 'gemini-3.5-flash' },
    promptVersion: { type: String, default: 'v2.1-executive' },
    executiveSummary: { type: mongoose_1.Schema.Types.Mixed },
    businessModelAnalysis: { type: mongoose_1.Schema.Types.Mixed },
    swot: { type: mongoose_1.Schema.Types.Mixed },
    prosAndCons: { type: mongoose_1.Schema.Types.Mixed },
    marketingSalesAudit: { type: mongoose_1.Schema.Types.Mixed },
    financialReview: { type: mongoose_1.Schema.Types.Mixed },
    operationsProductivity: { type: mongoose_1.Schema.Types.Mixed },
    competitivePositioning: { type: mongoose_1.Schema.Types.Mixed },
    riskAnalysis: { type: mongoose_1.Schema.Types.Mixed },
    growthOpportunities: { type: mongoose_1.Schema.Types.Mixed },
    actionPlan: { type: mongoose_1.Schema.Types.Mixed },
    informationGaps: { type: mongoose_1.Schema.Types.Mixed }
});
// Conversation Schema
const ConversationSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    lastMessageAt: { type: Date, default: Date.now }
});
// Chat Message Schema
const ChatMessageSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    conversationId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    sender: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    sources: [{ type: String }],
    actionItemCandidate: { type: mongoose_1.Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now }
});
// Report Schema
const ReportSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    analysisId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    version: { type: Number, default: 1 },
    businessName: { type: String, required: true },
    generatedAt: { type: Date, default: Date.now },
    executiveSummary: { type: String, default: '' },
    sections: { type: mongoose_1.Schema.Types.Mixed }
});
// Action Item Schema
const ActionItemSchema = new mongoose_1.Schema({
    id: { type: String, required: true, unique: true, index: true },
    ownerId: { type: String, required: true, index: true },
    businessId: { type: String, required: true, index: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String },
    priority: { type: String, enum: ['urgent', 'high', 'medium', 'low'], default: 'medium' },
    timeframe: { type: String, enum: ['7_days', '30_days', '90_days', 'long_term'], default: '30_days' },
    status: { type: String, enum: ['todo', 'in_progress', 'completed'], default: 'todo' },
    ownerRole: { type: String },
    successMetric: { type: String },
    dueDate: { type: String },
    source: { type: String, default: 'ai_action_plan' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
// User Settings Schema
const UserSettingsSchema = new mongoose_1.Schema({
    ownerId: { type: String, required: true, unique: true, index: true },
    notificationsEnabled: { type: Boolean, default: true },
    emailReports: { type: Boolean, default: false },
    theme: { type: String, enum: ['dark', 'light', 'system'], default: 'dark' },
    preferredCurrency: { type: String, default: 'USD' },
    aiCreativity: { type: String, enum: ['conservative', 'balanced', 'creative'], default: 'balanced' },
    geminiApiKey: { type: String },
    geminiModel: { type: String, default: 'gemini-1.5-flash' },
    updatedAt: { type: Date, default: Date.now }
});
exports.UserModel = mongoose_1.default.models.User || mongoose_1.default.model('User', UserSchema);
exports.BusinessProfileModel = mongoose_1.default.models.BusinessProfile || mongoose_1.default.model('BusinessProfile', BusinessProfileSchema);
exports.BusinessAnalysisModel = mongoose_1.default.models.BusinessAnalysis || mongoose_1.default.model('BusinessAnalysis', BusinessAnalysisSchema);
exports.ConversationModel = mongoose_1.default.models.Conversation || mongoose_1.default.model('Conversation', ConversationSchema);
exports.ChatMessageModel = mongoose_1.default.models.ChatMessage || mongoose_1.default.model('ChatMessage', ChatMessageSchema);
exports.ReportModel = mongoose_1.default.models.Report || mongoose_1.default.model('Report', ReportSchema);
exports.ActionItemModel = mongoose_1.default.models.ActionItem || mongoose_1.default.model('ActionItem', ActionItemSchema);
exports.UserSettingsModel = mongoose_1.default.models.UserSettings || mongoose_1.default.model('UserSettings', UserSettingsSchema);
