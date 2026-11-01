const User = require('../models/User');

const autoSeedIfEmpty = async () => {
  try {
    const userCount = await User.countDocuments({});
    if (userCount > 0) {
      return;
    }

    console.log('Database initialized. Creating default Admin & Sales user accounts...');

    await User.create({
      name: 'Admin Manager',
      email: 'admin@crm.com',
      password: 'tarasaka$admin2028',
      role: 'ADMIN',
      isActive: true
    });

    await User.create({
      name: 'Dharmik Patel',
      email: 'dharmik@crm.com',
      password: 'tarasaka$dharmik2028',
      role: 'SALES',
      isActive: true
    });

    console.log('✅ Default User Accounts Created (Zero Dummy Leads/Data):');
    console.log('   Admin: admin@crm.com / tarasaka$admin2028');
    console.log('   Sales: dharmik@crm.com / tarasaka$dharmik2028');
  } catch (error) {
    console.error('Error initializing user accounts:', error.message);
  }
};

module.exports = { autoSeedIfEmpty };
