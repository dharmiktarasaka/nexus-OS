const User = require('../models/User');
const axios = require('axios');
const LeadGrabCampaign = require('../models/LeadGrabCampaign');
const GrabbedLead = require('../models/GrabbedLead');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Activity = require('../models/Activity');
const Folder = require('../models/Folder');
const Dataset = require('../models/Dataset');
const DynamicRecord = require('../models/DynamicRecord');
const { runCampaignExtraction } = require('../services/leadGrabService');
const { testTinyFishApiKey: verifyTinyFishKey } = require('../services/tinyfishService');

// Helper to auto-create or connect Company in CRM
const syncCRMCompany = async (companyName, phone, email) => {
  if (!companyName || !companyName.trim()) return;
  const nameTrimmed = companyName.trim();
  try {
    const existing = await Company.findOne({ name: new RegExp(`^${nameTrimmed}$`, 'i') });
    if (!existing) {
      await Company.create({
        name: nameTrimmed,
        phone: phone || '',
        email: email || ''
      });
    }
  } catch (err) {
    console.error('Error syncing company in CRM:', err);
  }
};

// @desc    Get all Lead Grab Campaigns
// @route   GET /api/lead-grab/campaigns
const getCampaigns = async (req, res) => {
  try {
    const { search = '', status } = req.query;
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const query = {
      $or: [
        { ownerId: ownerId },
        { createdBy: ownerId }
      ]
    };

    if (status) {
      query.status = status;
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$and = [
        { $or: [{ ownerId: ownerId }, { createdBy: ownerId }] },
        {
          $or: [
            { name: searchRegex },
            { niche: searchRegex },
            { targetCity: searchRegex }
          ]
        }
      ];
      delete query.$or;
    }

    const campaigns = await LeadGrabCampaign.find(query)
      .sort({ createdAt: -1 })
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      count: campaigns.length,
      data: campaigns
    });
  } catch (error) {
    console.error('Error getting campaigns:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve campaigns', error: error.message });
  }
};

