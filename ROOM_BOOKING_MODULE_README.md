# Room Booking Module

## Overview

The Room Booking module provides comprehensive booking functionality for the Hajzi hospitality platform. It allows customers to book rooms, manage their reservations, and enables hotel owners and administrators to manage bookings effectively.

## Features

### Customer Features
- ✅ Create room bookings with guest details
- ✅ View all personal bookings with filtering and pagination
- ✅ Update booking details (with restrictions)
- ✅ Cancel bookings (with time restrictions)
- ✅ View detailed booking information

### Owner Features
- ✅ View all bookings for their hotels
- ✅ Filter bookings by status and hotel
- ✅ Update booking status (pending, confirmed, cancelled, rejected)
- ✅ Access to customer contact information

### Admin Features
- ✅ View all bookings across the platform
- ✅ Advanced filtering and search capabilities
- ✅ Booking statistics and analytics
- ✅ Full booking management capabilities

## Database Schema

### RoomBooking Model

```javascript
{
  fullName: String,           // Full name of the person making the booking
  guestName: String,          // Name of the guest (can be different from booker)
  phoneNumber: String,        // Yemen phone number format
  discountCode: String,       // Optional discount code
  checkIn: Date,             // Check-in date (must be in future)
  checkOut: Date,            // Check-out date (must be after check-in)
  adults: Number,            // Number of adults (1-20)
  children: Number,          // Number of children (0-10)
  notes: String,             // Optional notes (max 1000 chars)
  userId: ObjectId,          // Reference to User (customer)
  ownerId: ObjectId,         // Reference to User (hotel owner)
  roomId: ObjectId,          // Reference to Room
  hotelId: ObjectId,         // Reference to Hotel
  price: Number,             // Calculated: nights × room_price
  status: String,            // Enum: pending, confirmed, cancelled, rejected
  ownerWhatsappLink: String, // Optional WhatsApp link for owner
  createdAt: Date,           // Auto-generated
  updatedAt: Date            // Auto-generated
}
```

## API Endpoints

### Customer Endpoints

#### Create Booking
```http
POST /api/room-bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "أحمد محمد السعيد",
  "guestName": "أحمد محمد السعيد",
  "phoneNumber": "+967712345678",
  "discountCode": "SAVE10",
  "checkIn": "2024-02-15T00:00:00.000Z",
  "checkOut": "2024-02-18T00:00:00.000Z",
  "adults": 2,
  "children": 1,
  "notes": "نريد غرفة هادئة مع إفطار",
  "roomId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "hotelId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "ownerWhatsappLink": "https://wa.me/967712345678?text=مرحباً"
}
```

#### Get My Bookings
```http
GET /api/room-bookings/my-bookings?page=1&pageSize=20&status=confirmed&sortBy=createdAt&sortDir=desc
Authorization: Bearer <token>
```

#### Get Booking by ID
```http
GET /api/room-bookings/:id
Authorization: Bearer <token>
```

#### Update Booking
```http
PUT /api/room-bookings/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "fullName": "أحمد محمد السعيد",
  "guestName": "أحمد محمد السعيد",
  "phoneNumber": "+967712345678",
  "checkIn": "2024-02-16T00:00:00.000Z",
  "checkOut": "2024-02-19T00:00:00.000Z",
  "adults": 3,
  "children": 1,
  "notes": "تم تحديث عدد البالغين"
}
```

#### Cancel Booking
```http
DELETE /api/room-bookings/:id
Authorization: Bearer <token>
```

### Owner Endpoints

#### Get Owner Bookings
```http
GET /api/room-bookings/owner/my-bookings?page=1&pageSize=20&status=pending&hotelId=60f7b3b3b3b3b3b3b3b3b3b4
Authorization: Bearer <token>
```

#### Update Booking Status
```http
PATCH /api/room-bookings/:id/status
Authorization: Bearer <token>
Content-Type: application/json

{
  "status": "confirmed"
}
```

### Admin Endpoints

#### Get All Bookings
```http
GET /api/room-bookings/admin/all?page=1&pageSize=20&status=pending&hotelId=60f7b3b3b3b3b3b3b3b3b3b4&ownerId=60f7b3b3b3b3b3b3b3b3b3b5&search=أحمد
Authorization: Bearer <token>
```

#### Get Booking Statistics
```http
GET /api/room-bookings/admin/stats
Authorization: Bearer <token>
```

## Business Rules

### Booking Creation
- ✅ Check-in date must be in the future
- ✅ Check-out date must be after check-in date
- ✅ Room must be available for the selected dates
- ✅ Price is automatically calculated based on room price and number of nights
- ✅ Only customers can create bookings

### Booking Modification
- ✅ Only the customer who made the booking can modify it
- ✅ Booking can only be modified if status is "pending" and check-in is more than 48 hours away
- ✅ Room availability is re-checked when dates or room are changed
- ✅ Price is automatically recalculated when dates or room change

### Booking Cancellation
- ✅ Only the customer who made the booking can cancel it
- ✅ Booking can only be cancelled if check-in is more than 24 hours away
- ✅ Cancelled bookings cannot be restored

