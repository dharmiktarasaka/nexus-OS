import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../models/User.js';

async function main() {
  const email = process.argv[2] || 'admin@mediamation.com';
  const password = process.argv[3] || 'admin123';
  const name = process.argv[4] || 'System Admin';

  if (!process.env.MONGODB_URI) {
    console.error('Error: MONGODB_URI env variable is missing.');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Database connected successfully.');

    let user = await User.findOne({ email });
    if (user) {
      user.role = 'admin';
      user.isSuspended = false;
      user.suspendedUntil = null;
      user.suspendReason = '';
      if (process.argv[3]) {
        user.password = password; // triggers pre-save hashing
      }
      await user.save();
      console.log(`Successfully promoted existing user to ADMIN: ${email}`);
    } else {
      user = await User.create({
        name,
        email,
        password,
        role: 'admin'
      });
      console.log(`Successfully created new ADMIN user:`);
      console.log(`Email: ${email}`);
      console.log(`Password: ${password}`);
    }
  } catch (err) {
    console.error('Failed to create admin user:', err.message);
  } finally {
    await mongoose.disconnect();
  }
}

main();