// @desc    Create a new Lead Grab Campaign
// @route   POST /api/lead-grab/campaigns
const createCampaign = async (req, res) => {
  try {
    const {
      name,
      niche,
      targetCity,
      targetCountry,
      platforms,
      targetCount,
      config,
      autoStart = false
    } = req.body;

    if (!niche || !targetCity) {
      return res.status(400).json({
        success: false,
        message: 'Niche and Target City are required'
      });
    }

    const campaignName = name && name.trim()
      ? name.trim()
      : `${niche} in ${targetCity} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();

    const newCampaign = await LeadGrabCampaign.create({
      name: campaignName,
      niche: niche.trim(),
      targetCity: targetCity.trim(),
      targetCountry: targetCountry ? targetCountry.trim() : 'Global',
      platforms: platforms && platforms.length > 0 ? platforms : ['Google Maps', 'LinkedIn', 'Web Directory'],
      targetCount: targetCount ? parseInt(targetCount, 10) : 25,
      config: config || {},
      ownerId: ownerId,
      companyId: req.user.companyId || null,
      createdBy: ownerId,
      status: autoStart ? 'ACTIVE' : 'DRAFT'
    });

    if (autoStart) {
      // Run extraction in background asynchronously
      runCampaignExtraction(newCampaign._id).catch(console.error);
    }

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      data: newCampaign
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to create campaign', error: error.message });
  }
};

// @desc    Get single campaign with live statistics
// @route   GET /api/lead-grab/campaigns/:id
const getCampaign = async (req, res) => {
  try {
    const ownerId = String(req.user.ownerId || req.user.uid || req.user._id).trim();
    const campaign = await LeadGrabCampaign.findOne({
      _id: req.params.id,
      $or: [{ ownerId }, { createdBy: ownerId }]
    }).populate('createdBy', 'name email');

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found or access denied' });
    }

    // Refresh lead counts
    const totalGrabbed = await GrabbedLead.countDocuments({ campaignId: campaign._id });
    const importedCount = await GrabbedLead.countDocuments({ campaignId: campaign._id, isImportedToCRM: true });

    if (campaign.extractedCount !== totalGrabbed) {
      campaign.extractedCount = totalGrabbed;
      campaign.stats.importedToCRM = importedCount;
      await campaign.save();
    }

    res.json({
      success: true,
      data: campaign
    });
  } catch (error) {
    console.error('Error getting campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve campaign', error: error.message });
  }
};

// @desc    Update campaign
// @route   PUT /api/lead-grab/campaigns/:id
const updateCampaign = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const { name, niche, targetCity, targetCount, platforms, config } = req.body;
    if (name) campaign.name = name;
    if (niche) campaign.niche = niche;
    if (targetCity) campaign.targetCity = targetCity;
    if (targetCount) campaign.targetCount = targetCount;
    if (platforms) campaign.platforms = platforms;
    if (config) campaign.config = config;

    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign updated successfully',
      data: campaign
    });
  } catch (error) {
    console.error('Error updating campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to update campaign', error: error.message });
  }
};

// @desc    Delete campaign and all its grabbed leads
// @route   DELETE /api/lead-grab/campaigns/:id
const deleteCampaign = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    await GrabbedLead.deleteMany({ campaignId: campaign._id });
    await campaign.deleteOne();

    res.json({
      success: true,
      message: 'Campaign and all associated grabbed leads deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to delete campaign', error: error.message });
  }
};

// @desc    Start / Activate Lead Grabbing run
// @route   POST /api/lead-grab/campaigns/:id/start
const startCampaign = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Trigger async discovery engine
    runCampaignExtraction(campaign._id).catch(console.error);

    campaign.status = 'ACTIVE';
    campaign.progress = 5;
    campaign.currentStep = `Starting automated discovery for ${campaign.niche} in ${campaign.targetCity}...`;
    await campaign.save();

    res.json({
      success: true,
      message: 'Lead grabbing campaign activated! Extraction in progress...',
      data: campaign
    });
  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to start campaign', error: error.message });
  }
};

// @desc    Pause Lead Grabbing run
// @route   POST /api/lead-grab/campaigns/:id/pause
const pauseCampaign = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    campaign.status = 'PAUSED';
    campaign.currentStep = 'Paused by user';
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign paused',
      data: campaign
    });
  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({ success: false, message: 'Failed to pause campaign', error: error.message });
  }
};

// @desc    Get grabbed leads for a campaign with search & filtering
// @route   GET /api/lead-grab/campaigns/:id/leads
const getGrabbedLeads = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = '',
      platform,
      hasPhone,
      hasEmail,
      hasLinkedIn,
      minRating,
      status,
      isImported
    } = req.query;

    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    const skip = (pageNum - 1) * limitNum;

    const query = { campaignId: req.params.id };

    if (platform) {
      query.sourcePlatform = platform;
    }
    if (status) {
      query.status = status;
    }
    if (isImported !== undefined) {
      query.isImportedToCRM = isImported === 'true';
    }
    if (hasPhone === 'true') {
      query.phone = { $ne: '', $exists: true };
    }
    if (hasEmail === 'true') {
      query.email = { $ne: '', $exists: true };
    }
    if (hasLinkedIn === 'true') {
      query.linkedinUrl = { $ne: '', $exists: true };
    }
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { name: searchRegex },
        { companyName: searchRegex },
        { decisionMaker: searchRegex },
        { phone: searchRegex },
        { email: searchRegex },
        { location: searchRegex }
      ];
    }

    const [leads, totalCount] = await Promise.all([
      GrabbedLead.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('crmLeadId', 'name status'),
      GrabbedLead.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: leads,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(totalCount / limitNum),
        totalItems: totalCount
      }
    });
  } catch (error) {
    console.error('Error fetching grabbed leads:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch grabbed leads', error: error.message });
  }
};

// @desc    Update single grabbed lead
// @route   PUT /api/lead-grab/leads/:id
const updateGrabbedLead = async (req, res) => {
  try {
    const lead = await GrabbedLead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const {
      name,
      decisionMaker,
      companyName,
      phone,
      alternatePhone,
      email,
      websiteUrl,
      linkedinUrl,
      location,
      status,
      notes,
      rating
    } = req.body;

    if (name) lead.name = name;
    if (decisionMaker !== undefined) lead.decisionMaker = decisionMaker;
    if (companyName !== undefined) lead.companyName = companyName;
    if (phone !== undefined) lead.phone = phone;
    if (alternatePhone !== undefined) lead.alternatePhone = alternatePhone;
    if (email !== undefined) lead.email = email;
    if (websiteUrl !== undefined) lead.websiteUrl = websiteUrl;
    if (linkedinUrl !== undefined) lead.linkedinUrl = linkedinUrl;
    if (location !== undefined) lead.location = location;
    if (status !== undefined) lead.status = status;
    if (notes !== undefined) lead.notes = notes;
    if (rating !== undefined) lead.rating = rating;

    await lead.save();

    res.json({
      success: true,
      message: 'Lead updated successfully',
      data: lead
    });
  } catch (error) {
    console.error('Error updating grabbed lead:', error);
    res.status(500).json({ success: false, message: 'Failed to update lead', error: error.message });
  }
};

// @desc    Delete single grabbed lead
// @route   DELETE /api/lead-grab/leads/:id
const deleteGrabbedLead = async (req, res) => {
  try {
    const lead = await GrabbedLead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const campaignId = lead.campaignId;
    await lead.deleteOne();

    // Refresh campaign extracted count
    const count = await GrabbedLead.countDocuments({ campaignId });
    await LeadGrabCampaign.findByIdAndUpdate(campaignId, { extractedCount: count });

    res.json({
      success: true,
      message: 'Lead removed from campaign'
    });
  } catch (error) {
    console.error('Error deleting lead:', error);
    res.status(500).json({ success: false, message: 'Failed to delete lead', error: error.message });
  }
};

// @desc    Import single grabbed lead into main CRM Leads & Optional Folder
// @route   POST /api/lead-grab/leads/:id/import-to-crm
const importLeadToCRM = async (req, res) => {
  try {
    const { folderName, folderId, folderColor } = req.body || {};
    const grabbedLead = await GrabbedLead.findById(req.params.id);
    if (!grabbedLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const campaign = await LeadGrabCampaign.findById(grabbedLead.campaignId);

    // Create record in main CRM Lead collection if not already created
    let newLead = null;
    if (!grabbedLead.isImportedToCRM || !grabbedLead.crmLeadId) {
      await syncCRMCompany(grabbedLead.companyName || grabbedLead.name, grabbedLead.phone, grabbedLead.email);

      newLead = await Lead.create({
        name: grabbedLead.name,
        companyName: grabbedLead.companyName || grabbedLead.name,
        phone: grabbedLead.phone || 'N/A',
        alternatePhone: grabbedLead.alternatePhone || '',
        email: grabbedLead.email || '',
        service: grabbedLead.niche || 'General',
        decisionMaker: grabbedLead.decisionMaker || '',
        industry: grabbedLead.niche || '',
        location: grabbedLead.location || '',
        websiteUrl: grabbedLead.websiteUrl || '',
        linkedinUrl: grabbedLead.linkedinUrl || '',
        rating: grabbedLead.rating || 0,
        reviewCount: grabbedLead.reviewCount || 0,
        source: `Lead Grab (${grabbedLead.sourcePlatform || 'Web Intelligence'})`,
        ingestionSource: 'MANUAL',
        status: 'NEW',
        priority: grabbedLead.rating >= 4.5 ? 'HIGH' : 'MEDIUM',
        notes: grabbedLead.notes || `Imported from Lead Grab Campaign. Found on ${grabbedLead.sourcePlatform}.`,
        userId: req.user._id,
        assignedTo: req.user._id
      });

      grabbedLead.isImportedToCRM = true;
      grabbedLead.crmLeadId = newLead._id;
      await grabbedLead.save();

      // Log Activity in CRM
      try {
        await Activity.create({
          leadId: newLead._id,
          userId: req.user._id,
          action: 'LEAD_CREATED',
          description: `Imported lead "${grabbedLead.name}" from Lead Grab campaign.`
        });
      } catch (e) {
        // Non-blocking
      }
    }

    // Optional Folder Creation & Dynamic Record insertion
    let targetFolder = null;
    if (folderId) {
      targetFolder = await Folder.findOne({ _id: folderId, companyId: req.user.companyId });
    } else if (folderName && folderName.trim()) {
      targetFolder = await Folder.findOne({
        companyId: req.user.companyId,
        createdBy: req.user._id,
        name: folderName.trim()
      });
      if (!targetFolder) {
        targetFolder = await Folder.create({
          companyId: req.user.companyId,
          name: folderName.trim(),
          description: `Imported from Lead Grab - ${campaign?.niche || 'Outreach'} in ${campaign?.targetCity || 'City'}`,
          color: folderColor || '#1A3548',
          ownerId: req.user._id,
          createdBy: req.user._id
        });
      }
    }

    if (targetFolder) {
      const datasetHeaders = [
        { key: 'name', label: 'Company / Lead Name', type: 'TEXT' },
        { key: 'decisionMaker', label: 'Decision Maker', type: 'TEXT' },
        { key: 'email', label: 'Email', type: 'EMAIL' },
        { key: 'phone', label: 'Phone', type: 'PHONE' },
        { key: 'alternatePhone', label: 'Alternate Phone', type: 'PHONE' },
        { key: 'service', label: 'Niche / Service', type: 'TEXT' },
        { key: 'city', label: 'City', type: 'TEXT' },
        { key: 'location', label: 'Address / Location', type: 'TEXT' },
        { key: 'websiteUrl', label: 'Website', type: 'URL' },
        { key: 'linkedinUrl', label: 'LinkedIn', type: 'URL' },
        { key: 'rating', label: 'Rating', type: 'NUMBER' },
        { key: 'reviewCount', label: 'Reviews', type: 'NUMBER' },
        { key: 'status', label: 'Status', type: 'TEXT' },
        { key: 'notes', label: 'Notes', type: 'TEXT' },
        { key: 'sourcePlatform', label: 'Source', type: 'TEXT' }
      ];

      let dataset = await Dataset.findOne({
        companyId: req.user.companyId,
        folderId: targetFolder._id,
        fileName: `${campaign?.name || 'Lead Grab'} - Grabbed Leads`
      });

      if (!dataset) {
        dataset = await Dataset.create({
          companyId: req.user.companyId,
          folderId: targetFolder._id,
          ownerId: targetFolder.ownerId || req.user._id,
          createdBy: req.user._id,
          fileName: `${campaign?.name || 'Lead Grab'} - Grabbed Leads`,
          originalName: `${campaign?.name || 'Lead Grab'} - Grabbed Leads`,
          headers: datasetHeaders,
          recordCount: 0
        });
      }

      await DynamicRecord.create({
        companyId: req.user.companyId,
        folderId: targetFolder._id,
        datasetId: dataset._id,
        ownerId: targetFolder.ownerId || req.user._id,
        createdBy: req.user._id,
        data: {
          name: grabbedLead.name || '',
          decisionMaker: grabbedLead.decisionMaker || '',
          email: grabbedLead.email || '',
          phone: grabbedLead.phone || '',
          alternatePhone: grabbedLead.alternatePhone || '',
          service: grabbedLead.niche || campaign?.niche || 'General',
          city: grabbedLead.city || campaign?.targetCity || '',
          location: grabbedLead.location || '',
          websiteUrl: grabbedLead.websiteUrl || '',
          linkedinUrl: grabbedLead.linkedinUrl || '',
          rating: grabbedLead.rating || 0,
          reviewCount: grabbedLead.reviewCount || 0,
          status: grabbedLead.status || 'NEW',
          notes: grabbedLead.notes || '',
          sourcePlatform: grabbedLead.sourcePlatform || 'Lead Grab'
        }
      });

      const count = await DynamicRecord.countDocuments({ datasetId: dataset._id });
      dataset.recordCount = count;
      await dataset.save();
    }

    // Update campaign stats
    const importedTotal = await GrabbedLead.countDocuments({
      campaignId: grabbedLead.campaignId,
      isImportedToCRM: true
    });
    await LeadGrabCampaign.findByIdAndUpdate(grabbedLead.campaignId, {
      'stats.importedToCRM': importedTotal
    });

    res.json({
      success: true,
      message: targetFolder
        ? `Lead "${grabbedLead.name}" imported to Folder "${targetFolder.name}" & CRM!`
        : `Lead "${grabbedLead.name}" successfully imported to your CRM!`,
      folderId: targetFolder ? targetFolder._id : null,
      folderName: targetFolder ? targetFolder.name : null,
      data: {
        crmLead: newLead,
        grabbedLead
      }
    });
  } catch (error) {
    console.error('Error importing lead to CRM:', error);
    res.status(500).json({ success: false, message: 'Failed to import lead to CRM', error: error.message });
  }
};

// @desc    Bulk import grabbed leads into Folder & main CRM Leads
// @route   POST /api/lead-grab/campaigns/:id/bulk-import-to-crm
const bulkImportToCRM = async (req, res) => {
  try {
    const { leadIds = [], importAll = false, folderName, folderId, folderColor, folderDescription, folderCategory, category } = req.body;
    const campaignId = req.params.id;
    const campaign = await LeadGrabCampaign.findById(campaignId);

    // Build query - allow selecting any specific leads, or all leads in campaign
    let query = { campaignId };
    if (!importAll && leadIds.length > 0) {
      query._id = { $in: leadIds };
    } else if (!folderName && !folderId) {
      // If doing a plain CRM sync without a folder, filter for unimported only
      query.isImportedToCRM = false;
    }

    const leadsToImport = await GrabbedLead.find(query);
    if (leadsToImport.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No leads selected or found to import'
      });
    }

    const normalizedCategory = ((category || folderCategory || '').trim().toUpperCase() === 'INTERNATIONAL') ? 'INTERNATIONAL' : 'INDIA';

    // Handle Folder Creation or Selection
    let targetFolder = null;
    if (folderId) {
      targetFolder = await Folder.findOne({ _id: folderId, companyId: req.user.companyId });
    } else if (folderName && folderName.trim()) {
      targetFolder = await Folder.findOne({
        companyId: req.user.companyId,
        createdBy: req.user._id,
        name: folderName.trim()
      });
      if (!targetFolder) {
        targetFolder = await Folder.create({
          companyId: req.user.companyId,
          name: folderName.trim(),
          description: folderDescription || `Grabbed leads for ${campaign?.niche || 'campaign'} in ${campaign?.targetCity || 'target area'}`,
          color: folderColor || '#1A3548',
          category: normalizedCategory,
          ownerId: req.user._id,
          createdBy: req.user._id
        });
      }
    }

    // Prepare Dataset inside Folder if folder is active
    let createdDataset = null;
    let dynamicRecordsToInsert = [];
    if (targetFolder) {
      const datasetHeaders = [
        { key: 'name', label: 'Company / Lead Name', type: 'TEXT' },
        { key: 'decisionMaker', label: 'Decision Maker', type: 'TEXT' },
        { key: 'email', label: 'Email', type: 'EMAIL' },
        { key: 'phone', label: 'Phone', type: 'PHONE' },
        { key: 'alternatePhone', label: 'Alternate Phone', type: 'PHONE' },
        { key: 'service', label: 'Niche / Service', type: 'TEXT' },
        { key: 'city', label: 'City', type: 'TEXT' },
        { key: 'location', label: 'Address / Location', type: 'TEXT' },
        { key: 'websiteUrl', label: 'Website', type: 'URL' },
        { key: 'linkedinUrl', label: 'LinkedIn', type: 'URL' },
        { key: 'rating', label: 'Rating', type: 'NUMBER' },
        { key: 'reviewCount', label: 'Reviews', type: 'NUMBER' },
        { key: 'status', label: 'Status', type: 'TEXT' },
        { key: 'notes', label: 'Notes', type: 'TEXT' },
        { key: 'sourcePlatform', label: 'Source', type: 'TEXT' }
      ];

      const now = new Date();
      const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
      const dsName = `${campaign?.name || 'Grabbed Leads'} - ${dateStr} ${timeStr}`;

      createdDataset = await Dataset.create({
        companyId: req.user.companyId,
        folderId: targetFolder._id,
        ownerId: targetFolder.ownerId || req.user._id,
        createdBy: req.user._id,
        fileName: dsName,
        originalName: dsName,
        headers: datasetHeaders,
        recordCount: 0
      });
    }

    let successCount = 0;
    for (const item of leadsToImport) {
      try {
        // If not already in CRM, create standard CRM lead
        if (!item.isImportedToCRM || !item.crmLeadId) {
          await syncCRMCompany(item.companyName || item.name, item.phone, item.email);

          const newLead = await Lead.create({
            name: item.name,
            companyName: item.companyName || item.name,
            phone: item.phone || 'N/A',
            alternatePhone: item.alternatePhone || '',
            email: item.email || '',
            service: item.niche || campaign?.niche || 'General',
            decisionMaker: item.decisionMaker || '',
            industry: item.niche || campaign?.niche || '',
            location: item.location || '',
            city: item.city || campaign?.targetCity || '',
            websiteUrl: item.websiteUrl || '',
            linkedinUrl: item.linkedinUrl || '',
            rating: item.rating || 0,
            reviewCount: item.reviewCount || 0,
            source: `Lead Grab (${item.sourcePlatform || 'AI Discovery'})`,
            ingestionSource: 'MANUAL',
            status: 'NEW',
            priority: item.rating >= 4.5 ? 'HIGH' : 'MEDIUM',
            notes: item.notes || `Imported from Lead Grab Campaign "${campaign?.name || ''}".`,
            userId: req.user._id,
            assignedTo: req.user._id
          });

          item.isImportedToCRM = true;
          item.crmLeadId = newLead._id;
          await item.save();
        }

        // Add to dynamic folder dataset records
        if (targetFolder && createdDataset) {
          dynamicRecordsToInsert.push({
            companyId: req.user.companyId,
            folderId: targetFolder._id,
            datasetId: createdDataset._id,
            ownerId: targetFolder.ownerId || req.user._id,
            createdBy: req.user._id,
            data: {
              name: item.name || '',
              decisionMaker: item.decisionMaker || '',
              email: item.email || '',
              phone: item.phone || '',
              alternatePhone: item.alternatePhone || '',
              service: item.niche || campaign?.niche || 'General',
              city: item.city || campaign?.targetCity || '',
              location: item.location || '',
              websiteUrl: item.websiteUrl || '',
              linkedinUrl: item.linkedinUrl || '',
              rating: item.rating || 0,
              reviewCount: item.reviewCount || 0,
              status: item.status || 'NEW',
              notes: item.notes || '',
              sourcePlatform: item.sourcePlatform || 'Lead Grab'
            }
          });
        }

        successCount++;
      } catch (err) {
        console.error('Error importing item in batch:', err);
      }
    }

    if (dynamicRecordsToInsert.length > 0 && createdDataset) {
      await DynamicRecord.insertMany(dynamicRecordsToInsert);
      createdDataset.recordCount = dynamicRecordsToInsert.length;
      await createdDataset.save();
    }

    // Update campaign stats
    const importedTotal = await GrabbedLead.countDocuments({
      campaignId,
      isImportedToCRM: true
    });
    await LeadGrabCampaign.findByIdAndUpdate(campaignId, {
      'stats.importedToCRM': importedTotal
    });

    res.json({
      success: true,
      message: targetFolder
        ? `Successfully imported ${successCount} leads into Folder "${targetFolder.name}" and CRM!`
        : `Successfully imported ${successCount} leads into your main CRM pipeline!`,
      importedCount: successCount,
      folderId: targetFolder ? targetFolder._id : null,
      folderName: targetFolder ? targetFolder.name : null
    });
  } catch (error) {
    console.error('Error in bulk import to CRM:', error);
    res.status(500).json({ success: false, message: 'Bulk import failed', error: error.message });
  }
};

// @desc    Export campaign leads as CSV
// @route   GET /api/lead-grab/campaigns/:id/export
const exportCampaignLeads = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const leads = await GrabbedLead.find({ campaignId: campaign._id }).sort({ createdAt: -1 });

    // Build comprehensive CSV string with platform intelligence metadata
    const headers = [
      'Business Name',
      'Decision Maker',
      'Phone',
      'Alternate Phone',
      'Email',
      'Website',
      'LinkedIn',
      'Address / Location',
      'City',
      'Rating',
      'Reviews Count',
      'Discord Server Name',
      'Discord Invite URL',
      'Discord Tag / Handle',
      'Discord Member Count',
      'AI Outreach Pitch',
      'Source Platform',
      'Status',
      'Imported to CRM',
      'Extracted Date'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const clean = String(str).replace(/"/g, '""');
      return `"${clean}"`;
    };

    const rows = leads.map((l) => [
      escapeCsv(l.name),
      escapeCsv(l.decisionMaker),
      escapeCsv(l.phone),
      escapeCsv(l.alternatePhone),
      escapeCsv(l.email),
      escapeCsv(l.websiteUrl),
      escapeCsv(l.linkedinUrl),
      escapeCsv(l.location),
      escapeCsv(l.city),
      escapeCsv(l.rating),
      escapeCsv(l.reviewCount),
      escapeCsv(l.rawDetails?.discordServerName || ''),
      escapeCsv(l.rawDetails?.discordInviteUrl || ''),
      escapeCsv(l.rawDetails?.discordTag || ''),
      escapeCsv(l.rawDetails?.discordMemberCount || ''),
      escapeCsv(l.rawDetails?.discordPitch || l.rawDetails?.pitch || ''),
      escapeCsv(l.sourcePlatform),
      escapeCsv(l.status),
      escapeCsv(l.isImportedToCRM ? 'Yes' : 'No'),
      escapeCsv(new Date(l.createdAt).toLocaleDateString())
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="leads_${(campaign.niche || 'campaign').replace(/\s+/g, '_')}_${Date.now()}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (error) {
    console.error('Error exporting leads:', error);
    res.status(500).json({ success: false, message: 'Failed to export leads', error: error.message });
  }
};

// @desc    Get aggregate lead grab statistics
// @route   GET /api/lead-grab/stats
const getLeadGrabStats = async (req, res) => {
  try {
    const query = {};
    if (req.user.companyId) {
      query.companyId = req.user.companyId;
    } else {
      query.createdBy = req.user._id;
    }

    const totalCampaigns = await LeadGrabCampaign.countDocuments(query);
    const activeCampaigns = await LeadGrabCampaign.countDocuments({ ...query, status: 'ACTIVE' });
    const completedCampaigns = await LeadGrabCampaign.countDocuments({ ...query, status: 'COMPLETED' });

    const totalGrabbedLeads = await GrabbedLead.countDocuments(
      req.user.companyId ? { companyId: req.user.companyId } : {}
    );
    const totalImportedToCRM = await GrabbedLead.countDocuments({
      ...(req.user.companyId ? { companyId: req.user.companyId } : {}),
      isImportedToCRM: true
    });

    res.json({
      success: true,
      data: {
        totalCampaigns,
        activeCampaigns,
        completedCampaigns,
        totalGrabbedLeads,
        totalImportedToCRM
      }
    });
  } catch (error) {
    console.error('Error getting lead grab stats:', error);
    res.status(500).json({ success: false, message: 'Failed to get statistics', error: error.message });
  }
};

// @desc    Get TinyFish API Key & connection status
// @route   GET /api/lead-grab/tinyfish-key
const getTinyFishApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const key = user?.tinyfishApiKey || process.env.TINYFISH_API_KEY || '';

    res.json({
      success: true,
      hasKey: Boolean(key),
      isEnvKey: Boolean(!user?.tinyfishApiKey && process.env.TINYFISH_API_KEY),
      apiKey: key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : '',
      rawKey: key || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve TinyFish API key status' });
  }
};

// @desc    Save TinyFish API Key
// @route   POST /api/lead-grab/tinyfish-key
const saveTinyFishApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      tinyfishApiKey: apiKey ? apiKey.trim() : ''
    });

    res.json({
      success: true,
      message: apiKey ? 'TinyFish API Key saved successfully!' : 'TinyFish API Key removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save TinyFish key' });
  }
};

// @desc    Test TinyFish API Key
// @route   POST /api/lead-grab/test-tinyfish
const testTinyFishApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;

    const keyToTest = apiKey ? apiKey.trim() : (req.user && req.user.tinyfishApiKey) || process.env.TINYFISH_API_KEY;
    if (!keyToTest) {
      return res.status(400).json({ success: false, message: 'No TinyFish API Key provided' });
    }

    const result = await verifyTinyFishKey(keyToTest);
    res.json(result);
  } catch (err) {
    const errMsg = (err && typeof err.message === 'string') ? err.message : 'TinyFish API verification failed';
    res.status(400).json({
      success: false,
      message: errMsg
    });
  }
};

// @desc    Get Outscraper API Key & connection status
// @route   GET /api/lead-grab/api-key
const getOutscraperApiKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const key = user?.outscraperApiKey || process.env.OUTSCRAPER_API_KEY || '';
    
    res.json({
      success: true,
      hasKey: Boolean(key),
      isEnvKey: Boolean(!user?.outscraperApiKey && process.env.OUTSCRAPER_API_KEY),
      apiKey: key ? `${key.substring(0, 8)}...${key.substring(key.length - 4)}` : '',
      rawKey: key || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve API key status' });
  }
};

// @desc    Save Outscraper API Key
// @route   POST /api/lead-grab/api-key
const saveOutscraperApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      outscraperApiKey: apiKey ? apiKey.trim() : ''
    });

    res.json({
      success: true,
      message: apiKey ? 'Outscraper API Key saved successfully!' : 'Outscraper API Key removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save API key' });
  }
};

// @desc    Test Outscraper API Key
// @route   POST /api/lead-grab/test-api-key
const testOutscraperApiKey = async (req, res) => {
  try {
    const { apiKey } = req.body;
    const keyToTest = apiKey ? apiKey.trim() : req.user.outscraperApiKey || process.env.OUTSCRAPER_API_KEY;

    if (!keyToTest) {
      return res.status(400).json({ success: false, message: 'No Outscraper API Key provided' });
    }

    const testUrl = `https://api.app.outscraper.com/maps/search-v2?query=Coffee+Shop+New+York&limit=1&async=false`;
    const testResp = await axios.get(testUrl, {
      headers: { 'X-API-KEY': keyToTest },
      timeout: 15000
    });

    if (testResp.data) {
      return res.json({
        success: true,
        message: '🟢 Outscraper API Key is valid and connected! 100% Real Lead Extraction is active.'
      });
    } else {
      return res.status(400).json({
        success: false,
        message: 'Could not verify Outscraper API Key'
      });
    }
  } catch (err) {
    return res.status(400).json({
      success: false,
      message: err.response?.data?.message || 'Invalid Outscraper API Key or connection error'
    });
  }
};

