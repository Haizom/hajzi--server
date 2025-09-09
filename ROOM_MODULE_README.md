# Room Module Implementation

This document describes the complete Room module implementation following the same architecture, patterns, and conventions used for the existing Hotel module.

## Overview

The Room module provides comprehensive functionality for managing hotel rooms, including CRUD operations, availability management, visibility controls, and proper access control based on user roles.

## Data Model

### Room Schema

```javascript
{
  id: ObjectId (PK, implicit by Mongoose)
  hotelId: ObjectId (FK → Hotel, required, ref: "Hotel")
  name: String (required, trim, 2–120 chars)
  description: String (optional, trim, max 2,000)
  numberOfBeds: Number (required, min 1, max 20)
  numberOfBathrooms: Number (required, min 0, allows decimals)
  roomSize: Number (optional, square meters)
  moreInfo: String[] (optional, each trimmed, max 200 chars per item, total items max 20)
  basePrice: Number (required, min 0)
  currency: Enum ("YER" | "USD" | "SAR", required)
  capacity: Number (required, min 1)
  images: String[] (URLs, max length = 4, validates URL format)
  availableDates: Date[] (list of unique day-start dates, UTC)
  amenityIds: ObjectId[] (FK → Amenity, optional, ref: "Amenity")
  status: Enum ("visible" | "hidden", default "visible")
  createdAt: Date (automatic timestamp)
  updatedAt: Date (automatic timestamp)
}
```

### Key Features

- **Automatic Timestamps**: `createdAt` and `updatedAt` are automatically managed
- **Data Validation**: Comprehensive validation rules for all fields
- **URL Validation**: Image URLs are validated for proper format
- **Date Normalization**: Available dates are automatically normalized to UTC day-start
- **Deduplication**: Available dates are automatically deduplicated
- **Virtual Fields**: Provides populated references to related models

## Indexes & Constraints

### Performance Indexes
- `{ hotelId: 1, name: 1 }` - Unique compound index (prevents duplicate room names within same hotel)
- `{ hotelId: 1, status: 1 }` - Fast listing by hotel
- `{ status: 1 }` - Public filters
- `{ basePrice: 1 }` - Price-based queries
- `{ capacity: 1 }` - Capacity-based queries
- `{ numberOfBeds: 1 }` - Bed-based queries

### Business Rules
- Room names must be unique within the same hotel
- Hotel must exist before room creation
- Amenities must exist if referenced

## API Endpoints

### 1. Create Room
- **Route**: `POST /api/rooms`
- **Access**: Owner + SuperAdmin
- **Description**: Creates a new room for a hotel
- **Validation**: `validateCreateRoom` middleware
- **Business Logic**: 
  - Checks hotel ownership
  - Validates duplicate room names
  - Normalizes available dates

### 2. Update Room
- **Route**: `PATCH /api/rooms/:roomId`
- **Access**: Owner + SuperAdmin
- **Description**: Updates room information
- **Validation**: `validateUpdateRoom` middleware
- **Business Logic**: 
  - Checks room ownership
  - Validates duplicate names if changed
  - Updates only provided fields

### 3. Edit Room Availability
- **Route**: `PATCH /api/rooms/:roomId/availability`
- **Access**: Owner + SuperAdmin
- **Description**: Updates room availability dates
- **Validation**: `validateRoomAvailability` middleware
- **Business Logic**: 
  - Normalizes dates to UTC day-start
  - Deduplicates dates
  - Sorts dates chronologically

### 4. Toggle Room Visibility
- **Route**: `PATCH /api/rooms/:roomId/visibility`
- **Access**: Owner + SuperAdmin
- **Description**: Shows/hides room from public view
- **Validation**: `validateRoomVisibility` middleware
- **Business Logic**: 
  - Updates status to "visible" or "hidden"
  - Maintains consistency with hotel visibility approach

### 5. List Hotel Rooms
- **Route**: `GET /api/hotels/:hotelId/rooms`
- **Access**: Public (with role-based filtering)
- **Description**: Lists rooms for a specific hotel
- **Query Parameters**:
  - `page`: Page number (default: 1)
  - `limit`: Items per page (default: 20)
  - `status`: Filter by status (visible/hidden/all, default: visible)
- **Business Logic**: 
  - Public users see only visible rooms
  - Hotel owners see all their rooms
  - SuperAdmins see all rooms

