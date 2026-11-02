import React, { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { WorkspaceContainer } from '../components/workspace/WorkspaceContainer';
import { CrmHub } from '../components/workspace/CrmHub';
import { SocialHub } from '../components/workspace/SocialHub';
import { SocialApp } from '../social/SocialApp';
import { WebsiteHub } from '../components/workspace/WebsiteHub';
import { AnalyticsHub } from '../components/workspace/AnalyticsHub';
import { api, AppModule } from '../services/api';
import { useWorkspace } from '../context/WorkspaceContext';

export const AppWorkspacePage: React.FC = () => {
  const { appSlug } = useParams<{ appSlug: string }>();
  const [module, setModule] = useState<AppModule | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { recordAppAccess } = useWorkspace();

  useEffect(() => {
    if (!appSlug) return;
    recordAppAccess(appSlug);

    const fetchModule = async () => {
      setLoading(true);
      try {
        const res = await api.getModule(appSlug);
        setModule(res.module);
        setActiveTab('overview');
      } catch (err) {
        // Quiet fallback
      } finally {
        setLoading(false);
      }
    };

    fetchModule();
  }, [appSlug]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-3 border-indigo-600 border-t-transparent animate-spin" />
          <p className="text-xs font-semibold text-slate-500">
            Initializing integrated workspace module...
          </p>
        </div>
      </div>
    );
  }

  if (!module) {
    return <Navigate to="/" replace />;
  }

  // Dynamic Tabs configuration based on module
  const getTabs = () => {
    switch (module.slug) {
      case 'crm':
        return [
          { id: 'overview', label: 'Leads Pipeline' },
          { id: 'kanban', label: 'Kanban Stages' },
          { id: 'scraper', label: 'Lead Scraper' },
          { id: 'followups', label: 'Follow-ups' }
        ];
      case 'social':
        return [
          { id: 'overview', label: 'Scheduled Content' },
          { id: 'calendar', label: 'Publishing Calendar' },
          { id: 'accounts', label: 'Connected Channels' },
          { id: 'history', label: 'Post History' }
        ];
      case 'website-builder':
        return [
          { id: 'overview', label: 'Projects Gallery' },
          { id: 'generator', label: 'AI Site Generator' },
          { id: 'templates', label: 'Responsive Templates' },
          { id: 'editor', label: 'Code Editor' }
        ];
      case 'analytics':
        return [
          { id: 'overview', label: 'Strategic Overview' },
          { id: 'stepper', label: '4-Pillar Diagnostic' },
          { id: 'swot', label: 'SWOT Intelligence' },
          { id: 'reports', label: 'Executive Reports' }
        ];
      default:
        return [];
    }
  };

  // Render appropriate Hub content
  const renderHubContent = () => {
    switch (module.slug) {
      case 'crm':
        return <CrmHub />;
      case 'social':
        return <SocialApp />;
      case 'website-builder':
        return <WebsiteHub />;
      case 'analytics':
        return <AnalyticsHub />;
      default:
        return (
          <div className="p-8 text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {module.name}
            </h3>
            <p className="text-xs text-slate-500 mt-2">
              {module.description}
            </p>
          </div>
        );
    }
  };

  return (
    <WorkspaceContainer
      module={module}
      activeTab={activeTab}
      onTabChange={setActiveTab}
      tabs={getTabs()}
    >
      {renderHubContent()}
    </WorkspaceContainer>
  );
};

