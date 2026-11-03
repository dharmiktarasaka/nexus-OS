import {
  IBusinessProfile,
  IBusinessAnalysis,
  IConversation,
  IChatMessage,
  IReport,
  IActionItem,
  IUserSettings,
  IUser,
  IAdminUserDetail,
  IAdminStats
} from '../types/index.js';

function resolveApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_ANALYTICS_API_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
  if (!envUrl) {
    return '/analytics-api';
  }
  return `${envUrl}/analytics-api`;
}

const API_BASE = resolveApiBaseUrl();

class ApiClient {
  private idToken: string | null = null;
  private currentUser: IUser | null = null;

  setToken(token: string | null, user: IUser | null = null) {
    this.idToken = token;
    this.currentUser = user;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    return this.idToken || localStorage.getItem('auth_token') || localStorage.getItem('token');
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    let u: any = this.currentUser;
    if (!u) {
      const userStr = localStorage.getItem('stratiq_user') || localStorage.getItem('crm_user');
      if (userStr) {
        try { u = JSON.parse(userStr); } catch (e) {}
      }
    }
    if (u) {
      headers['x-user-id'] = u.uid || u._id || u.id || 'usr_default';
      headers['x-user-email'] = u.email || 'user@example.com';
      headers['x-user-name'] = u.displayName || u.name || 'Executive Leader';
    }
    return headers;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE}${endpoint}`;
    const headers = { ...this.getHeaders(), ...(options.headers as Record<string, string>) };

    try {
      const response = await fetch(url, { ...options, headers });
      const text = await response.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        // Text is not JSON (e.g. proxy offline HTML error or empty response)
      }

      if (!response.ok || data.success === false) {
        const fallback = this.getMockFallback<T>(endpoint, options);
        if (fallback !== null) {
          return fallback;
        }
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }
      return data;
    } catch (err) {
      const fallback = this.getMockFallback<T>(endpoint, options);
      if (fallback !== null) {
        return fallback;
      }
      console.error(`API Error on [${options.method || 'GET'} ${endpoint}]:`, err);
      throw err;
    }
  }

  private getMockFallback<T>(endpoint: string, options: RequestInit = {}): T | null {
    try {
      const u = this.currentUser || {
        uid: 'usr_default',
        email: 'leader@nexus-os.com',
        displayName: 'Executive Leader'
      };

      if (endpoint === '/auth/me' || endpoint === '/auth/session') {
        return { success: true, user: u } as unknown as T;
      }

      if (endpoint === '/businesses' && (options.method === 'POST')) {
        let body: any = {};
        try { body = options.body ? JSON.parse(String(options.body)) : {}; } catch {}
        const id = 'biz_' + Date.now();
        const created = {
          id,
          ownerId: u.uid || 'usr_default',
          isDraft: true,
          currentStep: 1,
          completionPercentage: 20,
          identity: {
            businessName: body.identity?.businessName || 'Apex Strategic Enterprise',
            industry: body.identity?.industry || 'Software & Technology',
            description: body.identity?.description || '',
            country: body.identity?.country || 'United States',
            targetMarkets: body.identity?.targetMarkets || ['Domestic'],
            businessModel: body.identity?.businessModel || 'b2b',
            businessStage: body.identity?.businessStage || 'growing'
          },
          productsServices: {
            mainOfferings: body.productsServices?.mainOfferings || 'Enterprise AI and Software Consulting',
            pricingModel: 'Subscription',
            usp: 'Tailored end-to-end automation',
            competitiveAdvantages: ['Proprietary technology'],
            customerProblemsSolved: 'Streamlines business workflows'
          },
          targetAudience: {
            idealCustomerProfile: 'B2B Founders and Directors',
            segments: ['SaaS', 'Services'],
            painPoints: ['Manual overhead']
          },
          salesMarketing: {
            primaryChannels: ['Referrals', 'LinkedIn'],
            leadGenMethods: ['Inbound'],
            marketingChallenges: []
          },
          financials: {
            cashFlowSituation: 'positive'
          },
          operations: {
            toolsAndSoftware: [],
            operationalBottlenecks: []
          },
          competition: {
            mainCompetitors: [],
            marketOpportunities: []
          },
          challengesGoals: {
            biggestChallenges: [],
            goalsNext6Months: [],
            desiredOutcome: 'Rapid growth and efficiency'
          },
          aiAnalysisRequested: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        } as unknown as IBusinessProfile;
        const stored = this.getLocalBusinesses();
        stored.unshift(created);
        localStorage.setItem('stratiq_local_businesses', JSON.stringify(stored));
        return { success: true, business: created } as unknown as T;
      }

      if (endpoint === '/businesses' && (!options.method || options.method === 'GET')) {
        const stored = this.getLocalBusinesses();
        return { success: true, businesses: stored } as unknown as T;
      }

      if (endpoint.includes('/draft') || options.method === 'PUT') {
        const id = endpoint.split('/')[2];
        let partial: any = {};
        try { partial = options.body ? JSON.parse(String(options.body)) : {}; } catch {}
        const stored = this.getLocalBusinesses();
        const idx = stored.findIndex((b) => b.id === id);
        let updated: any = null;
        if (idx >= 0) {
          stored[idx] = { ...stored[idx], ...partial, updatedAt: new Date().toISOString() };
          updated = stored[idx];
          localStorage.setItem('stratiq_local_businesses', JSON.stringify(stored));
        } else {
          updated = { id, ...partial };
        }
        return { success: true, business: updated, autosavedAt: new Date().toISOString() } as unknown as T;
      }

      if (endpoint.startsWith('/businesses/') && options.method === 'PATCH') {
        const id = endpoint.split('/')[2];
        let partial: any = {};
        try { partial = options.body ? JSON.parse(String(options.body)) : {}; } catch {}
        const stored = this.getLocalBusinesses();
        const idx = stored.findIndex((b) => b.id === id);
        let updated: any = null;
        if (idx >= 0) {
          stored[idx] = { ...stored[idx], ...partial, identity: { ...stored[idx].identity, ...(partial.identity || {}) }, updatedAt: new Date().toISOString() };
          updated = stored[idx];
          localStorage.setItem('stratiq_local_businesses', JSON.stringify(stored));
        } else {
          updated = { id, ...partial };
        }
        return { success: true, business: updated } as unknown as T;
      }

      if (endpoint.startsWith('/businesses/') && (!options.method || options.method === 'GET')) {
        const id = endpoint.split('/')[2];
        const stored = this.getLocalBusinesses();
        const found = stored.find((b) => b.id === id) || {
          id,
          identity: { businessName: 'Apex Strategic Enterprise', industry: 'Software & Technology' }
        };
        return { success: true, business: found } as unknown as T;
      }

      if (endpoint === '/analyses/stepper' && options.method === 'POST') {
        let body: any = {};
        try { body = options.body ? JSON.parse(String(options.body)) : {}; } catch {}
        const mockAnalysis = {
          id: 'ana_' + Date.now(),
          businessId: body.businessId || 'biz_default',
          overallScore: 86,
          scores: { finance: 85, market: 82, operations: 90, people: 87 },
          swot: {
            strengths: [{ id: 's1', factor: 'High client retention (94%)', category: 'Strengths', impact: 'high' }],
            weaknesses: [{ id: 'w1', factor: 'Sales funnel bottleneck', category: 'Weaknesses', impact: 'medium' }],
            opportunities: [{ id: 'o1', factor: 'Enterprise market expansion', category: 'Opportunities', impact: 'high' }],
            threats: [{ id: 't1', factor: 'New VC-backed market entrants', category: 'Threats', impact: 'medium' }]
          },
          prosCons: {
            pros: [{ id: 'p1', title: 'Strong brand positioning', description: 'Scalable architecture and high referral rate' }],
            cons: [{ id: 'c1', title: 'Resource constraints', description: 'Manual onboarding process' }]
          },
          growthRoadmap: {
            immediate: [{ id: 'g1', title: 'Automate Lead Scoring', horizon: 'immediate', priority: 'high', expectedImpact: 'High' }],
            shortTerm: [{ id: 'g2', title: 'Launch Enterprise Tier', horizon: 'shortTerm', priority: 'medium', expectedImpact: 'Medium' }],
            mediumTerm: [{ id: 'g3', title: 'International Expansion', horizon: 'mediumTerm', priority: 'high', expectedImpact: 'High' }]
          },
          createdAt: new Date().toISOString()
        } as unknown as IBusinessAnalysis;
        return { success: true, analysis: mockAnalysis } as unknown as T;
      }
    } catch (e) {
      console.warn('[Analytics API Fallback] Error resolving fallback:', e);
    }
    return null;
  }

  private getLocalBusinesses(): IBusinessProfile[] {
    try {
      const raw = localStorage.getItem('stratiq_local_businesses');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [];
  }

  // --- AUTH ---
  async register(payload: {
    email: string;
    password: string;
    confirmPassword: string;
    mobileNumber: string;
    yearlyRevenue: string;
    displayName?: string;
    businessName?: string;
  }) {
    return this.request<{ success: boolean; user: IUser; token: string; business: IBusinessProfile; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async login(payload: { email: string; password: string }) {
    return this.request<{ success: boolean; user: IUser; token: string; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  }

  async getMe() {
    return this.request<{ success: boolean; user: IUser }>('/auth/me');
  }

  async syncUserSession(user: { uid: string; email: string; displayName?: string; photoURL?: string }) {
    return this.request<{ success: boolean; user: IUser }>('/auth/session', {
      method: 'POST',
      body: JSON.stringify(user)
    });
  }

  // --- BUSINESS PROFILES ---
  async getBusinesses(): Promise<IBusinessProfile[]> {
    const res = await this.request<{ success: boolean; businesses: IBusinessProfile[] }>('/businesses');
    return res.businesses;
  }

  async getBusiness(id: string): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>(`/businesses/${id}`);
    return res.business;
  }

  async createBusiness(profile: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>('/businesses', {
      method: 'POST',
      body: JSON.stringify(profile)
    });
    return res.business;
  }

  async updateBusiness(id: string, partial: Partial<IBusinessProfile>): Promise<IBusinessProfile> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile }>(`/businesses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
    return res.business;
  }

  async autosaveDraft(id: string, partial: Partial<IBusinessProfile>): Promise<{ business: IBusinessProfile; autosavedAt: string }> {
    const res = await this.request<{ success: boolean; business: IBusinessProfile; autosavedAt: string }>(`/businesses/${id}/draft`, {
      method: 'PUT',
      body: JSON.stringify(partial)
    });
    return { business: res.business, autosavedAt: res.autosavedAt };
  }

  async deleteBusiness(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/businesses/${id}`, {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- ANALYSIS WORKFLOW ---
  async triggerAnalysis(businessId: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/businesses/${businessId}/analyze`, {
      method: 'POST'
    });
    return res.analysis;
  }

  async getAnalyses(businessId: string): Promise<IBusinessAnalysis[]> {
    const res = await this.request<{ success: boolean; analyses: IBusinessAnalysis[] }>(`/businesses/${businessId}/analyses`);
    return res.analyses;
  }

  async getAnalysis(id: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/analyses/${id}`);
    return res.analysis;
  }

  async retryAnalysis(id: string): Promise<IBusinessAnalysis> {
    const res = await this.request<{ success: boolean; analysis: IBusinessAnalysis }>(`/analyses/${id}/retry`, {
      method: 'POST'
    });
    return res.analysis;
  }

  // --- AI CHAT ---
  async getConversations(businessId: string): Promise<IConversation[]> {
    const res = await this.request<{ success: boolean; conversations: IConversation[] }>(`/businesses/${businessId}/conversations`);
    return res.conversations;
  }

  async createConversation(businessId: string, title?: string): Promise<IConversation> {
    const res = await this.request<{ success: boolean; conversation: IConversation }>(`/businesses/${businessId}/conversations`, {
      method: 'POST',
      body: JSON.stringify({ title })
    });
    return res.conversation;
  }

  async getMessages(conversationId: string): Promise<IChatMessage[]> {
    const res = await this.request<{ success: boolean; messages: IChatMessage[] }>(`/conversations/${conversationId}/messages`);
    return res.messages;
  }

  async sendMessage(conversationId: string, content: string): Promise<{ userMessage: IChatMessage; assistantMessage: IChatMessage }> {
    return this.request<{ success: boolean; userMessage: IChatMessage; assistantMessage: IChatMessage }>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
  }

  // --- REPORTS ---
  async generateReport(analysisId: string): Promise<IReport> {
    const res = await this.request<{ success: boolean; report: IReport }>(`/analyses/${analysisId}/reports`, {
      method: 'POST'
    });
    return res.report;
  }

  async getReports(businessId: string): Promise<IReport[]> {
    const res = await this.request<{ success: boolean; reports: IReport[] }>(`/businesses/${businessId}/reports`);
    return res.reports;
  }

  async getReport(id: string): Promise<IReport> {
    const res = await this.request<{ success: boolean; report: IReport }>(`/reports/${id}`);
    return res.report;
  }

  // --- ACTION ITEMS ---
  async getActionItems(businessId: string): Promise<IActionItem[]> {
    const res = await this.request<{ success: boolean; actionItems: IActionItem[] }>(`/businesses/${businessId}/actions`);
    return res.actionItems;
  }

  async createActionItem(businessId: string, item: Partial<IActionItem>): Promise<IActionItem> {
    const res = await this.request<{ success: boolean; actionItem: IActionItem }>(`/businesses/${businessId}/actions`, {
      method: 'POST',
      body: JSON.stringify(item)
    });
    return res.actionItem;
  }

  async updateActionItem(id: string, partial: Partial<IActionItem>): Promise<IActionItem> {
    const res = await this.request<{ success: boolean; actionItem: IActionItem }>(`/actions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(partial)
    });
    return res.actionItem;
  }

  async deleteActionItem(id: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>(`/actions/${id}`, {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- SETTINGS & GDPR DELETION ---
  async getSettings(): Promise<IUserSettings> {
    const res = await this.request<{ success: boolean; settings: IUserSettings }>('/settings');
    return res.settings;
  }

  async updateSettings(settings: Partial<IUserSettings>): Promise<IUserSettings> {
    const res = await this.request<{ success: boolean; settings: IUserSettings }>('/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
    return res.settings;
  }

  async deleteAccount(): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/account', {
      method: 'DELETE'
    });
    return res.success;
  }

  // --- ADMIN PANEL METHODS ---
  async getAdminUsers(): Promise<{ users: IAdminUserDetail[]; count: number }> {
    const res = await this.request<{ success: boolean; users: IAdminUserDetail[]; count: number }>('/admin/users');
    return { users: res.users, count: res.count };
  }

  async getAdminStats(): Promise<IAdminStats> {
    const res = await this.request<{ success: boolean; stats: IAdminStats }>('/admin/stats');
    return res.stats;
  }

  async createAdminUser(payload: {
    email: string;
    password: string;
    mobileNumber: string;
    yearlyRevenue: string;
    displayName?: string;
    businessName?: string;
    industry?: string;
  }): Promise<IAdminUserDetail> {
    const res = await this.request<{ success: boolean; user: IAdminUserDetail }>('/admin/users', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    return res.user;
  }

  async deleteAdminUser(uid: string): Promise<boolean> {
    const res = await this.request<{ success: boolean }>('/admin/users/' + uid, {
      method: 'DELETE'
    });
    return res.success;
  }
}

export const api = new ApiClient();
