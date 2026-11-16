import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Command,
  Mail,
  Lock,
  User,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  AlertCircle,
  Globe,
  Users,
  Share2,
  Brain,
  TrendingUp,
  Zap,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type AuthMode = 'login' | 'register';
type WorkflowStep = 'build' | 'crm' | 'social' | 'analytics';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowStep>('build');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, registerWithEmail, loginAsDemoExecutive, resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) {
          throw new Error('Please enter your full name.');
        }
        await registerWithEmail(name.trim(), email, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Google sign-in was cancelled or encountered an error.');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      await loginAsDemoExecutive();
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to enter demo session.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to receive password reset link.');
      return;
    }
    try {
      await resetPassword(email);
      setResetSent(true);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to send reset link.');
    }
  };

  // Workflow definitions showcasing facilities & benefits
  const workflowData = {
    build: {
      badge: 'Step 1 • Creation',
      title: 'AI Website & Storefront Studio',
      highlight: 'Turn Ideas into Live High-Converting Sites in Seconds',
      description:
        'Generate and edit entire responsive websites, landing pages, and e-commerce stores using natural language. Comes with automatic live hosting, glassmorphic themes, and custom domain linking (*.tarasaka.com).',
      facilities: [
        'Natural Language Prompt Editor (Claude & Gemini powered)',
        '1-Click Custom Domain & Subdomain integration',
        'Built-in Product Catalogs, WhatsApp Floating Chat & Checkout',
        'Mobile, Tablet & Desktop responsive device simulator'
      ],
      metrics: 'Launch ready in < 60 seconds',
      gradient: 'from-blue-600/20 via-indigo-600/10 to-transparent',
      accentColor: '#3b82f6',
      icon: Globe
    },
    crm: {
      badge: 'Step 2 • Pipeline',
      title: 'High-Velocity Omnichannel CRM',
      highlight: 'Capture, Nurture & Convert Leads into Repeat Revenue',
      description:
        'A comprehensive customer relationship engine designed to eliminate deal leakage. Manage contacts, drag-and-drop Kanban sales stages, track lead interactions, and automate customer follow-ups.',
      facilities: [
        'Visual Multi-Stage Deal Pipeline with drag-and-drop sorting',
        'Comprehensive Contact Profiles with full history & notes',
        'Activity Timeline (Calls, Meetings, Tasks, Approvals)',
        'Team collaboration with multi-user assignment and status tags'
      ],
      metrics: '35% Higher Lead Conversion Rate',
      gradient: 'from-emerald-600/20 via-teal-600/10 to-transparent',
      accentColor: '#10b981',
      icon: Users
    },
    social: {
      badge: 'Step 3 • Growth',
      title: 'Mediamation Multi-Channel Social Hub',
      highlight: 'Broadcast to Every Channel from One Unified Queue',
      description:
        'Publish and automate media campaigns across Pinterest, Facebook, Instagram, LinkedIn, and Tumblr. Connect real accounts via official OAuth or developer tokens and schedule posts effortlessly.',
      facilities: [
        'Unified Content Calendar with auto-queue and time slots',
        'Pinterest boards, Meta pages & LinkedIn profiles support',
        'Zero-friction Direct API Handshake with instant verification',
        'AI caption writing & hashtag optimization assistant'
      ],
      metrics: 'Save 15+ Hours Every Week',
      gradient: 'from-rose-600/20 via-pink-600/10 to-transparent',
      accentColor: '#f43f5e',
      icon: Share2
    },
    analytics: {
      badge: 'Step 4 • Strategy',
      title: 'STRATIQ AI Business Advisory',
      highlight: 'Enterprise Strategic Audits, SWOT & Growth Action Plans',
      description:
        'Get board-level business intelligence on demand. STRATIQ analyzes your business profile, produces comprehensive SWOT matrices, uncovers hidden revenue leaks, and prescribes actionable 7-day profit roadmaps.',
      facilities: [
        'Autonomous SWOT & Competitive Landscape Analysis',
        'Prioritized 7-Day, 30-Day & 90-Day High-ROI Action Items',
        'Real-time P&L Financial Diagnostic & Margin Enhancers',
        '1-Click Executive PDF & Excel Reports for Stakeholders'
      ],
      metrics: 'Uncover $50K+ in Growth Opportunities',
      gradient: 'from-amber-600/20 via-orange-600/10 to-transparent',
      accentColor: '#f59e0b',
      icon: Brain
    }
  };

  const currentWorkflow = workflowData[activeWorkflow];
  const CurrentIcon = currentWorkflow.icon;

  return (
    <div className="min-h-screen w-full bg-slate-950 text-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-indigo-500 selection:text-white">
      {/* ============================================================== */}
      {/* LEFT COLUMN: Clean, High-Conversion Authentication Portal       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-10 border-b lg:border-b-0 lg:border-r border-slate-800/80 bg-slate-950/95 backdrop-blur-xl">
        {/* Ambient background glow */}
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 ring-1 ring-white/20">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-white font-mono">
                    SYS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-400 border border-indigo-500/30 tracking-wider">
                    v2.5
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-400 tracking-wide flex items-center gap-1">
                  <span>Developed by</span>
                  <a
                    href="https://tarasaka.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 font-bold transition-colors underline decoration-indigo-500/40"
                  >
                    Tarasaka
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-semibold text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="pt-4">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              {authMode === 'login' ? 'Welcome Back to Your Workspace' : 'Create Your Enterprise Workspace'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              {authMode === 'login'
                ? 'Sign in to access your Websites, CRM, Social Campaigns, and AI Advisory in one place.'
                : 'Get instant, unrestricted access to the complete SYS ecosystem with unified SSO.'}
            </p>
          </div>
        </div>

        {/* Authentication Card */}
        <div className="my-6 space-y-4">
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-900 border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'register'
                  ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-950/50 border border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3.5 rounded-xl bg-emerald-950/50 border border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-300 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <span>Password reset instructions have been sent to your email. Check your inbox.</span>
            </div>
          )}

          {/* 1-Click Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-slate-200 hover:text-white transition-all shadow-sm cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span>Continue with Google Single Sign-On</span>
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="px-3 bg-slate-950 text-slate-500">
                Or with business email
              </span>
            </div>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-300">
                  Password
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>{loading ? 'Authenticating...' : authMode === 'login' ? 'Sign In to SYS Workspace' : 'Create SYS Account'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Instant Executive Demo (1-Click Tour) */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoLogin}
              disabled={loading}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-indigo-500/30 text-xs font-bold text-indigo-300 hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm group hover:border-indigo-500/60"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 group-hover:rotate-12 transition-transform" />
              <span>⚡ Instant 1-Click Executive Demo (Explore Without Sign-In)</span>
            </button>
          </div>
        </div>

        {/* Security & Tarasaka Trust Footer */}
        <div className="pt-4 border-t border-slate-800/60 space-y-2">
          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>256-bit AES Encryption • SOC-2 Compliant Architecture • Central SSO</span>
          </div>
          <p className="text-[10px] text-slate-600">
            SYS Developed by Tarasaka. Operating across unified domains & dedicated tenant infrastructure.
          </p>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: Interactive Workflow, Facilities & Benefits       */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[55%] xl:w-[58%] p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between relative bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 overflow-y-auto">
        {/* Ambient background effects */}
        <div className="absolute top-1/4 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Hero Banner */}
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-bold text-indigo-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Autonomous All-in-One Enterprise Operating System</span>
          </div>

          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-white leading-tight">
            Build. Sell. Automate. Scale.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400">
              Without Leaving Your Workspace.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-400 max-w-2xl leading-relaxed">
            SYS developed by Tarasaka eliminates tool sprawl by consolidating your website builder, sales pipeline, social publishing, and AI strategic advisory into one unified, lightning-fast platform.
          </p>
        </div>

        {/* Interactive 4-Stage Workflow Selector */}
        <div className="my-8 space-y-4 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>How SYS Works • 4-Stage Operating Flow</span>
            </span>
            <span className="text-[11px] text-indigo-400 font-semibold hidden sm:inline">
              Click any stage to preview capabilities
            </span>
          </div>

          {/* Workflow Stepper Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'build' as const, label: '1. Build & Store', icon: Globe },
              { id: 'crm' as const, label: '2. CRM & Deals', icon: Users },
              { id: 'social' as const, label: '3. Social Publish', icon: Share2 },
              { id: 'analytics' as const, label: '4. AI Advisory', icon: Brain },
            ].map((step) => {
              const StepIcon = step.icon;
              const isActive = activeWorkflow === step.id;
              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setActiveWorkflow(step.id)}
                  className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden ${
                    isActive
                      ? 'bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  {isActive && (
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                  )}
                  <StepIcon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-slate-500'}`} />
                  <span className={`text-xs font-bold ${isActive ? 'text-white' : 'text-slate-300'}`}>
                    {step.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Selected Stage Spotlight Card */}
          <div className={`p-6 sm:p-7 rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl relative overflow-hidden bg-gradient-to-b ${currentWorkflow.gradient}`}>
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white/10 text-[10px] font-bold tracking-wider uppercase text-white/90">
                  <CurrentIcon className="w-3 h-3" />
                  <span>{currentWorkflow.badge}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  {currentWorkflow.title}
                </h3>
                <p className="text-xs font-medium text-indigo-300">
                  {currentWorkflow.highlight}
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">ROI Impact</span>
                <span className="text-xs font-extrabold text-emerald-400 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {currentWorkflow.metrics}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mt-3 leading-relaxed">
              {currentWorkflow.description}
            </p>

            {/* Facilities List for Current Stage */}
            <div className="mt-4 pt-4 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentWorkflow.facilities.map((fac, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Core Facilities Grid */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Full Suite Facility Breakdown
            </span>
            <span className="text-[11px] text-slate-500">
              One account connects all 4 engines
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-blue-500/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-blue-400 transition-colors">
                    AI Website & Store Builder
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Prompt-to-site generation with live subdomains & WhatsApp checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-400 transition-colors">
                    Enterprise Pipeline CRM
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Visual Kanban pipeline, deal scoring, notes & omnichannel contact tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-rose-500/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-500/15 text-rose-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                    Mediamation Social Hub
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Pinterest, Meta & LinkedIn multi-queue scheduler with AI captions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-amber-500/40 transition-colors group">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors">
                    STRATIQ Business Advisory
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Autonomous SWOT audits, financial forecast models & 7-day profit roadmaps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits & Value Retention Footnote */}
        <div className="pt-6 mt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              Replaces 5+ Subscriptions
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              99.9% Cloud Uptime
            </span>
          </div>

          <a
            href="https://tarasaka.com"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-400 hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>Learn more about Tarasaka ecosystem</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
