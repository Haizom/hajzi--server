import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const createSuperAdmin = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    // Check if super admin already exists
    const existingSuperAdmin = await User.findOne({ role: 'super_admin' });
    if (existingSuperAdmin) {
      console.log('❌ Super admin already exists!');
      console.log(`📧 Email: ${existingSuperAdmin.email}`);
      console.log(`👤 Name: ${existingSuperAdmin.fullName}`);
      process.exit(1);
    }
    
    // Super admin credentials
    const superAdminData = {
      fullName: 'Super Administrator',
      email: 'admin@hajzi.com',
      phone: '967771234567',
      whatsappNumber: '967771234567',
      passwordHash: 'SuperAdmin123!', // This will be hashed automatically
      role: 'super_admin',
      status: 'active'
    };
    
    console.log('👑 Creating super admin...');
    const superAdmin = await User.create(superAdminData);
    
    console.log('✅ Super admin created successfully!');
    console.log('📧 Email:', superAdmin.email);
    console.log('👤 Name:', superAdmin.fullName);
    console.log('📱 Phone:', superAdmin.phone);
    console.log('🔐 Password: SuperAdmin123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Please change the default password after first login!');
    console.log('');
    console.log('🚀 You can now login with these credentials at:');
    console.log(`   POST ${process.env.FRONTEND_URL || 'http://localhost:5173'}/api/v1/auth/login`);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error.message);
    if (error.code === 11000) {
      console.log('📧 A user with this email or phone already exists.');
    }
  } finally {
    process.exit();
  }
};

// Run the script
createSuperAdmin();
