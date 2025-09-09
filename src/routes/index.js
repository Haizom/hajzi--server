import express from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import cityRoutes from './cityRoutes.js';
import amenityRoutes from './amenityRoutes.js';
import hotelRoutes from './hotelRoutes.js';
import roomRoutes from './roomRoutes.js';
import roomBookingRoutes from './roomBookingRoutes.js';
import featuredHotelRoutes from './featuredHotelRoutes.js';
import statsRoutes from './statsRoutes.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/cities', cityRoutes);
router.use('/amenities', amenityRoutes);
router.use('/hotels', hotelRoutes);
router.use('/rooms', roomRoutes);
router.use('/room-bookings', roomBookingRoutes);
router.use('/featured-hotels', featuredHotelRoutes);
router.use('/stats', statsRoutes);

// API info endpoint
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Welcome to Hajzi API',
    version: process.env.API_VERSION || 'v1',
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login',
        me: 'GET /auth/me',
        updatePassword: 'PATCH /auth/update-password',
        updateProfile: 'PATCH /auth/update-profile',
        logout: 'POST /auth/logout',
        refresh: 'POST /auth/refresh'
      },
      users: {
        me: 'GET /users/me',
        getById: 'GET /users/:id',
        getAll: 'GET /users (super_admin only)',
        createCityAdmin: 'POST /users/city-admin (super_admin only)',
        updateStatus: 'PATCH /users/:id/status (super_admin only)',
        updateRole: 'PATCH /users/:id/role (super_admin only)',
        delete: 'DELETE /users/:id (super_admin only)',
        getByCityId: 'GET /users/city/:cityId (super_admin, city_admin)'
      },
      cities: {
        getAll: 'GET /cities',
        getById: 'GET /cities/:id',
        search: 'GET /cities/search',
        create: 'POST /cities (super_admin only)',
        update: 'PATCH /cities/:id (super_admin only)',
        delete: 'DELETE /cities/:id (super_admin only)',
        getStats: 'GET /cities/:id/stats (super_admin, city_admin)'
      },
      amenities: {
        getAll: 'GET /amenities',
        getById: 'GET /amenities/:id',
        search: 'GET /amenities/search',
        create: 'POST /amenities (super_admin only)',
        update: 'PATCH /amenities/:id (super_admin only)',
        delete: 'DELETE /amenities/:id (super_admin only)',
        getStats: 'GET /amenities/admin/stats (super_admin only)'
      },
      hotels: {
        getAll: 'GET /hotels (public)',
        getById: 'GET /hotels/:id (public for approved+visible)',
        getRooms: 'GET /hotels/:id/rooms (public)',
        create: 'POST /hotels (owner, super_admin)',
        update: 'PUT /hotels/:id (owner)',
        delete: 'DELETE /hotels/:id (super_admin only)',
        approve: 'POST /hotels/:id/approve (super_admin only)',
        reject: 'POST /hotels/:id/reject (super_admin only)',
        confirm: 'POST /hotels/:id/confirm (super_admin only)',
        unconfirm: 'POST /hotels/:id/unconfirm (super_admin only)',
        show: 'POST /hotels/:id/show (owner)',
        hide: 'POST /hotels/:id/hide (owner)',
        ownerHotels: 'GET /hotels/owner/my-hotels (owner)',
        adminPending: 'GET /hotels/admin/pending (super_admin)',
        adminAll: 'GET /hotels/admin/all (super_admin)'
      },
      rooms: {
        getByHotel: 'GET /rooms/by-hotel/:hotelId (public)',
        getById: 'GET /rooms/:id (public for visible, owner+admin for hidden)',
        create: 'POST /rooms (owner, super_admin)',
        update: 'PATCH /rooms/:id (owner, super_admin)',
        delete: 'DELETE /rooms/:id (super_admin only)',
        availability: 'PATCH /rooms/:id/availability (owner, super_admin)',
        visibility: 'PATCH /rooms/:id/visibility (owner, super_admin)',
        ownerRooms: 'GET /rooms/owner/my-rooms (owner)',
        adminAll: 'GET /rooms/admin/all (super_admin only)'
      },
      roomBookings: {
        create: 'POST /room-bookings (customer)',
        getMyBookings: 'GET /room-bookings/my-bookings (customer)',
        getById: 'GET /room-bookings/:id (customer for own, owner+admin for hotel bookings)',
        update: 'PUT /room-bookings/:id (customer for own bookings)',
        cancel: 'DELETE /room-bookings/:id (customer for own bookings)',
        getOwnerBookings: 'GET /room-bookings/owner/my-bookings (owner)',
        updateStatus: 'PATCH /room-bookings/:id/status (owner, super_admin)',
        getAll: 'GET /room-bookings/admin/all (super_admin)',
        getStats: 'GET /room-bookings/admin/stats (super_admin)'
      },
      featuredHotels: {
        getAll: 'GET /featured-hotels (public)',
        getById: 'GET /featured-hotels/:id (public)',
        create: 'POST /featured-hotels (super_admin only)',
        update: 'PUT /featured-hotels/:id (super_admin only)',
        delete: 'DELETE /featured-hotels/:id (super_admin only)',
        toggle: 'POST /featured-hotels/:id/toggle (super_admin only)',
        getAvailableHotels: 'GET /featured-hotels/available-hotels (super_admin only)',
        getAdminAll: 'GET /featured-hotels/admin/all (super_admin only)'
      },
      stats: {
        system: 'GET /stats/system (super_admin only)',
        dashboard: 'GET /stats/dashboard (super_admin only)',
        users: 'GET /stats/users (super_admin only)',
        hotels: 'GET /stats/hotels (super_admin only)'
      }
    }
  });
});

export default router;
