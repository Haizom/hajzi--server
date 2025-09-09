import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ES6 module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Import models
import Amenity from '../src/models/Amenity.js';

// Amenities data in Arabic
const amenitiesData = [
  // Basic Amenities
  { name: 'واي فاي مجاني', icon: 'wifi', category: 'basic' },
  { name: 'تكييف الهواء', icon: 'air-conditioning', category: 'basic' },
  { name: 'تلفزيون', icon: 'tv', category: 'basic' },
  { name: 'ثلاجة', icon: 'refrigerator', category: 'basic' },
  { name: 'مكواة', icon: 'iron', category: 'basic' },
  { name: 'مجفف شعر', icon: 'hair-dryer', category: 'basic' },
  { name: 'مكيف هواء', icon: 'air-conditioning', category: 'basic' },
  { name: 'تدفئة', icon: 'heating', category: 'basic' },
  
  // Bathroom Amenities
  { name: 'حمام خاص', icon: 'bathroom', category: 'bathroom' },
  { name: 'دش', icon: 'shower', category: 'bathroom' },
  { name: 'مناشف', icon: 'towels', category: 'bathroom' },
  { name: 'مستلزمات حمام', icon: 'toiletries', category: 'bathroom' },
  { name: 'مغطس', icon: 'bathtub', category: 'bathroom' },
  
  // Kitchen Amenities
  { name: 'مطبخ مجهز', icon: 'kitchen', category: 'kitchen' },
  { name: 'أدوات طبخ', icon: 'cooking-utensils', category: 'kitchen' },
  { name: 'غسالة صحون', icon: 'dishwasher', category: 'kitchen' },
  { name: 'مايكروويف', icon: 'microwave', category: 'kitchen' },
  { name: 'قهوة/شاي', icon: 'coffee-tea', category: 'kitchen' },
  
  // Outdoor Amenities
  { name: 'مسبح', icon: 'pool', category: 'outdoor' },
  { name: 'حديقة', icon: 'garden', category: 'outdoor' },
  { name: 'مظلة', icon: 'umbrella', category: 'outdoor' },
  { name: 'مقاعد خارجية', icon: 'outdoor-seating', category: 'outdoor' },
  { name: 'باربكيو', icon: 'barbecue', category: 'outdoor' },
  
  // Entertainment Amenities
  { name: 'صالة ألعاب', icon: 'game-room', category: 'entertainment' },
  { name: 'مكتبة', icon: 'library', category: 'entertainment' },
  { name: 'موسيقى', icon: 'music', category: 'entertainment' },
  { name: 'ألعاب أطفال', icon: 'kids-games', category: 'entertainment' },
  
  // Business Amenities
  { name: 'مكتب عمل', icon: 'work-desk', category: 'business' },
  { name: 'طابعة', icon: 'printer', category: 'business' },
  { name: 'قاعة اجتماعات', icon: 'meeting-room', category: 'business' },
  { name: 'خدمة استقبال 24/7', icon: '24-7-reception', category: 'business' },
  
  // Transportation Amenities
  { name: 'موقف سيارات مجاني', icon: 'free-parking', category: 'transportation' },
  { name: 'خدمة نقل من المطار', icon: 'airport-shuttle', category: 'transportation' },
  { name: 'تأجير سيارات', icon: 'car-rental', category: 'transportation' },
  { name: 'دراجات', icon: 'bicycles', category: 'transportation' },
  
  // Wellness Amenities
  { name: 'صالة رياضية', icon: 'gym', category: 'wellness' },
  { name: 'ساونا', icon: 'sauna', category: 'wellness' },
  { name: 'جاكوزي', icon: 'jacuzzi', category: 'wellness' },
  { name: 'مساج', icon: 'massage', category: 'wellness' },
  { name: 'يوجا', icon: 'yoga', category: 'wellness' },
  
  // Family Amenities
  { name: 'غرفة أطفال', icon: 'kids-room', category: 'family' },
  { name: 'مقاعد أطفال', icon: 'high-chair', category: 'family' },
  { name: 'سرير أطفال', icon: 'crib', category: 'family' },
  { name: 'ملعب أطفال', icon: 'playground', category: 'family' },
  
  // Accessibility Amenities
  { name: 'غرف متاحة للمعاقين', icon: 'accessible-rooms', category: 'accessibility' },
  { name: 'مصاعد', icon: 'elevator', category: 'accessibility' },
  { name: 'منحدرات', icon: 'ramps', category: 'accessibility' },
  { name: 'مراحيض متاحة للمعاقين', icon: 'accessible-bathroom', category: 'accessibility' }
];

async function seedAmenities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing amenities
    await Amenity.deleteMany({});
    console.log('🗑️  Cleared existing amenities');

    // Insert new amenities
    const amenities = await Amenity.insertMany(amenitiesData);
    console.log(`✅ Successfully seeded ${amenities.length} amenities`);

    // Display seeded amenities
    console.log('\n📋 Seeded Amenities:');
    amenities.forEach(amenity => {
      console.log(`  - ${amenity.name} (${amenity.category})`);
    });

    console.log('\n🎉 Amenities seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding amenities:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedAmenities();
