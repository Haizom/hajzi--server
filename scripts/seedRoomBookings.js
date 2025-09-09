import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import models
import RoomBooking from '../src/models/RoomBooking.js';
import User from '../src/models/User.js';
import Hotel from '../src/models/Hotel.js';
import Room from '../src/models/Room.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../config.env') });

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Sample room booking data
const sampleBookings = [
  {
    fullName: 'أحمد محمد السعيد',
    guestName: 'أحمد محمد السعيد',
    phoneNumber: '+967712345678',
    checkIn: new Date('2024-02-15'),
    checkOut: new Date('2024-02-18'),
    adults: 2,
    children: 1,
    notes: 'نريد غرفة هادئة مع إفطار',
    status: 'confirmed'
  },
  {
    fullName: 'فاطمة علي أحمد',
    guestName: 'فاطمة علي أحمد',
    phoneNumber: '+967723456789',
    checkIn: new Date('2024-02-20'),
    checkOut: new Date('2024-02-22'),
    adults: 1,
    children: 0,
    notes: 'سفر عمل',
    status: 'pending'
  },
  {
    fullName: 'محمد عبدالله حسن',
    guestName: 'محمد عبدالله حسن',
    phoneNumber: '+967734567890',
    checkIn: new Date('2024-02-25'),
    checkOut: new Date('2024-02-28'),
    adults: 3,
    children: 2,
    notes: 'عائلة مع أطفال صغار',
    status: 'confirmed'
  },
  {
    fullName: 'عائشة يوسف محمد',
    guestName: 'عائشة يوسف محمد',
    phoneNumber: '+967745678901',
    checkIn: new Date('2024-03-01'),
    checkOut: new Date('2024-03-03'),
    adults: 2,
    children: 0,
    notes: 'إقامة قصيرة',
    status: 'pending'
  },
  {
    fullName: 'خالد سالم أحمد',
    guestName: 'خالد سالم أحمد',
    phoneNumber: '+967756789012',
    checkIn: new Date('2024-03-05'),
    checkOut: new Date('2024-03-10'),
    adults: 4,
    children: 1,
    notes: 'عطلة عائلية طويلة',
    status: 'confirmed'
  },
  {
    fullName: 'نور الدين عبدالرحمن',
    guestName: 'نور الدين عبدالرحمن',
    phoneNumber: '+967767890123',
    checkIn: new Date('2024-03-12'),
    checkOut: new Date('2024-03-14'),
    adults: 1,
    children: 0,
    notes: 'رحلة عمل',
    status: 'cancelled'
  },
  {
    fullName: 'ريم عبدالله محمد',
    guestName: 'ريم عبدالله محمد',
    phoneNumber: '+967778901234',
    checkIn: new Date('2024-03-18'),
    checkOut: new Date('2024-03-20'),
    adults: 2,
    children: 1,
    notes: 'نريد غرفة متصلة',
    status: 'confirmed'
  },
  {
    fullName: 'عبدالرحمن علي حسن',
    guestName: 'عبدالرحمن علي حسن',
    phoneNumber: '+967789012345',
    checkIn: new Date('2024-03-22'),
    checkOut: new Date('2024-03-25'),
    adults: 3,
    children: 0,
    notes: 'مؤتمر عمل',
    status: 'pending'
  }
];

const seedRoomBookings = async () => {
  try {
    console.log('🌱 Starting RoomBooking seeding...');

    // Clear existing room bookings
    await RoomBooking.deleteMany({});
    console.log('🧹 Cleared existing room bookings');

    // Get sample users, hotels, and rooms
    const customers = await User.find({ role: 'customer' }).limit(8);
    const hotels = await Hotel.find({ status: 'approved' });
    const rooms = await Room.find({ status: 'visible' });

    if (customers.length === 0) {
      console.log('❌ No customers found. Please seed users first.');
      return;
    }

    if (hotels.length === 0) {
      console.log('❌ No approved hotels found. Please seed hotels first.');
      return;
    }

    if (rooms.length === 0) {
      console.log('❌ No visible rooms found. Please seed rooms first.');
      return;
    }

    // Create room bookings
    const roomBookings = [];
    
    for (let i = 0; i < sampleBookings.length; i++) {
      const bookingData = sampleBookings[i];
      const customer = customers[i % customers.length];
      const room = rooms[i % rooms.length];
      const hotel = hotels.find(h => h._id.toString() === room.hotelId.toString());
      
      if (!hotel) continue;

      // Calculate price based on room price and number of nights
      const nights = Math.ceil((bookingData.checkOut - bookingData.checkIn) / (1000 * 60 * 60 * 24));
      const price = room.basePrice * nights;

      // Generate WhatsApp link for owner
      const ownerWhatsappLink = hotel.owner?.whatsappNumber 
        ? `https://wa.me/${hotel.owner.whatsappNumber.replace(/\+/g, '')}?text=مرحباً، أريد الاستفسار عن حجز الغرفة`
        : null;

      const roomBooking = new RoomBooking({
        ...bookingData,
        userId: customer._id,
        ownerId: hotel.ownerId,
        roomId: room._id,
        hotelId: hotel._id,
        price,
        ownerWhatsappLink
      });

      roomBookings.push(roomBooking);
    }

    // Save all room bookings
    const savedBookings = await RoomBooking.insertMany(roomBookings);
    console.log(`✅ Created ${savedBookings.length} room bookings`);

    // Display summary
    console.log('\n📊 Room Booking Summary:');
    console.log(`Total bookings: ${savedBookings.length}`);
    
    const statusCounts = savedBookings.reduce((acc, booking) => {
      acc[booking.status] = (acc[booking.status] || 0) + 1;
      return acc;
    }, {});
    
    Object.entries(statusCounts).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });

    console.log('\n🎉 Room booking seeding completed successfully!');

  } catch (error) {
    console.error('❌ Error seeding room bookings:', error);
  }
};

const main = async () => {
  try {
    await connectDB();
    await seedRoomBookings();
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
};

// Run the seeding
main();
