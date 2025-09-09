import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import City from '../src/models/City.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const seedData = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await City.deleteMany({});
    
    console.log('🏙️  Creating cities...');
    const cities = await City.create([
      { name: 'صنعاء' }, // Sana'a
      { name: 'عدن' },   // Aden
      { name: 'تعز' },   // Taiz
      { name: 'الحديدة' }, // Al Hudaydah
      { name: 'المكلا' }, // Al Mukalla
      { name: 'إب' },    // Ibb
      { name: 'ذمار' },  // Dhamar
      { name: 'صعدة' },  // Sa'dah
    ]);
    
    console.log(`✅ Created ${cities.length} cities`);
    
    console.log('👑 Creating super admin...');
    const superAdmin = await User.create({
      fullName: 'Super Administrator',
      email: 'admin@hajzi.com',
      phone: '967771234567',
      whatsappNumber: '967771234567',
      passwordHash: 'SuperAdmin123!',
      role: 'super_admin',
      status: 'active'
    });
    
    console.log('👨‍💼 Creating city admins...');
    const cityAdmins = await User.create([
      {
        fullName: 'أحمد محمد الصنعاني',
        email: 'sanaa.admin@hajzi.com',
        phone: '967771111111',
        passwordHash: 'CityAdmin123!',
        role: 'city_admin',
        cityId: cities[0]._id, // Sana'a
        status: 'active'
      },
      {
        fullName: 'فاطمة علي العدنية',
        email: 'aden.admin@hajzi.com',
        phone: '967772222222',
        passwordHash: 'CityAdmin123!',
        role: 'city_admin',
        cityId: cities[1]._id, // Aden
        status: 'active'
      },
      {
        fullName: 'محمد صالح التعزي',
        email: 'taiz.admin@hajzi.com',
        phone: '967773333333',
        passwordHash: 'CityAdmin123!',
        role: 'city_admin',
        cityId: cities[2]._id, // Taiz
        status: 'active'
      }
    ]);
    
    console.log('🏨 Creating hotel owners...');
    const owners = await User.create([
      {
        fullName: 'خالد أحمد الشميري',
        email: 'khalid.owner@example.com',
        phone: '967774444444',
        passwordHash: 'Owner123!',
        role: 'owner',
        status: 'active'
      },
      {
        fullName: 'نادية سالم الحضرمية',
        email: 'nadia.owner@example.com',
        phone: '967775555555',
        passwordHash: 'Owner123!',
        role: 'owner',
        status: 'active'
      }
    ]);
    
    console.log('👥 Creating customers...');
    const customers = await User.create([
      {
        fullName: 'عبدالله يحيى المطري',
        email: 'abdullah.customer@example.com',
        phone: '967776666666',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'active'
      },
      {
        fullName: 'آمنة محمد الزبيدي',
        email: 'amina.customer@example.com',
        phone: '967777777777',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'active'
      },
      {
        fullName: 'يوسف علي البحري',
        email: 'youssef.customer@example.com',
        phone: '967778888888',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'pending_approval'
      }
    ]);
    
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   🏙️  Cities: ${cities.length}`);
    console.log(`   👑 Super Admin: 1`);
    console.log(`   👨‍💼 City Admins: ${cityAdmins.length}`);
    console.log(`   🏨 Owners: ${owners.length}`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('   Super Admin: admin@hajzi.com / SuperAdmin123!');
    console.log('   City Admins: [city].admin@hajzi.com / CityAdmin123!');
    console.log('   Sample Owner: khalid.owner@example.com / Owner123!');
    console.log('   Sample Customer: abdullah.customer@example.com / Customer123!');
    console.log('');
    console.log('⚠️  IMPORTANT: Change all default passwords in production!');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error.message);
    if (error.code === 11000) {
      console.log('📧 Some users with these emails or phones already exist.');
    }
  } finally {
    process.exit();
  }
};

// Run the script
seedData();
