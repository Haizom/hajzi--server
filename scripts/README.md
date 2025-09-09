# Database Seeding Scripts

This directory contains scripts to seed the Hajzi backend database with sample data.

## Available Scripts

### 1. `comprehensiveSeed.js` (Recommended)
**Command:** `npm run seed-comprehensive`

This is the main seeding script that creates all required data:
- **10 Amenities** in Arabic (WiFi, AC, Restaurant, Parking, etc.)
- **5 Cities** in Yemen in Arabic (Sana'a, Aden, Taiz, Al Hudaydah, Al Mukalla)
- **5 Hotels** with full details and Arabic descriptions
- **6 Users** with different roles and Arabic names

### 2. `seedData.js`
**Command:** `npm run seed`

Basic seeding script that creates:
- Cities
- Super admin
- City admins
- Hotel owners
- Customers

### 3. `seedUsers.js`
**Command:** `node scripts/seedUsers.js`

Creates only user accounts with different roles.

### 4. `seedCities.js`
**Command:** `node scripts/seedCities.js`

Creates only city data.

### 5. `seedAmenities.js`
**Command:** `node scripts/seedAmenities.js`

Creates only amenity data.

### 6. `createSuperAdmin.js`
**Command:** `npm run create-super-admin`

Creates only a super admin user.

## Prerequisites

1. **Environment Setup**: Ensure you have a `config.env` file with:
   ```
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   ```

2. **Database Connection**: Make sure your MongoDB instance is running and accessible.

3. **Dependencies**: Install all required packages:
   ```bash
   npm install
   ```

## Usage

### Quick Start (Recommended)
```bash
# Navigate to backend directory
cd backend

# Run comprehensive seeding
npm run seed-comprehensive
```

### Individual Scripts
```bash
# Seed only users
node scripts/seedUsers.js

# Seed only cities
node scripts/seedCities.js

# Seed only amenities
node scripts/seedAmenities.js

# Create super admin only
npm run create-super-admin
```

## What Gets Created

### Amenities (10 items)
- واي فاي مجاني (Free WiFi)
- تكييف هواء (Air Conditioning)
- مطعم (Restaurant)
- موقف سيارات مجاني (Free Parking)
- غرفة اجتماعات (Meeting Room)
- صالة رياضية (Gym)
- مسبح (Swimming Pool)
- خدمة تنظيف يومية (Daily Housekeeping)
- مطبخ مجهز (Kitchen)
- حديقة (Garden)

### Cities (5 cities in Yemen)
- صنعاء (Sana'a) - Capital
- عدن (Aden) - Port city
- تعز (Taiz) - Cultural center
- الحديدة (Al Hudaydah) - Red Sea port
- المكلا (Al Mukalla) - Arabian Sea port

### Hotels (5 hotels)
1. **فندق صنعاء الدولي** - 5-star hotel in Sana'a
2. **فندق عدن السياحي** - 4-star beach hotel in Aden
3. **فندق تعز التراثي** - 3-star heritage hotel in Taiz
4. **فندق الحديدة البحري** - 4-star beach hotel in Al Hudaydah
5. **فندق المكلا الساحلي** - 5-star coastal hotel in Al Mukalla

### Users (6 users)
1. **Super Admin**: admin@hajzi.com / SuperAdmin123!
2. **City Admin (Sana'a)**: sanaa.admin@hajzi.com / CityAdmin123!
3. **City Admin (Taiz)**: taiz.admin@hajzi.com / CityAdmin123!
4. **Hotel Owner (Khalid)**: khalid.owner@hajzi.com / Owner123!
5. **Hotel Owner (Nadia)**: nadia.owner@hajzi.com / Owner123!
6. **Hotel Owner (Ali)**: ali.owner@hajzi.com / Owner123!
7. **Customer (Abdullah)**: abdullah.customer@hajzi.com / Customer123!
8. **Customer (Amina)**: amina.customer@hajzi.com / Customer123!
9. **Customer (Youssef)**: youssef.customer@hajzi.com / Customer123!

## Data Structure

### User Roles
- **super_admin**: Full system access
- **city_admin**: City-level administration (assigned to specific city)
- **owner**: Hotel owner (can manage their hotels)
- **customer**: End user (can browse and book)

### Hotel Status
- **pending**: Awaiting approval
- **approved**: Ready for bookings
- **rejected**: Not approved

### Amenity Categories
Amenities are categorized for better organization and filtering.

## Important Notes

⚠️ **Security Warning**: All default passwords are simple for development. **Change them immediately in production!**

🔒 **Production Use**: 
- Update all passwords
- Use strong, unique passwords
- Consider using environment variables for sensitive data

🔄 **Re-running**: Scripts will clear existing data before seeding. Use with caution in production.

## Troubleshooting

### Common Issues

1. **Connection Error**: Check your `MONGODB_URI` in `config.env`
2. **Permission Error**: Ensure your MongoDB user has write permissions
3. **Duplicate Key Error**: Scripts automatically clear existing data, but check for unique constraints

### Error Messages

- **"Database connection error"**: Check MongoDB connection string
- **"Some users already exist"**: Database already has data, scripts will clear it
- **"Validation failed"**: Check model requirements and data format

## Customization

To modify the seeded data:

1. **Edit the script files** to change names, descriptions, or add more items
2. **Update the data arrays** with your preferred content
3. **Modify user credentials** as needed
4. **Add more amenities** or cities as required

## Support

For issues with seeding:
1. Check the console output for specific error messages
2. Verify your MongoDB connection
3. Ensure all required environment variables are set
4. Check that all models are properly imported
