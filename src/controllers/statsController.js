import asyncHandler from '../utils/asyncHandler.js';
import { sendResponse } from '../utils/response.js';
import User from '../models/User.js';
import City from '../models/City.js';
import Hotel from '../models/Hotel.js';
import Amenity from '../models/Amenity.js';
import Room from '../models/Room.js';

// @desc    Get comprehensive system statistics for super admin
// @route   GET /api/v1/stats/system
// @access  Private (Super Admin only)
export const getSystemStats = asyncHandler(async (req, res, next) => {
  // Get all counts in parallel for better performance
  const [
    totalCities,
    totalUsers,
    totalHotels,
    totalAmenities,
    usersByRole,
    usersByStatus,
    hotelsByStatus,
    recentUsers,
    recentHotels,
    cityStats
  ] = await Promise.all([
    // Basic counts
    City.countDocuments(),
    User.countDocuments(),
    Hotel.countDocuments(),
    Amenity.countDocuments(),
    
    // Users by role
    User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } }
    ]),
    
    // Users by status
    User.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    // Hotels by status
    Hotel.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    
    // Recent users (last 7 days)
    User.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('fullName email role status createdAt'),
    
    // Recent hotels (last 7 days)
    Hotel.find({
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .select('name status stars createdAt'),
    
    // Cities with user counts
    City.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'cityId',
          as: 'users'
        }
      },
      {
        $lookup: {
          from: 'hotels',
          localField: '_id',
          foreignField: 'cityId',
          as: 'hotels'
        }
      },
      {
        $project: {
          name: 1,
          userCount: { $size: '$users' },
          hotelCount: { $size: '$hotels' },
          createdAt: 1
        }
      },
      { $sort: { createdAt: -1 } }
    ])
  ]);

  // Process role counts
  const roleCounts = {};
  usersByRole.forEach(item => {
    roleCounts[item._id] = item.count;
  });

  // Process status counts
  const statusCounts = {};
  usersByStatus.forEach(item => {
    statusCounts[item._id] = item.count;
  });

  // Process hotel status counts
  const hotelStatusCounts = {};
  hotelsByStatus.forEach(item => {
    hotelStatusCounts[item._id] = item.count;
  });

  // Calculate growth percentages (comparing last 7 days vs previous 7 days)
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const previousWeek = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  
  const [lastWeekUsers, previousWeekUsers, lastWeekHotels, previousWeekHotels] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: lastWeek } }),
    User.countDocuments({ createdAt: { $gte: previousWeek, $lt: lastWeek } }),
    Hotel.countDocuments({ createdAt: { $gte: lastWeek } }),
    Hotel.countDocuments({ createdAt: { $gte: previousWeek, $lt: lastWeek } })
  ]);

  const userGrowthPercent = previousWeekUsers > 0 
    ? Math.round(((lastWeekUsers - previousWeekUsers) / previousWeekUsers) * 100)
    : lastWeekUsers > 0 ? 100 : 0;

  const hotelGrowthPercent = previousWeekHotels > 0
    ? Math.round(((lastWeekHotels - previousWeekHotels) / previousWeekHotels) * 100)
    : lastWeekHotels > 0 ? 100 : 0;

  const stats = {
    overview: {
      totalCities,
      totalUsers,
      totalHotels,
      totalAmenities
    },
    users: {
      total: totalUsers,
      byRole: {
        super_admin: roleCounts.super_admin || 0,
        city_admin: roleCounts.city_admin || 0,
        owner: roleCounts.owner || 0,
        customer: roleCounts.customer || 0
      },
      byStatus: {
        active: statusCounts.active || 0,
        inactive: statusCounts.inactive || 0,
        pending_approval: statusCounts.pending_approval || 0
      },
      growth: {
        lastWeek: lastWeekUsers,
        previousWeek: previousWeekUsers,
        percentage: userGrowthPercent
      }
    },
    hotels: {
      total: totalHotels,
      byStatus: {
        pending: hotelStatusCounts.pending || 0,
        approved: hotelStatusCounts.approved || 0,
        rejected: hotelStatusCounts.rejected || 0
      },
      growth: {
        lastWeek: lastWeekHotels,
        previousWeek: previousWeekHotels,
        percentage: hotelGrowthPercent
      }
    },
    cities: cityStats,
    recent: {
      users: recentUsers,
      hotels: recentHotels
    }
  };

  sendResponse(res, 200, 'success', 'System statistics retrieved successfully', stats);
});

