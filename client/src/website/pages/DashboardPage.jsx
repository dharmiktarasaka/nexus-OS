// client/src/pages/DashboardPage.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { exportProjectToZip } from '../utils/zipExport';
import { getWebsiteApiUrl } from '../apiConfig';
import {
  Plus,
  Search,
  Download,
  Trash2,
  Edit3,
  Calendar,
  Sparkles,
  Eye,
  X,
  Code2,
  Globe,
  ArrowRight
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const location = useLocation();
  const basePath = location.pathname.startsWith('/apps/website-builder') ? '/apps/website-builder' : '';

  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [exportingId, setExportingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const userId = user?.uid || user?.id || '';
      if (!userId) {
        setProjects([]);
        setLoading(false);
        return;
      }

      const queryParam = `?userId=${encodeURIComponent(userId)}`;
      let serverProjects = [];
      try {
        const token = localStorage.getItem('studio_auth_token') || localStorage.getItem('auth_token') || '';
        const res = await fetch(getWebsiteApiUrl(`/api/projects${queryParam}`), {
          headers: {
            'x-user-id': userId,
            ...(user?.email ? { 'x-user-email': user.email } : {}),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          }
        });
        if (res.ok) {
          const data = await res.json();
          serverProjects = Array.isArray(data) ? data : (data.projects || []);
        }
      } catch (err) {
        console.warn('Network call to /api/projects deferred:', err.message);
      }

      // Merge with offline created projects ONLY for this specific user
      let localProjects = [];
      try {
        localProjects = JSON.parse(localStorage.getItem(`pulse_offline_projects_${userId}`) || '[]');
      } catch (e) {}

      const merged = [...serverProjects];
      localProjects.forEach(lp => {
        if (!merged.some(p => p.id === lp.id)) {
          merged.push(lp);
        }
      });

      setProjects(merged);
    } catch (err) {
      console.error('Failed to fetch projects:', err);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    } else {
      setProjects([]);
      setLoading(false);
    }
  }, [user]);

  const handleExportZip = async (projectSummary) => {
    setExportingId(projectSummary.id);
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${projectSummary.id}`));
      const fullProject = await res.json();
      await exportProjectToZip(fullProject);
    } catch (err) {
      alert('Failed to export ZIP: ' + err.message);
    } finally {
      setExportingId(null);
    }
  };

  const handleDelete = async (id) => {
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${id}`), { method: 'DELETE' });
      if (res.ok) {
        setProjects(prev => prev.filter(p => p.id !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleOpenLiveWindow = async (id) => {
    try {
      const res = await fetch(getWebsiteApiUrl(`/api/projects/${id}`));
      const fullProject = await res.json();
      let doc = fullProject.html || '<!DOCTYPE html><html><body>No content</body></html>';
      if (fullProject.css) {
        doc = doc.includes('</head>')
          ? doc.replace('</head>', `<style>${fullProject.css}</style></head>`)
          : `<style>${fullProject.css}</style>${doc}`;
      }
      if (fullProject.js) {
        doc = doc.includes('</body>')
          ? doc.replace('</body>', `<script>${fullProject.js}</script></body>`)
          : `${doc}<script>${fullProject.js}</script>`;
      }
      const newWin = window.open('', '_blank');
      if (newWin) {
        newWin.document.open();
        newWin.document.write(doc);
        newWin.document.close();
      }
    } catch (e) {
      alert('Could not open preview: ' + e.message);
    }
  };

  // Dynamic categories computed from active projects
  const uniqueCategories = Array.from(new Set(projects.map(p => p.category).filter(Boolean)));
  const categoryList = ['all', ...uniqueCategories];

  const filteredProjects = projects.filter(p => {
    const matchesSearch = (p.name || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.tagline || '').toLowerCase().includes(search.toLowerCase()) ||
                          (p.category || '').toLowerCase().includes(search.toLowerCase());
    const matchesCat = filterCategory === 'all' || p.category === filterCategory;
    return matchesSearch && matchesCat;
  });

  const totalKb = Math.round(
    projects.reduce(
      (acc, p) => acc + (p.codeLength?.html || 0) + (p.codeLength?.css || 0) + (p.codeLength?.js || 0),
      0
    ) / 1024
  );

  return (
    <div className="dashboard-container">
      <Navbar />

      <main className="dashboard-main">
        {/* Hero Section */}
        <div className="dashboard-hero">
          <div className="hero-text-wrap">
            <div className="dash-hero-badge">
              <Sparkles size={14} className="sparkle-icon" />
              <span>Autonomous AI Web Engineering</span>
            </div>
            <h1 className="dash-title">Design Studio & Projects</h1>
            <p className="dash-subtitle">
              Manage your AI-generated websites, live previews, code inspection, and ZIP deployments.
            </p>

            {/* Quick Metrics Strip */}
            <div className="hero-stats-strip">
              <div className="stat-pill">
                <Globe size={14} className="stat-icon" />
                <span className="stat-value">{projects.length}</span>
                <span className="stat-label">Websites</span>
              </div>
              <div className="stat-pill">
                <Code2 size={14} className="stat-icon" />
                <span className="stat-value">{totalKb} KB</span>
                <span className="stat-label">Synthesized</span>
              </div>
              <div className="stat-pill">
                <span className="stat-dot-online"></span>
                <span className="stat-value">MongoDB</span>
                <span className="stat-label">Database Connected</span>
              </div>
            </div>
          </div>

          <Link to={`${basePath}/new`} className="btn-hero-create">
            <Plus size={18} />
            <span>Generate New Website</span>
            <ArrowRight size={16} className="btn-arrow" />
          </Link>
        </div>

        {/* Filter and Search Bar */}
        <div className="controls-bar">
          <div className="search-wrap">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search websites by name, concept, or category..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
            {search && (
              <button className="search-clear-btn" onClick={() => setSearch('')} title="Clear search">
                <X size={14} />
              </button>
            )}
          </div>

          <div className="category-tabs">
            {categoryList.map(cat => (
              <button
                key={cat}
                className={`cat-tab ${filterCategory === cat ? 'active' : ''}`}
                onClick={() => setFilterCategory(cat)}
              >
                {cat === 'all' ? 'All Projects' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Project Grid */}
        {loading ? (
          <div className="projects-loading-state">
            <div className="spinner"></div>
            <p>Loading projects from persistent store...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-projects-state">
            <div className="empty-icon-circle">
              <Sparkles size={36} />
            </div>
            <h3>{search || filterCategory !== 'all' ? 'No matching websites found' : 'No websites created yet'}</h3>
            <p>
              {search || filterCategory !== 'all'
                ? 'Try adjusting your search query or reset your category filter to view all projects.'
                : 'Start by generating an interactive bespoke website tailored to any niche prompt.'}
            </p>
            <div className="empty-actions">
              {search || filterCategory !== 'all' ? (
                <button
                  className="btn-empty-reset"
                  onClick={() => {
                    setSearch('');
                    setFilterCategory('all');
                  }}
                >
                  Reset Filters
                </button>
              ) : null}
              <Link to={`${basePath}/new`} className="btn-empty-action">
                <Plus size={16} />
                <span>Launch Generation Studio</span>
              </Link>
            </div>
          </div>
        ) : (
          <div className="projects-grid">
            {filteredProjects.map(p => (
              <div key={p.id} className="project-card">
                {/* Visual Header Banner */}
                <div className="card-visual-banner">
                  <div className="banner-pattern"></div>
                  <div className="banner-content">
                    <span className="cat-pill">
                      {p.category || 'General'}
                    </span>
                    <button
                      className="btn-live-quick"
                      onClick={() => handleOpenLiveWindow(p.id)}
                      title="Open Live Preview in New Window"
                    >
                      <Eye size={13} />
                      <span>Live Window</span>
                    </button>
                  </div>
                </div>

                <div className="card-main-content">
                  <div className="card-title-row">
                    <h3 className="project-name" title={p.name}>{p.name}</h3>
                    <span className="date-pill">
                      <Calendar size={12} />
                      <span>{new Date(p.createdAt).toLocaleDateString()}</span>
                    </span>
                  </div>

                  <p className="project-tagline">{p.tagline || p.prompt?.slice(0, 110) || 'AI Generated Website'}</p>

                  <div className="card-metrics">
                    <div className="metric-pill">
                      <span>HTML: {Math.max(1, Math.round((p.codeLength?.html || 0) / 1024))} KB</span>
                    </div>
                    <div className="metric-pill">
                      <span>CSS: {Math.max(1, Math.round((p.codeLength?.css || 0) / 1024))} KB</span>
                    </div>
                    <div className="metric-pill">
                      <span>JS: {Math.max(1, Math.round((p.codeLength?.js || 0) / 1024))} KB</span>
                    </div>
                  </div>
                </div>

                <div className="card-actions-row">
                  <Link to={`${basePath}/editor/${p.id}`} className="btn-card-edit">
                    <Edit3 size={15} />
                    <span>Open Studio</span>
                  </Link>

                  <button
                    className="btn-card-action"
                    onClick={() => handleExportZip(p)}
                    disabled={exportingId === p.id}
                    title="Export Production ZIP"
                  >
                    <Download size={15} />
                    <span>{exportingId === p.id ? 'Zipping...' : 'ZIP'}</span>
                  </button>

                  {deleteConfirmId === p.id ? (
                    <div className="confirm-delete-group">
                      <button className="btn-del-yes" onClick={() => handleDelete(p.id)}>Delete</button>
                      <button className="btn-del-no" onClick={() => setDeleteConfirmId(null)}>Cancel</button>
                    </div>
                  ) : (
                    <button
                      className="btn-card-action icon-only"
                      onClick={() => setDeleteConfirmId(p.id)}
                      title="Delete Project"
                    >
                      <Trash2 size={15} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