### 6. Get Room Details
- **Route**: `GET /api/rooms/:roomId`
- **Access**: Public (visible rooms), Owner+Admin (hidden rooms)
- **Description**: Retrieves detailed room information
- **Business Logic**: 
  - Visible rooms accessible to everyone
  - Hidden rooms only accessible to owners and super admins

### 7. Owner Dashboard
- **Route**: `GET /api/rooms/owner/my-rooms`
- **Access**: Owner only
- **Description**: Lists all rooms owned by the authenticated user
- **Query Parameters**:
  - `page`: Page number
  - `limit`: Items per page
  - `hotelId`: Filter by specific hotel
  - `status`: Filter by room status

### 8. Delete Room
- **Route**: `DELETE /api/rooms/:roomId`
- **Access**: SuperAdmin only
- **Description**: Permanently removes a room
- **Business Logic**: 
  - Future: Check for existing bookings
  - Soft delete could be implemented later

## Validation Rules

### Create Room Schema
- All required fields validated
- String length limits enforced
- Numeric range validation
- URL format validation for images
- Date format validation for available dates
- ObjectId validation for references

### Update Room Schema
- All fields optional
- Same validation rules as create
- Partial updates supported

### Availability Validation
- Array of dates required
- Each date validated as valid ISO date
- Empty arrays not allowed

### Visibility Validation
- Status must be "visible" or "hidden"
- No other values accepted

## Access Control

### Role-Based Access
- **Public**: Can view visible rooms and hotel room lists
- **Owner**: Can manage rooms in hotels they own
- **SuperAdmin**: Can manage all rooms and delete any room

### Ownership Verification
- Room operations verify hotel ownership
- Cross-hotel access prevented
- Proper error messages for unauthorized access

## Data Integrity

### Pre-save Middleware
- Validates hotel existence
- Validates amenity references
- Normalizes available dates
- Ensures data consistency

### Pre-remove Middleware
- Future: Check for existing bookings
- Prevents deletion of rooms with active reservations

## Response Format

All API responses follow the standard format:

```javascript
{
  status: "success" | "error",
  message: "Human readable message",
  data: { /* response data */ },
  timestamp: "ISO timestamp"
}
```

### Error Responses
```javascript
{
  status: "error",
  message: "Error description",
  errors: [
    {
      field: "fieldName",
      message: "Validation error message"
    }
  ]
}
```

## Integration Points

### Hotel Module
- Rooms are linked to hotels via `hotelId`
- Hotel routes include room listing endpoint
- Consistent visibility patterns

### Amenity Module
- Rooms can have multiple amenities
- Amenity references validated on creation/update
- Populated in responses for display

### User Module
- Owner verification for room operations
- Role-based access control
- User authentication required for protected routes

## Testing

### Test Coverage
- Model creation and validation
- Business rule enforcement
- Date normalization
- Unique constraint validation

### Test File
- `backend/tests/room.test.js`
- Comprehensive test scenarios
- Database cleanup between tests

## Future Enhancements

### Potential Features
- Room booking system integration
- Room availability calendar
- Room pricing variations by date
- Room photos management
- Room reviews and ratings

### Technical Improvements
- Soft delete implementation
- Room search functionality
- Room availability caching
- Bulk room operations
- Room statistics and analytics

## Usage Examples

### Creating a Room
```javascript
const roomData = {
  hotelId: "hotelObjectId",
  name: "Deluxe Suite",
  description: "Spacious suite with city view",
  numberOfBeds: 2,
  numberOfBathrooms: 1.5,
  roomSize: 45,
  moreInfo: ["Free WiFi", "City view", "Balcony"],
  basePrice: 150,
  currency: "USD",
  capacity: 4,
  images: ["https://example.com/room1.jpg"],
  availableDates: ["2024-01-01", "2024-01-02"],
  amenityIds: ["amenity1Id", "amenity2Id"]
};

const room = await Room.create(roomData);
```

### Updating Room Availability
```javascript
const availableDates = [
  "2024-01-01",
  "2024-01-02", 
  "2024-01-03"
];

await Room.findByIdAndUpdate(roomId, { availableDates });
```

### Listing Hotel Rooms
```javascript
// Public endpoint
GET /api/hotels/hotelId/rooms?page=1&limit=10&status=visible

// Owner endpoint  
GET /api/rooms/owner/my-rooms?hotelId=hotelId&status=all
```

## Conclusion

The Room module provides a robust, scalable solution for hotel room management that follows established architectural patterns and maintains consistency with the existing codebase. It includes comprehensive validation, proper access control, and follows RESTful API design principles.
