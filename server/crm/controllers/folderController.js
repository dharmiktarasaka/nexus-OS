const nodemailer = require('nodemailer');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Dataset = require('../models/Dataset');
const DynamicRecord = require('../models/DynamicRecord');
const FolderPermission = require('../models/FolderPermission');
const ScheduledEmail = require('../models/ScheduledEmail');
const Email = require('../models/Email');
const WhatsAppCampaign = require('../models/WhatsAppCampaign');
const whatsappService = require('../services/whatsappService');
const { parseBuffer, generateExportBuffer } = require('../services/folderExcelService');
const { evaluateFolderAccess } = require('../middleware/rbacMiddleware');
const { logAudit } = require('../services/auditService');
const { verifyMailConnection, normalizeSmtpHost, formatSmtpError } = require('../services/emailSchedulerService');

const getUserOwnerId = (req) => {
  return String(req.user?.ownerId || req.user?.uid || req.user?._id || '').trim();
};

const getFolderOwnerFilter = (req) => {
  const ownerId = getUserOwnerId(req);
  return {
    $or: [
      { ownerId: ownerId },
      { createdBy: ownerId }
    ]
  };
};

// @desc    Create new user folder
// @route   POST /api/folders
const createFolder = async (req, res, next) => {
  try {
    if (req.user.role === 'VISITOR') {
      return res.status(403).json({ success: false, message: 'Visitors are not authorized to create folders' });
    }

    const { name, description, color, category } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ success: false, message: 'Folder name is required' });
    }

    const normalizedCategory = (category || '').trim().toUpperCase() === 'INTERNATIONAL' ? 'INTERNATIONAL' : 'INDIA';
    const ownerId = getUserOwnerId(req);

    const folder = await Folder.create({
      companyId: req.user.companyId || null,
      name: name.trim(),
      description: description ? description.trim() : '',
      color: color || '#1A3548',
      category: normalizedCategory,
      ownerId: ownerId,
      createdBy: ownerId
    });

    await logAudit(req, 'FOLDER_CREATED', 'Folder', folder._id, `Created folder '${folder.name}' (${normalizedCategory})`);

    res.status(201).json({
      success: true,
      message: 'Folder created successfully',
      folder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all accessible folders for logged-in user (Owned + Granted Shared Folders)
// @route   GET /api/folders
const getFolders = async (req, res, next) => {
  try {
    const ownerId = getUserOwnerId(req);
    // Strictly retrieve ONLY:
    // 1. Folders owned/created by the logged-in user
    // 2. Folders explicitly shared with the logged-in user via FolderPermission
    const ownedFolders = await Folder.find(getFolderOwnerFilter(req), { _id: 1 });
    const ownedIds = ownedFolders.map(f => f._id);

    const grantedDocs = await FolderPermission.find({
      $or: [{ userId: ownerId }, { userEmail: req.user.email }]
    }, { folderId: 1 });
    const grantedIds = grantedDocs.map(g => g.folderId);

    const folderIds = Array.from(new Set([...ownedIds.map(id => id.toString()), ...grantedIds.map(id => id.toString())]));

    const filterQuery = {
      $or: [
        { _id: { $in: folderIds } },
        { ownerId: ownerId },
        { createdBy: ownerId }
      ]
    };

    if (req.query.category) {
      const cat = req.query.category.trim().toUpperCase();
      if (cat === 'INDIA' || cat === 'INTERNATIONAL') {
        filterQuery.category = cat;
      }
    }

    const folders = await Folder.find(filterQuery).sort({ updatedAt: -1 });

    // Aggregate dataset counts and total record counts per folder
    const stats = await Dataset.aggregate([
      { $match: { folderId: { $in: folders.map(f => f._id) } } },
      {
        $group: {
          _id: "$folderId",
          datasetCount: { $sum: 1 },
          totalRecords: { $sum: "$recordCount" }
        }
      }
    ]);

    const statsMap = new Map();
    stats.forEach(s => {
      statsMap.set(s._id.toString(), s);
    });

    const result = await Promise.all(folders.map(async f => {
      const folderStat = statsMap.get(f._id.toString()) || { datasetCount: 0, totalRecords: 0 };
      const access = await evaluateFolderAccess(req.user, f, 'VIEW');
      return {
        ...f.toObject(),
        category: f.category || 'INDIA',
        datasetCount: folderStat.datasetCount,
        totalRecords: folderStat.totalRecords,
        isOwner: (f.ownerId && f.ownerId.toString() === ownerId) || (f.createdBy && f.createdBy.toString() === ownerId),
        accessLevel: access.accessLevel
      };
    }));

    res.json({
      success: true,
      folders: result
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single folder & its datasets list
// @route   GET /api/folders/:folderId
const getFolderById = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.folderId)) {
      const isHealth = req.params.folderId === 'f_2';
      return res.json({
        success: true,
        folder: {
          _id: req.params.folderId,
          name: isHealth ? 'US HealthCare Providers' : 'India Tech & SaaS Startups',
          description: isHealth ? 'Medical and healthcare clinics in California' : 'Verified founders and CEOs in Bangalore & Mumbai',
          color: isHealth ? '#059669' : '#4F46E5',
          category: isHealth ? 'INTERNATIONAL' : 'INDIA',
          datasetCount: isHealth ? 1 : 2,
          totalRecords: isHealth ? 14 : 28,
          isOwner: true,
          accessLevel: 'FULL_ACCESS'
        },
        datasets: []
      });
    }

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'VIEW');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Access denied to this private folder' });
    }

    const ownerId = getUserOwnerId(req);
    const datasets = await Dataset.find({ folderId: folder._id }).sort({ createdAt: -1 });
    const totalRecords = datasets.reduce((acc, d) => acc + (d.recordCount || 0), 0);

    res.json({
      success: true,
      folder: {
        ...folder.toObject(),
        category: folder.category || 'INDIA',
        datasetCount: datasets.length,
        totalRecords,
        isOwner: (folder.ownerId && folder.ownerId.toString() === ownerId) || (folder.createdBy && folder.createdBy.toString() === ownerId),
        accessLevel: access.accessLevel
      },
      datasets
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update/Rename folder
// @route   PUT /api/folders/:folderId
const updateFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const ownerId = getUserOwnerId(req);
    // Strict Data Creator Check: Only the folder creator can rename or update the folder
    const isCreator = (folder.ownerId && folder.ownerId.toString() === ownerId) ||
                      (folder.createdBy && folder.createdBy.toString() === ownerId);
    if (!isCreator) {
      return res.status(403).json({ success: false, message: 'Strict Privacy Protection: You can only edit your own created folders.' });
    }

    const { name, description, color, category } = req.body;
    if (name && name.trim()) folder.name = name.trim();
    if (description !== undefined) folder.description = description.trim();
    if (color) folder.color = color;
    if (category) {
      const normalizedCategory = category.trim().toUpperCase();
      if (normalizedCategory === 'INDIA' || normalizedCategory === 'INTERNATIONAL') {
        folder.category = normalizedCategory;
      }
    }

    await folder.save();

    await logAudit(req, 'FOLDER_UPDATED', 'Folder', folder._id, `Renamed folder to '${folder.name}'`);

    res.json({
      success: true,
      message: 'Folder updated successfully',
      folder
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete folder and cascade delete datasets & records
// @route   DELETE /api/folders/:folderId
const deleteFolder = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const ownerId = getUserOwnerId(req);
    // Strict Data Creator Check: ONLY the user who created the folder can delete it!
    const isCreator = (folder.ownerId && folder.ownerId.toString() === ownerId) ||
                      (folder.createdBy && folder.createdBy.toString() === ownerId);

    if (!isCreator) {
      return res.status(403).json({ success: false, message: 'Strict Privacy Protection: You can only delete your own created folders.' });
    }

    await DynamicRecord.deleteMany({ folderId: folder._id });
    await Dataset.deleteMany({ folderId: folder._id });
    await FolderPermission.deleteMany({ folderId: folder._id });
    await Folder.deleteOne({ _id: folder._id });

    await logAudit(req, 'FOLDER_DELETED', 'Folder', folder._id, `Deleted folder '${folder.name}'`);

    res.json({
      success: true,
      message: 'Folder and all associated datasets and records deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Parse uploaded Excel file and return preview payload
// @route   POST /api/folders/:folderId/parse
const parseExcelForImport = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (mongoose.Types.ObjectId.isValid(req.params.folderId)) {
      const folder = await Folder.findById(req.params.folderId);
      if (folder) {
        const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
        if (!access.allowed) {
          return res.status(403).json({ success: false, message: 'Edit permission required to upload Excel files' });
        }
      }
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No Excel file uploaded' });
    }

    const headerRowIndex = req.query.headerRowIndex !== undefined 
      ? parseInt(req.query.headerRowIndex, 10) 
      : (req.body && req.body.headerRowIndex !== undefined ? parseInt(req.body.headerRowIndex, 10) : null);

    const parsed = parseBuffer(req.file.buffer, headerRowIndex);

    res.json({
      success: true,
      fileName: req.file.originalname,
      headerRowIndex: parsed.headerRowIndex,
      headerRowOptions: parsed.headerRowOptions,
      headers: parsed.headers,
      totalRecords: parsed.totalRecords,
      sampleRows: parsed.sampleRows,
      rowsData: parsed.rowsData
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message || 'Failed to parse Excel file' });
  }
};

// @desc    Confirm and import dataset into folder with duplicate strategy
// @route   POST /api/folders/:folderId/import
const importDataset = async (req, res, next) => {
  try {
    const { fileName, headers, rowsData, duplicateMode = 'import_all', duplicateKey } = req.body;

    if (!fileName || !headers || !Array.isArray(headers) || !rowsData || !Array.isArray(rowsData)) {
      return res.status(400).json({ success: false, message: 'Invalid import payload structure' });
    }

    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.folderId)) {
      return res.status(201).json({
        success: true,
        message: `Successfully imported ${rowsData.length} records into folder`,
        dataset: {
          _id: 'ds_' + Date.now(),
          folderId: req.params.folderId,
          fileName,
          headers,
          recordCount: rowsData.length
        }
      });
    }

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Edit permission required to import datasets' });
    }

    const ownerId = getUserOwnerId(req);

    const validTypes = ['TEXT', 'PHONE', 'EMAIL', 'NUMBER', 'DATE', 'URL', 'SELECT'];
    const normalizedHeaders = headers.map((h) => {
      let upperType = (h.type ? String(h.type).toUpperCase() : 'TEXT').trim();
      if (!validTypes.includes(upperType)) upperType = 'TEXT';
      return {
        key: h.key,
        label: h.label || h.key,
        type: upperType
      };
    });

    // Create Dataset document
    const dataset = await Dataset.create({
      companyId: req.user.companyId || null,
      folderId: folder._id,
      ownerId: ownerId,
      createdBy: ownerId,
      fileName,
      originalName: fileName,
      headers: normalizedHeaders,
      recordCount: 0
    });

    let recordsToInsert = [];

    // Calculate baseRowIndex to preserve exact Excel sheet row order
    let baseRowIndex = 0;
    const lastRecord = await DynamicRecord.findOne({ folderId: folder._id }).sort({ rowIndex: -1 });
    if (lastRecord && typeof lastRecord.rowIndex === 'number') {
      baseRowIndex = lastRecord.rowIndex + 1;
    }

    if (duplicateMode !== 'import_all' && duplicateKey && headers.some(h => h.key === duplicateKey)) {
      const existingRecords = await DynamicRecord.find(
        { folderId: folder._id },
        { [`data.${duplicateKey}`]: 1 }
      );
      const existingValueSet = new Set();
      existingRecords.forEach(r => {
        const val = r.data ? r.data[duplicateKey] : undefined;
        if (val) existingValueSet.add(String(val).trim().toLowerCase());
      });

      if (duplicateMode === 'skip') {
        rowsData.forEach((row, idx) => {
          const val = row[duplicateKey] ? String(row[duplicateKey]).trim().toLowerCase() : '';
          if (!val || !existingValueSet.has(val)) {
            recordsToInsert.push({
              companyId: req.user.companyId || null,
              folderId: folder._id,
              datasetId: dataset._id,
              ownerId: ownerId,
              createdBy: ownerId,
              rowIndex: baseRowIndex + idx,
              data: row
            });
            if (val) existingValueSet.add(val);
          }
        });
      } else if (duplicateMode === 'update') {
        const bulkOps = [];
        for (let idx = 0; idx < rowsData.length; idx++) {
          const row = rowsData[idx];
          const val = row[duplicateKey] ? String(row[duplicateKey]).trim().toLowerCase() : '';
          if (val && existingValueSet.has(val)) {
            bulkOps.push({
              updateOne: {
                filter: { folderId: folder._id, [`data.${duplicateKey}`]: new RegExp(`^${row[duplicateKey].trim()}$`, 'i') },
                update: { $set: { data: row, datasetId: dataset._id, ownerId: ownerId } }
              }
            });
          } else {
            recordsToInsert.push({
              companyId: req.user.companyId || null,
              folderId: folder._id,
              datasetId: dataset._id,
              ownerId: ownerId,
              createdBy: ownerId,
              rowIndex: baseRowIndex + idx,
              data: row
            });
            if (val) existingValueSet.add(val);
          }
        }

        if (bulkOps.length > 0) {
          await DynamicRecord.bulkWrite(bulkOps);
        }
      }
    } else {
      recordsToInsert = rowsData.map((row, idx) => ({
        companyId: req.user.companyId || null,
        folderId: folder._id,
        datasetId: dataset._id,
        ownerId: ownerId,
        createdBy: ownerId,
        rowIndex: baseRowIndex + idx,
        data: row
      }));
    }

    if (recordsToInsert.length > 0) {
      await DynamicRecord.insertMany(recordsToInsert);
    }

    const insertedCount = recordsToInsert.length;
    dataset.recordCount = insertedCount;
    await dataset.save();

    await logAudit(req, 'EXCEL_IMPORTED', 'Dataset', dataset._id, `Imported ${insertedCount} records from '${fileName}' into folder '${folder.name}'`);

    res.status(201).json({
      success: true,
      message: `Successfully imported ${insertedCount} records into ${folder.name}`,
      dataset
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get paginated records for folder or dataset
// @route   GET /api/folders/:folderId/records
const getFolderRecords = async (req, res, next) => {
  try {
    const mongoose = require('mongoose');
    if (!mongoose.Types.ObjectId.isValid(req.params.folderId)) {
      const isHealth = req.params.folderId === 'f_2';
      const sampleHeaders = isHealth ? [
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
      ];

      return res.json({
        success: true,
        records: [],
        headers: sampleHeaders,
        total: 0,
        totalPages: 1,
        currentPage: 1
      });
    }

    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'VIEW');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Access denied to view records in this folder' });
    }

    const {
      datasetId,
      page = 1,
      limit = 10,
      search = '',
      sortBy,
      sortOrder = 'asc',
      columnFilters
    } = req.query;

    const query = {
      folderId: folder._id
    };

    if (datasetId && datasetId !== 'all') {
      query.datasetId = datasetId;
    }

    // Determine headers
    let activeHeaders = [];
    if (datasetId && datasetId !== 'all') {
      const ds = await Dataset.findById(datasetId);
      if (ds) activeHeaders = ds.headers;
    } else {
      const allDatasets = await Dataset.find({ folderId: folder._id });
      const headerMap = new Map();
      allDatasets.forEach(ds => {
        ds.headers.forEach(h => {
          if (!headerMap.has(h.key)) headerMap.set(h.key, h);
        });
      });
      activeHeaders = Array.from(headerMap.values());
    }

    // Search
    if (search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = activeHeaders.map(h => ({ [`data.${h.key}`]: searchRegex }));
      if (searchOr.length > 0) query.$or = searchOr;
    }

    // Column Filters
    if (columnFilters) {
      try {
        const filtersObj = typeof columnFilters === 'string' ? JSON.parse(columnFilters) : columnFilters;
        Object.keys(filtersObj).forEach(key => {
          const val = filtersObj[key];
          if (val && String(val).trim()) {
            query[`data.${key}`] = new RegExp(String(val).trim(), 'i');
          }
        });
      } catch (err) {}
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const sortObj = {};
    if (sortBy) {
      sortObj[`data.${sortBy}`] = sortOrder === 'desc' ? -1 : 1;
    } else {
      // Preserve exact original Excel sheet insertion sequence (1, 2, 3...)
      sortObj.rowIndex = 1;
      sortObj.createdAt = 1;
      sortObj._id = 1;
    }

    const total = await DynamicRecord.countDocuments(query);
    const records = await DynamicRecord.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      headers: activeHeaders,
      total,
      totalPages: Math.ceil(total / limitNum),
      currentPage: pageNum,
      records
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Manually add record to dataset
// @route   POST /api/datasets/:datasetId/records
const createRecord = async (req, res, next) => {
  try {
    const dataset = await Dataset.findById(req.params.datasetId);
    if (!dataset) {
      return res.status(404).json({ success: false, message: 'Dataset not found or access denied' });
    }

    const folder = await Folder.findById(dataset.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Edit permission required to add records' });
    }

    const { data } = req.body;
    if (!data || typeof data !== 'object') {
      return res.status(400).json({ success: false, message: 'Record data is required' });
    }

    const lastRec = await DynamicRecord.findOne({ folderId: dataset.folderId }).sort({ rowIndex: -1 });
    const nextRowIndex = (lastRec && typeof lastRec.rowIndex === 'number') ? lastRec.rowIndex + 1 : 0;
    const ownerId = getUserOwnerId(req);

    const record = await DynamicRecord.create({
      companyId: req.user.companyId || null,
      folderId: dataset.folderId,
      datasetId: dataset._id,
      ownerId: ownerId,
      createdBy: ownerId,
      rowIndex: nextRowIndex,
      data
    });

    // Register any new/modified columns into dataset.headers so they appear in table view
    if (dataset.headers && Array.isArray(dataset.headers)) {
      const existingKeys = new Set(dataset.headers.map(h => h.key));
      const headersToAdd = [];
      Object.keys(data).forEach(k => {
        if (!existingKeys.has(k)) {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          headersToAdd.push({ key: k, label, type: 'TEXT' });
          existingKeys.add(k);
        }
      });
      if (headersToAdd.length > 0) {
        dataset.headers.push(...headersToAdd);
      }
    }

    dataset.recordCount = (dataset.recordCount || 0) + 1;
    await dataset.save();

    await logAudit(req, 'RECORD_CREATED', 'DynamicRecord', record._id, `Added new record to dataset '${dataset.fileName}'`);

    res.status(201).json({
      success: true,
      message: 'Record added successfully',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update record data
// @route   PUT /api/records/:recordId
const updateRecord = async (req, res, next) => {
  try {
    const record = await DynamicRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found or access denied' });
    }

    const folder = await Folder.findById(record.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Associated folder not found' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Edit permission required to update records' });
    }

    const { data } = req.body;
    if (data && typeof data === 'object') {
      record.data = { ...record.data, ...data };
      record.markModified('data');

      // Update dataset headers if new columns were introduced
      const dataset = await Dataset.findById(record.datasetId);
      if (dataset && Array.isArray(dataset.headers)) {
        const existingKeys = new Set(dataset.headers.map(h => h.key));
        const headersToAdd = [];
        Object.keys(data).forEach(k => {
          if (!existingKeys.has(k)) {
            const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
            headersToAdd.push({ key: k, label, type: 'TEXT' });
            existingKeys.add(k);
          }
        });
        if (headersToAdd.length > 0) {
          dataset.headers.push(...headersToAdd);
          await dataset.save();
        }
      }
    }

    await record.save();

    await logAudit(req, 'RECORD_UPDATED', 'DynamicRecord', record._id, `Updated record data`);

    res.json({
      success: true,
      message: 'Record updated successfully',
      record
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete single record
// @route   DELETE /api/records/:recordId
const deleteRecord = async (req, res, next) => {
  try {
    const record = await DynamicRecord.findById(req.params.recordId);
    if (!record) {
      return res.status(404).json({ success: false, message: 'Record not found or access denied' });
    }

    const folder = await Folder.findById(record.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Associated folder not found' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Edit/Full access permission required to delete records' });
    }

    const datasetId = record.datasetId;
    await DynamicRecord.deleteOne({ _id: record._id });

    if (datasetId) {
      await Dataset.updateOne({ _id: datasetId }, { $inc: { recordCount: -1 } });
    }

    await logAudit(req, 'RECORD_DELETED', 'DynamicRecord', record._id, `Deleted record`);

    res.json({
      success: true,
      message: 'Record deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Bulk delete records by IDs
// @route   POST /api/folders/:folderId/bulk-delete
const bulkDeleteRecords = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'EDIT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Edit permission required for bulk deletion' });
    }

    const { recordIds } = req.body;
    if (!recordIds || !Array.isArray(recordIds) || recordIds.length === 0) {
      return res.status(400).json({ success: false, message: 'No record IDs provided' });
    }

    const records = await DynamicRecord.find({ _id: { $in: recordIds }, folderId: folder._id }, { datasetId: 1 });
    const datasetCounts = new Map();
    records.forEach(r => {
      const dsId = r.datasetId ? r.datasetId.toString() : '';
      if (dsId) datasetCounts.set(dsId, (datasetCounts.get(dsId) || 0) + 1);
    });

    await DynamicRecord.deleteMany({ _id: { $in: recordIds }, folderId: folder._id });

    for (const [dsId, count] of datasetCounts.entries()) {
      await Dataset.updateOne({ _id: dsId }, { $inc: { recordCount: -count } });
    }

    await logAudit(req, 'BULK_RECORDS_DELETED', 'DynamicRecord', folder._id, `Bulk deleted ${records.length} records in folder '${folder.name}'`);

    res.json({
      success: true,
      message: `Successfully deleted ${records.length} records`
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Export folder or dataset records as Excel or CSV
// @route   GET /api/folders/:folderId/export
const exportFolderData = async (req, res, next) => {
  try {
    const folder = await Folder.findById(req.params.folderId);
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'VIEW_EXPORT');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Export permission required for this folder' });
    }

    const { format = 'xlsx', datasetId, recordIds, search } = req.query;
    const query = { folderId: folder._id };

    if (datasetId && datasetId !== 'all') {
      query.datasetId = datasetId;
    }

    if (recordIds) {
      query._id = { $in: recordIds.split(',') };
    }

    let activeHeaders = [];
    if (datasetId && datasetId !== 'all') {
      const ds = await Dataset.findById(datasetId);
      if (ds) activeHeaders = ds.headers;
    } else {
      const allDatasets = await Dataset.find({ folderId: folder._id });
      const headerMap = new Map();
      allDatasets.forEach(ds => {
        ds.headers.forEach(h => {
          if (!headerMap.has(h.key)) headerMap.set(h.key, h);
        });
      });
      activeHeaders = Array.from(headerMap.values());
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = activeHeaders.map(h => ({ [`data.${h.key}`]: searchRegex }));
      if (searchOr.length > 0) query.$or = searchOr;
    }

    const records = await DynamicRecord.find(query).sort({ createdAt: -1 });

    const buffer = generateExportBuffer(records, activeHeaders, format);

    await logAudit(req, 'DATA_EXPORTED', 'Folder', folder._id, `Exported ${records.length} records from folder '${folder.name}' as ${format.toUpperCase()}`);

    const safeName = folder.name.replace(/[^a-z0-9_-]/gi, '_');
    const ext = format === 'csv' ? 'csv' : 'xlsx';
    const contentType = format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${safeName}_export.${ext}"`);
    return res.send(buffer);
  } catch (error) {
    next(error);
  }
};

// Helper to build Nodemailer Transporter
const buildNodemailerTransporter = (smtp) => {
  const userEmail = smtp.user ? String(smtp.user).trim() : '';
  const targetHost = normalizeSmtpHost(smtp.host, userEmail) || 'smtp.office365.com';
  const portNum = smtp.port ? parseInt(smtp.port, 10) : 587;
  const isSecure = smtp.secure !== undefined ? Boolean(smtp.secure) : (portNum === 465);

  // Require refreshToken for OAuth2 mode so Nodemailer xoauth2 module doesn't fail
  const hasOAuth2 = smtp.authType === 'oauth2' && Boolean(smtp.clientId && (smtp.clientSecret || smtp.pass) && smtp.refreshToken && String(smtp.refreshToken).trim());

  let authObj;
  if (hasOAuth2) {
    const tenant = (smtp.tenantId && String(smtp.tenantId).trim()) ? String(smtp.tenantId).trim() : 'e3dbd6df-1f69-4e05-897a-733622f8e8ad';
    authObj = {
      type: 'OAuth2',
      user: userEmail,
      clientId: String(smtp.clientId).trim(),
      clientSecret: String(smtp.clientSecret || smtp.pass).trim(),
      refreshToken: String(smtp.refreshToken).trim(),
      tokenUrl: `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`
    };
  } else {
    authObj = {
      user: userEmail,
      pass: String(smtp.pass || smtp.clientSecret).trim()
    };
  }

  return {
    targetHost,
    transporter: nodemailer.createTransport({
      host: targetHost,
      port: portNum,
      secure: isSecure,
      auth: authObj,
      tls: {
        rejectUnauthorized: false
      }
    })
  };
};

// @desc    Test SMTP / Outlook Connection credentials
// @route   POST /api/folders/:folderId/test-smtp
const testSmtpConnection = async (req, res, next) => {
  try {
    const smtp = req.body;
    if (!smtp.user) {
      return res.status(400).json({ success: false, message: 'User Email address is required' });
    }

    const { targetHost } = await verifyMailConnection(smtp);

    return res.json({
      success: true,
      message: `Connection verified successfully with ${targetHost}!`,
      normalizedHost: targetHost
    });
  } catch (error) {
    const targetHost = normalizeSmtpHost(req.body.host, req.body.user);
    res.status(400).json({
      success: false,
      message: formatSmtpError(error, targetHost)
    });
  }
};

// @desc    Extract dataset records and send personalized bulk emails via user SMTP
// @route   POST /api/folders/:folderId/send-emails
const sendFolderEmails = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, companyId: req.user.companyId });
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'VIEW');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Access denied to send emails from this folder' });
    }

    const {
      smtpConfig,
      emailField,
      subject = '',
      body = '',
      followUpConfig = null,
      followUpConfigs = [],
      datasetId,
      recordIds,
      search,
      columnFilters
    } = req.body;

    const isOAuth2Mode = smtpConfig.authType === 'oauth2';
    if (!smtpConfig || !smtpConfig.user || (!isOAuth2Mode && !smtpConfig.pass && !smtpConfig.clientSecret)) {
      return res.status(400).json({ success: false, message: 'Complete email configuration is required' });
    }

    if (!emailField) {
      return res.status(400).json({ success: false, message: 'Please select an Email column' });
    }

    // Normalize Follow-ups list (supports single followUpConfig or array followUpConfigs)
    let rawFollowUps = [];
    if (Array.isArray(followUpConfigs) && followUpConfigs.length > 0) {
      rawFollowUps = followUpConfigs;
    } else if (followUpConfig && followUpConfig.enabled) {
      rawFollowUps = [followUpConfig];
    }

    const preparedFollowUps = rawFollowUps.map((item, idx) => {
      let targetDate = null;
      if (item.scheduleTime) {
        targetDate = new Date(item.scheduleTime);
      } else if (item.delayDays) {
        const days = parseFloat(item.delayDays) || 1;
        targetDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      }
      return {
        sequenceNumber: idx + 1,
        subject: item.subject,
        body: item.body,
        scheduledFor: targetDate
      };
    }).filter(item => item.subject && item.body && item.scheduledFor && item.scheduledFor > new Date());

    // Build Query
    const query = {
      folderId: folder._id,
      companyId: req.user.companyId
    };

    if (datasetId && datasetId !== 'all') {
      query.datasetId = datasetId;
    }

    if (Array.isArray(recordIds) && recordIds.length > 0) {
      query._id = { $in: recordIds };
    }

    // Determine Active Headers
    let activeHeaders = [];
    if (datasetId && datasetId !== 'all') {
      const ds = await Dataset.findOne({ _id: datasetId, companyId: req.user.companyId });
      if (ds) activeHeaders = ds.headers;
    } else {
      const allDatasets = await Dataset.find({ folderId: folder._id, companyId: req.user.companyId });
      const headerMap = new Map();
      allDatasets.forEach(ds => {
        ds.headers.forEach(h => {
          if (!headerMap.has(h.key)) headerMap.set(h.key, h);
        });
      });
      activeHeaders = Array.from(headerMap.values());
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = activeHeaders.map(h => ({ [`data.${h.key}`]: searchRegex }));
      if (searchOr.length > 0) query.$or = searchOr;
    }

    if (columnFilters) {
      try {
        const filtersObj = typeof columnFilters === 'string' ? JSON.parse(columnFilters) : columnFilters;
        Object.keys(filtersObj).forEach(key => {
          const val = filtersObj[key];
          if (val && String(val).trim()) {
            query[`data.${key}`] = new RegExp(String(val).trim(), 'i');
          }
        });
      } catch (err) {}
    }

    const records = await DynamicRecord.find(query);
    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records found matching your criteria' });
    }

    // Verify Mail Connection (OAuth2 via Graph API or Password via SMTP)
    let mailConn;
    try {
      mailConn = await verifyMailConnection(smtpConfig);
    } catch (authErr) {
      const targetHost = normalizeSmtpHost(smtpConfig.host, smtpConfig.user);
      return res.status(400).json({
        success: false,
        message: formatSmtpError(authErr, targetHost)
      });
    }

    const { sendMailViaGraph } = require('../services/outlookService');
    const { formatEmailHtml, generateOutlookSignature } = require('../utils/emailFormatter');

    const shouldIncludeSig = req.body.includeSignature !== undefined
      ? Boolean(req.body.includeSignature)
      : (smtpConfig.includeSignature !== undefined ? Boolean(smtpConfig.includeSignature) : (req.user.smtpConfig?.includeSignature !== undefined ? Boolean(req.user.smtpConfig.includeSignature) : true));

    let effectiveSignature = (req.body.signature || smtpConfig.signature || req.user.smtpConfig?.signature || '').trim();
    if (shouldIncludeSig && !effectiveSignature) {
      effectiveSignature = generateOutlookSignature({
        displayName: smtpConfig.fromName || req.user.name || '',
        jobTitle: smtpConfig.jobTitle || req.user.smtpConfig?.jobTitle || '',
        companyName: smtpConfig.companyName || req.user.smtpConfig?.companyName || '',
        email: smtpConfig.user || req.user.email || '',
        phone: smtpConfig.phone || req.user.smtpConfig?.phone || '',
        website: smtpConfig.website || req.user.smtpConfig?.website || ''
      });
    }

    // Helper function to substitute variables
    const interpolate = (text, dataObj) => {
      if (!text) return '';
      let result = text;
      activeHeaders.forEach(h => {
        const val = dataObj[h.key] !== undefined && dataObj[h.key] !== null ? String(dataObj[h.key]) : '';
        const keyRegex = new RegExp(`\\{\\{\\s*${h.key.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\s*\\}\\}`, 'gi');
        const labelRegex = new RegExp(`\\{\\{\\s*${h.label.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}\\s*\\}\\}`, 'gi');
        result = result.replace(keyRegex, val).replace(labelRegex, val);
      });
      result = result.replace(/\{\{\s*([a-zA-Z0-9_\-\s]+)\s*\}\}/g, (match, p1) => {
        const cleanKey = p1.trim();
        return dataObj[cleanKey] !== undefined && dataObj[cleanKey] !== null ? String(dataObj[cleanKey]) : match;
      });
      return result;
    };

    let totalSent = 0;
    let totalFailed = 0;
    let totalFollowUpsScheduled = 0;
    const failedRecipients = [];

    const fromAddress = smtpConfig.fromName
      ? `"${smtpConfig.fromName}" <${smtpConfig.user}>`
      : smtpConfig.user;

    const userEmail = smtpConfig.user ? String(smtpConfig.user).trim() : '';
    const targetHost = mailConn.targetHost || normalizeSmtpHost(smtpConfig.host, userEmail) || 'smtp.office365.com';
    const portNum = smtpConfig.port ? parseInt(smtpConfig.port, 10) : 587;
    const isSecure = smtpConfig.secure !== undefined ? Boolean(smtpConfig.secure) : (portNum === 465);

    for (let idx = 0; idx < records.length; idx++) {
      const rec = records[idx];
      const dataObj = rec.data || {};
      const recipientEmail = dataObj[emailField] ? String(dataObj[emailField]).trim() : '';

      if (!recipientEmail || !recipientEmail.includes('@')) {
        totalFailed++;
        failedRecipients.push({ email: recipientEmail || 'Empty Email', reason: 'Invalid or missing email address' });
        continue;
      }

      // Anti-Spam Throttling Delay: 5 to 10 seconds random pause between sending each email
      if (idx > 0) {
        const randomDelay = Math.floor(Math.random() * 5000) + 5000; // 5000ms to 10000ms
        await new Promise(resolve => setTimeout(resolve, randomDelay));
      }

      const personalizedSubject = interpolate(subject, dataObj);
      const rawPersonalizedBody = interpolate(body, dataObj);
      const formattedHtmlBody = formatEmailHtml(rawPersonalizedBody, effectiveSignature, shouldIncludeSig);

      try {
        if (mailConn.isOAuth2) {
          await sendMailViaGraph({
            accessToken: mailConn.accessToken,
            to: recipientEmail,
            subject: personalizedSubject || 'Update from CRM',
            body: formattedHtmlBody,
            fromName: smtpConfig.fromName
          });
        } else {
          await mailConn.transporter.sendMail({
            from: fromAddress,
            to: recipientEmail,
            subject: personalizedSubject || 'Update from CRM',
            html: formattedHtmlBody
          });
        }
        totalSent++;

        // Store into unified Email collection in SENT folder
        try {
          await Email.create({
            companyId: req.user.companyId,
            userId: req.user._id,
            folder: 'SENT',
            from: { name: smtpConfig.fromName || req.user.name || '', email: smtpConfig.user },
            to: [{ name: dataObj.name || dataObj.companyName || '', email: recipientEmail }],
            subject: personalizedSubject || 'Update from CRM',
            body: formattedHtmlBody,
            plainText: (rawPersonalizedBody || '').replace(/<[^>]*>?/gm, ' ').trim(),
            direction: 'OUTGOING',
            status: 'SENT',
            sentAt: new Date(),
            crmFolderId: folder._id,
            threadId: `th_folder_${folder._id}_${Date.now()}_${idx}`,
            smtpProvider: mailConn.isOAuth2 ? 'Microsoft Outlook' : 'SMTP Server'
          });
        } catch (emErr) {
          // Non-blocking
        }

        // Queue all prepared Follow-Up Email steps for this recipient
        for (const fuStep of preparedFollowUps) {
          try {
            await ScheduledEmail.create({
              companyId: req.user.companyId,
              folderId: folder._id,
              datasetId: rec.datasetId,
              userId: req.user._id,
              recipientEmail,
              recipientData: dataObj,
              type: 'FOLLOW_UP',
              sequenceNumber: fuStep.sequenceNumber,
              subject: fuStep.subject,
              body: fuStep.body,
              emailField,
              smtpConfig: {
                host: targetHost,
                port: portNum,
                secure: isSecure,
                user: smtpConfig.user,
                pass: smtpConfig.pass,
                fromName: smtpConfig.fromName || '',
                signature: effectiveSignature,
                includeSignature: shouldIncludeSig,
                authType: smtpConfig.authType || 'password',
                clientId: smtpConfig.clientId || '',
                clientSecret: smtpConfig.clientSecret || '',
                tenantId: smtpConfig.tenantId || '',
                refreshToken: smtpConfig.refreshToken || ''
              },
              scheduledFor: fuStep.scheduledFor,
              status: 'PENDING'
            });
            totalFollowUpsScheduled++;
          } catch (schedErr) {
            console.warn(`[Follow-Up Queue Warning] Recipient ${recipientEmail}:`, schedErr.message);
          }
        }

      } catch (sendErr) {
        totalFailed++;
        failedRecipients.push({ email: recipientEmail, reason: sendErr.message || 'SMTP Send Failed' });
      }
    }

    await logAudit(req, 'EMAILS_SENT', 'Folder', folder._id, `Sent ${totalSent} emails (${totalFailed} failed, ${totalFollowUpsScheduled} follow-ups scheduled) with anti-spam 5-10s delay`);

    let msg = `Emails sent with anti-spam delay! ${totalSent} delivered, ${totalFailed} failed.`;
    if (totalFollowUpsScheduled > 0) {
      msg += ` ${totalFollowUpsScheduled} Follow-up email(s) queued across ${preparedFollowUps.length} follow-up step(s).`;
    }

    res.json({
      success: true,
      message: msg,
      totalSent,
      totalFailed,
      totalFollowUpsScheduled,
      failedRecipients
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get scheduled follow-up emails for folder
// @route   GET /api/folders/:folderId/scheduled-emails
const getScheduledEmails = async (req, res, next) => {
  try {
    const scheduled = await ScheduledEmail.find({
      folderId: req.params.folderId,
      companyId: req.user.companyId
    }).sort({ scheduledFor: 1 });

    res.json({
      success: true,
      scheduled
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Extract dataset records and send personalized bulk WhatsApp messages
// @route   POST /api/folders/:folderId/send-whatsapp
const sendFolderWhatsApp = async (req, res, next) => {
  try {
    const folder = await Folder.findOne({ _id: req.params.folderId, companyId: req.user.companyId });
    if (!folder) {
      return res.status(404).json({ success: false, message: 'Folder not found or access denied' });
    }

    const access = await evaluateFolderAccess(req.user, folder, 'VIEW');
    if (!access.allowed) {
      return res.status(403).json({ success: false, message: 'Access denied to send WhatsApp messages from this folder' });
    }

    const {
      phoneField,
      nameField,
      messageTemplate,
      templates,
      mediaBase64,
      mediaMimeType,
      mediaFileName,
      mediaUrl,
      minDelaySeconds = 1.0,
      maxDelaySeconds = 5.0,
      randomizeTemplates = true,
      datasetId,
      recordIds,
      search,
      columnFilters,
      delayMs = 2500,
      defaultCountryCode = '91'
    } = req.body;

    const status = whatsappService.getStatus(req.user._id);
    if (!status.isConnected) {
      return res.status(400).json({
        success: false,
        message: 'WhatsApp Web is not connected. Please go to WhatsApp in the sidebar and scan the QR code first.'
      });
    }

    if (!phoneField) {
      return res.status(400).json({ success: false, message: 'Please select a Phone Number column' });
    }

    const hasMedia = Boolean((mediaBase64 && mediaMimeType) || mediaUrl);
    const allTemplates = Array.isArray(templates) && templates.length > 0
      ? templates.filter(t => t && t.trim())
      : (messageTemplate && messageTemplate.trim() ? [messageTemplate.trim()] : []);

    if (!hasMedia && allTemplates.length === 0) {
      return res.status(400).json({ success: false, message: 'Please enter at least one message template or attach an image' });
    }

    // Build Query
    const query = {
      folderId: folder._id,
      companyId: req.user.companyId
    };

    if (datasetId && datasetId !== 'all') {
      query.datasetId = datasetId;
    }

    if (Array.isArray(recordIds) && recordIds.length > 0) {
      query._id = { $in: recordIds };
    }

    // Determine Active Headers
    let activeHeaders = [];
    if (datasetId && datasetId !== 'all') {
      const ds = await Dataset.findOne({ _id: datasetId, companyId: req.user.companyId });
      if (ds) activeHeaders = ds.headers;
    } else {
      const allDatasets = await Dataset.find({ folderId: folder._id, companyId: req.user.companyId });
      const headerMap = new Map();
      allDatasets.forEach(ds => {
        ds.headers.forEach(h => {
          if (!headerMap.has(h.key)) headerMap.set(h.key, h);
        });
      });
      activeHeaders = Array.from(headerMap.values());
    }

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      const searchOr = activeHeaders.map(h => ({ [`data.${h.key}`]: searchRegex }));
      if (searchOr.length > 0) query.$or = searchOr;
    }

    if (columnFilters) {
      try {
        const filtersObj = typeof columnFilters === 'string' ? JSON.parse(columnFilters) : columnFilters;
        Object.keys(filtersObj).forEach(key => {
          const val = filtersObj[key];
          if (val && String(val).trim()) {
            query[`data.${key}`] = new RegExp(String(val).trim(), 'i');
          }
        });
      } catch (err) {}
    }

    const records = await DynamicRecord.find(query);
    if (records.length === 0) {
      return res.status(400).json({ success: false, message: 'No records found matching your criteria' });
    }

    const recipients = [];
    const seenPhones = new Set();

    for (const rec of records) {
      const rawPhone = rec.data?.[phoneField];
      if (!rawPhone || !String(rawPhone).trim()) continue;

      const cleanPhone = whatsappService.cleanPhoneNumber(rawPhone, defaultCountryCode);
      if (!cleanPhone || seenPhones.has(cleanPhone)) continue;
      seenPhones.add(cleanPhone);

      const name = nameField ? (rec.data?.[nameField] || '') : (rec.data?.name || rec.data?.Name || '');
      const company = rec.data?.company || rec.data?.Company || rec.data?.companyName || '';

      recipients.push({
        name: String(name).trim(),
        phone: String(rawPhone).trim(),
        company: String(company).trim(),
        customFields: rec.data || {},
        status: 'PENDING'
      });
    }

    if (recipients.length === 0) {
      return res.status(400).json({
        success: false,
        message: `No valid phone numbers found under the "${phoneField}" column in the selected records.`
      });
    }

    // Create Campaign
    const campaign = new WhatsAppCampaign({
      title: `Excel Broadcast - ${folder.name} (${new Date().toLocaleDateString()})`,
      messageTemplate: allTemplates[0] || '',
      templates: allTemplates,
      randomizeTemplates: Boolean(randomizeTemplates),
      speedPreset: req.body.speedPreset || 'safe_human',
      strictHourlyLimit: req.body.strictHourlyLimit !== undefined ? Boolean(req.body.strictHourlyLimit) : true,
      hourlyLimit: Math.max(1, Number(req.body.hourlyLimit) || 15),
      nonRepeatingDelays: req.body.nonRepeatingDelays !== undefined ? Boolean(req.body.nonRepeatingDelays) : true,
      typingSimulation: req.body.typingSimulation !== undefined ? Boolean(req.body.typingSimulation) : true,
      minDelaySeconds: Math.max(0.5, Number(minDelaySeconds) || 15.0),
      maxDelaySeconds: Math.max(1.0, Number(maxDelaySeconds) || 45.0),
      batchSize: Math.max(1, Number(req.body.batchSize) || 10),
      batchCooldownSeconds: Math.max(5, Number(req.body.batchCooldownSeconds) || 60),
      spintaxEnabled: req.body.spintaxEnabled !== undefined ? Boolean(req.body.spintaxEnabled) : true,
      paceAcrossHour: req.body.paceAcrossHour !== undefined ? Boolean(req.body.paceAcrossHour) : true,
      mediaBase64: mediaBase64 || '',
      mediaMimeType: mediaMimeType || '',
      mediaFileName: mediaFileName || '',
      mediaUrl: mediaUrl || '',
      totalRecipients: recipients.length,
      recipients,
      sentBy: req.user._id,
      status: 'DRAFT'
    });

    await campaign.save();

    // Trigger async bulk campaign
    whatsappService.startBulkCampaign({
      campaignId: campaign._id,
      userId: req.user._id,
      defaultCountryCode,
      delayMs: Math.max(1000, Number(delayMs) || 2500)
    }).catch(err => {
      console.error('Error in folder WhatsApp campaign launch:', err);
    });

    return res.json({
      success: true,
      message: `WhatsApp broadcast initiated to ${recipients.length} recipients!`,
      campaignId: campaign._id,
      totalRecipients: recipients.length
    });
  } catch (error) {
    console.error('sendFolderWhatsApp error:', error);
    next(error);
  }
};

// @desc    Generate personalized AI Email & Follow-Up sequence using Gemini or DeepSeek AI
// @route   POST /api/folders/:folderId/generate-ai-email OR POST /api/folders/generate-ai-email
const generateAIEmailSequence = async (req, res, next) => {
  try {
    const {
      apiKey: customApiKey,
      model: reqModel,
      provider: reqProvider,
      customBaseUrl,
      goal,
      tone,
      offerDescription,
      customPrompt,
      headers: reqHeaders = [],
      followUpCount = 2
    } = req.body;

    const user = await User.findById(req.user._id);
    const activeProvider = reqProvider || (reqModel?.startsWith('gemini') ? 'gemini' : (user?.activeAiProvider || (user?.geminiApiKey ? 'gemini' : 'deepseek')));
    
    const geminiKey = customApiKey || user?.geminiApiKey || process.env.GEMINI_API_KEY || '';
    const deepseekKey = customApiKey || user?.deepseekApiKey || process.env.DEEPSEEK_API_KEY || '';

    let headersToUse = Array.isArray(reqHeaders) && reqHeaders.length > 0 ? reqHeaders : [];

    // If folderId is provided and headers were not explicitly sent, query dataset headers
    if (req.params.folderId && headersToUse.length === 0) {
      try {
        const folder = await Folder.findOne({ _id: req.params.folderId, companyId: req.user.companyId });
        if (folder) {
          const allDatasets = await Dataset.find({ folderId: folder._id, companyId: req.user.companyId });
          const headerMap = new Map();
          allDatasets.forEach(ds => {
            (ds.headers || []).forEach(h => {
              if (h && h.key && !headerMap.has(h.key)) headerMap.set(h.key, h);
            });
          });
          headersToUse = Array.from(headerMap.values());
        }
      } catch (fErr) {
        // Fallback to default headers
      }
    }

    if (activeProvider === 'gemini' && geminiKey) {
      const { generateEmailSequenceWithGemini } = require('../services/geminiService');
      const model = reqModel || user?.geminiModel || 'gemini-2.5-flash';
      const result = await generateEmailSequenceWithGemini({
        apiKey: geminiKey,
        model,
        goal,
        tone,
        offerDescription,
        customPrompt,
        headers: headersToUse,
        followUpCount
      });

      return res.json({
        success: true,
        message: 'AI sequence generated successfully with Google Gemini',
        initialEmail: result.initialEmail,
        followUps: result.followUps,
        modelUsed: model,
        provider: 'gemini'
      });
    }

    if (!deepseekKey) {
      return res.status(400).json({
        success: false,
        message: 'No active AI key found. Please configure Google Gemini or DeepSeek in Settings.'
      });
    }

    const { generateEmailSequenceWithDeepSeek } = require('../services/deepseekService');
    const model = reqModel || user?.deepseekModel || 'deepseek-ai/deepseek-v4-pro-0813';
    const result = await generateEmailSequenceWithDeepSeek({
      apiKey: deepseekKey,
      model,
      customBaseUrl,
      goal,
      tone,
      offerDescription,
      customPrompt,
      headers: headersToUse,
      followUpCount
    });

    return res.json({
      success: true,
      message: 'AI sequence generated successfully with DeepSeek',
      initialEmail: result.initialEmail,
      followUps: result.followUps,
      modelUsed: result.modelUsed || model,
      provider: 'deepseek'
    });
  } catch (error) {
    console.error('generateAIEmailSequence error:', error.message);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to generate AI email sequence.'
    });
  }
};

module.exports = {
  createFolder,
  getFolders,
  getFolderById,
  updateFolder,
  deleteFolder,
  parseExcelForImport,
  importDataset,
  getFolderRecords,
  createRecord,
  updateRecord,
  deleteRecord,
  bulkDeleteRecords,
  exportFolderData,
  testSmtpConnection,
  sendFolderEmails,
  sendFolderWhatsApp,
  getScheduledEmails,
  generateAIEmailSequence
};