// @desc    Get DeepSeek API Key & connection status
// @route   GET /api/lead-grab/deepseek-key
const getDeepSeekKey = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const key = user?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';
    const model = user?.deepseekModel || 'deepseek-chat';

    res.json({
      success: true,
      hasKey: Boolean(key),
      isEnvKey: Boolean(!user?.deepseekApiKey && process.env.DEEPSEEK_API_KEY),
      model,
      rawKey: key || ''
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve DeepSeek API status' });
  }
};

// @desc    Get AI Config (DeepSeek + Google Gemini + Active Provider)
// @route   GET /api/lead-grab/ai-config
const getAiConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({
      success: true,
      deepseekApiKey: user?.deepseekApiKey || '',
      deepseekModel: user?.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813',
      hasDeepseekKey: Boolean(user?.deepseekApiKey),
      geminiApiKey: user?.geminiApiKey || '',
      geminiModel: user?.geminiModel || 'gemini-2.5-flash',
      hasGeminiKey: Boolean(user?.geminiApiKey),
      activeAiProvider: user?.activeAiProvider || (user?.geminiApiKey ? 'gemini' : 'deepseek')
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve AI config' });
  }
};

// @desc    Save AI Config (DeepSeek + Google Gemini + Provider Switcher)
// @route   POST /api/lead-grab/save-ai-config
const saveAiConfig = async (req, res) => {
  try {
    const { deepseekApiKey, deepseekModel, geminiApiKey, geminiModel, activeAiProvider } = req.body;
    const updateData = {};
    if (deepseekApiKey !== undefined) updateData.deepseekApiKey = String(deepseekApiKey).trim();
    if (deepseekModel) updateData.deepseekModel = deepseekModel;
    if (geminiApiKey !== undefined) updateData.geminiApiKey = String(geminiApiKey).trim();
    if (geminiModel) updateData.geminiModel = geminiModel;
    if (activeAiProvider) updateData.activeAiProvider = activeAiProvider;

    await User.findByIdAndUpdate(req.user._id, updateData);

    res.json({
      success: true,
      message: 'AI Model configuration & provider preference saved successfully!'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save AI configuration' });
  }
};

// @desc    Save DeepSeek API Key & Model (Legacy Route)
// @route   POST /api/lead-grab/deepseek-key
const saveDeepSeekKey = async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    await User.findByIdAndUpdate(req.user._id, {
      deepseekApiKey: apiKey ? apiKey.trim() : '',
      deepseekModel: model || 'deepseek-ai/deepseek-v4-pro-0813'
    });

    res.json({
      success: true,
      message: apiKey ? 'DeepSeek AI Key saved successfully!' : 'DeepSeek AI Key removed'
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save DeepSeek key' });
  }
};

// @desc    Test Google Gemini API Key
// @route   POST /api/lead-grab/test-gemini
const testGeminiKey = async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const { testGeminiApiKey } = require('../services/geminiService');

    const keyToTest = apiKey ? apiKey.trim() : req.user.geminiApiKey || process.env.GEMINI_API_KEY;
    if (!keyToTest) {
      return res.json({ success: false, message: 'No Google Gemini API Key provided' });
    }

    const targetModel = model || req.user.geminiModel || 'gemini-2.5-flash';
    const testRes = await testGeminiApiKey(keyToTest, targetModel);
    const verifiedModel = testRes?.model || targetModel;

    // Auto-save verified key and set active provider to Gemini
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        geminiApiKey: keyToTest,
        geminiModel: verifiedModel,
        activeAiProvider: 'gemini'
      });
    }

    return res.json({
      success: true,
      model: verifiedModel,
      message: `🟢 Google Gemini Connection Verified! (${verifiedModel}) Ready for real email discovery and outreach.`
    });
  } catch (err) {
    const errorMsg = err.message || err.response?.data?.error?.message || 'Google Gemini verification failed';
    return res.json({
      success: false,
      message: errorMsg
    });
  }
};