// @desc    Get dashboard summary stats for super admin
// @route   GET /api/v1/stats/dashboard
// @access  Private (Super Admin only)
export const getDashboardStats = asyncHandler(async (req, res, next) => {
  // Get quick stats for dashboard cards
  const [
    totalCities,
    totalCityAdmins,
    totalUsers,
    totalHotels,
    totalRooms
  ] = await Promise.all([
    City.countDocuments(),
    User.countDocuments({ role: 'city_admin' }),
    User.countDocuments(),
    Hotel.countDocuments(),
    Room.countDocuments()
  ]);

  // Get recent activity (last 24 hours)
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  const [
    newUsers24h,
    newHotels24h,
    newCities24h,
    newRooms24h
  ] = await Promise.all([
    User.countDocuments({ createdAt: { $gte: last24Hours } }),
    Hotel.countDocuments({ createdAt: { $gte: last24Hours } }),
    City.countDocuments({ createdAt: { $gte: last24Hours } }),
    Room.countDocuments({ createdAt: { $gte: last24Hours } })
  ]);

  const dashboardStats = {
    cities: {
      total: totalCities,
      new: newCities24h
    },
    cityAdmins: {
      total: totalCityAdmins
    },
    users: {
      total: totalUsers,
      new: newUsers24h
    },
    hotels: {
      total: totalHotels,
      new: newHotels24h
    },
    rooms: {
      total: totalRooms,
      new: newRooms24h
    }
  };

  sendResponse(res, 200, 'success', 'Dashboard statistics retrieved successfully', dashboardStats);
});

// @desc    Get user statistics
// @route   GET /api/v1/stats/users
// @access  Private (Super Admin only)
export const getUserStats = asyncHandler(async (req, res, next) => {
  const userStats = await User.aggregate([
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pendingUsers: { $sum: { $cond: [{ $eq: ['$status', 'pending_approval'] }, 1, 0] } },
        inactiveUsers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } }
      }
    },
    {
      $project: {
        _id: 0,
        totalUsers: 1,
        activeUsers: 1,
        pendingUsers: 1,
        inactiveUsers: 1
      }
    }
  ]);

  const roleDistribution = await User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const statusDistribution = await User.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]);

  const monthlyGrowth = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  sendResponse(res, 200, 'success', 'User statistics retrieved successfully', {
    overview: userStats[0] || { totalUsers: 0, activeUsers: 0, pendingUsers: 0, inactiveUsers: 0 },
    roleDistribution,
    statusDistribution,
    monthlyGrowth
  });
});

// @desc    Get hotel statistics
// @route   GET /api/v1/stats/hotels
// @access  Private (Super Admin only)
export const getHotelStats = asyncHandler(async (req, res, next) => {
  const hotelStats = await Hotel.aggregate([
    {
      $group: {
        _id: null,
        totalHotels: { $sum: 1 },
        approvedHotels: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
        pendingHotels: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        rejectedHotels: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        averageStars: { $avg: '$stars' },
        totalRooms: { $sum: '$roomsNumber' }
      }
    },
    {
      $project: {
        _id: 0,
        totalHotels: 1,
        approvedHotels: 1,
        pendingHotels: 1,
        rejectedHotels: 1,
        averageStars: { $round: ['$averageStars', 1] },
        totalRooms: 1
      }
    }
  ]);

  const hotelsByCity = await Hotel.aggregate([
    {
      $lookup: {
        from: 'cities',
        localField: 'cityId',
        foreignField: '_id',
        as: 'city'
      }
    },
    {
      $group: {
        _id: '$cityId',
        cityName: { $first: { $arrayElemAt: ['$city.name', 0] } },
        hotelCount: { $sum: 1 },
        averageStars: { $avg: '$stars' }
      }
    },
    { $sort: { hotelCount: -1 } }
  ]);

  const monthlyGrowth = await Hotel.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);

  sendResponse(res, 200, 'success', 'Hotel statistics retrieved successfully', {
    overview: hotelStats[0] || { totalHotels: 0, approvedHotels: 0, pendingHotels: 0, rejectedHotels: 0, averageStars: 0, totalRooms: 0 },
    hotelsByCity,
    monthlyGrowth
  });
});
