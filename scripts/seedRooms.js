import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Room from '../src/models/Room.js';
import Hotel from '../src/models/Hotel.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hajzi';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected successfully');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

const seedRooms = async () => {
  try {
    await connectDB();
    
    // Get existing hotels
    const hotels = await Hotel.find({ status: 'approved' });
    if (hotels.length === 0) {
      console.log('❌ No approved hotels found. Please run the comprehensive seed script first.');
      process.exit(1);
    }
    
    console.log('🏨 Found hotels:', hotels.map(h => h.name));
    
    // Sample room data with images
    const sampleRooms = [
      {
        hotelId: hotels[0]._id, // Sanaa International Hotel
        name: 'Deluxe Room',
        description: 'Elegant room with city view and king-size bed',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 35,
        basePrice: 120000,
        currency: 'YER',
        capacity: 2,
        images: [
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a.jpg',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b.jpg',
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[0]._id, // Sanaa International Hotel
        name: 'Junior Suite',
        description: 'Spacious suite with separate seating area and luxury bathroom',
        numberOfBeds: 2,
        numberOfBathrooms: 1,
        roomSize: 45,
        basePrice: 180000,
        currency: 'YER',
        capacity: 3,
        images: [
          'https://images.unsplash.com/photo-1578683010236-d716f9a3f461.jpg',
          'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[1]._id, // Aden Beach Resort
        name: 'Beach View Room',
        description: 'Room with direct beach access and sea view',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 40,
        basePrice: 800,
        currency: 'SAR',
        capacity: 2,
        images: [
          'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4.jpg',
          'https://images.unsplash.com/photo-1566073771259-6a8506099945.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[1]._id, // Aden Beach Resort
        name: 'Family Suite',
        description: 'Large suite perfect for families with children',
        numberOfBeds: 3,
        numberOfBathrooms: 2,
        roomSize: 60,
        basePrice: 1200,
        currency: 'SAR',
        capacity: 6,
        images: [
          'https://images.unsplash.com/photo-1578895101408-1a36b834405b.jpg',
          'https://images.unsplash.com/photo-1578474846511-04ba529f0b88.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[2]._id, // Taiz Heritage Hotel
        name: 'Heritage Room',
        description: 'Traditional room with authentic Yemeni design',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 30,
        basePrice: 80000,
        currency: 'YER',
        capacity: 2,
        images: [
          'https://images.unsplash.com/photo-1566665797739-1674de7a421a.jpg'
        ],
        status: 'visible'
      }
    ];
    
    console.log('🏠 Creating rooms...');
    
    // Clear existing rooms
    await Room.deleteMany({});
    console.log('🗑️  Cleared existing rooms');
    
    // Create new rooms
    const rooms = await Room.create(sampleRooms);
    
    console.log('✅ Rooms created successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   🏨 Hotels: ${hotels.length}`);
    console.log(`   🏠 Rooms: ${rooms.length}`);
    console.log('');
    console.log('🏠 Created Rooms:');
    rooms.forEach(room => {
      console.log(`   - ${room.name} (${room.hotelId}) - ${room.images.length} images`);
    });
    
  } catch (error) {
    console.error('❌ Error seeding rooms:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB disconnected');
    process.exit();
  }
};

// Run the script
seedRooms();