// @desc    Test DeepSeek API Key
// @route   POST /api/lead-grab/test-deepseek
const testDeepSeekKey = async (req, res) => {
  try {
    const { apiKey, model } = req.body;
    const { testDeepSeekApiKey } = require('../services/deepseekService');

    const keyToTest = apiKey ? apiKey.trim() : req.user.deepseekApiKey || process.env.DEEPSEEK_API_KEY;
    if (!keyToTest) {
      return res.json({ success: false, message: 'No DeepSeek / AI API Key provided' });
    }

    const testRes = await testDeepSeekApiKey(keyToTest, model || req.user.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813');
    const verifiedModel = testRes?.model || model || 'deepseek-ai/deepseek-v4-pro-0813';

    // Auto-save the verified working model for this user
    if (req.user?._id) {
      await User.findByIdAndUpdate(req.user._id, {
        deepseekApiKey: keyToTest,
        deepseekModel: verifiedModel,
        activeAiProvider: 'deepseek'
      });
    }

    return res.json({
      success: true,
      model: verifiedModel,
      message: `🟢 DeepSeek AI Connection Verified! Ready for qualified lead intelligence and instant follow-ups.`
    });
  } catch (err) {
    const errorMsg = err.message || err.response?.data?.error?.message || err.response?.data?.detail || 'API Key verification failed';
    return res.json({
      success: false,
      message: errorMsg
    });
  }
};

// @desc    On-demand AI Lead Analysis (Gemini / DeepSeek)
// @route   POST /api/lead-grab/leads/:id/ai-analyze
const analyzeLeadWithDeepSeek = async (req, res) => {
  try {
    const lead = await GrabbedLead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const user = await User.findById(req.user._id);
    const activeProvider = user?.activeAiProvider || (user?.geminiApiKey ? 'gemini' : 'deepseek');
    const geminiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;
    const deepseekKey = user?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

    if (!geminiKey && !deepseekKey) {
      return res.status(400).json({
        success: false,
        message: 'Please configure your Google Gemini or DeepSeek API Key in Settings first.'
      });
    }

    // 1. Gather live context for missing email/phone/website via authentic web crawling
    let liveWebContext = '';
    const { scrapeRealWebsiteContacts } = require('../services/leadGrabService');

    // If website is already known, crawl website contact and about pages for real published email
    if (lead.websiteUrl && lead.websiteUrl.startsWith('http')) {
      try {
        const scraped = await scrapeRealWebsiteContacts(lead.websiteUrl);
        if (scraped.email && !lead.email) lead.email = scraped.email;
        if (scraped.phone && !lead.phone) lead.phone = scraped.phone;
        if (scraped.linkedinUrl && !lead.linkedinUrl) lead.linkedinUrl = scraped.linkedinUrl;
        if (scraped.decisionMaker && (!lead.decisionMaker || lead.decisionMaker.includes('Admin Team'))) {
          lead.decisionMaker = scraped.decisionMaker;
        }
      } catch (e) {}
    }

    // Live search for official website and published contacts if email/website is missing
    if (!lead.email || !lead.websiteUrl) {
      try {
        const cheerio = require('cheerio');
        const cleanName = lead.name.replace(/[-–|(@].*$/, '').trim();
        const searchQuery = `"${cleanName}" ${lead.city && lead.city !== 'Global' ? `"${lead.city}"` : ''} official website contact email`;
        
        // Multi-source live search query
        const searchUrls = [
          `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(searchQuery)}`,
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent(searchQuery)}`
        ];

        let snippets = [];
        let discoveredWebsite = '';

        for (const sUrl of searchUrls) {
          try {
            const searchRes = await axios.get(sUrl, {
              timeout: 6000,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
              }
            });

            const $ = cheerio.load(searchRes.data);
            $('td.result-snippet, .result__snippet, .snippet').each((_, el) => {
              const text = $(el).text().trim();
              if (text && !snippets.includes(text)) snippets.push(text);
            });

            // Extract real website URL
            $('a.result-url, .result__url, a.result-link').each((_, el) => {
              let u = $(el).attr('href') || $(el).text().trim();
              if (u && !discoveredWebsite) {
                if (u.includes('duckduckgo.com/l/?uddg=')) {
                  try {
                    const match = u.match(/uddg=([^&]+)/);
                    if (match) u = decodeURIComponent(match[1]);
                  } catch (e) {}
                }
                if (u.startsWith('http') && !u.includes('duckduckgo') && !u.includes('linkedin.com') && !u.includes('facebook.com') && !u.includes('instagram.com') && !u.includes('yelp.') && !u.includes('yellowpages.')) {
                  discoveredWebsite = u;
                }
              }
            });

            if (snippets.length > 0 || discoveredWebsite) break;
          } catch (err) {}
        }

        if (discoveredWebsite && !lead.websiteUrl) {
          lead.websiteUrl = discoveredWebsite;
        }

        // If official website was discovered, crawl it immediately for authentic published email
        if (lead.websiteUrl && lead.websiteUrl.startsWith('http') && !lead.email) {
          try {
            const newlyScraped = await scrapeRealWebsiteContacts(lead.websiteUrl);
            if (newlyScraped.email) lead.email = newlyScraped.email;
            if (newlyScraped.phone && !lead.phone) lead.phone = newlyScraped.phone;
            if (newlyScraped.linkedinUrl && !lead.linkedinUrl) lead.linkedinUrl = newlyScraped.linkedinUrl;
            if (newlyScraped.decisionMaker && (!lead.decisionMaker || lead.decisionMaker.includes('Admin Team') || lead.decisionMaker.includes('Executive'))) {
              lead.decisionMaker = newlyScraped.decisionMaker;
            }
          } catch (e) {}
        }

        liveWebContext = snippets.slice(0, 10).join('\n');
      } catch (searchErr) {
        console.warn('Live search context notice:', searchErr.message);
      }
    }

    // 2. Call AI Intelligence (Gemini or DeepSeek based on user preference)
    let enriched = null;
    let providerLabel = 'AI';

    if (activeProvider === 'gemini' && geminiKey) {
      const { enrichLeadWithGemini } = require('../services/geminiService');
      providerLabel = 'Google Gemini';
      enriched = await enrichLeadWithGemini({
        apiKey: geminiKey,
        model: user?.geminiModel || 'gemini-2.5-flash',
        businessName: lead.name,
        niche: lead.niche,
        city: lead.city,
        websiteUrl: lead.websiteUrl,
        initialPhone: lead.phone,
        initialEmail: lead.email,
        rawText: `${lead.notes || ''} ${lead.location || ''} \nLive Search & Website Context:\n${liveWebContext}`
      });
    } else if (deepseekKey) {
      const { enrichLeadWithDeepSeek } = require('../services/deepseekService');
      providerLabel = 'DeepSeek AI';
      enriched = await enrichLeadWithDeepSeek({
        apiKey: deepseekKey,
        model: user?.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813',
        businessName: lead.name,
        niche: lead.niche,
        city: lead.city,
        websiteUrl: lead.websiteUrl,
        initialPhone: lead.phone,
        initialEmail: lead.email,
        rawText: `${lead.notes || ''} ${lead.location || ''} \nLive Search & Website Context:\n${liveWebContext}`
      });
    }

    const discoveredItems = [];

    // 1. Process authentic discovered email
    if (lead.email) {
      discoveredItems.push(`Email: ${lead.email}`);
    } else if (enriched?.email) {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
      const match = String(enriched.email).trim().match(emailRegex);
      if (match) {
        const authenticEmail = match[0].toLowerCase();
        // Ignore generic placeholder domains
        if (!authenticEmail.includes('example.com') && !authenticEmail.includes('domain.com') && !authenticEmail.includes('company.com') && !authenticEmail.includes('email.com')) {
          lead.email = authenticEmail;
          discoveredItems.push(`Email: ${authenticEmail}`);
        }
      }
    }

    if (enriched) {
      if (enriched.decisionMaker && (!lead.decisionMaker || lead.decisionMaker.includes('Admin Team') || lead.decisionMaker.includes('Executive'))) {
        lead.decisionMaker = enriched.decisionMaker;
        discoveredItems.push(`Decision Maker: ${enriched.decisionMaker}`);
      }
      if (enriched.phone && !lead.phone) {
        lead.phone = enriched.phone;
        discoveredItems.push(`Phone: ${enriched.phone}`);
      }
      if (enriched.linkedinUrl && !lead.linkedinUrl) {
        lead.linkedinUrl = enriched.linkedinUrl;
        discoveredItems.push(`LinkedIn: Profile`);
      }
      if (enriched.outreachPitch) {
        lead.notes = `✨ AI Outreach Pitch: ${enriched.outreachPitch}\n\n${lead.notes || ''}`;
      }
      if (enriched.websiteUrl && !lead.websiteUrl) {
        lead.websiteUrl = enriched.websiteUrl;
        discoveredItems.push(`Website: ${enriched.websiteUrl}`);
      }
    }

    lead.sourcePlatform = lead.sourcePlatform ? `${lead.sourcePlatform} + ${providerLabel} Enriched` : providerLabel;
    await lead.save();

    // Update campaign stats
    if (lead.campaignId) {
      const camp = await LeadGrabCampaign.findById(lead.campaignId);
      if (camp) {
        camp.stats.withEmail = await GrabbedLead.countDocuments({ campaignId: camp._id, email: { $ne: '' } });
        camp.stats.withPhone = await GrabbedLead.countDocuments({ campaignId: camp._id, phone: { $ne: '' } });
        camp.stats.withLinkedIn = await GrabbedLead.countDocuments({ campaignId: camp._id, linkedinUrl: { $ne: '' } });
        camp.stats.withWebsite = await GrabbedLead.countDocuments({ campaignId: camp._id, websiteUrl: { $ne: '' } });
        await camp.save();
      }
    }

    const message = discoveredItems.length > 0
      ? `✨ ${providerLabel} discovered: ${discoveredItems.join(' | ')}!`
      : `✨ ${providerLabel} analysis completed (No public email published on official website)`;

    res.json({
      success: true,
      message,
      data: lead,
      enriched
    });
  } catch (error) {
    console.error('Error analyzing lead with AI:', error);
    res.status(500).json({ success: false, message: 'AI Analysis failed', error: error.message });
  }
};

// @desc    Bulk AI Contact Enrichment for all missing leads in a campaign
// @route   POST /api/lead-grab/campaigns/:id/ai-enrich-all
const bulkEnrichCampaignWithDeepSeek = async (req, res) => {
  try {
    const campaign = await LeadGrabCampaign.findById(req.params.id);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const user = await User.findById(req.user._id);
    const activeProvider = user?.activeAiProvider || (user?.geminiApiKey ? 'gemini' : 'deepseek');
    const geminiKey = user?.geminiApiKey || process.env.GEMINI_API_KEY;
    const deepseekKey = user?.deepseekApiKey || process.env.DEEPSEEK_API_KEY;

    if (!geminiKey && !deepseekKey) {
      return res.status(400).json({
        success: false,
        message: 'Please configure your Google Gemini or DeepSeek API Key in Settings first.'
      });
    }

    // Find leads missing email or phone
    const leadsToEnrich = await GrabbedLead.find({
      campaignId: campaign._id,
      $or: [{ email: '' }, { email: { $exists: false } }, { phone: '' }, { phone: { $exists: false } }]
    }).limit(30);

    if (leadsToEnrich.length === 0) {
      return res.json({
        success: true,
        message: 'All leads in this campaign already have contact info!',
        updatedCount: 0
      });
    }

    const { enrichLeadWithGemini } = require('../services/geminiService');
    const { enrichLeadWithDeepSeek } = require('../services/deepseekService');
    const { scrapeRealWebsiteContacts } = require('../services/leadGrabService');
    const isGemini = activeProvider === 'gemini' && Boolean(geminiKey);
    const providerLabel = isGemini ? 'Google Gemini' : 'DeepSeek AI';
    let updatedCount = 0;

    // Process in parallel batches of 5
    const batchSize = 5;
    for (let i = 0; i < leadsToEnrich.length; i += batchSize) {
      const batch = leadsToEnrich.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(async (lead) => {
          try {
            if (lead.websiteUrl && lead.websiteUrl.startsWith('http')) {
              try {
                const scraped = await scrapeRealWebsiteContacts(lead.websiteUrl);
                if (scraped.email && !lead.email) lead.email = scraped.email;
                if (scraped.phone && !lead.phone) lead.phone = scraped.phone;
                if (scraped.linkedinUrl && !lead.linkedinUrl) lead.linkedinUrl = scraped.linkedinUrl;
                if (scraped.decisionMaker && (!lead.decisionMaker || lead.decisionMaker.includes('Admin Team'))) {
                  lead.decisionMaker = scraped.decisionMaker;
                }
              } catch (e) {}
            }

            let enriched = null;
            if (isGemini) {
              enriched = await enrichLeadWithGemini({
                apiKey: geminiKey,
                model: user?.geminiModel || 'gemini-2.5-flash',
                businessName: lead.name,
                niche: lead.niche || campaign.niche,
                city: lead.city || campaign.targetCity,
                websiteUrl: lead.websiteUrl,
                initialPhone: lead.phone,
                initialEmail: lead.email,
                rawText: `${lead.notes || ''} ${lead.location || ''}`
              });
            } else {
              enriched = await enrichLeadWithDeepSeek({
                apiKey: deepseekKey,
                model: user?.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813',
                businessName: lead.name,
                niche: lead.niche || campaign.niche,
                city: lead.city || campaign.targetCity,
                websiteUrl: lead.websiteUrl,
                initialPhone: lead.phone,
                initialEmail: lead.email,
                rawText: `${lead.notes || ''} ${lead.location || ''}`
              });
            }

            if (enriched) {
              if (enriched.decisionMaker && (!lead.decisionMaker || lead.decisionMaker.includes('Admin Team'))) {
                lead.decisionMaker = enriched.decisionMaker;
              }

              // Email validation & discovery
              let foundEmail = enriched.email ? String(enriched.email).trim() : '';
              const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
              const match = foundEmail.match(emailRegex);
              if (match) {
                foundEmail = match[0].toLowerCase();
              } else {
                foundEmail = '';
              }

              // Fallback: If no email returned directly, deduce from official website domain
              if (!foundEmail && (enriched.websiteUrl || lead.websiteUrl)) {
                const targetUrl = enriched.websiteUrl || lead.websiteUrl;
                try {
                  const urlObj = new URL(targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`);
                  let domain = urlObj.hostname.replace(/^www\./, '').toLowerCase();
                  if (domain && !domain.includes('google.') && !domain.includes('duckduckgo.') && !domain.includes('facebook.') && !domain.includes('instagram.') && !domain.includes('linkedin.')) {
                    foundEmail = `info@${domain}`;
                  }
                } catch (e) {}
              }

              if (foundEmail && !lead.email) {
                lead.email = foundEmail;
              }

              if (enriched.phone && !lead.phone) lead.phone = enriched.phone;
              if (enriched.linkedinUrl && !lead.linkedinUrl) lead.linkedinUrl = enriched.linkedinUrl;
              if (enriched.websiteUrl && !lead.websiteUrl) lead.websiteUrl = enriched.websiteUrl;
              if (enriched.outreachPitch) {
                lead.notes = `✨ AI Outreach Pitch: ${enriched.outreachPitch}\n\n${lead.notes || ''}`;
              }
              lead.sourcePlatform = lead.sourcePlatform ? `${lead.sourcePlatform} + ${providerLabel} Enriched` : providerLabel;
              await lead.save();
              updatedCount++;
            }
          } catch (e) {}
        })
      );
    }

    // Refresh campaign stats
    campaign.stats.withEmail = await GrabbedLead.countDocuments({ campaignId: campaign._id, email: { $ne: '' } });
    campaign.stats.withPhone = await GrabbedLead.countDocuments({ campaignId: campaign._id, phone: { $ne: '' } });
    campaign.stats.withLinkedIn = await GrabbedLead.countDocuments({ campaignId: campaign._id, linkedinUrl: { $ne: '' } });
    campaign.stats.withWebsite = await GrabbedLead.countDocuments({ campaignId: campaign._id, websiteUrl: { $ne: '' } });
    await campaign.save();

    res.json({
      success: true,
      message: `✨ ${providerLabel} enriched ${updatedCount} leads successfully!`,
      updatedCount,
      totalProcessed: leadsToEnrich.length
    });
  } catch (error) {
    console.error('Error in bulk AI enrichment:', error);
    res.status(500).json({ success: false, message: 'Bulk AI Enrichment failed', error: error.message });
  }
};

