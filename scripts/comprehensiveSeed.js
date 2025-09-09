import dotenv from 'dotenv';
import connectDB from '../src/config/database.js';
import User from '../src/models/User.js';
import City from '../src/models/City.js';
import Hotel from '../src/models/Hotel.js';
import Amenity from '../src/models/Amenity.js';
import Room from '../src/models/Room.js';
import RoomBooking from '../src/models/RoomBooking.js';

// Load environment variables
dotenv.config({ path: './config.env' });

const seedData = async () => {
  try {
    console.log('🔌 Connecting to database...');
    await connectDB();
    
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await City.deleteMany({});
    await Hotel.deleteMany({});
    await Amenity.deleteMany({});
    await Room.deleteMany({});
    await RoomBooking.deleteMany({});
    
    console.log('🏙️  Creating cities in Yemen...');
    const cities = await City.create([
      { name: 'صنعاء' },     // Sana'a - Capital
      { name: 'عدن' },       // Aden - Port city
      { name: 'تعز' },       // Taiz - Cultural center
      { name: 'الحديدة' },   // Al Hudaydah - Red Sea port
      { name: 'المكلا' }     // Al Mukalla - Arabian Sea port
    ]);
    
    console.log(`✅ Created ${cities.length} cities`);
    
    console.log('🏠 Creating amenities...');
    const amenities = await Amenity.create([
      { name: 'واي فاي مجاني' },           // Free WiFi
      { name: 'تكييف هواء' },              // Air Conditioning
      { name: 'مطعم' },                    // Restaurant
      { name: 'موقف سيارات مجاني' },       // Free Parking
      { name: 'غرفة اجتماعات' },            // Meeting Room
      { name: 'صالة رياضية' },              // Gym
      { name: 'مسبح' },                    // Swimming Pool
      { name: 'خدمة تنظيف يومية' },         // Daily Housekeeping
      { name: 'مطبخ مجهز' },               // Kitchen
      { name: 'حديقة' }                    // Garden
    ]);
    
    console.log(`✅ Created ${amenities.length} amenities`);
    
    console.log('👑 Creating super admin...');
    const superAdmin = await User.create({
      fullName: 'أحمد محمد علي',
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
        fullName: 'فاطمة أحمد حسن',
        email: 'sanaa.admin@hajzi.com',
        phone: '967771111111',
        passwordHash: 'CityAdmin123!',
        role: 'city_admin',
        cityId: cities[0]._id, // Sana'a
        status: 'active'
      },
      {
        fullName: 'محمد صالح التعزي',
        email: 'taiz.admin@hajzi.com',
        phone: '967772222222',
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
        email: 'khalid.owner@hajzi.com',
        phone: '967773333333',
        passwordHash: 'Owner123!',
        role: 'owner',
        status: 'active'
      },
      {
        fullName: 'نادية سالم الحضرمية',
        email: 'nadia.owner@hajzi.com',
        phone: '967774444444',
        passwordHash: 'Owner123!',
        role: 'owner',
        status: 'active'
      },
      {
        fullName: 'علي محمد البحري',
        email: 'ali.owner@hajzi.com',
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
        email: 'abdullah.customer@hajzi.com',
        phone: '967776666666',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'active'
      },
      {
        fullName: 'آمنة محمد الزبيدي',
        email: 'amina.customer@hajzi.com',
        phone: '967777777777',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'active'
      },
      {
        fullName: 'يوسف علي البحري',
        email: 'youssef.customer@hajzi.com',
        phone: '967778888888',
        passwordHash: 'Customer123!',
        role: 'customer',
        status: 'active'
      }
    ]);
    
    console.log('🏨 Creating hotels...');
    const hotels = await Hotel.create([
      {
        name: 'فندق صنعاء الدولي',
        cityId: cities[0]._id, // Sana'a
        ownerId: owners[0]._id,
        status: 'approved',
        isVisible: true,
        mainImage: 'http://localhost:5000/uploads/hotels/hotel_1.PNG',
        secondaryImages: [
          'http://localhost:5000/uploads/hotels/hotel_2.PNG',
          'http://localhost:5000/uploads/hotels/hotel_3.jpg'
        ],
        description: 'فندق فاخر في قلب العاصمة صنعاء، يوفر إقامة مريحة وخدمات عالية الجودة مع إطلالة رائعة على المدينة القديمة.',
        location: 'وسط صنعاء، بالقرب من المدينة القديمة',
        confirmed: true,
        stars: 5,
        roomsNumber: 25,
        amenityIds: [amenities[0]._id, amenities[1]._id, amenities[2]._id, amenities[3]._id]
      },
      {
        name: 'فندق عدن السياحي',
        cityId: cities[1]._id, // Aden
        ownerId: owners[1]._id,
        status: 'approved',
        isVisible: true,
        mainImage: 'http://localhost:5000/uploads/hotels/hotel_2.PNG',
        secondaryImages: [
          'http://localhost:5000/uploads/hotels/hotel_1.PNG',
          'http://localhost:5000/uploads/hotels/hotel_3.jpg'
        ],
        description: 'فندق مميز على شاطئ عدن، يوفر إقامة فاخرة مع إطلالة مباشرة على البحر الأحمر وخدمات سياحية متكاملة.',
        location: 'شاطئ عدن، بالقرب من الميناء',
        confirmed: true,
        stars: 4,
        roomsNumber: 20,
        amenityIds: [amenities[0]._id, amenities[1]._id, amenities[2]._id, amenities[6]._id]
      },
      {
        name: 'فندق تعز التراثي',
        cityId: cities[2]._id, // Taiz
        ownerId: owners[2]._id,
        status: 'approved',
        isVisible: true,
        mainImage: 'http://localhost:5000/uploads/hotels/hotel_3.jpg',
        secondaryImages: [
          'http://localhost:5000/uploads/hotels/hotel_1.PNG',
          'http://localhost:5000/uploads/hotels/hotel_2.PNG'
        ],
        description: 'فندق تراثي أصيل في مدينة تعز، يجمع بين الأصالة والراحة، يوفر تجربة إقامة فريدة في قلب التاريخ.',
        location: 'وسط تعز، بالقرب من القلعة التاريخية',
        confirmed: true,
        stars: 3,
        roomsNumber: 15,
        amenityIds: [amenities[0]._id, amenities[1]._id, amenities[7]._id]
      },
      {
        name: 'فندق الحديدة البحري',
        cityId: cities[3]._id, // Al Hudaydah
        ownerId: owners[0]._id,
        status: 'approved',
        isVisible: true,
        mainImage: 'http://localhost:5000/uploads/hotels/hotel_1.PNG',
        secondaryImages: [
          'http://localhost:5000/uploads/hotels/hotel_2.PNG',
          'http://localhost:5000/uploads/hotels/hotel_3.jpg'
        ],
        description: 'فندق على شاطئ البحر الأحمر في الحديدة، يوفر إقامة مريحة مع إطلالة خلابة على البحر وخدمات متكاملة.',
        location: 'شاطئ الحديدة، على البحر الأحمر',
        confirmed: true,
        stars: 4,
        roomsNumber: 18,
        amenityIds: [amenities[0]._id, amenities[1]._id, amenities[2]._id, amenities[6]._id, amenities[9]._id]
      },
      {
        name: 'فندق المكلا الساحلي',
        cityId: cities[4]._id, // Al Mukalla
        ownerId: owners[1]._id,
        status: 'approved',
        isVisible: true,
        mainImage: 'http://localhost:5000/uploads/hotels/hotel_2.PNG',
        secondaryImages: [
          'http://localhost:5000/uploads/hotels/hotel_1.PNG',
          'http://localhost:5000/uploads/hotels/hotel_3.jpg'
        ],
        description: 'فندق فاخر في مدينة المكلا الساحلية، يوفر إقامة مريحة مع إطلالة رائعة على بحر العرب وخدمات عالية الجودة.',
        location: 'شاطئ المكلا، على بحر العرب',
        confirmed: true,
        stars: 5,
        roomsNumber: 30,
        amenityIds: [amenities[0]._id, amenities[1]._id, amenities[2]._id, amenities[3]._id, amenities[6]._id, amenities[9]._id]
      }
    ]);
    
    console.log('🏠 Creating rooms for hotels...');
    const rooms = await Room.create([
      // فندق صنعاء الدولي - Rooms
      {
        hotelId: hotels[0]._id,
        name: 'غرفة ديلوكس',
        description: 'غرفة فاخرة مع إطلالة رائعة على المدينة القديمة، مجهزة بأحدث التقنيات وخدمات عالية الجودة',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 35,
        basePrice: 120000,
        currency: 'YER',
        capacity: 2,
        images: [
          'http://localhost:5000/uploads/rooms/3.jpg',
          'http://localhost:5000/uploads/rooms/4.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[0]._id,
        name: 'جناح تنفيذي',
        description: 'جناح فاخر مع منطقة جلوس منفصلة وحمام فاخر، مثالي للضيوف المميزين',
        numberOfBeds: 2,
        numberOfBathrooms: 1,
        roomSize: 45,
        basePrice: 180000,
        currency: 'YER',
        capacity: 3,
        images: [
          'http://localhost:5000/uploads/rooms/5.jpg',
          'http://localhost:5000/uploads/rooms/3.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[0]._id,
        name: 'غرفة عائلية',
        description: 'غرفة واسعة مناسبة للعائلات، مع سريرين مزدوجين وحمامين',
        numberOfBeds: 3,
        numberOfBathrooms: 2,
        roomSize: 55,
        basePrice: 220000,
        currency: 'YER',
        capacity: 6,
        images: [
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      },
      
      // فندق عدن السياحي - Rooms
      {
        hotelId: hotels[1]._id,
        name: 'غرفة إطلالة بحرية',
        description: 'غرفة مع إطلالة مباشرة على البحر الأحمر، مثالية للاسترخاء والاستمتاع بالمنظر الخلاب',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 40,
        basePrice: 800,
        currency: 'SAR',
        capacity: 2,
        images: [
          'http://localhost:5000/uploads/rooms/3.jpg',
          'http://localhost:5000/uploads/rooms/4.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[1]._id,
        name: 'جناح شاطئي',
        description: 'جناح فاخر مع إطلالة مباشرة على الشاطئ، مع منطقة جلوس خارجية خاصة',
        numberOfBeds: 2,
        numberOfBathrooms: 1,
        roomSize: 50,
        basePrice: 1200,
        currency: 'SAR',
        capacity: 4,
        images: [
          'http://localhost:5000/uploads/rooms/5.jpg',
          'http://localhost:5000/uploads/rooms/3.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[1]._id,
        name: 'غرفة عائلية بحرية',
        description: 'غرفة عائلية واسعة مع إطلالة على البحر، مناسبة للعائلات الكبيرة',
        numberOfBeds: 3,
        numberOfBathrooms: 2,
        roomSize: 65,
        basePrice: 1500,
        currency: 'SAR',
        capacity: 6,
        images: [
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      },
      
      // فندق تعز التراثي - Rooms
      {
        hotelId: hotels[2]._id,
        name: 'غرفة تراثية',
        description: 'غرفة بتصميم تراثي أصيل يعكس هوية مدينة تعز التاريخية، مع أثاث تقليدي',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 30,
        basePrice: 80000,
        currency: 'YER',
        capacity: 2,
        images: [
          'http://localhost:5000/uploads/rooms/3.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[2]._id,
        name: 'جناح تراثي',
        description: 'جناح فاخر بتصميم تراثي مع منطقة جلوس منفصلة وحمام تقليدي',
        numberOfBeds: 2,
        numberOfBathrooms: 1,
        roomSize: 40,
        basePrice: 120000,
        currency: 'YER',
        capacity: 3,
        images: [
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      },
      
      // فندق الحديدة البحري - Rooms
      {
        hotelId: hotels[3]._id,
        name: 'غرفة بحرية',
        description: 'غرفة مع إطلالة رائعة على البحر الأحمر، مثالية للاستمتاع بجمال الشاطئ',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 35,
        basePrice: 90000,
        currency: 'YER',
        capacity: 2,
        images: [
          'http://localhost:5000/uploads/rooms/3.jpg',
          'http://localhost:5000/uploads/rooms/4.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[3]._id,
        name: 'جناح بحري فاخر',
        description: 'جناح فاخر مع إطلالة مباشرة على البحر، مع منطقة جلوس خارجية',
        numberOfBeds: 2,
        numberOfBathrooms: 1,
        roomSize: 45,
        basePrice: 140000,
        currency: 'YER',
        capacity: 4,
        images: [
          'http://localhost:5000/uploads/rooms/5.jpg',
          'http://localhost:5000/uploads/rooms/3.jpg'
        ],
        status: 'visible'
      },
      
      // فندق المكلا الساحلي - Rooms
      {
        hotelId: hotels[4]._id,
        name: 'غرفة ساحلية',
        description: 'غرفة مع إطلالة خلابة على بحر العرب، مع تصميم عصري وأثاث مريح',
        numberOfBeds: 1,
        numberOfBathrooms: 1,
        roomSize: 40,
        basePrice: 1000,
        currency: 'SAR',
        capacity: 2,
        images: [
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[4]._id,
        name: 'جناح رئاسي',
        description: 'جناح رئاسي فاخر مع إطلالة بانورامية على البحر، مع خدمات VIP حصرية',
        numberOfBeds: 2,
        numberOfBathrooms: 2,
        roomSize: 80,
        basePrice: 2000,
        currency: 'SAR',
        capacity: 4,
        images: [
          'http://localhost:5000/uploads/rooms/3.jpg',
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      },
      {
        hotelId: hotels[4]._id,
        name: 'غرفة عائلية ساحلية',
        description: 'غرفة عائلية واسعة مع إطلالة على البحر، مناسبة للعائلات الكبيرة',
        numberOfBeds: 3,
        numberOfBathrooms: 2,
        roomSize: 70,
        basePrice: 1800,
        currency: 'SAR',
        capacity: 6,
        images: [
          'http://localhost:5000/uploads/rooms/4.jpg',
          'http://localhost:5000/uploads/rooms/5.jpg'
        ],
        status: 'visible'
      }
    ]);
    
    console.log('📅 Creating sample room bookings...');
    // Generate future dates for bookings
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + (7 * 24 * 60 * 60 * 1000)); // 7 days from now
    const futureDate2 = new Date(today.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days from now
    const futureDate3 = new Date(today.getTime() + (21 * 24 * 60 * 60 * 1000)); // 21 days from now
    const futureDate4 = new Date(today.getTime() + (28 * 24 * 60 * 60 * 1000)); // 28 days from now
    const futureDate5 = new Date(today.getTime() + (35 * 24 * 60 * 60 * 1000)); // 35 days from now
    const futureDate6 = new Date(today.getTime() + (42 * 24 * 60 * 60 * 1000)); // 42 days from now
    const futureDate7 = new Date(today.getTime() + (49 * 24 * 60 * 60 * 1000)); // 49 days from now
    const futureDate8 = new Date(today.getTime() + (56 * 24 * 60 * 60 * 1000)); // 56 days from now

    const sampleBookings = [
      {
        fullName: 'أحمد محمد السعيد',
        guestName: 'أحمد محمد السعيد',
        phoneNumber: '+967712345678',
        checkIn: futureDate1,
        checkOut: new Date(futureDate1.getTime() + (3 * 24 * 60 * 60 * 1000)),
        adults: 2,
        children: 1,
        notes: 'نريد غرفة هادئة مع إفطار',
        status: 'confirmed'
      },
      {
        fullName: 'فاطمة علي أحمد',
        guestName: 'فاطمة علي أحمد',
        phoneNumber: '+967723456789',
        checkIn: futureDate2,
        checkOut: new Date(futureDate2.getTime() + (2 * 24 * 60 * 60 * 1000)),
        adults: 1,
        children: 0,
        notes: 'سفر عمل',
        status: 'pending'
      },
      {
        fullName: 'محمد عبدالله حسن',
        guestName: 'محمد عبدالله حسن',
        phoneNumber: '+967734567890',
        checkIn: futureDate3,
        checkOut: new Date(futureDate3.getTime() + (3 * 24 * 60 * 60 * 1000)),
        adults: 3,
        children: 2,
        notes: 'عائلة مع أطفال صغار',
        status: 'confirmed'
      },
      {
        fullName: 'عائشة يوسف محمد',
        guestName: 'عائشة يوسف محمد',
        phoneNumber: '+967745678901',
        checkIn: futureDate4,
        checkOut: new Date(futureDate4.getTime() + (2 * 24 * 60 * 60 * 1000)),
        adults: 2,
        children: 0,
        notes: 'إقامة قصيرة',
        status: 'pending'
      },
      {
        fullName: 'خالد سالم أحمد',
        guestName: 'خالد سالم أحمد',
        phoneNumber: '+967756789012',
        checkIn: futureDate5,
        checkOut: new Date(futureDate5.getTime() + (5 * 24 * 60 * 60 * 1000)),
        adults: 4,
        children: 1,
        notes: 'عطلة عائلية طويلة',
        status: 'confirmed'
      },
      {
        fullName: 'نور الدين عبدالرحمن',
        guestName: 'نور الدين عبدالرحمن',
        phoneNumber: '+967767890123',
        checkIn: futureDate6,
        checkOut: new Date(futureDate6.getTime() + (2 * 24 * 60 * 60 * 1000)),
        adults: 1,
        children: 0,
        notes: 'رحلة عمل',
        status: 'cancelled'
      },
      {
        fullName: 'ريم عبدالله محمد',
        guestName: 'ريم عبدالله محمد',
        phoneNumber: '+967778901234',
        checkIn: futureDate7,
        checkOut: new Date(futureDate7.getTime() + (2 * 24 * 60 * 60 * 1000)),
        adults: 2,
        children: 1,
        notes: 'نريد غرفة متصلة',
        status: 'confirmed'
      },
      {
        fullName: 'عبدالرحمن علي حسن',
        guestName: 'عبدالرحمن علي حسن',
        phoneNumber: '+967789012345',
        checkIn: futureDate8,
        checkOut: new Date(futureDate8.getTime() + (3 * 24 * 60 * 60 * 1000)),
        adults: 3,
        children: 0,
        notes: 'مؤتمر عمل',
        status: 'pending'
      }
    ];

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

    const savedBookings = await RoomBooking.insertMany(roomBookings);
    console.log(`✅ Created ${savedBookings.length} room bookings`);
    
    console.log('✅ Database seeded successfully!');
    console.log('');
    console.log('📊 Summary:');
    console.log(`   🏙️  Cities: ${cities.length}`);
    console.log(`   🏠 Amenities: ${amenities.length}`);
    console.log(`   🏨 Hotels: ${hotels.length}`);
    console.log(`   🏠 Rooms: ${rooms.length}`);
    console.log(`   📅 Room Bookings: ${savedBookings.length}`);
    console.log(`   👑 Super Admin: 1`);
    console.log(`   👨‍💼 City Admins: ${cityAdmins.length}`);
    console.log(`   🏨 Owners: ${owners.length}`);
    console.log(`   👥 Customers: ${customers.length}`);
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('');
    console.log('👑 Super Admin:');
    console.log('   Email: admin@hajzi.com');
    console.log('   Password: SuperAdmin123!');
    console.log('');
    console.log('🏙️ City Admins:');
    console.log('   Sanaa: sanaa.admin@hajzi.com / CityAdmin123!');
    console.log('   Taiz: taiz.admin@hajzi.com / CityAdmin123!');
    console.log('');
    console.log('🏨 Hotel Owners:');
    console.log('   Khalid: khalid.owner@hajzi.com / Owner123!');
    console.log('   Nadia: nadia.owner@hajzi.com / Owner123!');
    console.log('   Ali: ali.owner@hajzi.com / Owner123!');
    console.log('');
    console.log('👥 Customers:');
    console.log('   Abdullah: abdullah.customer@hajzi.com / Customer123!');
    console.log('   Amina: amina.customer@hajzi.com / Customer123!');
    console.log('   Youssef: youssef.customer@hajzi.com / Customer123!');
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
