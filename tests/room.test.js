import mongoose from 'mongoose';
import Room from '../src/models/Room.js';
import Hotel from '../src/models/Hotel.js';
import User from '../src/models/User.js';
import Amenity from '../src/models/Amenity.js';

// Basic test to verify Room model can be created
describe('Room Model Test', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test');
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear test data
    await Room.deleteMany({});
    await Hotel.deleteMany({});
    await User.deleteMany({});
    await Amenity.deleteMany({});
  });

  it('should create a room with valid data', async () => {
    // Create test data
    const user = await User.create({
      fullName: 'Test Owner',
      email: 'owner@test.com',
      phone: '967123456789',
      passwordHash: 'hashedpassword',
      role: 'owner',
      status: 'active'
    });

    const city = await (await import('../src/models/City.js')).default.create({
      name: 'Test City'
    });

    const hotel = await Hotel.create({
      name: 'Test Hotel',
      cityId: city._id,
      ownerId: user._id,
      description: 'A test hotel',
      mainImage: 'https://example.com/image.jpg',
      status: 'approved',
      isVisible: true
    });

    const amenity = await Amenity.create({
      name: 'WiFi'
    });

    const roomData = {
      hotelId: hotel._id,
      name: 'Test Room',
      description: 'A test room',
      numberOfBeds: 2,
      numberOfBathrooms: 1,
      roomSize: 25,
      moreInfo: ['Free WiFi', 'City view'],
      basePrice: 100,
      currency: 'USD',
      capacity: 2,
      images: ['https://example.com/room1.jpg'],
      availableDates: [new Date('2024-01-01'), new Date('2024-01-02')],
      amenityIds: [amenity._id]
    };

    const room = await Room.create(roomData);

    expect(room.name).toBe('Test Room');
    expect(room.hotelId.toString()).toBe(hotel._id.toString());
    expect(room.numberOfBeds).toBe(2);
    expect(room.currency).toBe('USD');
    expect(room.status).toBe('visible');
    expect(room.availableDates).toHaveLength(2);
    expect(room.amenityIds).toHaveLength(1);
  });

  it('should enforce unique room names within the same hotel', async () => {
    // Create test data
    const user = await User.create({
      fullName: 'Test Owner',
      email: 'owner@test.com',
      phone: '967123456789',
      passwordHash: 'hashedpassword',
      role: 'owner',
      status: 'active'
    });

    const city = await (await import('../src/models/City.js')).default.create({
      name: 'Test City'
    });

    const hotel = await Hotel.create({
      name: 'Test Hotel',
      cityId: city._id,
      ownerId: user._id,
      description: 'A test hotel',
      mainImage: 'https://example.com/image.jpg',
      status: 'approved',
      isVisible: true
    });

    const roomData = {
      hotelId: hotel._id,
      name: 'Test Room',
      numberOfBeds: 2,
      numberOfBathrooms: 1,
      basePrice: 100,
      currency: 'USD',
      capacity: 2
    };

    // Create first room
    await Room.create(roomData);

    // Try to create second room with same name in same hotel
    await expect(Room.create(roomData)).rejects.toThrow();
  });

  it('should normalize availableDates to UTC day-start', async () => {
    const user = await User.create({
      fullName: 'Test Owner',
      email: 'owner@test.com',
      phone: '967123456789',
      passwordHash: 'hashedpassword',
      role: 'owner',
      status: 'active'
    });

    const city = await (await import('../src/models/City.js')).default.create({
      name: 'Test City'
    });

    const hotel = await Hotel.create({
      name: 'Test Hotel',
      cityId: city._id,
      ownerId: user._id,
      description: 'A test hotel',
      mainImage: 'https://example.com/image.jpg',
      status: 'approved',
      isVisible: true
    });

    const roomData = {
      hotelId: hotel._id,
      name: 'Test Room',
      numberOfBeds: 2,
      numberOfBathrooms: 1,
      basePrice: 100,
      currency: 'USD',
      capacity: 2,
      availableDates: [
        new Date('2024-01-01T15:30:00Z'),
        new Date('2024-01-02T09:45:00Z')
      ]
    };

    const room = await Room.create(roomData);

    // Check that dates are normalized to UTC day-start
    expect(room.availableDates[0].getUTCHours()).toBe(0);
    expect(room.availableDates[0].getUTCMinutes()).toBe(0);
    expect(room.availableDates[0].getUTCSeconds()).toBe(0);
    expect(room.availableDates[1].getUTCHours()).toBe(0);
    expect(room.availableDates[1].getUTCMinutes()).toBe(0);
    expect(room.availableDates[1].getUTCSeconds()).toBe(0);
  });
});