// ==========================================
// DISCORD COMMUNITY & CHAT LEAD EXTRACTORS
// ==========================================

// @desc    Inspect a Discord server invite URL / Code
// @route   POST /api/lead-grab/discord/inspect-invite
const inspectDiscordInvite = async (req, res) => {
  try {
    const { inviteUrl } = req.body;
    if (!inviteUrl || !inviteUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Discord invite URL or code is required' });
    }

    const { fetchDiscordInviteDetails } = require('../services/discordLeadService');
    const details = await fetchDiscordInviteDetails(inviteUrl.trim());

    if (!details) {
      return res.status(404).json({ success: false, message: 'Could not resolve Discord invite details. Make sure the server invite is valid and public.' });
    }

    res.json({
      success: true,
      message: `Found Discord Community "${details.guildName}"!`,
      data: details
    });
  } catch (error) {
    console.error('Error inspecting Discord invite:', error);
    res.status(500).json({ success: false, message: 'Failed to inspect Discord invite', error: error.message });
  }
};

// @desc    Parse raw Discord chat messages / intros / hiring into structured leads
// @route   POST /api/lead-grab/discord/parse-text
const parseDiscordTranscriptData = async (req, res) => {
  try {
    const { text, niche, targetCity, campaignId, folderId, folderName } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Discord message transcript text is required' });
    }

    const { parseDiscordTranscript } = require('../services/discordLeadService');
    const extractedLeads = parseDiscordTranscript({
      text,
      niche: niche || 'Discord Community Member',
      targetCity: targetCity || 'Global'
    });

    if (extractedLeads.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid leads or contact posts could be parsed from the provided text' });
    }

    // If campaignId is provided, save leads directly to campaign
    let savedToCampaignCount = 0;
    if (campaignId) {
      const campaign = await LeadGrabCampaign.findById(campaignId);
      if (campaign) {
        const docs = extractedLeads.map(l => ({
          ...l,
          campaignId: campaign._id,
          companyId: campaign.companyId || req.user.companyId || null
        }));
        await GrabbedLead.insertMany(docs);
        savedToCampaignCount = docs.length;

        // update campaign stats
        const total = await GrabbedLead.countDocuments({ campaignId: campaign._id });
        campaign.extractedCount = total;
        campaign.stats.withEmail = await GrabbedLead.countDocuments({ campaignId: campaign._id, email: { $ne: '' } });
        campaign.stats.withPhone = await GrabbedLead.countDocuments({ campaignId: campaign._id, phone: { $ne: '' } });
        await campaign.save();
      }
    }

    // If folderId or folderName is provided, import to folder
    let savedToFolderCount = 0;
    if (folderId || folderName) {
      let targetFolder = null;
      if (folderId) {
        targetFolder = await Folder.findById(folderId);
      } else if (folderName) {
        targetFolder = await Folder.create({
          name: folderName.trim(),
          color: '#5865F2',
          description: `Imported from Discord Chat Parser (${extractedLeads.length} leads)`,
          companyId: req.user.companyId || null,
          createdBy: req.user._id
        });
      }

      if (targetFolder) {
        let dataset = await Dataset.findOne({ folderId: targetFolder._id });
        if (!dataset) {
          dataset = await Dataset.create({
            folderId: targetFolder._id,
            name: `${targetFolder.name} Records`,
            columns: [
              { key: 'name', label: 'Name / Discord Tag', type: 'text', required: true },
              { key: 'companyName', label: 'Company / Project', type: 'text' },
              { key: 'decisionMaker', label: 'Role / Bio', type: 'text' },
              { key: 'email', label: 'Email', type: 'email' },
              { key: 'phone', label: 'Phone', type: 'phone' },
              { key: 'websiteUrl', label: 'Website / Link', type: 'text' },
              { key: 'sourcePlatform', label: 'Platform', type: 'text' },
              { key: 'status', label: 'Status', type: 'status' },
              { key: 'notes', label: 'Notes & Script', type: 'text' }
            ]
          });
        }

        for (const lead of extractedLeads) {
          await DynamicRecord.create({
            datasetId: dataset._id,
            folderId: targetFolder._id,
            data: {
              name: lead.name,
              companyName: lead.companyName,
              decisionMaker: lead.decisionMaker,
              email: lead.email,
              phone: lead.phone,
              websiteUrl: lead.websiteUrl,
              sourcePlatform: lead.sourcePlatform,
              status: lead.status || 'NEW',
              notes: lead.notes
            }
          });
          savedToFolderCount++;
        }

        const count = await DynamicRecord.countDocuments({ datasetId: dataset._id });
        dataset.recordCount = count;
        await dataset.save();
      }
    }

    res.json({
      success: true,
      message: `Parsed ${extractedLeads.length} leads successfully!${savedToCampaignCount > 0 ? ` Added ${savedToCampaignCount} to campaign.` : ''}${savedToFolderCount > 0 ? ` Imported ${savedToFolderCount} to folder.` : ''}`,
      count: extractedLeads.length,
      data: extractedLeads
    });
  } catch (error) {
    console.error('Error parsing Discord transcript:', error);
    res.status(500).json({ success: false, message: 'Failed to parse Discord messages', error: error.message });
  }
};

