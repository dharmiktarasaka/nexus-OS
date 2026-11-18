import React, { useState, useEffect, useRef } from 'react';
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
  CheckCircle2,
  Layers,
  ArrowUpRight,
  Sun,
  Moon,
  Activity,
  Play,
  Pause
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

type AuthMode = 'login' | 'register';
type WorkflowStep = 'build' | 'crm' | 'social' | 'analytics';

export const LoginPage: React.FC = () => {
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [activeWorkflow, setActiveWorkflow] = useState<WorkflowStep>('build');
  const [isAutoCycling, setIsAutoCycling] = useState(true);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const { loginWithEmail, loginWithGoogle, registerWithEmail, resetPassword } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Canvas ref for 2D animated interactive particles
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // -------------------------------------------------------------
  // 2D ANIMATED PARTICLE NETWORK ENGINE (HTML5 Canvas)
  // -------------------------------------------------------------
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle nodes
    const particleCount = Math.min(36, Math.floor((width * height) / 22000));
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.7,
      vy: (Math.random() - 0.5) * 0.7,
      radius: Math.random() * 2 + 1.5,
      color: ['#4f46e5', '#3b82f6', '#10b981', '#8b5cf6'][Math.floor(Math.random() * 4)]
    }));

    let mouseX = -1000;
    let mouseY = -1000;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = e.clientY - rect.top;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Draw connecting lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            const alpha = (1 - dist / 130) * 0.18;
            ctx.strokeStyle = theme === 'dark' ? `rgba(129, 140, 248, ${alpha})` : `rgba(79, 70, 229, ${alpha * 1.5})`;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and update particles
      particles.forEach((p) => {
        // Move
        p.x += p.vx;
        p.y += p.vy;

        // Bounce off canvas edges
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        // Subtle mouse repulsion/attraction
        const mdx = mouseX - p.x;
        const mdy = mouseY - p.y;
        const mdist = Math.sqrt(mdx * mdx + mdy * mdy);
        if (mdist < 100) {
          p.x -= (mdx / mdist) * 0.6;
          p.y -= (mdy / mdist) * 0.6;
        }

        // Draw particle dot
        ctx.fillStyle = p.color;
        ctx.globalAlpha = theme === 'dark' ? 0.7 : 0.85;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      canvas.removeEventListener('mousemove', handleMouseMove);
    };
  }, [theme]);

  // -------------------------------------------------------------
  // AUTO-CYCLING WORKFLOW PREVIEW (Cycles every 6 seconds)
  // -------------------------------------------------------------
  useEffect(() => {
    if (!isAutoCycling) return;
    const steps: WorkflowStep[] = ['build', 'crm', 'social', 'analytics'];
    const interval = setInterval(() => {
      setActiveWorkflow((prev) => {
        const idx = steps.indexOf(prev);
        return steps[(idx + 1) % steps.length];
      });
    }, 6000);
    return () => clearInterval(interval);
  }, [isAutoCycling]);

  // Form Handlers
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (authMode === 'login') {
        await loginWithEmail(email, password);
      } else {
        if (!name.trim()) throw new Error('Please enter your full name.');
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
      stepNum: '01',
      badge: 'Creation & Commerce',
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
      gradient: 'from-blue-500/10 via-indigo-500/5 to-transparent',
      accentColor: '#3b82f6',
      icon: Globe
    },
    crm: {
      stepNum: '02',
      badge: 'Leads & Conversions',
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
      gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
      accentColor: '#10b981',
      icon: Users
    },
    social: {
      stepNum: '03',
      badge: 'Omnichannel Growth',
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
      gradient: 'from-rose-500/10 via-pink-500/5 to-transparent',
      accentColor: '#f43f5e',
      icon: Share2
    },
    analytics: {
      stepNum: '04',
      badge: 'Strategy & Profits',
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
      gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
      accentColor: '#f59e0b',
      icon: Brain
    }
  };

  const currentWorkflow = workflowData[activeWorkflow];
  const CurrentIcon = currentWorkflow.icon;

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white flex flex-col lg:flex-row overflow-x-hidden font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      {/* ============================================================== */}
      {/* LEFT COLUMN: 2D Animated Workflow, Facilities & Benefits        */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[55%] xl:w-[58%] p-6 sm:p-10 lg:p-12 xl:p-16 flex flex-col justify-between relative bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white dark:from-slate-950 dark:via-slate-900 dark:to-indigo-950/40 overflow-hidden border-b lg:border-b-0 lg:border-r border-slate-200/90 dark:border-slate-800/90">
        {/* 2D Interactive Particle Canvas (60FPS Interactive Physics) */}
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-auto w-full h-full z-0 opacity-70"
        />

        {/* Floating 2D Live Micro-Cards for Visual Magnetism */}
        <div className="hidden xl:block absolute top-8 right-8 z-10 animate-float-slow pointer-events-none">
          <div className="px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs">
              🛍️
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Storefront Live
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                shop.tarasaka.com • $1,240 Today
              </p>
            </div>
          </div>
        </div>

        <div className="hidden xl:block absolute bottom-12 right-12 z-10 animate-float-reverse pointer-events-none">
          <div className="px-3.5 py-2 rounded-2xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl backdrop-blur-md flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Pipeline Automation
              </p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                +42 Deals Qualified • 98% Win Rate
              </p>
            </div>
          </div>
        </div>

        {/* Hero Banner */}
        <div className="space-y-4 relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/30 text-xs font-bold text-indigo-600 dark:text-indigo-400 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>The Autonomous All-in-One Enterprise Platform</span>
          </div>

          <h2 className="text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            Build. Sell. Automate. Scale.
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-600 dark:from-indigo-400 dark:via-violet-400 dark:to-pink-400">
              Without Leaving Your Workspace.
            </span>
          </h2>

          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
            SYS developed by Tarasaka eliminates tool sprawl by consolidating your website builder, sales pipeline, social media command hub, and AI strategic advisory into one unified, lightning-fast platform.
          </p>
        </div>

        {/* 2D Animated Workflow Visualizer & Interactive Pipeline Diagram */}
        <div className="my-6 space-y-4 relative z-10">
          {/* Header & Play/Pause controls */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              <span>How SYS Works • 4-Stage Connected Workflow</span>
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAutoCycling(!isAutoCycling)}
                className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-300 flex items-center gap-1 cursor-pointer transition-colors"
              >
                {isAutoCycling ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isAutoCycling ? 'Auto-cycling' : 'Paused'}</span>
              </button>
            </div>
          </div>

          {/* 2D Animated Flow Diagram with Flowing SVG Energy Connectors */}
          <div className="relative py-2">
            {/* SVG Connecting Light Pulse Line */}
            <svg
              className="absolute top-1/2 left-0 w-full -translate-y-1/2 pointer-events-none hidden sm:block"
              height="30"
              style={{ overflow: 'visible' }}
            >
              <line
                x1="12%"
                y1="15"
                x2="88%"
                y2="15"
                className="animate-dash-flow stroke-indigo-400 dark:stroke-indigo-500"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.75"
              />
            </svg>

            {/* Stepper Pills (Clickable Nodes) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 relative z-10">
              {[
                { id: 'build' as const, label: '1. Build & Store', icon: Globe, color: '#3b82f6' },
                { id: 'crm' as const, label: '2. CRM & Deals', icon: Users, color: '#10b981' },
                { id: 'social' as const, label: '3. Social Publish', icon: Share2, color: '#f43f5e' },
                { id: 'analytics' as const, label: '4. AI Advisory', icon: Brain, color: '#f59e0b' },
              ].map((step) => {
                const StepIcon = step.icon;
                const isActive = activeWorkflow === step.id;
                return (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setActiveWorkflow(step.id);
                      setIsAutoCycling(false);
                    }}
                    className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1.5 relative overflow-hidden backdrop-blur-md ${
                      isActive
                        ? 'bg-white dark:bg-slate-900 border-indigo-500 shadow-lg shadow-indigo-500/15 ring-2 ring-indigo-500/30'
                        : 'bg-white/70 dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-violet-500" />
                    )}
                    <div className="flex items-center justify-between">
                      <StepIcon
                        className="w-4 h-4 transition-transform group-hover:scale-110"
                        style={{ color: isActive ? step.color : undefined }}
                      />
                      {isActive && (
                        <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: step.color }} />
                      )}
                    </div>
                    <span className={`text-xs font-bold ${isActive ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                      {step.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selected Stage Spotlight Card with 2D Glass Styling */}
          <div
            className={`p-6 sm:p-7 rounded-3xl bg-white/95 dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-xl relative overflow-hidden bg-gradient-to-b ${currentWorkflow.gradient}`}
          >
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-white/10 text-[10px] font-bold tracking-wider uppercase text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-white/10">
                  <CurrentIcon className="w-3 h-3" />
                  <span>Stage {currentWorkflow.stepNum} • {currentWorkflow.badge}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                  {currentWorkflow.title}
                </h3>
                <p className="text-xs font-medium text-indigo-600 dark:text-indigo-300">
                  {currentWorkflow.highlight}
                </p>
              </div>

              <div className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-white/10 text-right shrink-0">
                <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400 block">
                  ROI Impact
                </span>
                <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {currentWorkflow.metrics}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 mt-3 leading-relaxed">
              {currentWorkflow.description}
            </p>

            {/* Facilities List for Current Stage */}
            <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {currentWorkflow.facilities.map((fac, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{fac}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4 Core Facilities Grid */}
        <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
              Full Suite Facility Breakdown
            </span>
            <span className="text-[11px] text-slate-500">
              One account connects all 4 engines seamlessly
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-blue-500/40 transition-colors shadow-2xs group cursor-pointer" onClick={() => setActiveWorkflow('build')}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    AI Website & Store Builder
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Prompt-to-site generation with live subdomains & WhatsApp checkout.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/40 transition-colors shadow-2xs group cursor-pointer" onClick={() => setActiveWorkflow('crm')}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Enterprise Pipeline CRM
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Visual Kanban pipeline, deal scoring, notes & omnichannel contact tracking.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-rose-500/40 transition-colors shadow-2xs group cursor-pointer" onClick={() => setActiveWorkflow('social')}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                    Mediamation Social Hub
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Pinterest, Meta & LinkedIn multi-queue scheduler with AI captions.
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 hover:border-amber-500/40 transition-colors shadow-2xs group cursor-pointer" onClick={() => setActiveWorkflow('analytics')}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                  <Brain className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                    STRATIQ Business Advisory
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    Autonomous SWOT audits, financial forecast models & 7-day profit roadmaps.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Social Proof & Value Metric Banner */}
        <div className="pt-6 mt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 dark:text-slate-400 relative z-10">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Replaces 5+ SaaS Subscriptions
            </span>
            <span>•</span>
            <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              99.9% Cloud Uptime
            </span>
          </div>

          <a
            href="https://tarasaka.com"
            target="_blank"
            rel="noreferrer"
            className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <span>Learn more about Tarasaka ecosystem</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* ============================================================== */}
      {/* RIGHT COLUMN: Clean, High-Conversion Authentication Portal      */}
      {/* ============================================================== */}
      <div className="w-full lg:w-[45%] xl:w-[42%] flex flex-col justify-between p-6 sm:p-10 lg:p-12 relative z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-xl lg:shadow-2xl">
        {/* Top Header & Theme Switcher */}
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 ring-1 ring-indigo-500/20">
                <Command className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-black tracking-tight text-slate-900 dark:text-white font-mono">
                    SYS
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 tracking-wider">
                    v2.5
                  </span>
                </div>
                <p className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 tracking-wide flex items-center gap-1">
                  <span>Developed by</span>
                  <a
                    href="https://tarasaka.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 font-bold transition-colors underline decoration-indigo-500/40"
                  >
                    Tarasaka
                  </a>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle Button */}
              <button
                type="button"
                onClick={toggleTheme}
                title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
                className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>

              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/25 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Operational</span>
              </div>
            </div>
          </div>

          <div className="pt-6">
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {authMode === 'login' ? 'Welcome Back to Your Workspace' : 'Create Your Enterprise Workspace'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {authMode === 'login'
                ? 'Sign in to access Websites, CRM, Social Campaigns, and AI Advisory in one place.'
                : 'Get instant, unrestricted access to the complete SYS ecosystem with unified SSO.'}
            </p>
          </div>
        </div>

        {/* Form Body */}
        <div className="my-6 space-y-4">
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="grid grid-cols-2 p-1 rounded-xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setAuthMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                authMode === 'login'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
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
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Create Account
            </button>
          </div>

          {/* Feedback Alerts */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/80 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {resetSent && (
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 flex items-start gap-2.5 text-xs text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Password reset instructions sent. Please check your inbox.</span>
            </div>
          )}

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-xl bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-850 border border-slate-300 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-2xs cursor-pointer disabled:opacity-60"
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
          <div className="relative my-1">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="px-3 bg-white dark:bg-slate-900 text-slate-400">
                Or with business email
              </span>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3.5">
            {authMode === 'register' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Alex Morgan"
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Corporate Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="executive@company.com"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                  Password
                </label>
                {authMode === 'login' && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-hidden focus:border-indigo-500 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>
                {loading
                  ? 'Authenticating...'
                  : authMode === 'login'
                  ? 'Sign In to SYS Workspace'
                  : 'Create SYS Account'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Security & Tarasaka Trust Footer */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800/80 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>256-bit AES Encryption • SOC-2 Compliant Architecture • Central SSO</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500">
            SYS Developed by Tarasaka. Operating across unified domains & dedicated tenant infrastructure.
          </p>
        </div>
      </div>
    </div>
  );
};
