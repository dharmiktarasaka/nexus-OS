import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Users,
  UserPlus,
  Calendar,
  AlertTriangle,
  Award,
  FileCheck,
  CheckCircle2,
  XCircle,
  TrendingUp,
  ArrowRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  Legend
} from 'recharts';
import api from '../services/api';
import { Loader } from '../components/Loader';
import { WhatsAppLiveTracker } from '../components/WhatsAppLiveTracker';

const SOURCE_COLORS = ['#4F46E5', '#6366F1', '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#06B6D4', '#64748B'];

export const Dashboard = () => {
  const { refreshTrigger } = useOutletContext() || {};
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchDashboard = async () => {
      setLoading(true);
      try {
        const res = await api.get('/dashboard/stats');
        if (isMounted && res.data?.success) {
          setData(res.data);
        }
      } catch (err) {
        if (isMounted) {
          setData({
            success: true,
            kpi: {
              totalLeads: 0,
              newLeads: 0,
              followUpsToday: 0,
              overdueFollowUps: 0,
              qualifiedLeads: 0,
              proposalSentLeads: 0,
              wonLeads: 0,
              lostLeads: 0,
              conversionRate: 0
            },
            charts: {
              pipelineData: [
                { stage: 'NEW', count: 0 },
                { stage: 'CONTACTED', count: 0 },
                { stage: 'QUALIFIED', count: 0 },
                { stage: 'PROPOSAL_SENT', count: 0 },
                { stage: 'WON', count: 0 },
                { stage: 'LOST', count: 0 }
              ],
              sourceData: [],
              trendData: [],
              lostReasonData: []
            }
          });
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchDashboard();
    return () => { isMounted = false; };
  }, [refreshTrigger]);

  if (loading && !data) {
    return <Loader message="Fetching real-time MongoDB analytics..." />;
  }

  const kpi = data?.kpi || {};
  const charts = data?.charts || {};
  const pipelineData = Array.isArray(charts.pipelineData) ? charts.pipelineData : [];
  const rawSourceData = Array.isArray(charts.sourceData) ? charts.sourceData : [];
  const sourceData = rawSourceData.map(item => ({
    source: item.source || item.name || 'Other',
    count: item.count ?? item.value ?? 0
  }));
  const trendData = Array.isArray(charts.trendData) ? charts.trendData : [];
  const lostReasonData = Array.isArray(charts.lostReasonData) ? charts.lostReasonData : [];

  const kpiCards = [
    { title: 'Total Leads', value: kpi.totalLeads ?? 0, icon: Users, color: 'text-slate-700', bg: 'bg-slate-100', link: '/leads' },
    { title: 'New Leads', value: kpi.newLeads ?? 0, icon: UserPlus, color: 'text-blue-600', bg: 'bg-blue-50', link: '/leads?status=NEW' },
    { title: 'Follow-ups Today', value: kpi.followUpsToday ?? 0, icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', link: '/followups?filter=today' },
    { title: 'Overdue Follow-ups', value: kpi.overdueFollowUps ?? 0, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/followups?filter=overdue' },
    { title: 'Qualified Leads', value: kpi.qualifiedLeads ?? 0, icon: Award, color: 'text-amber-600', bg: 'bg-amber-50', link: '/leads?status=QUALIFIED' },
    { title: 'Proposals Sent', value: kpi.proposalSentLeads ?? 0, icon: FileCheck, color: 'text-purple-600', bg: 'bg-purple-50', link: '/leads?status=PROPOSAL_SENT' },
    { title: 'Won Deals', value: kpi.wonLeads ?? 0, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', link: '/leads?status=WON' },
    { title: 'Lost Leads', value: kpi.lostLeads ?? 0, icon: XCircle, color: 'text-rose-600', bg: 'bg-rose-50', link: '/leads?status=LOST' }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-crm-navy via-crm-navy-light to-slate-900 text-white rounded-2xl shadow-xl border border-white/10">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">Executive CRM Dashboard</h2>
          <p className="text-xs text-slate-300 mt-1">Real-time Lead Conversion, Pipeline Aggregation & Activity Stats</p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 px-5 py-3 rounded-xl border border-white/15 backdrop-blur-xs">
          <div className="p-2 rounded-lg bg-crm-lime text-crm-navy font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-crm-lime font-extrabold">Conversion Rate</p>
            <p className="text-2xl font-black text-white">{kpi.conversionRate ?? 0}%</p>
          </div>
        </div>
      </div>

      {/* Real-time WhatsApp Broadcast & Next Message Countdown Tracker */}
      <WhatsAppLiveTracker initialData={data?.whatsappDispatch} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
        {kpiCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              onClick={() => navigate(card.link)}
              className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-slate-300 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-500">{card.title}</span>
                <div className={`p-2 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-extrabold text-crm-navy">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pipeline Bar Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-crm-navy">Lead Pipeline Stages</h3>
            <span className="text-[11px] text-slate-400 font-medium">Stage Counts</span>
          </div>
          <div className="h-64">
            {pipelineData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No pipeline data recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="stage" tick={{ fontSize: 10, fill: '#64748b' }} angle={-25} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px', borderColor: '#e2e8f0' }} />
                  <Bar dataKey="count" fill="#4F46E5" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lead Source Analytics */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-crm-navy">Lead Sources Distribution</h3>
            <span className="text-[11px] text-slate-400 font-medium">Acquisition Channel</span>
          </div>
          <div className="h-64 flex items-center justify-center">
            {sourceData.length === 0 ? (
              <p className="text-xs text-slate-400">No source records available</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourceData}
                    dataKey="count"
                    nameKey="source"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    innerRadius={45}
                    paddingAngle={3}
                    label={({ source, count }) => `${source}: ${count}`}
                  >
                    {sourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Monthly Trend Chart */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-crm-navy">Monthly Performance Trend</h3>
            <span className="text-[11px] text-slate-400 font-medium">Total vs Won vs Lost</span>
          </div>
          <div className="h-64">
            {trendData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No trend history recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Line type="monotone" dataKey="total" stroke="#4F46E5" strokeWidth={2} name="Total Leads" />
                  <Line type="monotone" dataKey="won" stroke="#10B981" strokeWidth={2} name="Won Deals" />
                  <Line type="monotone" dataKey="lost" stroke="#F43F5E" strokeWidth={2} name="Lost Leads" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Lost Reason Analytics */}
        <div className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-crm-navy">Lost Reason Analytics</h3>
            <span className="text-[11px] text-rose-500 font-semibold">Disqualification Breakdown</span>
          </div>
          <div className="h-64">
            {lostReasonData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No lost lead reasons recorded yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lostReasonData} layout="vertical" margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis type="category" dataKey="reason" tick={{ fontSize: 10, fill: '#64748b' }} width={110} />
                  <Tooltip contentStyle={{ fontSize: '12px', borderRadius: '12px' }} />
                  <Bar dataKey="count" fill="#F43F5E" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
export default Dashboard;