// @desc    Get user Discord configuration
// @route   GET /api/lead-grab/discord-config
const getDiscordConfig = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const config = user?.discordConfig || { isConnected: false, botToken: '', webhookUrl: '', defaultChannelId: '' };
    res.json({
      success: true,
      hasWebhook: Boolean(config.webhookUrl),
      hasBotToken: Boolean(config.botToken),
      webhookUrl: config.webhookUrl || '',
      defaultChannelId: config.defaultChannelId || '',
      isConnected: config.isConnected || false
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch Discord config', error: error.message });
  }
};

// @desc    Save user Discord configuration
// @route   POST /api/lead-grab/discord-config
const saveDiscordConfig = async (req, res) => {
  try {
    const { webhookUrl, botToken, defaultChannelId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.discordConfig) {
      user.discordConfig = {};
    }

    if (webhookUrl !== undefined) user.discordConfig.webhookUrl = (webhookUrl || '').trim();
    if (botToken !== undefined) user.discordConfig.botToken = (botToken || '').trim();
    if (defaultChannelId !== undefined) user.discordConfig.defaultChannelId = (defaultChannelId || '').trim();
    user.discordConfig.isConnected = Boolean(user.discordConfig.webhookUrl || user.discordConfig.botToken);
    user.discordConfig.updatedAt = new Date();

    await user.save();

    res.json({
      success: true,
      message: 'Discord integration settings saved successfully!',
      data: {
        isConnected: user.discordConfig.isConnected,
        hasWebhook: Boolean(user.discordConfig.webhookUrl),
        hasBotToken: Boolean(user.discordConfig.botToken)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to save Discord config', error: error.message });
  }
};

// @desc    Test Discord Webhook notification
// @route   POST /api/lead-grab/test-discord-webhook
const testDiscordWebhook = async (req, res) => {
  try {
    const { webhookUrl } = req.body;
    const targetUrl = webhookUrl || req.user.discordConfig?.webhookUrl;

    if (!targetUrl || !targetUrl.trim()) {
      return res.status(400).json({ success: false, message: 'Discord Webhook URL is required' });
    }

    const payload = {
      username: 'MyCRM Lead Grabber',
      avatar_url: 'https://cdn-icons-png.flaticon.com/512/3670/3670157.png',
      embeds: [
        {
          title: '🎮 Discord Lead Grabber Connected!',
          description: 'Your CRM is now integrated with Discord. New business leads and community discoveries can be alerted directly into your Discord server.',
          color: 0x5865f2,
          fields: [
            { name: 'Status', value: '🟢 Active & Ready', inline: true },
            { name: 'CRM User', value: req.user.name || 'Admin', inline: true },
            { name: 'Timestamp', value: new Date().toLocaleTimeString(), inline: true }
          ],
          footer: { text: 'MyCRM Discord Intelligence Hub' }
        }
      ]
    };

    await axios.post(targetUrl.trim(), payload, { timeout: 10000 });

    res.json({
      success: true,
      message: 'Discord Webhook test message delivered successfully!'
    });
  } catch (error) {
    console.error('Discord webhook test failed:', error.response?.data || error.message);
    res.status(400).json({
      success: false,
      message: 'Failed to send Discord webhook message. Please verify your Discord Webhook URL.',
      error: error.response?.data || error.message
    });
  }
};

// @desc    Deduplicate leads in a campaign & optionally replenish with new unique leads
// @route   POST /api/lead-grab/campaigns/:id/deduplicate
const deduplicateCampaignLeads = async (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = await LeadGrabCampaign.findById(campaignId);
    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const { deduplicateCampaignDocs, runCampaignExtraction } = require('../services/leadGrabService');
    const result = await deduplicateCampaignDocs(campaign._id, campaign.companyId || req.user.companyId);

    const { autoReplenish = true } = req.body;
    if (autoReplenish && result.remainingCount < (campaign.targetCount || 25)) {
      runCampaignExtraction(campaign._id).catch(console.error);
    }

    res.json({
      success: true,
      message: result.removedDuplicates > 0
        ? `Cleaned ${result.removedDuplicates} duplicate leads! Fetching fresh unique replacements...`
        : `All leads in this campaign are already 100% unique!`,
      data: result
    });
  } catch (error) {
    console.error('Error deduplicating campaign leads:', error);
    res.status(500).json({ success: false, message: 'Failed to deduplicate leads', error: error.message });
  }
};

module.exports = {
  getCampaigns,
  createCampaign,
  getCampaign,
  updateCampaign,
  deleteCampaign,
  startCampaign,
  pauseCampaign,
  getGrabbedLeads,
  updateGrabbedLead,
  deleteGrabbedLead,
  deduplicateCampaignLeads,
  importLeadToCRM,
  bulkImportToCRM,
  exportCampaignLeads,
  getLeadGrabStats,
  getTinyFishApiKey,
  saveTinyFishApiKey,
  testTinyFishApiKey,
  getOutscraperApiKey,
  saveOutscraperApiKey,
  testOutscraperApiKey,
  getDeepSeekKey,
  saveDeepSeekKey,
  testDeepSeekKey,
  getAiConfig,
  saveAiConfig,
  testGeminiKey,
  analyzeLeadWithDeepSeek,
  bulkEnrichCampaignWithDeepSeek,
  inspectDiscordInvite,
  parseDiscordTranscriptData,
  getDiscordConfig,
  saveDiscordConfig,
  testDiscordWebhook
};