### Status Management
- ✅ Only hotel owners and super admins can change booking status
- ✅ Valid statuses: pending, confirmed, cancelled, rejected
- ✅ Status changes are logged with timestamps

## Validation Rules

### Phone Numbers
- Must follow Yemen phone number format: `+967` or `967` followed by 9 digits
- Examples: `+967712345678`, `967712345678`, `712345678`

### Dates
- Check-in must be in the future
- Check-out must be after check-in
- Dates are validated at both schema and business logic levels

### Guest Counts
- Adults: 1-20 (required)
- Children: 0-10 (required)
- Total capacity must not exceed room capacity

### WhatsApp Links
- Must be valid WhatsApp URL format
- Example: `https://wa.me/967712345678?text=مرحباً`

## Error Handling

### Common Error Responses

#### Validation Error (400)
```json
{
  "status": "error",
  "message": "Validation error",
  "errors": [
    {
      "field": "checkIn",
      "message": "Check-in date must be in the future"
    }
  ]
}
```

#### Room Not Available (400)
```json
{
  "status": "error",
  "message": "Room is not available for the selected dates"
}
```

#### Permission Denied (403)
```json
{
  "status": "error",
  "message": "You can only update your own bookings"
}
```

#### Booking Not Found (404)
```json
{
  "status": "error",
  "message": "Booking not found"
}
```

## Database Indexes

The RoomBooking model includes optimized indexes for:
- User bookings: `{ userId: 1, createdAt: -1 }`
- Owner bookings: `{ ownerId: 1, createdAt: -1 }`
- Hotel bookings by status: `{ hotelId: 1, status: 1 }`
- Room availability: `{ roomId: 1, checkIn: 1, checkOut: 1 }`
- Status queries: `{ status: 1, createdAt: -1 }`
- Date range queries: `{ checkIn: 1, checkOut: 1 }`

## Seeding

### Comprehensive Seeding
The comprehensive seed script includes sample room bookings:
```bash
npm run seed-comprehensive
```

### Room Booking Only
To seed only room bookings (requires existing users, hotels, and rooms):
```bash
npm run seed-room-bookings
```

### Sample Data
The seeding creates 8 sample bookings with various statuses:
- 4 confirmed bookings
- 3 pending bookings  
- 1 cancelled booking

## Security Features

### Authentication & Authorization
- ✅ All endpoints require authentication
- ✅ Role-based access control (customer, owner, super_admin)
- ✅ Users can only access their own bookings
- ✅ Owners can only manage bookings for their hotels

### Data Validation
- ✅ Input validation using Joi schemas
- ✅ Phone number format validation
- ✅ Date validation and business rules
- ✅ Room availability checking

### Business Logic Protection
- ✅ Automatic price calculation
- ✅ Room availability enforcement
- ✅ Time-based modification restrictions
- ✅ Status transition validation

## Usage Examples

### Frontend Integration

#### Create Booking Form
```javascript
const createBooking = async (bookingData) => {
  const response = await fetch('/api/room-bookings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(bookingData)
  });
  
  const result = await response.json();
  return result;
};
```

#### Booking List Component
```javascript
const fetchBookings = async (filters = {}) => {
  const queryParams = new URLSearchParams(filters);
  const response = await fetch(`/api/room-bookings/my-bookings?${queryParams}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const result = await response.json();
  return result.data.bookings;
};
```

#### Status Update (Owner Dashboard)
```javascript
const updateBookingStatus = async (bookingId, status) => {
  const response = await fetch(`/api/room-bookings/${bookingId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
  
  const result = await response.json();
  return result;
};
```

## Future Enhancements

### Planned Features
- [ ] Payment integration
- [ ] Email notifications
- [ ] SMS notifications via WhatsApp
- [ ] Booking confirmation emails
- [ ] Reminder notifications
- [ ] Review system integration
- [ ] Loyalty program integration
- [ ] Multi-language support
- [ ] Mobile app API optimization

### Performance Optimizations
- [ ] Caching for frequently accessed bookings
- [ ] Database query optimization
- [ ] Real-time availability updates
- [ ] Background job processing
- [ ] API rate limiting

## Troubleshooting

### Common Issues

#### "Room is not available"
- Check if room exists and is visible
- Verify date range doesn't conflict with existing bookings
- Ensure check-in/check-out dates are valid

#### "Booking cannot be modified"
- Verify booking status is "pending"
- Check if check-in is more than 48 hours away
- Ensure user owns the booking

#### "Permission denied"
- Verify user authentication
- Check user role and permissions
- Ensure user owns the booking or has admin access

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your environment variables.

## Contributing

When contributing to the Room Booking module:

1. Follow the existing code patterns and conventions
2. Add comprehensive validation for new fields
3. Update this documentation for any changes
4. Add appropriate error handling
5. Include unit tests for new functionality
6. Update the seeding scripts if needed

## Support

For technical support or questions about the Room Booking module:
- Check the API documentation
- Review the validation rules
- Test with the provided sample data
- Contact the development team
