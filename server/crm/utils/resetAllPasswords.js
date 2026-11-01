const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('../config/db');
const User = require('../models/User');

const resetAllPasswords = async () => {
  try {
    await connectDB();
    const defaultPassword = process.argv[2] || '123456';

    const users = await User.find({});
    console.log(`Found ${users.length} users in database. Resetting all passwords to: "${defaultPassword}"...`);

    for (const user of users) {
      user.password = defaultPassword;
      await user.save();
      console.log(` - Updated password for: ${user.name} (${user.email}) -> ${defaultPassword}`);
    }

    console.log(`\n✅ All ${users.length} user passwords have been successfully reset to "${defaultPassword}".`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting user passwords:', error);
    process.exit(1);
  }
};

resetAllPasswords();
