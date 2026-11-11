// Central API Service Client

const rawApiUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/+$/, '');
const BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem('auth_token') || localStorage.getItem('crm_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function authFetch(url: string, init?: RequestInit): Promise<Response> {
  const authHeaders = getAuthHeaders();
  const headers = new Headers(init?.headers || {});
  Object.entries(authHeaders).forEach(([k, v]) => {
    if (!headers.has(k)) headers.set(k, v);
  });
  const res = await fetch(url, { ...init, headers });
  if (res.status === 401 && !url.includes('/auth/check-status') && !url.includes('/auth/bridge')) {
    console.warn('[API] Session expired or unauthorized at:', url);
    window.dispatchEvent(new Event('auth:unauthorized'));
  }
  return res;
}

export interface DashboardStats {
  crm: {
    totalLeads: number;
    newLeads: number;
    qualifiedLeads: number;
    wonDeals: number;
    connected: boolean;
  };
  social: {
    totalPosts: number;
    scheduledPosts: number;
    publishedPosts: number;
    connected: boolean;
  };
  website: {
    totalProjects: number;
    publishedSites: number;
    draftSites: number;
    connected: boolean;
  };
  analytics: {
    totalReports: number;
    activeAnalyses: number;
    avgHealthScore: number;
    connected: boolean;
  };
  system: {
    totalApps: number;
    operationalApps: number;
    lastSync: string;
  };
}

export interface ActivityItem {
  id: string;
  appId: string;
  appName: string;
  title: string;
  description: string;
  timestamp: string;
  badge: string;
  actionUrl: string;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  url: string;
  badge: string;
}

export interface AppModule {
  id: string;
  slug: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  icon: string;
  badge: string;
  badgeColor: string;
  status: string;
  category: string;
  defaultUrl: string;
  isDbConnected?: boolean;
  features: string[];
  quickActions: Array<{
    id: string;
    label: string;
    route: string;
  }>;
}

export const api = {
  // Dashboard Metrics & Activity strictly isolated to current user
  async getStats(): Promise<{ success: boolean; stats: DashboardStats }> {
    try {
      const res = await authFetch(`${BASE_URL}/dashboard/stats`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Quiet fallback when offline or starting up
    }
    return {
      success: true,
      stats: {
        crm: { totalLeads: 0, newLeads: 0, qualifiedLeads: 0, wonDeals: 0, connected: true },
        social: { totalPosts: 0, scheduledPosts: 0, publishedPosts: 0, connected: true },
        website: { totalProjects: 0, publishedSites: 0, draftSites: 0, connected: true },
        analytics: { totalReports: 0, activeAnalyses: 0, avgHealthScore: 0, connected: true },
        system: { totalApps: 4, operationalApps: 4, lastSync: new Date().toISOString() }
      }
    };
  },

  async getActivity(): Promise<{ success: boolean; activities: ActivityItem[] }> {
    try {
      const res = await authFetch(`${BASE_URL}/dashboard/activity`);
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // Quiet fallback when offline or starting up
    }
    return {
      success: true,
      activities: []
    };
  },

  // Global Search strictly isolated to current user
  async search(query: string): Promise<{ success: boolean; results: SearchResult[] }> {
    const res = await authFetch(`${BASE_URL}/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Search failed');
    return res.json();
  },

  // Modules & Applications Registry
  async getModules(): Promise<{
    success: boolean;
    core: AppModule[];
    upcoming: any[];
    totalInstalled: number;
    totalAvailable: number;
  }> {
    const res = await authFetch(`${BASE_URL}/modules`);
    if (!res.ok) throw new Error('Failed to fetch modules');
    return res.json();
  },

  async getModule(slug: string): Promise<{ success: boolean; module: AppModule }> {
    const res = await authFetch(`${BASE_URL}/modules/${slug}`);
    if (!res.ok) throw new Error(`Failed to fetch module ${slug}`);
    return res.json();
  },

  // CRM Hub Data
  async getCrmLeads(): Promise<{ success: boolean; isLiveDb: boolean; leads: any[] }> {
    const res = await authFetch(`${BASE_URL}/crm/leads`);
    if (!res.ok) throw new Error('Failed to fetch CRM leads');
    return res.json();
  },

  async createCrmLead(data: any): Promise<{ success: boolean; lead: any }> {
    const res = await authFetch(`${BASE_URL}/crm/leads`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Failed to create lead');
    return res.json();
  },

  // Website Studio Projects
  async getWebsiteProjects(): Promise<{ success: boolean; isLiveDb: boolean; projects: any[] }> {
    const res = await authFetch(`${BASE_URL}/website/projects`);
    if (!res.ok) throw new Error('Failed to fetch website projects');
    return res.json();
  },

  // Business Analytics Reports
  async getAnalyticsReports(): Promise<{ success: boolean; isLiveDb: boolean; reports: any[] }> {
    const res = await authFetch(`${BASE_URL}/analytics/reports`);
    if (!res.ok) throw new Error('Failed to fetch analytics reports');
    return res.json();
  },

  // Social Media Posts
  async getSocialPosts(): Promise<{ success: boolean; posts: any[] }> {
    const res = await authFetch(`${BASE_URL}/social/posts`);
    if (!res.ok) throw new Error('Failed to fetch social posts');
    return res.json();
  },

  // Central Auth Bridge with automatic retry for server cold starts
  async bridgeAuth(user: any, maxRetries = 2): Promise<{
    success: boolean;
    token: string;
    user: any;
    tokens: { central: string; crm: string; stratiq: string };
  }> {
    let lastError: any = null;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const res = await fetch(`${BASE_URL}/auth/bridge`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(user)
        });
        const data = await res.json();
        if (!res.ok) {
          const err: any = new Error(data.message || 'Auth bridge synchronization failed');
          err.status = data.status || (res.status === 403 ? 'PENDING' : 'ERROR');
          err.data = data;
          // Don't retry definite client status codes like 403 (pending approval) or 400
          if (res.status === 403 || res.status === 400) {
            throw err;
          }
          lastError = err;
        } else {
          return data;
        }
      } catch (err: any) {
        if (err.status === 'PENDING' || err.status === 'REJECTED') {
          throw err;
        }
        lastError = err;
        if (attempt < maxRetries) {
          // Wait 2 seconds before retry to accommodate Render cold start
          await new Promise(r => setTimeout(r, 2000));
        }
      }
    }
    throw lastError || new Error('Auth bridge synchronization failed');
  },

  // Check User Access Request Status
  async checkAccessStatus(payload: { email: string; uid?: string; displayName?: string; photoURL?: string; provider?: string }): Promise<{
    success: boolean;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    isApproved: boolean;
    message: string;
    user: any;
  }> {
    const res = await fetch(`${BASE_URL}/auth/check-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
  }
};

