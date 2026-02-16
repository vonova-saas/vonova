#!/usr/bin/env ts-node

/**
 * Script to create owner users
 * Usage: npm run create:admins
 *        or: npx ts-node -r tsconfig-paths/register scripts/create-admin-users.ts
 * 
 * This script reads owner user data from environment variables in .env file.
 * Required environment variables:
 * - ADMIN_USER_1_NAME, ADMIN_USER_1_EMAIL, ADMIN_USER_1_PASSWORD
 * - ADMIN_USER_2_NAME, ADMIN_USER_2_EMAIL, ADMIN_USER_2_PASSWORD
 * - ADMIN_USER_3_NAME, ADMIN_USER_3_EMAIL, ADMIN_USER_3_PASSWORD
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import mongoose from 'mongoose';

// Load environment variables
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const mongoUri: string = process.env.MONGO_URI_REMOTE || process.env.MONGO_URI_RMOTE || '';
if (!mongoUri) {
  console.error('ERROR: MONGO_URI_REMOTE (or MONGO_URI_RMOTE) environment variable is not set');
  process.exit(1);
}

// Read admin users from environment variables
interface AdminUser {
  name: string;
  email: string;
  password: string;
}

function getAdminUsers(): AdminUser[] {
  const adminUsers: AdminUser[] = [];

  for (let i = 1; i <= 3; i++) {
    const name = process.env[`ADMIN_USER_${i}_NAME`];
    const email = process.env[`ADMIN_USER_${i}_EMAIL`];
    const password = process.env[`ADMIN_USER_${i}_PASSWORD`];

    if (name && email && password) {
      adminUsers.push({ name, email, password });
    } else {
      console.warn(`Warning: Owner user ${i} is missing required fields (NAME, EMAIL, or PASSWORD)`);
    }
  }

  if (adminUsers.length === 0) {
    console.error('ERROR: No owner users found in environment variables.');
    console.error('Please set ADMIN_USER_1_NAME, ADMIN_USER_1_EMAIL, ADMIN_USER_1_PASSWORD, etc. in your .env file');
    process.exit(1);
  }

  return adminUsers;
}

const adminUsers = getAdminUsers();

// User Schema (simplified for script)
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  password: { type: String, required: true },
  profilePicture: { type: String, default: null },
  role: { type: String, enum: ['PENDING', 'STUDENT_USER', 'INSTRUCTORS_USER', 'OWNER'], required: true },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: null },
}, { timestamps: true });

// Account Schema
const AccountSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  provider: { type: String, required: true },
  providerId: { type: String, required: true },
}, { timestamps: true });

const User: any = mongoose.models.User || mongoose.model('User', UserSchema);
const Account: any = mongoose.models.Account || mongoose.model('Account', AccountSchema);

async function hashPassword(password: string): Promise<string> {
  const bcrypt = require('bcrypt');
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

async function createAdminUsers() {
  try {
    if (!mongoUri) {
      console.error('ERROR: MONGO_URI_RMOTE environment variable is not set');
      process.exit(1);
    }

    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri!); // Non-null assertion - we checked above
    console.log('Connected to MongoDB\n');

    for (const adminData of adminUsers) {
      try {
        // Check if user already exists
        const existingUser = await User.findOne({ email: adminData.email.toLowerCase() }).exec();

        if (existingUser) {
          // Update existing user to owner if not already
          if (existingUser.role !== 'OWNER') {
            existingUser.role = 'OWNER';
            existingUser.isVerified = true;
            existingUser.isActive = true;
            await existingUser.save();
            console.log(`Updated user: ${adminData.name} (${adminData.email}) - Role set to OWNER`);
          } else {
            console.log(`User already exists as OWNER: ${adminData.name} (${adminData.email})`);
          }
          continue;
        }

        // Hash password
        const hashedPassword = await hashPassword(adminData.password);

        // Create user
        const user = new User({
          name: adminData.name,
          email: adminData.email.toLowerCase(),
          password: hashedPassword,
          role: 'OWNER',
          isVerified: true,
          isActive: true,
        });

        await user.save();
        console.log(`Created owner user: ${adminData.name} (${adminData.email})`);

        // Create account
        const account = new Account({
          userId: user._id,
          provider: 'EMAIL',
          providerId: adminData.email.toLowerCase(),
        });

        await account.save();
        console.log(`  Created account for: ${adminData.name}\n`);

      } catch (error: any) {
        if (error.code === 11000) {
          console.log(`User already exists: ${adminData.name} (${adminData.email})`);
        } else {
          console.error(`Error creating user ${adminData.name}:`, error.message);
        }
      }
    }

    console.log('\nOwner users creation completed!');
    console.log('Please change the passwords after first login!\n');

  } catch (error: any) {
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the script
createAdminUsers();

