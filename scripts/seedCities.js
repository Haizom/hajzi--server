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
import City from '../src/models/City.js';

// Yemeni cities data in Arabic
const citiesData = [
  // Major Cities
  { 
    name: 'صنعاء', 
    nameEn: 'Sanaa',
    description: 'العاصمة السياسية لليمن ومركزها الثقافي والتاريخي',
    descriptionEn: 'The political capital of Yemen and its cultural and historical center',
    population: 2957000,
    isActive: true,
    coordinates: { lat: 15.3694, lng: 44.1910 }
  },
  { 
    name: 'عدن', 
    nameEn: 'Aden',
    description: 'الميناء الرئيسي لليمن ومركز تجاري مهم',
    descriptionEn: 'The main port of Yemen and an important commercial center',
    population: 863000,
    isActive: true,
    coordinates: { lat: 12.7797, lng: 45.0095 }
  },
  { 
    name: 'تعز', 
    nameEn: 'Taiz',
    description: 'مدينة جبلية جميلة مع مناخ معتدل وطبيعة خلابة',
    descriptionEn: 'A beautiful mountain city with moderate climate and stunning nature',
    population: 615000,
    isActive: true,
    coordinates: { lat: 13.5926, lng: 44.0178 }
  },
  { 
    name: 'الحديدة', 
    nameEn: 'Al Hudaydah',
    description: 'ميناء بحري مهم على البحر الأحمر',
    descriptionEn: 'An important seaport on the Red Sea',
    population: 548000,
    isActive: true,
    coordinates: { lat: 14.7979, lng: 42.9530 }
  },
  { 
    name: 'إب', 
    nameEn: 'Ibb',
    description: 'مدينة خضراء مع مناظر طبيعية رائعة',
    descriptionEn: 'A green city with amazing natural scenery',
    population: 350000,
    isActive: true,
    coordinates: { lat: 13.9667, lng: 44.1833 }
  },
  
  // Historical Cities
  { 
    name: 'شبام', 
    nameEn: 'Shibam',
    description: 'مدينة ناطحات السحاب الطينية التاريخية',
    descriptionEn: 'The historic mud skyscraper city',
    population: 7000,
    isActive: true,
    coordinates: { lat: 15.9277, lng: 48.6266 }
  },
  { 
    name: 'زبيد', 
    nameEn: 'Zabid',
    description: 'مدينة تاريخية قديمة مع جامعتها الشهيرة',
    descriptionEn: 'An ancient historical city with its famous university',
    population: 52000,
    isActive: true,
    coordinates: { lat: 14.1951, lng: 43.3151 }
  },
  { 
    name: 'صعدة', 
    nameEn: 'Saada',
    description: 'مدينة تاريخية في شمال اليمن',
    descriptionEn: 'A historical city in northern Yemen',
    population: 70000,
    isActive: true,
    coordinates: { lat: 16.9402, lng: 43.7636 }
  },
  
  // Coastal Cities
  { 
    name: 'المكلا', 
    nameEn: 'Mukalla',
    description: 'مدينة ساحلية جميلة على بحر العرب',
    descriptionEn: 'A beautiful coastal city on the Arabian Sea',
    population: 300000,
    isActive: true,
    coordinates: { lat: 14.5333, lng: 49.1333 }
  },
  { 
    name: 'الخوخة', 
    nameEn: 'Al Khokha',
    description: 'مدينة ساحلية صغيرة مع شواطئ جميلة',
    descriptionEn: 'A small coastal city with beautiful beaches',
    population: 15000,
    isActive: true,
    coordinates: { lat: 14.0167, lng: 43.2500 }
  },
  
  // Mountain Cities
  { 
    name: 'ذمار', 
    nameEn: 'Dhamar',
    description: 'مدينة جبلية مع مناخ بارد وطبيعة جميلة',
    descriptionEn: 'A mountain city with cold climate and beautiful nature',
    population: 160000,
    isActive: true,
    coordinates: { lat: 14.5577, lng: 44.4053 }
  },
  { 
    name: 'ريمة', 
    nameEn: 'Raymah',
    description: 'محافظة جبلية مع مناظر طبيعية خلابة',
    descriptionEn: 'A mountainous governorate with stunning natural views',
    population: 45000,
    isActive: true,
    coordinates: { lat: 14.6278, lng: 43.6667 }
  },
  
  // Business Cities
  { 
    name: 'مارب', 
    nameEn: 'Marib',
    description: 'مدينة نفطية مهمة مع تاريخ قديم',
    descriptionEn: 'An important oil city with ancient history',
    population: 40000,
    isActive: true,
    coordinates: { lat: 15.4600, lng: 45.3250 }
  },
  { 
    name: 'حضرموت', 
    nameEn: 'Hadramout',
    description: 'محافظة كبيرة مع تنوع جغرافي وثقافي',
    descriptionEn: 'A large governorate with geographical and cultural diversity',
    population: 1200000,
    isActive: true,
    coordinates: { lat: 15.9313, lng: 49.3653 }
  },
  
  // Tourist Cities
  { 
    name: 'سقطرى', 
    nameEn: 'Socotra',
    description: 'جزيرة فريدة مع نباتات وحيوانات نادرة',
    descriptionEn: 'A unique island with rare plants and animals',
    population: 44000,
    isActive: true,
    coordinates: { lat: 12.4634, lng: 53.8233 }
  },
  { 
    name: 'البيضاء', 
    nameEn: 'Al Bayda',
    description: 'مدينة جبلية مع مناخ معتدل',
    descriptionEn: 'A mountain city with moderate climate',
    population: 60000,
    isActive: true,
    coordinates: { lat: 13.9833, lng: 45.5667 }
  }
];

async function seedCities() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing cities
    await City.deleteMany({});
    console.log('🗑️  Cleared existing cities');

    // Insert new cities
    const cities = await City.insertMany(citiesData);
    console.log(`✅ Successfully seeded ${cities.length} cities`);

    // Display seeded cities
    console.log('\n📋 Seeded Cities:');
    cities.forEach(city => {
      console.log(`  - ${city.name} (${city.nameEn}) - Population: ${city.population.toLocaleString()}`);
    });

    console.log('\n🎉 Cities seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding cities:', error);
  } finally {
    // Close connection
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
}

// Run the seeding function
seedCities();
