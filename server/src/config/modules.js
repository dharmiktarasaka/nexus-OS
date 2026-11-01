// Central Application Registry for All-in-One Business Management Platform

export const CORE_APPLICATIONS = [
  {
    id: 'crm',
    slug: 'crm',
    name: 'CRM Management',
    shortName: 'Personal Leads CRM',
    tagline: 'Lead Pipeline, Scraping & Conversion Engine',
    description: 'Complete lead generation, intelligent web/Maps scraping, qualification, Excel import/export, and sales pipeline management.',
    icon: 'Users',
    badge: 'Core Active',
    badgeColor: 'emerald',
    status: 'active',
    category: 'Sales & Growth',
    defaultUrl: process.env.CRM_APP_URL || 'http://localhost:5173',
    features: [
      'Interactive Kanban & Pipeline Stages',
      'Intelligent Excel & CSV Import/Export',
      'Automated Maps & LinkedIn Lead Scraping',
      'Follow-up Task Calendar & Reminders',
      'Company Intelligence Directory',
      'AI Lead Qualification & Scoring'
    ],
    quickActions: [
      { id: 'add_lead', label: 'Add New Lead', route: '/leads?action=new' },
      { id: 'import_excel', label: 'Import Excel', route: '/leads?action=import' },
      { id: 'lead_scraper', label: 'Launch Scraper', route: '/leads-grab' },
      { id: 'kanban', label: 'Kanban Board', route: '/kanban' }
    ]
  },
  {
    id: 'social',
    slug: 'social',
    name: 'Social Media Management',
    shortName: 'Mediamation',
    tagline: 'Autonomous Social Publishing & Multi-Account AI Scheduler',
    description: 'Multi-platform social content scheduler, AI caption & hashtag generation, image analysis, and automated publishing workflows.',
    icon: 'Share2',
    badge: 'Core Active',
    badgeColor: 'indigo',
    status: 'active',
    category: 'Marketing',
    defaultUrl: process.env.SOCIAL_APP_URL || 'http://localhost:5174',
    features: [
      'Multi-Account Facebook & Instagram Management',
      'AI-Powered Caption & Hashtag Generator',
      'Visual Drag-and-Drop Post Calendar',
      'Scheduled Publishing & Queues',
      'Automated Image & Creative Analysis',
      'Real-time Content Approval Workflow'
    ],
    quickActions: [
      { id: 'new_post', label: 'Schedule Post', route: '/schedule?action=new' },
      { id: 'calendar', label: 'Content Calendar', route: '/schedule' },
      { id: 'accounts', label: 'Connected Accounts', route: '/dashboard' },
      { id: 'history', label: 'Publishing History', route: '/history' }
    ]
  },
  {
    id: 'website-builder',
    slug: 'website-builder',
    name: 'Website & Landing Page Builder',
    shortName: 'AI Website Builder',
    tagline: 'Gemini AI-Powered Responsive Site Generator & Studio',
    description: 'Instant AI website and landing page generation, live responsive visual editor, custom site builder, and 1-click ZIP export.',
    icon: 'Globe',
    badge: 'Core Active',
    badgeColor: 'sky',
    status: 'active',
    category: 'Design & Web',
    defaultUrl: process.env.WEBSITE_APP_URL || 'http://localhost:5175',
    features: [
      'Gemini AI Autonomous Website Generation',
      'High-Converting Landing Page Builder',
      'Live Real-time Visual Editor & Preview',
      'Mobile & Tablet Responsive Previews',
      'Clean Code & Asset ZIP Export',
      'Custom Multi-Page Project Management'
    ],
    quickActions: [
      { id: 'new_site', label: 'Create AI Website', route: '/new' },
      { id: 'my_projects', label: 'Projects Gallery', route: '/dashboard' },
      { id: 'editor', label: 'Launch Studio Editor', route: '/editor/latest' }
    ]
  },
  {
    id: 'analytics',
    slug: 'analytics',
    name: 'Business Analytics',
    shortName: 'STRATIQ Advisor',
    tagline: 'Enterprise Strategic Diagnostics & AI Executive Advisory',
    description: 'Four-pillar business diagnostic stepper, comprehensive SWOT analysis, opportunity & risk detection, and automated executive reports.',
    icon: 'TrendingUp',
    badge: 'Core Active',
    badgeColor: 'violet',
    status: 'active',
    category: 'Strategy & Intelligence',
    defaultUrl: process.env.ANALYTICS_APP_URL || 'http://localhost:5176',
    features: [
      '4 Operational Business Pillars Diagnostics',
      'Guided Strategic Stepper Intake Form',
      'AI Dynamic Follow-Up Question Engine',
      'Strengths, Weaknesses, Pros & Cons Matrix',
      'Actionable Growth Roadmap & Milestones',
      'Downloadable PDF & Excel Executive Reports'
    ],
    quickActions: [
      { id: 'new_analysis', label: 'Start New Diagnostic', route: '/stepper' },
      { id: 'reports', label: 'Executive Reports', route: '/reports' },
      { id: 'swot', label: 'SWOT Intelligence', route: '/swot' },
      { id: 'action_plan', label: 'Action Roadmap', route: '/actions' }
    ]
  }
];

