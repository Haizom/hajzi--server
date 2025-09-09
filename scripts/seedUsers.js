import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

// ES6 module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Import models
import User from '../src/models/User.js';

// Users data with credentials
const usersData = [
  // Super Admin
  {
    fullName: 'أحمد محمد علي',
    fullNameEn: 'Ahmed Mohammed Ali',
    email: 'superadmin@hajzi.com',
    phone: '+967711234567',
    password: 'SuperAdmin123!',
    role: 'super_admin',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=SA',
    address: 'صنعاء، اليمن',
    addressEn: 'Sanaa, Yemen',
    dateOfBirth: '1985-03-15',
    gender: 'male',
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    }
  },
  
  // City Admin - Sanaa
  {
    fullName: 'فاطمة أحمد حسن',
    fullNameEn: 'Fatima Ahmed Hassan',
    email: 'sanaa.admin@hajzi.com',
    phone: '+967722345678',
    password: 'SanaaAdmin123!',
    role: 'city_admin',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=CA',
    address: 'صنعاء، اليمن',
    addressEn: 'Sanaa, Yemen',
    dateOfBirth: '1990-07-22',
    gender: 'female',
    cityId: null, // Will be set after cities are seeded
    permissions: ['hotel_approval', 'user_management', 'content_moderation'],
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  
  // City Admin - Aden
  {
    fullName: 'محمد علي سالم',
    fullNameEn: 'Mohammed Ali Salem',
    email: 'aden.admin@hajzi.com',
    phone: '+967733456789',
    password: 'AdenAdmin123!',
    role: 'city_admin',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=CA',
    address: 'عدن، اليمن',
    addressEn: 'Aden, Yemen',
    dateOfBirth: '1988-11-08',
    gender: 'male',
    cityId: null, // Will be set after cities are seeded
    permissions: ['hotel_approval', 'user_management', 'content_moderation'],
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    }
  },
  
  // Hotel Owner - Sanaa
  {
    fullName: 'علي محمد عبدالله',
    fullNameEn: 'Ali Mohammed Abdullah',
    email: 'sanaa.owner@hajzi.com',
    phone: '+967744567890',
    password: 'SanaaOwner123!',
    role: 'owner',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=HO',
    address: 'صنعاء، اليمن',
    addressEn: 'Sanaa, Yemen',
    dateOfBirth: '1982-05-12',
    gender: 'male',
    cityId: null, // Will be set after cities are seeded
    businessInfo: {
      businessName: 'فنادق صنعاء المتميزة',
      businessNameEn: 'Sanaa Premium Hotels',
      businessType: 'hotel_chain',
      businessLicense: 'SN-2024-001',
      taxNumber: 'TAX-2024-001'
    },
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: true,
        push: true
      }
    }
  },
  
  // Hotel Owner - Aden
  {
    fullName: 'سارة أحمد محمد',
    fullNameEn: 'Sara Ahmed Mohammed',
    email: 'aden.owner@hajzi.com',
    phone: '+967755678901',
    password: 'AdenOwner123!',
    role: 'owner',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=HO',
    address: 'عدن، اليمن',
    addressEn: 'Aden, Yemen',
    dateOfBirth: '1987-09-18',
    gender: 'female',
    cityId: null, // Will be set after cities are seeded
    businessInfo: {
      businessName: 'فنادق عدن السياحية',
      businessNameEn: 'Aden Tourist Hotels',
      businessType: 'hotel_chain',
      businessLicense: 'AD-2024-001',
      taxNumber: 'TAX-2024-002'
    },
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  
  // Hotel Owner - Taiz
  {
    fullName: 'يوسف محمد علي',
    fullNameEn: 'Yousef Mohammed Ali',
    email: 'taiz.owner@hajzi.com',
    phone: '+967766789012',
    password: 'TaizOwner123!',
    role: 'owner',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=HO',
    address: 'تعز، اليمن',
    addressEn: 'Taiz, Yemen',
    dateOfBirth: '1985-12-03',
    gender: 'male',
    cityId: null, // Will be set after cities are seeded
    businessInfo: {
      businessName: 'فنادق تعز الجبلية',
      businessNameEn: 'Taiz Mountain Hotels',
      businessType: 'hotel_chain',
      businessLicense: 'TZ-2024-001',
      taxNumber: 'TAX-2024-003'
    },
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    }
  },
  
  // Regular Users
  {
    fullName: 'أحمد علي حسن',
    fullNameEn: 'Ahmed Ali Hassan',
    email: 'user1@hajzi.com',
    phone: '+967777890123',
    password: 'User123!',
    role: 'user',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=U1',
    address: 'صنعاء، اليمن',
    addressEn: 'Sanaa, Yemen',
    dateOfBirth: '1995-04-25',
    gender: 'male',
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: false,
        push: true
      }
    }
  },
  {
    fullName: 'فاطمة محمد أحمد',
    fullNameEn: 'Fatima Mohammed Ahmed',
    email: 'user2@hajzi.com',
    phone: '+967788901234',
    password: 'User123!',
    role: 'user',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=U2',
    address: 'عدن، اليمن',
    addressEn: 'Aden, Yemen',
    dateOfBirth: '1992-08-14',
    gender: 'female',
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: false,
        sms: true,
        push: true
      }
    }
  },
  {
    fullName: 'محمد يوسف علي',
    fullNameEn: 'Mohammed Yousef Ali',
    email: 'user3@hajzi.com',
    phone: '+967799012345',
    password: 'User123!',
    role: 'user',
    isVerified: true,
    isActive: true,
    profileImage: 'https://via.placeholder.com/150x150?text=U3',
    address: 'تعز، اليمن',
    addressEn: 'Taiz, Yemen',
    dateOfBirth: '1990-01-30',
    gender: 'male',
    preferences: {
      language: 'ar',
      currency: 'YER',
      notifications: {
        email: true,
        sms: true,
        push: false
      }
    }
  }
];

async function seedUsers() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing users
    await User.deleteMany({});
    console.log('🗑️  Cleared existing users');

    // Hash passwords and insert users
    const hashedUsers = await Promise.all(
      usersData.map(async (user) => {
        const hashedPassword = await bcrypt.hash(user.password, 12);
        return {
          ...user,
          password: hashedPassword
        };
      })
    );

    // Insert new users
    const users = await User.insertMany(hashedUsers);
    console.log(`✅ Successfully seeded ${users.length} users`);

    // Display seeded users with credentials
    console.log('\n📋 Seeded Users with Credentials:');
    console.log('\n🔑 Super Admin:');
    console.log(`  Email: superadmin@hajzi.com`);
    console.log(`  Password: SuperAdmin123!`);
    
    console.log('\n🏙️ City Admins:');
    console.log(`  Sanaa: sanaa.admin@hajzi.com / SanaaAdmin123!`);
    console.log(`  Aden: aden.admin@hajzi.com / AdenAdmin123!`);
    
    console.log('\n🏨 Hotel Owners:');
    console.log(`  Sanaa: sanaa.owner@hajzi.com / SanaaOwner123!`);
    console.log(`  Aden: aden.owner@hajzi.com / AdenOwner123!`);
    console.log(`  Taiz: taiz.owner@hajzi.com / TaizOwner123!`);
    
    console.log('\n👤 Regular Users:');
    console.log(`  User 1: user1@hajzi.com / User123!`);
    console.log(`  User 2: user2@hajzi.com / User123!`);
    console.log(`  User 3: user3@hajzi.com / User123!`);

    console.log('\n🎉 Users seeding completed successfully!');
    console.log('\n⚠️  IMPORTANT: Update cityId fields after seeding cities!');
  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedUsers();
