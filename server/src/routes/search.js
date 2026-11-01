import { Router } from 'express';
import { dbConnections, connectionStatus } from '../config/db.js';
import { CORE_APPLICATIONS, FUTURE_APPLICATIONS } from '../config/modules.js';
import { authenticateUser } from '../middleware/auth.js';

const router = Router();

// GET /api/search?q=... - Global search across apps, tools, and user's private data
router.get('/', authenticateUser, async (req, res) => {
  const query = (req.query.q || '').trim().toLowerCase();
  if (!query) {
    return res.json({ success: true, results: [] });
  }

  const ownerId = req.user.uid;
  const userFilter = {
    $or: [
      { ownerId },
      { userId: ownerId },
      { createdBy: ownerId }
    ]
  };

  const results = [];

  // 1. Search Core Applications & Features (Public platform catalog)
  CORE_APPLICATIONS.forEach(app => {
    if (app.name.toLowerCase().includes(query) ||
        app.shortName.toLowerCase().includes(query) ||
        app.description.toLowerCase().includes(query) ||
        app.features.some(f => f.toLowerCase().includes(query))) {
      results.push({
        type: 'application',
        id: `app_${app.id}`,
        title: app.name,
        subtitle: `${app.shortName} • ${app.tagline}`,
        icon: app.icon,
        url: `/apps/${app.slug}`,
        badge: 'Module'
      });
    }

    // Quick actions match
    app.quickActions.forEach(qa => {
      if (qa.label.toLowerCase().includes(query)) {
        results.push({
          type: 'action',
          id: `qa_${qa.id}`,
          title: `${qa.label} (${app.name})`,
          subtitle: `Direct launch into ${app.shortName}`,
          icon: 'Zap',
          url: `/apps/${app.slug}`,
          badge: 'Quick Action'
        });
      }
    });
  });

  // 2. Search CRM Leads strictly isolated to authenticated user
  if (dbConnections.crm && connectionStatus.crm) {
    try {
      const leadCol = dbConnections.crm.collection('leads');
      const leads = await leadCol.find({
        $and: [
          userFilter,
          { isDeleted: { $ne: true } },
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { company: { $regex: query, $options: 'i' } },
              { companyName: { $regex: query, $options: 'i' } },
              { email: { $regex: query, $options: 'i' } },
              { phone: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }).limit(5).toArray();

      leads.forEach(lead => {
        results.push({
          type: 'crm_lead',
          id: `lead_${lead._id}`,
          title: lead.name || lead.companyName || 'Lead Contact',
          subtitle: `${lead.company || lead.companyName || 'Company'} • ${lead.email || lead.phone || 'Contact'} • $${(lead.dealValue || 2500).toLocaleString()}`,
          icon: 'Users',
          url: `/apps/crm`,
          badge: lead.status || 'LEAD'
        });
      });
    } catch (err) {
      console.warn('Search CRM error:', err.message);
    }
  }

  // 3. Search Website Projects strictly isolated to authenticated user
  if (dbConnections.website && connectionStatus.website) {
    try {
      const projCol = dbConnections.website.collection('projects');
      const projects = await projCol.find({
        $and: [
          userFilter,
          {
            $or: [
              { name: { $regex: query, $options: 'i' } },
              { title: { $regex: query, $options: 'i' } },
              { category: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }).limit(5).toArray();

      projects.forEach(proj => {
        results.push({
          type: 'website_project',
          id: `proj_${proj._id}`,
          title: proj.name || proj.title || 'Website Project',
          subtitle: `AI Website Builder • ${proj.category || 'Landing Page'}`,
          icon: 'Globe',
          url: `/apps/website-builder`,
          badge: 'WEBSITE'
        });
      });
    } catch (err) {
      console.warn('Search website error:', err.message);
    }
  }

  // 4. Search Business Analytics Reports strictly isolated to authenticated user
  if (dbConnections.analytics && connectionStatus.analytics) {
    try {
      const reportCol = dbConnections.analytics.collection('reports');
      const reports = await reportCol.find({
        $and: [
          userFilter,
          {
            $or: [
              { businessName: { $regex: query, $options: 'i' } },
              { industry: { $regex: query, $options: 'i' } },
              { summary: { $regex: query, $options: 'i' } }
            ]
          }
        ]
      }).limit(5).toArray();

      reports.forEach(rep => {
        results.push({
          type: 'analytics_report',
          id: `rep_${rep._id}`,
          title: `${rep.businessName || 'Business'} Diagnostic Report`,
          subtitle: `STRATIQ Intelligence • Score: ${rep.overallScore || '88'}/100`,
          icon: 'TrendingUp',
          url: `/apps/analytics`,
          badge: 'REPORT'
        });
      });
    } catch (err) {
      console.warn('Search analytics error:', err.message);
    }
  }

  // 5. Search Future Applications Marketplace (Public platform catalog)
  FUTURE_APPLICATIONS.forEach(futureApp => {
    if (futureApp.name.toLowerCase().includes(query) ||
        futureApp.tagline.toLowerCase().includes(query) ||
        futureApp.category.toLowerCase().includes(query)) {
      results.push({
        type: 'marketplace',
        id: `market_${futureApp.id}`,
        title: futureApp.name,
        subtitle: `${futureApp.tagline} (${futureApp.category})`,
        icon: futureApp.icon,
        url: `/apps/marketplace`,
        badge: 'Upcoming Tool'
      });
    }
  });

  res.json({
    success: true,
    query,
    count: results.length,
    results
  });
});

export default router;

