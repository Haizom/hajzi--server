# Hajzi Backend API

Backend API for the Hajzi Yemen Hospitality Booking Platform.

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account or local MongoDB instance
- npm or yarn

### Installation

1. **Clone and navigate to backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   - Copy `config.env` and update with your actual credentials
   - Update `MONGODB_URI` with your MongoDB connection string
   - Change `JWT_SECRET` to a secure secret key

4. **Start the server**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

5. **Create Super Admin (First Time Setup)**
   ```bash
   # Create super admin user
   npm run create-super-admin
   
   # Or seed database with sample data
   npm run seed
   ```

## 📁 Project Structure

```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/         # MongoDB schemas
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Helper utilities
├── config/
│   └── database.js     # Database connection
├── tests/              # Test files
├── package.json
└── README.md
```

## 🔗 API Endpoints

### Health Check
- **GET** `/health` - Server health status

### Authentication
- **POST** `/api/v1/auth/register` - Register new user (customer/owner only)
- **POST** `/api/v1/auth/login` - Login user
- **GET** `/api/v1/auth/me` - Get current user data
- **PATCH** `/api/v1/auth/update-password` - Update password
- **PATCH** `/api/v1/auth/update-profile` - Update profile
- **POST** `/api/v1/auth/logout` - Logout user
- **POST** `/api/v1/auth/refresh` - Refresh JWT token

### Users
- **GET** `/api/v1/users/me` - Get current user data
- **GET** `/api/v1/users/:id` - Get user by ID
- **GET** `/api/v1/users` - Get all users (super_admin only)
- **POST** `/api/v1/users/city-admin` - Create city admin (super_admin only)
- **PATCH** `/api/v1/users/:id/status` - Update user status (super_admin only)
- **PATCH** `/api/v1/users/:id/role` - Update user role (super_admin only)
- **DELETE** `/api/v1/users/:id` - Delete user (super_admin only)
- **GET** `/api/v1/users/city/:cityId` - Get users by city (super_admin, city_admin)

### Cities
- **GET** `/api/v1/cities` - Get all cities
- **GET** `/api/v1/cities/:id` - Get city by ID
- **GET** `/api/v1/cities/search` - Search cities by name
- **POST** `/api/v1/cities` - Create city (super_admin only)
- **PATCH** `/api/v1/cities/:id` - Update city (super_admin only)
- **DELETE** `/api/v1/cities/:id` - Delete city (super_admin only)
- **GET** `/api/v1/cities/:id/stats` - Get city statistics (super_admin, city_admin)

### API Base
- **GET** `/api/v1` - API information and available endpoints

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | Required |
| `PORT` | Server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `JWT_SECRET` | JWT signing secret | Required |
| `JWT_EXPIRE` | JWT expiration time | 30d |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |
| `API_VERSION` | API version | v1 |

## 👥 User Roles & Permissions

### Role Hierarchy
1. **Super Admin** - Full system access
   - Manage all users and cities
   - Create city administrators
   - View all data across cities

2. **City Admin** - City-level administration
   - Manage users within assigned city
   - View city statistics
   - Cannot access other cities' data

3. **Owner** - Property owner
   - Manage their own properties (future feature)
   - View booking data for their properties

4. **Customer** - End user
   - Browse and book properties
   - Manage their own profile

### Authentication & Authorization
- **JWT-based authentication** with token expiration
- **Role-based access control (RBAC)** middleware
- **City-scoped permissions** for city admins
- **Input validation** on all endpoints
- **Password hashing** with bcryptjs

## 🔧 Development

### Available Scripts
- `npm run dev` - Start development server with nodemon
- `npm start` - Start production server
- `npm run create-super-admin` - Create super admin user
- `npm run seed` - Seed database with sample data
- `npm test` - Run tests (to be implemented)

### Database Connection
The application connects to MongoDB Atlas using the provided connection string. Ensure your MongoDB cluster allows connections from your IP address.

## 📝 API Response Format

### Success Response
```json
{
  "status": "success",
  "message": "Operation successful",
  "data": {...},
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "status": "error",
  "message": "Error description",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Input validation** - Request data validation
- **JWT authentication** - Secure user authentication
- **bcryptjs** - Password hashing

## 🚦 Getting Started

1. **Test the health endpoint**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Check API base**
   ```bash
   curl http://localhost:5000/api/v1
   ```

## 📚 Next Steps

1. Implement authentication routes
2. Create property management endpoints
3. Add booking system APIs
4. Implement user management
5. Add file upload capabilities
6. Set up email notifications

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check MongoDB URI in config.env
   - Ensure IP whitelist in MongoDB Atlas
   - Verify network connectivity

2. **Port Already in Use**
   - Change PORT in config.env
   - Kill existing process on port 5000

3. **Module Import Errors**
   - Ensure `"type": "module"` in package.json
   - Use .js extensions in imports

## 📞 Support

For issues and questions, please check the project documentation or create an issue in the repository.