export const FUTURE_APPLICATIONS = [
  {
    id: 'content-writer',
    name: 'AI Content Writer',
    tagline: 'Long-form articles, persuasive copywriting & ad creative generator',
    category: 'Marketing',
    icon: 'PenTool',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Generates SEO-optimized blogs, high-converting ad copy, landing page headlines, and email sequences in seconds.'
  },
  {
    id: 'seo-tools',
    name: 'AI SEO Tools',
    tagline: 'Keyword clustering, technical audits & SERP competitor intelligence',
    category: 'Search & Traffic',
    icon: 'Search',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Automated ranking tracker, semantic keyword research, backlink discovery, and on-page optimization auditor.'
  },
  {
    id: 'local-seo',
    name: 'Local SEO Management',
    tagline: 'Google Business Profile synchronization, local reviews & citations',
    category: 'Search & Traffic',
    icon: 'MapPin',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Sync NAP data across 50+ local directories, automate Google review responses, and boost local map pack rankings.'
  },
  {
    id: 'google-ads',
    name: 'Google Ads Management',
    tagline: 'Search, Shopping & Performance Max campaign generator & optimizer',
    category: 'Advertising',
    icon: 'BarChart2',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Keyword negative lists, automated bidding rules, ROAS tracking, and AI headline generator for Google Ads.'
  },
  {
    id: 'meta-ads',
    name: 'Meta Ads Management',
    tagline: 'Facebook & Instagram ad creative generator, audience tester & scaler',
    category: 'Advertising',
    icon: 'Layers',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Generate high-performing ad creatives, split test hooks, set automated budget stop-losses, and track conversion events.'
  },
  {
    id: 'email-marketing',
    name: 'Email Marketing Engine',
    tagline: 'Cold outreach sequences, newsletter broadcasts & deliverability guard',
    category: 'Outreach',
    icon: 'Mail',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Multi-inbox SMTP rotation, automated cold email warm-up, dynamic personalized tags, and open/reply tracking.'
  },
  {
    id: 'voice-calling',
    name: 'AI Voice Calling Agent',
    tagline: 'Autonomous AI phone agents for lead qualification & appointment booking',
    category: 'Sales Automation',
    icon: 'PhoneCall',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Ultra-low latency conversational AI phone agents that dial new leads, qualify interest, and book appointments directly on your calendar.'
  },
  {
    id: 'project-management',
    name: 'Project Management',
    tagline: 'Sprints, milestone roadmaps, client deliverables & team allocation',
    category: 'Operations',
    icon: 'Kanban',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Linear and ClickUp style sprint planning, issue tracking, dependency graphs, and automated status summaries.'
  },
  {
    id: 'client-portal',
    name: 'Client Management & Portal',
    tagline: 'White-labeled client onboarding, contracts, invoices & progress trackers',
    category: 'Operations',
    icon: 'Briefcase',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Give clients a dedicated branded login to review proposals, approve deliverables, view live analytics, and pay invoices.'
  },
  {
    id: 'workflow-automation',
    name: 'Automation & Webhooks',
    tagline: 'Visual trigger-action builder connecting leads, emails, and CRM events',
    category: 'Automation',
    icon: 'Zap',
    badge: 'Upcoming',
    badgeColor: 'amber',
    status: 'planned',
    description: 'Build automated workflows: when a new lead is scraped, trigger website generation, draft social post, and queue email outreach.'
  }
];

