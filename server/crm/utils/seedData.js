const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const TenantCompany = require('../models/TenantCompany');
const User = require('../models/User');
const Folder = require('../models/Folder');
const Dataset = require('../models/Dataset');
const DynamicRecord = require('../models/DynamicRecord');
const FolderPermission = require('../models/FolderPermission');
const Lead = require('../models/Lead');
const Company = require('../models/Company');
const Activity = require('../models/Activity');
const Task = require('../models/Task');
const FollowUp = require('../models/FollowUp');
const connectDB = require('../config/db');

const seedData = async () => {
  try {
    await connectDB();

    console.log('Seeding initial RBAC multi-tenant company accounts...');

    // Clear all existing data for fresh seed
    await TenantCompany.deleteMany({});
    await User.deleteMany({});
    await Folder.deleteMany({});
    await Dataset.deleteMany({});
    await DynamicRecord.deleteMany({});
    await FolderPermission.deleteMany({});
    await Lead.deleteMany({});
    await Company.deleteMany({});
    await Activity.deleteMany({});
    await Task.deleteMany({});
    await FollowUp.deleteMany({});

    // Create Main Tenant Company
    const company = await TenantCompany.create({
      name: 'LeadFlow CRM Corporate'
    });

    // Create Boss / Owner Admin
    const owner = await User.create({
      companyId: company._id,
      name: 'Company Boss',
      email: 'admin@crm.com',
      password: 'tarasaka$admin2028',
      role: 'ADMIN',
      isActive: true
    });

    company.ownerId = owner._id;
    await company.save();

    // Create Manager Account
    const manager = await User.create({
      companyId: company._id,
      name: 'Rajesh Manager',
      email: 'manager@crm.com',
      password: 'Manager@123',
      role: 'MANAGER',
      isActive: true
    });

    // Create Employee A Account
    const employeeA = await User.create({
      companyId: company._id,
      name: 'Dharmik Rathod',
      email: 'dharmik@crm.com',
      password: 'tarasaka$dharmik2028',
      role: 'EMPLOYEE',
      isActive: true
    });

    // Create Employee B Account
    const employeeB = await User.create({
      companyId: company._id,
      name: 'Dhruvil Patel',
      email: 'dhruvil@crm.com',
      password: 'tarasaka$dhruvil2028',
      role: 'EMPLOYEE',
      isActive: true
    });

    // Create BDE Account
    const bde = await User.create({
      companyId: company._id,
      name: 'Samkav',
      email: 'samkav@crm.com',
      password: 'tarasaka$samkav2028',
      role: 'EMPLOYEE',
      isActive: true
    });

    // Create a Sample Private Folder for Employee A
    const folderA = await Folder.create({
      companyId: company._id,
      name: 'Google Ads Leads (Private)',
      description: 'Employee A Private Folder',
      color: '#3B82F6',
      ownerId: employeeA._id,
      createdBy: employeeA._id
    });

    // Share Folder A with Samkav for EDIT (Upload + Add + Edit) access
    await FolderPermission.create({
      companyId: company._id,
      folderId: folderA._id,
      userId: bde._id,
      grantedBy: employeeA._id,
      accessLevel: 'EDIT'
    });

    console.log('✅ Multi-Tenant RBAC Database Seeding Complete!');
    console.log('   Company: LeadFlow CRM Corporate');
    console.log('   1. Owner / Admin: admin@crm.com / tarasaka$admin2028');
    console.log('   2. Manager:       manager@crm.com / Manager@123');
    console.log('   3. Employee A:    dharmik@crm.com / tarasaka$dharmik2028');
    console.log('   4. Employee B:    dhruvil@crm.com / tarasaka$dhruvil2028');
    console.log('   5. BDE:           samkav@crm.com / tarasaka$samkav2028');


    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
