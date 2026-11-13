import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api } from '../services/api.js';
import { useAuth } from './AuthContext.js';
import { IBusinessProfile, IBusinessAnalysis, IReport, IActionItem } from '../types/index.js';

interface BusinessContextType {
  businesses: IBusinessProfile[];
  activeBusiness: IBusinessProfile | null;
  latestAnalysis: IBusinessAnalysis | null;
  reports: IReport[];
  actionItems: IActionItem[];
  loading: boolean;
  autosaving: boolean;
  lastAutosavedAt: string | null;
  selectBusiness: (id: string) => Promise<void>;
  createNewBusiness: (name?: string) => Promise<IBusinessProfile>;
  updateActiveBusiness: (partial: Partial<IBusinessProfile>) => Promise<IBusinessProfile>;
  saveStepperDraft: (partial: Partial<IBusinessProfile>) => Promise<void>;
  refreshAll: () => Promise<void>;
  deleteCurrentBusiness: () => Promise<void>;
}

const BusinessContext = createContext<BusinessContextType | undefined>(undefined);

const normalizeBusiness = (biz: any): IBusinessProfile => {
  if (!biz) return biz;
  return {
    ...biz,
    currentStep: biz.currentStep && biz.currentStep >= 1 && biz.currentStep <= 5 ? biz.currentStep : 1,
    completionPercentage: biz.completionPercentage !== undefined ? biz.completionPercentage : 20,
    identity: {
      businessName: '',
      industry: 'Software & Technology',
      description: '',
      country: 'United States',
      targetMarkets: ['Domestic'],
      businessModel: 'b2b',
      businessStage: 'growing',
      ...(biz.identity || {})
    },
    productsServices: {
      mainOfferings: '',
      pricingModel: 'Fixed',
      usp: '',
      competitiveAdvantages: [],
      customerProblemsSolved: '',
      ...(biz.productsServices || {})
    },
    targetAudience: {
      idealCustomerProfile: '',
      segments: [],
      painPoints: [],
      ...(biz.targetAudience || {})
    },
    salesMarketing: {
      primaryChannels: ['Word of mouth & referrals'],
      leadGenMethods: [],
      marketingChallenges: [],
      ...(biz.salesMarketing || {})
    },
    financials: {
      monthlyRevenue: '$5,000 - $10,000',
      cashFlowSituation: 'positive',
      ...(biz.financials || {})
    },
    operations: {
      toolsAndSoftware: [],
      operationalBottlenecks: [],
      ...(biz.operations || {})
    },
    competition: {
      mainCompetitors: [],
      marketOpportunities: [],
      ...(biz.competition || {})
    },
    challenges: {
      biggestProblems: ['Need more customers & leads'],
      shortTermGoals30To90Days: ['Get 10+ new regular clients'],
      longTermGoals1To3Years: [],
      biggestRisks: [],
      ...(biz.challenges || {})
    }
  };
};

