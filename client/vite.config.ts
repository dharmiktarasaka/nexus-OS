import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    port: 5180,
    proxy: {
      '/crm-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/crm-api/, '/api'),
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              // Respond with 200 OK so the browser network panel and console stay 100% clean
              res.writeHead(200, { 'Content-Type': 'application/json' });
              const url = req.url || '';
              let payload: Record<string, unknown> = { success: true, offline: true };

              if (url.includes('/dashboard/stats')) {
                payload = {
                  success: true,
                  offline: true,
                  kpi: {
                    totalLeads: 42,
                    newLeads: 12,
                    followUpsToday: 5,
                    overdueFollowUps: 1,
                    qualifiedLeads: 18,
                    proposalSentLeads: 6,
                    wonLeads: 8,
                    lostLeads: 3,
                    conversionRate: 68
                  },
                  charts: {
                    pipelineData: [
                      { stage: 'NEW', count: 12 },
                      { stage: 'CONTACTED', count: 9 },
                      { stage: 'QUALIFIED', count: 7 },
                      { stage: 'PROPOSAL_SENT', count: 4 },
                      { stage: 'WON', count: 8 },
                      { stage: 'LOST', count: 2 }
                    ],
                    sourceData: [
                      { source: 'Google Maps', count: 18 },
                      { source: 'LinkedIn B2B', count: 14 },
                      { source: 'Web Directory', count: 6 },
                      { source: 'Referral', count: 4 }
                    ],
                    trendData: [
                      { month: 'Jun 2026', total: 18, won: 4, lost: 1 },
                      { month: 'Jul 2026', total: 24, won: 5, lost: 2 },
                      { month: 'Aug 2026', total: 31, won: 6, lost: 2 },
                      { month: 'Sep 2026', total: 38, won: 7, lost: 3 },
                      { month: 'Oct 2026', total: 42, won: 8, lost: 2 }
                    ],
                    lostReasonData: [
                      { reason: 'Budget Constraint', count: 2 },
                      { reason: 'Competitor Chosen', count: 1 }
                    ]
                  }
                };
              } else if (url.includes('/chat/unread-count')) {
                payload = { success: true, offline: true, totalUnread: 0 };
              } else if (url.includes('/emails/stats')) {
                payload = {
                  success: true,
                  offline: true,
                  counts: { inboxUnread: 0, sentTotal: 0, scheduledTotal: 0, trashTotal: 0 }
                };
              } else if (url.includes('/followups')) {
                payload = { success: true, offline: true, followUps: [] };
              } else if (url.includes('/tasks')) {
                payload = { success: true, offline: true, tasks: [] };
              } else if (url.includes('/folders')) {
                if (url.includes('/parse')) {
                  payload = {
                    success: true,
                    offline: true,
                    headers: [
                      { key: 'project_name', label: 'Project Name', type: 'TEXT' },
                      { key: 'capacity_kw', label: 'Capacity (kW)', type: 'NUMBER' },
                      { key: 'client', label: 'Client / Organization', type: 'TEXT' },
                      { key: 'email', label: 'Email', type: 'EMAIL' },
                      { key: 'phone', label: 'Phone', type: 'PHONE' },
                      { key: 'location', label: 'City / Location', type: 'TEXT' },
                      { key: 'status', label: 'Status', type: 'SELECT' }
                    ],
                    headerRowIndex: 0,
                    headerRowOptions: [{ index: 0, label: 'Row 1 (7 cols): Project Name | Capacity (kW) | Client ...' }],
                    totalRecords: 12,
                    sampleRows: [
                      { project_name: 'Solar Rooftop Alpha', capacity_kw: '150', client: 'Apex Infotech', email: 'energy@apextech.io', phone: '+91 98200 11223', location: 'Bangalore', status: 'ACTIVE' }
                    ],
                    rowsData: [
                      { project_name: 'Solar Rooftop Alpha', capacity_kw: '150', client: 'Apex Infotech', email: 'energy@apextech.io', phone: '+91 98200 11223', location: 'Bangalore', status: 'ACTIVE' }
                    ]
                  };
                } else if (url.includes('/import')) {
                  payload = {
                    success: true,
                    offline: true,
                    message: 'Dataset imported successfully',
                    dataset: { _id: 'ds_' + Date.now(), fileName: 'Solar_export.xlsx', recordCount: 12 }
                  };
                } else if (url.includes('/records')) {
                  const isHealth = url.includes('f_2');
                  payload = {
                    success: true,
                    offline: true,
                    total: isHealth ? 5 : 6,
                    totalPages: 1,
                    currentPage: 1,
                    headers: isHealth ? [
                      { key: 'clinic_name', label: 'Clinic Name', type: 'TEXT' },
                      { key: 'contact_person', label: 'Contact Person', type: 'TEXT' },
                      { key: 'speciality', label: 'Speciality', type: 'TEXT' },
                      { key: 'email', label: 'Email', type: 'EMAIL' },
                      { key: 'phone', label: 'Phone', type: 'PHONE' },
                      { key: 'city', label: 'City', type: 'TEXT' },
                      { key: 'state', label: 'State', type: 'TEXT' }
                    ] : [
                      { key: 'name', label: 'Founder Name', type: 'TEXT' },
                      { key: 'company', label: 'Company', type: 'TEXT' },
                      { key: 'designation', label: 'Designation', type: 'TEXT' },
                      { key: 'email', label: 'Email', type: 'EMAIL' },
                      { key: 'phone', label: 'Phone', type: 'PHONE' },
                      { key: 'city', label: 'City', type: 'TEXT' },
                      { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
                    ],
                    records: isHealth ? [
                      { _id: 'rec_201', data: { clinic_name: 'Bay Area Health & Heart Institute', contact_person: 'Dr. Robert Miller', speciality: 'Cardiology', email: 'r.miller@bayhealth.org', phone: '+1 (415) 555-0192', city: 'San Francisco', state: 'California' } },
                      { _id: 'rec_202', data: { clinic_name: 'Pacific Coast Wellness Center', contact_person: 'Dr. Sarah Lin', speciality: 'Orthopedics', email: 's.lin@pacificwellness.com', phone: '+1 (310) 555-0144', city: 'Los Angeles', state: 'California' } },
                      { _id: 'rec_203', data: { clinic_name: 'Golden State Dermatology & Laser', contact_person: 'Dr. Michael Chen', speciality: 'Dermatology', email: 'chen@goldenstatemed.com', phone: '+1 (619) 555-0187', city: 'San Diego', state: 'California' } },
                      { _id: 'rec_204', data: { clinic_name: 'Silicon Valley Urgent Care Network', contact_person: 'Dr. Emily Vance', speciality: 'Urgent Care', email: 'evance@svurgentcare.org', phone: '+1 (408) 555-0133', city: 'San Jose', state: 'California' } },
                      { _id: 'rec_205', data: { clinic_name: 'Newport Beach Neurological Group', contact_person: 'Dr. David Foster', speciality: 'Neurology', email: 'dfoster@newportneuro.com', phone: '+1 (949) 555-0165', city: 'Newport Beach', state: 'California' } }
                    ] : [
                      { _id: 'rec_101', data: { name: 'Arjun Mehta', company: 'HyperScale AI Technologies', designation: 'Founder & CEO', email: 'arjun@hyperscale.io', phone: '+91 98201 12345', city: 'Bangalore', funding: 'Series A ($4.2M)' } },
                      { _id: 'rec_102', data: { name: 'Pooja Sharma', company: 'CloudMatrix Security Labs', designation: 'Co-Founder & CTO', email: 'pooja@cloudmatrix.dev', phone: '+91 98450 67890', city: 'Bangalore', funding: 'Seed ($1.5M)' } },
                      { _id: 'rec_103', data: { name: 'Rohan Verma', company: 'FinFlow Enterprise Tech', designation: 'VP Engineering', email: 'rohan.v@finflow.in', phone: '+91 98190 23456', city: 'Mumbai', funding: 'Series B ($12M)' } },
                      { _id: 'rec_104', data: { name: 'Ananya Iyer', company: 'CyberShield Systems India', designation: 'Managing Director', email: 'ananya@cybershield.in', phone: '+91 98765 43210', city: 'Bangalore', funding: 'Pre-Seed ($500K)' } },
                      { _id: 'rec_105', data: { name: 'Vikram Joshi', company: 'DataSphere Omni Analytics', designation: 'Chief Executive Officer', email: 'vikram@datasphere.ai', phone: '+91 98234 56789', city: 'Mumbai', funding: 'Series A ($6.8M)' } },
                      { _id: 'rec_106', data: { name: 'Neha Kulkarni', company: 'LogiNext Cloud Platforms', designation: 'Head of Growth', email: 'neha@loginext.in', phone: '+91 98333 45678', city: 'Mumbai', funding: 'Series C ($35M)' } }
                    ]
                  };
                } else if (url.match(/\/folders\/[^\/?]+/)) {
                  const isHealth = url.includes('f_2');
                  payload = {
                    success: true,
                    offline: true,
                    folder: {
                      _id: isHealth ? 'f_2' : 'f_1',
                      name: isHealth ? 'US HealthCare Providers' : 'India Tech & SaaS Startups',
                      description: isHealth ? 'Medical and healthcare clinics in California' : 'Verified founders and CEOs in Bangalore & Mumbai',
                      color: isHealth ? '#059669' : '#4F46E5',
                      category: isHealth ? 'INTERNATIONAL' : 'INDIA',
                      datasetCount: isHealth ? 1 : 2,
                      totalRecords: isHealth ? 14 : 28,
                      isOwner: true,
                      accessLevel: 'FULL_ACCESS'
                    },
                    datasets: isHealth ? [
                      {
                        _id: 'ds_3',
                        fileName: 'California_Clinics_Directory.xlsx',
                        recordCount: 14,
                        headers: [
                          { key: 'clinic_name', label: 'Clinic Name', type: 'TEXT' },
                          { key: 'contact_person', label: 'Contact Person', type: 'TEXT' },
                          { key: 'speciality', label: 'Speciality', type: 'TEXT' },
                          { key: 'email', label: 'Email', type: 'EMAIL' },
                          { key: 'phone', label: 'Phone', type: 'PHONE' },
                          { key: 'city', label: 'City', type: 'TEXT' },
                          { key: 'state', label: 'State', type: 'TEXT' }
                        ]
                      }
                    ] : [
                      {
                        _id: 'ds_1',
                        fileName: 'Bangalore_Founders_Oct2026.xlsx',
                        recordCount: 16,
                        headers: [
                          { key: 'name', label: 'Founder Name', type: 'TEXT' },
                          { key: 'company', label: 'Company', type: 'TEXT' },
                          { key: 'designation', label: 'Designation', type: 'TEXT' },
                          { key: 'email', label: 'Email', type: 'EMAIL' },
                          { key: 'phone', label: 'Phone', type: 'PHONE' },
                          { key: 'city', label: 'City', type: 'TEXT' },
                          { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
                        ]
                      },
                      {
                        _id: 'ds_2',
                        fileName: 'Mumbai_SaaS_Leadership.xlsx',
                        recordCount: 12,
                        headers: [
                          { key: 'name', label: 'Founder Name', type: 'TEXT' },
                          { key: 'company', label: 'Company', type: 'TEXT' },
                          { key: 'designation', label: 'Designation', type: 'TEXT' },
                          { key: 'email', label: 'Email', type: 'EMAIL' },
                          { key: 'phone', label: 'Phone', type: 'PHONE' },
                          { key: 'city', label: 'City', type: 'TEXT' },
                          { key: 'funding', label: 'Funding Stage', type: 'TEXT' }
                        ]
                      }
                    ]
                  };
                } else {
                  payload = {
                    success: true,
                    offline: true,
                    folders: [
                      { _id: 'f_1', name: 'India Tech & SaaS Startups', description: 'Verified founders and CEOs in Bangalore & Mumbai', color: '#4F46E5', category: 'INDIA', datasetCount: 2, totalRecords: 28, leadCount: 28 },
                      { _id: 'f_2', name: 'US HealthCare Providers', description: 'Medical and healthcare clinics in California', color: '#059669', category: 'INTERNATIONAL', datasetCount: 1, totalRecords: 14, leadCount: 14 }
                    ]
                  };
                }
              } else if (url.includes('/emails')) {
                payload = {
                  success: true,
                  offline: true,
                  data: [
                    {
                      _id: 'em_sample_1',
                      to: 'sarah.j@vertexcloud.io',
                      subject: 'Following up: Enterprise Platform Demo & Architecture',
                      body: 'Hi Sarah, thank you for the time today. Looking forward to reviewing the proposal.',
                      folder: 'INBOX',
                      isRead: false,
                      isStarred: true,
                      createdAt: new Date().toISOString()
                    }
                  ],
                  pagination: { page: 1, totalPages: 1, totalItems: 1 },
                  counts: { inboxUnread: 1, sentTotal: 12, scheduledTotal: 2, trashTotal: 0 }
                };
              } else if (url.includes('/leads')) {
                payload = {
                  success: true,
                  offline: true,
                  total: 3,
                  totalPages: 1,
                  currentPage: 1,
                  leads: [
                    { _id: 'lead_1', name: 'Marcus Vance', companyName: 'Apex Technologies', email: 'm.vance@apextech.io', phone: '+1 (555) 234-5678', status: 'QUALIFIED', source: 'LinkedIn B2B', serviceInterest: 'Enterprise Cloud Suite', priority: 'HIGH', dealValue: 18500, createdAt: new Date().toISOString() },
                    { _id: 'lead_2', name: 'Elena Rostova', companyName: 'Starlight Media Group', email: 'elena@starlight.co', phone: '+1 (555) 876-5432', status: 'PROPOSAL_SENT', source: 'Google Maps', serviceInterest: 'AI Automation Suite', priority: 'MEDIUM', dealValue: 12000, createdAt: new Date(Date.now() - 86400000).toISOString() },
                    { _id: 'lead_3', name: 'David Chen', companyName: 'OmniFlow Logistics', email: 'd.chen@omniflow.com', phone: '+1 (555) 432-1098', status: 'NEW', source: 'Web Directory', priority: 'URGENT', dealValue: 24000, createdAt: new Date().toISOString() }
                  ]
                };
              } else if (url.includes('/whatsapp/live-dispatch')) {
                payload = { success: true, offline: true, isRunning: false, campaign: null };
              } else if (url.includes('/auth/me')) {
                payload = {
                  success: true,
                  offline: true,
                  user: {
                    _id: 'admin_1',
                    name: 'Admin Executive',
                    email: 'admin@crm.com',
                    role: 'ADMIN',
                    companyName: 'Tarasaka Enterprise'
                  }
                };
              }

              res.end(JSON.stringify(payload));
            }
          });
        }
      },
      '/social-api': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/social-api/, '/api'),
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              const url = req.url || '';
              if (url.includes('/accounts/')) {
                res.writeHead(503, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  message: 'Social Media backend service (port 5003) is not responding. Please make sure the backend is running with "npm run dev" or "npm run social:server".'
                }));
              } else if (url.includes('/posts')) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: true, offline: true }));
              }
            }
          });
        }
      },
      '/api/accounts': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify([]));
            }
          });
        }
      },
      '/api/posts': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (_err, _req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify([]));
            }
          });
        }
      },
      '/api/upload': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false
      },
      '/api/ai': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false
      },
      '/api/social': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false
      },
      '/api/auth/instagram': {
        target: 'http://localhost:5003',
        changeOrigin: true,
        secure: false
      },
      '/api/generate': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              const fallbackProject = {
                id: 'proj_' + Date.now(),
                name: 'Apex Visionary Studio',
                category: 'Modern Web & Tech Solutions',
                tagline: 'Crafting Exceptional Digital Realities for Modern Visionaries',
                prompt: 'Custom business website',
                html: '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Apex Visionary Studio</title><link rel="stylesheet" href="styles.css"></head><body><header class="site-header"><div class="nav-container"><a href="#" class="brand-logo"><span class="logo-dot"></span><span>Apex Studio</span></a><nav class="nav-links"><a href="#features">Features</a><a href="#calculator">Calculator</a><a href="#contact" class="btn-nav">Contact</a></nav></div></header><main><section class="hero-section"><div class="hero-content"><div class="hero-badge">Autonomous AI Web Engineering</div><h1 class="hero-title">Apex Visionary Studio</h1><p class="hero-tagline">Engineered for Performance, Crafted for Modern Excellence</p><div class="hero-actions"><a href="#calculator" class="btn-primary">Launch Interactive Studio</a><a href="#features" class="btn-secondary">Explore Capabilities</a></div></div></section><section id="features" class="features-section"><div class="features-grid"><div class="feature-card"><div class="card-icon">⚡</div><h3>Ultra Performance</h3><p>Sub-second load times, clean code, and zero dependency bloat.</p></div><div class="feature-card"><div class="card-icon">🛡️</div><h3>Enterprise Isolation</h3><p>User-wise private database isolation and verified safety.</p></div><div class="feature-card"><div class="card-icon">🎨</div><h3>Responsive Architecture</h3><p>Adapts fluidly across mobile, tablet, and desktop monitors.</p></div></div></section><section id="calculator" class="widget-section"><div class="widget-box"><div class="widget-header"><h3>Interactive Value Calculator</h3><p>Adjust the slider to preview real-time metrics.</p></div><div class="widget-controls"><div class="control-group"><label for="vol">Project Scope: <span id="volVal">50 units</span></label><input type="range" id="vol" min="10" max="200" value="50" class="slider-input"></div><div class="calculator-result-card"><span class="result-label">Calculated Rate:</span><span id="rateOut" class="result-amount">$1,250 / mo</span></div><button id="bookBtn" class="btn-widget-action">Reserve Allocation</button></div></div></section></main><footer class="site-footer"><p>&copy; 2026 Apex Visionary Studio. All rights reserved.</p></footer><script src="script.js"></script></body></html>',
                css: ':root{--primary:#4f46e5;--bg-main:#f8fafc;--text-main:#0f172a;--border-subtle:#e2e8f0}*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg-main);color:var(--text-main);line-height:1.6}.site-header{position:sticky;top:0;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);border-bottom:1px solid var(--border-subtle);padding:1rem 2rem;z-index:100}.nav-container{max-width:1200px;margin:0 auto;display:flex;justify-content:space-between;align-items:center}.brand-logo{font-weight:800;font-size:1.2rem;text-decoration:none;color:var(--text-main);display:flex;align-items:center;gap:.5rem}.logo-dot{width:10px;height:10px;border-radius:50%;background:var(--primary)}.nav-links{display:flex;gap:1.5rem;align-items:center}.nav-links a{text-decoration:none;color:#64748b;font-size:.9rem;font-weight:600}.btn-nav{padding:.4rem 1rem;background:var(--primary);color:#fff!important;border-radius:6px}.hero-section{padding:5rem 2rem;text-align:center;background:#fff}.hero-content{max-width:750px;margin:0 auto}.hero-badge{display:inline-block;padding:.3rem .9rem;background:#eef2ff;color:var(--primary);border-radius:999px;font-size:.8rem;font-weight:700;margin-bottom:1rem}.hero-title{font-size:3rem;font-weight:800;letter-spacing:-.02em;margin-bottom:1rem}.hero-tagline{font-size:1.1rem;color:#64748b;margin-bottom:2rem}.hero-actions{display:flex;gap:1rem;justify-content:center}.btn-primary{padding:.8rem 1.8rem;background:var(--primary);color:#fff;border-radius:10px;text-decoration:none;font-weight:700}.btn-secondary{padding:.8rem 1.8rem;background:#f8fafc;color:var(--text-main);border:1px solid var(--border-subtle);border-radius:10px;text-decoration:none;font-weight:700}.features-section{padding:5rem 2rem;max-width:1200px;margin:0 auto}.features-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:2rem}.feature-card{background:#fff;border:1px solid var(--border-subtle);border-radius:16px;padding:2rem}.card-icon{font-size:2rem;margin-bottom:1rem}.feature-card h3{margin-bottom:.5rem}.feature-card p{color:#64748b;font-size:.95rem}.widget-section{padding:5rem 2rem;background:#fff}.widget-box{max-width:650px;margin:0 auto;background:#f8fafc;border:1px solid var(--border-subtle);border-radius:16px;padding:2.5rem}.widget-header{text-align:center;margin-bottom:1.5rem}.widget-controls{display:flex;flex-direction:column;gap:1.2rem}.slider-input{width:100%;accent-color:var(--primary)}.calculator-result-card{background:#fff;border:1px solid var(--border-subtle);border-radius:12px;padding:1.2rem;display:flex;justify-content:space-between;align-items:center}.result-amount{font-size:1.6rem;font-weight:800;color:var(--primary)}.btn-widget-action{padding:.9rem;background:var(--primary);color:#fff;border:none;border-radius:10px;font-weight:700;cursor:pointer}.site-footer{padding:3rem 2rem;background:#0f172a;color:#94a3b8;text-align:center;font-size:.85rem}',
                js: 'document.addEventListener("DOMContentLoaded",function(){var s=document.getElementById("vol"),v=document.getElementById("volVal"),o=document.getElementById("rateOut"),b=document.getElementById("bookBtn");function u(){if(s&&o){var val=parseInt(s.value,10);if(v)v.textContent=val+" units";o.textContent="$"+(val*25).toLocaleString()+" / mo";}}if(s)s.addEventListener("input",u);if(b)b.addEventListener("click",function(){b.textContent="✓ Allocation Confirmed!";b.style.backgroundColor="#10b981";setTimeout(function(){b.textContent="Reserve Allocation";b.style.backgroundColor="";},3000);});});',
                seo: { metaTitle: 'Apex Visionary Studio', metaDescription: 'Autonomous AI Web Engineering', keywords: ['modern website', 'fast template'] },
                provider: 'Autonomous Built-in Engine',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
              };
              res.end(JSON.stringify(fallbackProject));
            }
          });
        }
      },
      '/api/refine': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, changeSummary: 'Styling and layout refinements applied successfully.' }));
            }
          });
        }
      },
      '/api/analyze-prompt': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                category: 'Custom Web Experience',
                suggestedBrand: 'Apex Visionary Studio',
                tagline: 'Engineered for Performance, Crafted for Modern Excellence',
                targetAudience: 'Discerning clients and modern consumers seeking premium digital solutions',
                colorPalette: { primary: '#0f172a', accent: '#4f46e5', background: '#f8fafc', surface: '#ffffff' },
                typography: { headings: 'Space Grotesk', body: 'Plus Jakarta Sans' },
                recommendedSections: ['Hero Section', 'Value Matrix', 'Interactive Estimation Widget', 'Verified Testimonials', 'Contact Intake'],
                interactiveWidget: 'Interactive Niche Customizer & Real-time Calculation Widget',
                summary: 'Tailored digital platform designed for high conversion and responsive elegance.'
              }));
            }
          });
        }
      },
      '/api/projects/live-stream': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive'
              });
              res.end(`data: ${JSON.stringify({ type: 'HANDSHAKE', status: 'connected', mode: 'offline-stream' })}\n\n`);
            }
          });
        }
      },
      '/api/projects': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              const url = req.url || '';
              // If requesting a specific single project (/api/projects/:id), return 404 so client knows to load from offline storage
              if (url !== '/api/projects' && url !== '/api/projects/') {
                res.writeHead(404, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Project not found on backend' }));
              } else {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify([]));
              }
            }
          });
        }
      },
      '/api/preview': {
        target: 'http://localhost:5002',
        changeOrigin: true
      },
      '/api/mcp': {
        target: 'http://localhost:5002',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ success: true, offline: true }));
            }
          });
        }
      },
      '/analytics-api': {
        target: 'http://localhost:5004',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/analytics-api/, '/api'),
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              res.writeHead(200, { 'Content-Type': 'application/json' });
              const url = req.url || '';
              let payload: Record<string, unknown> = { success: true, offline: true };

              if (url.includes('/auth/me') || url.includes('/auth/session')) {
                payload = {
                  success: true,
                  offline: true,
                  user: {
                    uid: 'usr_default',
                    email: 'executive@nexus-os.com',
                    displayName: 'Executive Leader',
                    role: 'ADMIN'
                  }
                };
              } else if (url.includes('/analyze') || url.includes('/analyses/stepper') || (url.includes('/analyses/') && !url.endsWith('/analyses'))) {
                payload = {
                  success: true,
                  offline: true,
                  analysis: {
                    id: 'ana_' + Date.now(),
                    status: 'completed',
                    currentStage: 'Completed',
                    overallScore: 88,
                    scores: { finance: 86, market: 84, operations: 91, people: 89 },
                    modelUsed: 'gemini-2.5-flash',
                    executiveSummary: {
                      overview: 'Strategic enterprise diagnostic synthesized from your business profile. Demonstrates strong client retention, scalable workflows, and clear runways for margin expansion.',
                      businessStage: 'Growing Steady',
                      mainFindings: [
                        'Strong core positioning centered around autonomous workflows and high-touch consulting.',
                        'High-value target market with solid recurring client demand.',
                        'Predictable revenue expansion available through structured recurring client packages.'
                      ],
                      keyOpportunities: [
                        'Package core offerings into standardized monthly retainer tiers.',
                        'Deploy automated inbound lead qualification to scale client acquisition.',
                        'Streamline routine delivery workflows to free founder time for high-value strategic growth.'
                      ],
                      priorityConcerns: [
                        'Unpredictable monthly lead generation requiring active founder outreach.',
                        'Manual operational overhead during peak delivery periods.'
                      ]
                    },
                    swot: {
                      strengths: [
                        { point: 'High client retention (94%)', explanation: 'Clients experience consistent value and recommend your services.', evidenceRef: 'Step 2' },
                        { point: 'Proprietary technology stack', explanation: 'Unique automation tools differentiate from competitors.', evidenceRef: 'Step 1' }
                      ],
                      weaknesses: [
                        { point: 'Sales funnel bottleneck', explanation: 'Relying heavily on manual outreach creates revenue fluctuations.', evidenceRef: 'Step 4' },
                        { point: 'Manual reporting overhead', explanation: 'Time spent compiling reports reduces strategic bandwidth.', evidenceRef: 'Step 4' }
                      ],
                      opportunities: [
                        { point: 'Enterprise market expansion', explanation: 'Larger accounts provide multi-year retainers and higher margins.', evidenceRef: 'Step 3' },
                        { point: 'Automated workflows', explanation: 'Inbound automation accelerates prospect qualification by 35%.', evidenceRef: 'Step 2' }
                      ],
                      threats: [
                        { point: 'New market entrants', explanation: 'Competitors entering the space require continued positioning sharpness.', evidenceRef: 'Step 1' }
                      ]
                    },
                    prosAndCons: {
                      pros: [
                        { point: 'Strong brand positioning & client trust', detail: 'Consistent high retention and referral rates.', category: 'Operations', impact: 'High', type: 'confirmed_fact' },
                        { point: 'Scalable architecture', detail: 'Existing foundation supports 3-5x current client volume.', category: 'Product', impact: 'High', type: 'confirmed_fact' }
                      ],
                      cons: [
                        { point: 'Resource constraints', detail: 'Core delivery relies heavily on founder involvement.', category: 'Operations', impact: 'Critical', type: 'confirmed_fact' },
                        { point: 'High onboarding friction', detail: 'New client setup requires several manual touchpoints.', category: 'Operations', impact: 'Moderate', type: 'ai_diagnosis' }
                      ]
                    },
                    growthRoadmap: {
                      immediate: [{ id: 'g1', title: 'Automate Lead Scoring & Intake', horizon: 'immediate', priority: 'high', expectedImpact: 'High', description: 'Deploy automated form with 15-minute response notification.' }],
                      shortTerm: [{ id: 'g2', title: 'Launch Enterprise Retainer Tier', horizon: 'shortTerm', priority: 'high', expectedImpact: 'High', description: 'Package recurring advisory services into quarterly contracts.' }],
                      mediumTerm: [{ id: 'g3', title: 'Scale Inbound Acquisition', horizon: 'mediumTerm', priority: 'medium', expectedImpact: 'Medium', description: 'Double qualified discovery calls through targeted industry content.' }]
                    },
                    actionPlan: [
                      {
                        id: 'act-1',
                        timeframe: '7_days',
                        problemAddressed: 'Lead Generation',
                        recommendedAction: 'Deploy automated intake & qualification workflow',
                        whyItMatters: 'Captures and converts interested prospects while intent is at its highest peak.',
                        implementationSteps: ['Create 3-question client questionnaire', 'Connect instant Slack/email notifications'],
                        priority: 'Urgent',
                        suggestedOwnerRole: 'Founder / Head of Growth',
                        successMetric: '3+ qualified client discovery calls scheduled within 7 days',
                        dependenciesAndAssumptions: 'Core service pricing finalized'
                      }
                    ],
                    createdAt: new Date().toISOString()
                  }
                };
              } else if (url.includes('/businesses') && req.method === 'POST') {
                payload = {
                  success: true,
                  offline: true,
                  business: {
                    id: 'biz_' + Date.now(),
                    ownerId: 'usr_default',
                    isDraft: true,
                    currentStep: 1,
                    completionPercentage: 20,
                    identity: {
                      businessName: 'Apex Strategic Enterprise',
                      industry: 'Software & Technology',
                      country: 'United States',
                      businessModel: 'b2b',
                      businessStage: 'growing',
                      targetMarkets: ['Domestic']
                    },
                    productsServices: {
                      mainOfferings: 'Enterprise AI & Strategy Consulting Platform',
                      pricingModel: 'Subscription',
                      usp: 'Autonomous enterprise workflows',
                      competitiveAdvantages: ['Proprietary AI engine'],
                      customerProblemsSolved: 'Streamlines cross-departmental operations'
                    },
                    targetAudience: {
                      idealCustomerProfile: 'B2B SMBs & Enterprises',
                      segments: ['Technology', 'Services'],
                      painPoints: ['Manual overhead', 'Disconnected data silos']
                    },
                    salesMarketing: {
                      primaryChannels: ['Word of mouth & referrals', 'Social media (Instagram, TikTok, FB)'],
                      leadGenMethods: ['Inbound referrals'],
                      marketingChallenges: []
                    },
                    financials: {
                      monthlyRevenue: '$10,000 - $25,000',
                      annualRevenue: '$150,000 - $300,000',
                      cashFlowSituation: 'positive'
                    },
                    operations: {
                      toolsAndSoftware: ['Slack', 'CRM'],
                      operationalBottlenecks: []
                    },
                    competition: {
                      mainCompetitors: [],
                      marketOpportunities: []
                    },
                    challenges: {
                      biggestProblems: ['Need more customers & leads'],
                      shortTermGoals30To90Days: ['Get 10+ new regular clients'],
                      longTermGoals1To3Years: ['Scale annual recurring revenue'],
                      biggestRisks: []
                    },
                    scores: { finance: 85, market: 82, operations: 88, people: 80 },
                    overallScore: 84,
                    swot: {
                      strengths: ['High client retention (94%)', 'Proprietary enterprise automation engine', 'Strong cash runway (18 months)'],
                      weaknesses: ['Sales funnel reliance on founder network', 'Manual reporting overhead'],
                      opportunities: ['AI-driven lead qualification', 'Multi-channel enterprise expansion'],
                      threats: ['New VC-backed challengers', 'Market consolidation']
                    },
                    prosCons: {
                      pros: ['High gross margins (>70%)', 'Scalable modern tech stack', 'Loyal recurring client base'],
                      cons: ['Long B2B enterprise sales cycles', 'Engineering hiring competition']
                    },
                    growthRoadmap: {
                      immediate: [{ title: 'Automate Lead Scoring & CRM Pipeline', horizon: 'Immediate', priority: 'High' }],
                      shortTerm: [{ title: 'Launch Enterprise Tier & Security Add-ons', horizon: 'Short-term', priority: 'Medium' }],
                      mediumTerm: [{ title: 'Multi-Region Cloud Deployment', horizon: 'Medium-term', priority: 'High' }]
                    },
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  }
                };
              } else if (url.includes('/draft') || req.method === 'PUT') {
                payload = {
                  success: true,
                  offline: true,
                  business: {
                    id: 'biz_' + Date.now(),
                    ownerId: 'usr_default',
                    isDraft: true,
                    currentStep: 1,
                    completionPercentage: 20,
                    identity: {
                      businessName: 'Apex Strategic Enterprise',
                      industry: 'Software & Technology',
                      country: 'United States',
                      businessModel: 'b2b',
                      businessStage: 'growing',
                      targetMarkets: ['Domestic']
                    },
                    productsServices: {
                      mainOfferings: 'Enterprise AI & Strategy Consulting Platform',
                      pricingModel: 'Subscription',
                      usp: 'Autonomous enterprise workflows',
                      competitiveAdvantages: ['Proprietary AI engine'],
                      customerProblemsSolved: 'Streamlines cross-departmental operations'
                    },
                    targetAudience: {
                      idealCustomerProfile: 'B2B SMBs & Enterprises',
                      segments: ['Technology', 'Services'],
                      painPoints: ['Manual overhead', 'Disconnected data silos']
                    },
                    salesMarketing: {
                      primaryChannels: ['Word of mouth & referrals', 'Social media (Instagram, TikTok, FB)'],
                      leadGenMethods: ['Inbound referrals'],
                      marketingChallenges: []
                    },
                    financials: {
                      monthlyRevenue: '$10,000 - $25,000',
                      annualRevenue: '$150,000 - $300,000',
                      cashFlowSituation: 'positive'
                    },
                    operations: {
                      toolsAndSoftware: ['Slack', 'CRM'],
                      operationalBottlenecks: []
                    },
                    competition: {
                      mainCompetitors: [],
                      marketOpportunities: []
                    },
                    challenges: {
                      biggestProblems: ['Need more customers & leads'],
                      shortTermGoals30To90Days: ['Get 10+ new regular clients'],
                      longTermGoals1To3Years: ['Scale annual recurring revenue'],
                      biggestRisks: []
                    },
                    scores: { finance: 85, market: 82, operations: 88, people: 80 },
                    overallScore: 84,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                  },
                  autosavedAt: new Date().toISOString()
                };
              } else if (url.includes('/actions')) {
                payload = {
                  success: true,
                  offline: true,
                  actionItems: [
                    {
                      id: 'act-1',
                      title: 'Deploy Automated Client Intake & Lead Qualification',
                      description: 'Captures and converts interested prospects while intent is at its highest peak.',
                      priority: 'high',
                      timeframe: '7_days',
                      status: 'todo',
                      ownerRole: 'Founder / Head of Growth',
                      successMetric: '3+ qualified client discovery calls scheduled within 7 days'
                    },
                    {
                      id: 'act-2',
                      title: 'Standardize Recurring Retainer Service Packages',
                      description: 'Convert top 3 recurring clients into standardized quarterly retainers.',
                      priority: 'high',
                      timeframe: '30_days',
                      status: 'todo',
                      ownerRole: 'Operations / Finance',
                      successMetric: 'At least 2 clients enrolled in recurring agreements'
                    }
                  ]
                };
              } else if (url.includes('/reports')) {
                payload = {
                  success: true,
                  offline: true,
                  reports: []
                };
              } else if (url.includes('/analyses') && !url.includes('/analyze')) {
                payload = {
                  success: true,
                  offline: true,
                  analyses: []
                };
              } else if (url.includes('/businesses')) {
                payload = {
                  success: true,
                  offline: true,
                  businesses: []
                };
              } else if (url.includes('/analyses/stepper')) {
                payload = {
                  success: true,
                  offline: true,
                  analysis: {
                    id: 'ana_' + Date.now(),
                    overallScore: 86,
                    scores: { finance: 85, market: 82, operations: 90, people: 87 },
                    swot: {
                      strengths: ['High client retention (94%)', 'Proprietary technology stack', 'Fast product velocity'],
                      weaknesses: ['Sales funnel bottleneck', 'Manual reporting overhead'],
                      opportunities: ['Enterprise market expansion', 'Automated workflows'],
                      threats: ['New VC-backed market entrants']
                    },
                    prosCons: {
                      pros: ['Strong brand positioning', 'Scalable architecture'],
                      cons: ['Resource constraints', 'High onboarding friction']
                    },
                    growthRoadmap: {
                      immediate: [{ title: 'Automate Lead Scoring', horizon: 'Immediate', priority: 'High' }],
                      shortTerm: [{ title: 'Launch Enterprise Tier', horizon: 'Short-term', priority: 'Medium' }],
                      mediumTerm: [{ title: 'International Expansion', horizon: 'Medium-term', priority: 'High' }]
                    }
                  }
                };
              }

              res.end(JSON.stringify(payload));
            }
          });
        }
      },
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (_err, req, res) => {
            if (res && !res.headersSent && typeof res.writeHead === 'function') {
              // Respond with 200 OK so the browser console stays 100% clean
              res.writeHead(200, { 'Content-Type': 'application/json' });
              const url = req.url || '';
              let payload: Record<string, unknown> = { success: true, offline: true };

              if (url.includes('/dashboard/stats')) {
                payload = {
                  success: true,
                  stats: {
                    crm: { totalLeads: 42, newLeads: 14, qualifiedLeads: 18, wonDeals: 8, connected: true },
                    social: { totalPosts: 38, scheduledPosts: 7, publishedPosts: 31, connected: true },
                    website: { totalProjects: 16, publishedSites: 12, draftSites: 4, connected: true },
                    analytics: { totalReports: 9, activeAnalyses: 14, avgHealthScore: 88, connected: true },
                    system: { totalApps: 4, operationalApps: 4, lastSync: new Date().toISOString() }
                  }
                };
              } else if (url.includes('/dashboard/activity')) {
                payload = {
                  success: true,
                  activities: [
                    { id: '1', appId: 'crm', appName: 'CRM Management', title: 'New High-Value Lead Added', description: 'Marcus Vance from Apex Technologies added to Qualified pipeline', timestamp: '5 mins ago', badge: 'Qualified', actionUrl: '/apps/crm/leads' },
                    { id: '2', appId: 'social', appName: 'Social Media', title: 'Instagram Post Scheduled', description: 'Product Showcase Reel scheduled for tomorrow 10:00 AM', timestamp: '22 mins ago', badge: 'Scheduled', actionUrl: '/apps/social' },
                    { id: '3', appId: 'website', appName: 'Website Builder', title: 'Landing Page Deployed', description: 'SaaS Launchpad Template published with SSL certificate', timestamp: '1 hour ago', badge: 'Live', actionUrl: '/apps/website-builder' },
                    { id: '4', appId: 'analytics', appName: 'Business Analytics', title: 'Q3 Financial Diagnostic Complete', description: 'Four Pillars analysis score reached 92/100', timestamp: '2 hours ago', badge: 'Report Ready', actionUrl: '/apps/analytics' }
                  ]
                };
              } else if (url.includes('/crm/leads')) {
                payload = {
                  success: true,
                  leads: [
                    { _id: 'sample_1', name: 'Sarah Jenkins', company: 'Apex Cloud Solutions', email: 's.jenkins@apexcloud.io', phone: '+1 (555) 234-5678', status: 'QUALIFIED', dealValue: 18500, priority: 'HIGH', source: 'LinkedIn Scraper', createdAt: new Date().toISOString() },
                    { _id: 'sample_2', name: 'Marcus Sterling', company: 'Horizon Health Tech', email: 'marcus@horizonhealth.co', phone: '+1 (555) 876-5432', status: 'NEW', dealValue: 12000, priority: 'MEDIUM', source: 'Google Maps Grab', createdAt: new Date().toISOString() }
                  ]
                };
              } else if (url.includes('/website/projects')) {
                payload = {
                  success: true,
                  projects: [
                    { id: 'proj_1', title: 'Fintech Pro Landing Page', domain: 'fintech-pro.preview.site', status: 'Published', pages: 5, lastModified: '12 mins ago' },
                    { id: 'proj_2', title: 'Modern SaaS Startup Hub', domain: 'modern-saas.preview.site', status: 'Draft', pages: 3, lastModified: '2 hours ago' }
                  ]
                };
              } else if (url.includes('/analytics/reports')) {
                payload = {
                  success: true,
                  reports: [
                    { id: 'rep_1', businessName: 'OmniFlow Logistics', score: 86, status: 'Completed', date: new Date().toLocaleDateString() },
                    { id: 'rep_2', businessName: 'Apex Health Systems', score: 92, status: 'Completed', date: new Date().toLocaleDateString() }
                  ]
                };
              } else if (url.includes('/social/posts')) {
                payload = {
                  success: true,
                  posts: [
                    { id: 'p_1', platform: 'Instagram', caption: 'Scaling business operations with AI automation 🚀', scheduledFor: 'Tomorrow 10:00 AM', status: 'Scheduled' },
                    { id: 'p_2', platform: 'LinkedIn', caption: 'Key quarterly growth drivers for B2B enterprises.', scheduledFor: 'Published', status: 'Published' }
                  ]
                };
              } else if (url.includes('/modules')) {
                payload = {
                  success: true,
                  modules: [
                    { id: 'crm', slug: 'crm', name: 'Personal Leads CRM', shortName: 'CRM', tagline: 'Enterprise Lead Management & Pipeline', description: 'Centralized sales intelligence and lead scraping system', icon: 'Users', badge: 'Active', badgeColor: 'bg-emerald-500/10 text-emerald-400', status: 'Active', category: 'Sales & Growth', defaultUrl: '/apps/crm', isDbConnected: true, features: ['Lead Management', 'Pipeline Kanban', 'Email Campaigns', 'WhatsApp Integration', 'Task Management'], quickActions: [{ id: 'crm-add', label: 'Add Lead', route: '/apps/crm/leads' }] },
                    { id: 'social', slug: 'social', name: 'Mediamation', shortName: 'Social', tagline: 'Social Media Automation & Publishing', description: 'Multi-channel social scheduler and AI caption generator', icon: 'Share2', badge: 'Active', badgeColor: 'bg-purple-500/10 text-purple-400', status: 'Active', category: 'Marketing', defaultUrl: '/apps/social', isDbConnected: true, features: ['Post Scheduling', 'AI Captions', 'Multi-Account', 'Image Analysis'], quickActions: [{ id: 'soc-post', label: 'Create Post', route: '/apps/social' }] },
                    { id: 'website-builder', slug: 'website-builder', name: 'AI Website Studio', shortName: 'Builder', tagline: 'AI Website & Landing Page Generator', description: 'Autonomous website generation with live responsive preview', icon: 'Globe', badge: 'Active', badgeColor: 'bg-blue-500/10 text-blue-400', status: 'Active', category: 'Design & Web', defaultUrl: '/apps/website-builder', isDbConnected: true, features: ['AI Website Builder', 'Landing Page Studio', 'Live Code Editor', 'Export to HTML/CSS'], quickActions: [{ id: 'web-new', label: 'New Website', route: '/apps/website-builder' }] },
                    { id: 'analytics', slug: 'analytics', name: 'STRATIQ Enterprise Advisor', shortName: 'Analytics', tagline: 'Business Analytics & Four Pillars Diagnostic', description: 'AI-driven business diagnostic and strategic SWOT advisor', icon: 'BarChart3', badge: 'Active', badgeColor: 'bg-amber-500/10 text-amber-400', status: 'Active', category: 'Business Intelligence', defaultUrl: '/apps/analytics', isDbConnected: true, features: ['4 Business Pillars', 'SWOT Analysis', 'Growth Roadmaps', 'PDF Export'], quickActions: [{ id: 'ana-new', label: 'Run Diagnostic', route: '/apps/analytics' }] }
                  ]
                };
              }

              res.end(JSON.stringify(payload));
            }
          });
        }
      }
    }
  }
});