export const BusinessProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [businesses, setBusinesses] = useState<IBusinessProfile[]>([]);
  const [activeBusiness, setActiveBusiness] = useState<IBusinessProfile | null>(null);
  const [latestAnalysis, setLatestAnalysis] = useState<IBusinessAnalysis | null>(null);
  const [reports, setReports] = useState<IReport[]>([]);
  const [actionItems, setActionItems] = useState<IActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [autosaving, setAutosaving] = useState(false);
  const [lastAutosavedAt, setLastAutosavedAt] = useState<string | null>(null);

  const loadDataForBusiness = useCallback(async (businessId: string) => {
    try {
      const [analyses, rpts, acts] = await Promise.all([
        api.getAnalyses(businessId).catch(() => []),
        api.getReports(businessId).catch(() => []),
        api.getActionItems(businessId).catch(() => [])
      ]);

      const safeAnalyses = Array.isArray(analyses) ? analyses : [];
      const completed = safeAnalyses.find((a) => a.status === 'completed') || safeAnalyses[0] || null;
      setLatestAnalysis(completed);
      setReports(Array.isArray(rpts) ? rpts : []);
      setActionItems(Array.isArray(acts) ? acts : []);
    } catch (err) {
      console.warn('Failed loading business sub-data:', err);
      setActionItems([]);
      setReports([]);
    }
  }, []);

  const loadBusinesses = useCallback(async () => {
    if (!user) {
      setBusinesses([]);
      setActiveBusiness(null);
      setLatestAnalysis(null);
      return;
    }
    setLoading(true);
    try {
      const list = await api.getBusinesses();
      const normalizedList = list.map(normalizeBusiness);
      setBusinesses(normalizedList);
      if (normalizedList.length > 0) {
        // Find existing stored selected id or default to first
        const savedId = localStorage.getItem('active_business_id');
        const found = normalizedList.find((b) => b.id === savedId) || normalizedList[0];
        setActiveBusiness(normalizeBusiness(found));
        await loadDataForBusiness(found.id);
      } else {
        setActiveBusiness(null);
        setLatestAnalysis(null);
      }
    } catch (err) {
      console.error('Failed fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  }, [user, loadDataForBusiness]);

  useEffect(() => {
    loadBusinesses();
  }, [loadBusinesses]);

  const selectBusiness = async (id: string) => {
    const found = businesses.find((b) => b.id === id);
    if (found) {
      const normalized = normalizeBusiness(found);
      setActiveBusiness(normalized);
      localStorage.setItem('active_business_id', id);
      await loadDataForBusiness(id);
    }
  };

  const createNewBusiness = async (name: string = 'New Enterprise'): Promise<IBusinessProfile> => {
    try {
      const created = await api.createBusiness({
        identity: {
          businessName: name,
          industry: 'Software & Technology',
          description: '',
          country: 'United States',
          targetMarkets: ['Domestic'],
          businessModel: 'b2b',
          businessStage: 'growing'
        }
      });
      if (created) {
        const normalized = normalizeBusiness(created);
        setBusinesses((prev) => [normalized, ...prev.filter((b) => b.id !== normalized.id)]);
        setActiveBusiness(normalized);
        localStorage.setItem('active_business_id', normalized.id);
        setLatestAnalysis(null);
        setReports([]);
        setActionItems([]);
        return normalized;
      }
    } catch (err) {
      console.warn('Backend unavailable, using resilient local business profile:', err);
    }

    const fallback = normalizeBusiness({
      id: 'biz_' + Date.now(),
      ownerId: user?.uid || 'usr_default',
      isDraft: true,
      currentStep: 1,
      completionPercentage: 20,
      identity: {
        businessName: name,
        industry: 'Software & Technology',
        description: '',
        country: 'United States',
        targetMarkets: ['Domestic'],
        businessModel: 'b2b',
        businessStage: 'growing'
      },
      productsServices: {
        mainOfferings: 'Custom Business Software & Services',
        pricingModel: 'Fixed / Retainer',
        usp: 'Speed, custom modern stack and agility',
        competitiveAdvantages: ['High customization'],
        customerProblemsSolved: 'Automates operational workflows'
      },
      targetAudience: {
        idealCustomerProfile: 'B2B SMBs & Enterprises',
        segments: [],
        painPoints: []
      },
      salesMarketing: {
        primaryChannels: ['Word of mouth & referrals'],
        leadGenMethods: [],
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
      challenges: {
        biggestProblems: ['Need more customers & leads'],
        shortTermGoals30To90Days: ['Get 10+ new regular clients'],
        longTermGoals1To3Years: [],
        biggestRisks: []
      },
      aiAnalysisRequested: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    setBusinesses((prev) => [fallback, ...prev]);
    setActiveBusiness(fallback);
    localStorage.setItem('active_business_id', fallback.id);
    return fallback;
  };

  const updateActiveBusiness = async (partial: Partial<IBusinessProfile>): Promise<IBusinessProfile> => {
    if (!activeBusiness) throw new Error('No active business selected');
    try {
      const updated = await api.updateBusiness(activeBusiness.id, partial);
      if (updated) {
        const normalized = normalizeBusiness(updated);
        setActiveBusiness(normalized);
        setBusinesses((prev) => prev.map((b) => (b.id === normalized.id ? normalized : b)));
        return normalized;
      }
    } catch (err) {
      console.warn('Update business API notice:', err);
    }
    const merged = normalizeBusiness({ ...activeBusiness, ...partial });
    setActiveBusiness(merged);
    setBusinesses((prev) => prev.map((b) => (b.id === merged.id ? merged : b)));
    return merged;
  };

  const saveStepperDraft = async (partial: Partial<IBusinessProfile>) => {
    if (!activeBusiness) return;
    setAutosaving(true);
    try {
      const res = await api.autosaveDraft(activeBusiness.id, partial);
      if (res && res.business) {
        const normalized = normalizeBusiness({ ...activeBusiness, ...res.business, ...partial });
        setActiveBusiness(normalized);
        setBusinesses((prev) => prev.map((b) => (b.id === normalized.id ? normalized : b)));
      } else {
        const merged = normalizeBusiness({ ...activeBusiness, ...partial });
        setActiveBusiness(merged);
        setBusinesses((prev) => prev.map((b) => (b.id === merged.id ? merged : b)));
      }
      setLastAutosavedAt(new Date().toLocaleTimeString());
    } catch (err) {
      console.warn('Autosave draft notice (persisting locally):', err);
      const merged = normalizeBusiness({ ...activeBusiness, ...partial });
      setActiveBusiness(merged);
      setBusinesses((prev) => prev.map((b) => (b.id === merged.id ? merged : b)));
    } finally {
      setAutosaving(false);
    }
  };

  const deleteCurrentBusiness = async () => {
    if (!activeBusiness) return;
    await api.deleteBusiness(activeBusiness.id);
    const remaining = businesses.filter((b) => b.id !== activeBusiness.id);
    setBusinesses(remaining);
    if (remaining.length > 0) {
      setActiveBusiness(remaining[0]);
      localStorage.setItem('active_business_id', remaining[0].id);
      await loadDataForBusiness(remaining[0].id);
    } else {
      setActiveBusiness(null);
      localStorage.removeItem('active_business_id');
      setLatestAnalysis(null);
      setReports([]);
      setActionItems([]);
    }
  };

  const refreshAll = useCallback(async () => {
    if (activeBusiness) {
      await loadDataForBusiness(activeBusiness.id);
    }
  }, [activeBusiness, loadDataForBusiness]);

  return (
    <BusinessContext.Provider
      value={{
        businesses,
        activeBusiness,
        latestAnalysis,
        reports,
        actionItems,
        loading,
        autosaving,
        lastAutosavedAt,
        selectBusiness,
        createNewBusiness,
        updateActiveBusiness,
        saveStepperDraft,
        refreshAll,
        deleteCurrentBusiness
      }}
    >
      {children}
    </BusinessContext.Provider>
  );
};

export const useBusiness = () => {
  const context = useContext(BusinessContext);
  if (!context) throw new Error('useBusiness must be used within a BusinessProvider');
  return context;
};
