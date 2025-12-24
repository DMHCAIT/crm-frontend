# CRM API Documentation

## Table of Contents
- [Authentication](#authentication)
- [Calendar API](#calendar-api)
- [Email API](#email-api)
- [Response Format](#response-format)
- [Error Codes](#error-codes)

---

## Authentication

All API endpoints require JWT authentication. Include the token in the Authorization header:

```http
Authorization: Bearer <your-jwt-token>
```

**Get Token:**
```http
POST /api/auth?action=login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "yourpassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "username": "user@example.com",
      "role": "admin"
    }
  }
}
```

---

## Calendar API

Base URL: `/api/calendar`

### List Events

Get events within a date range.

**Endpoint:** `GET /api/calendar?action=list&start_date=YYYY-MM-DD&end_date=YYYY-MM-DD`

**Query Parameters:**
- `start_date` (required): Start date in ISO format
- `end_date` (required): End date in ISO format
- `type` (optional): Event type filter (`meeting`, `call`, `demo`, `follow_up`, `reminder`, `other`)
- `status` (optional): Event status filter (`scheduled`, `completed`, `cancelled`, `rescheduled`)

**Example Request:**
```http
GET /api/calendar?action=list&start_date=2024-01-01&end_date=2024-01-31&type=meeting
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Events fetched successfully",
  "data": [
    {
      "id": "uuid",
      "title": "Client Meeting",
      "description": "Discuss project requirements",
      "start_time": "2024-01-15T10:00:00Z",
      "end_time": "2024-01-15T11:00:00Z",
      "type": "meeting",
      "status": "scheduled",
      "location": "Conference Room A",
      "attendees": ["john@example.com", "jane@example.com"],
      "lead_id": "uuid",
      "user_id": "uuid",
      "created_at": "2024-01-10T08:00:00Z"
    }
  ]
}
```

---

### Create Event

Create a new calendar event.

**Endpoint:** `POST /api/calendar?action=create`

**Request Body:**
```json
{
  "title": "Client Meeting",
  "description": "Discuss project requirements",
  "start_time": "2024-01-15T10:00:00Z",
  "end_time": "2024-01-15T11:00:00Z",
  "type": "meeting",
  "location": "Conference Room A",
  "attendees": ["john@example.com", "jane@example.com"],
  "lead_id": "uuid",
  "reminder_minutes": 30
}
```

**Required Fields:**
- `title`: Event title (string)
- `start_time`: Event start time (ISO 8601)
- `end_time`: Event end time (ISO 8601)

**Optional Fields:**
- `description`: Event description
- `type`: Event type (`meeting`, `call`, `demo`, `follow_up`, `reminder`, `other`)
- `location`: Event location
- `attendees`: Array of email addresses
- `lead_id`: Associated lead UUID
- `reminder_minutes`: Minutes before event to send reminder

**Response:**
```json
{
  "success": true,
  "message": "Event created successfully",
  "data": {
    "id": "uuid",
    "title": "Client Meeting",
    ...
  }
}
```

**Conflict Detection:**
If the time slot conflicts with an existing event, returns:
```json
{
  "success": false,
  "message": "Time slot conflicts with existing event",
  "errorCode": "CONFLICT"
}
```

---

### Get Single Event

Get details of a specific event.

**Endpoint:** `GET /api/calendar?action=get&id=<event-id>`

**Response:**
```json
{
  "success": true,
  "message": "Event fetched successfully",
  "data": {
    "id": "uuid",
    "title": "Client Meeting",
    ...
  }
}
```

---

### Update Event

Update an existing event.

**Endpoint:** `PUT /api/calendar?action=update&id=<event-id>`

**Request Body:**
```json
{
  "title": "Updated Meeting Title",
  "start_time": "2024-01-15T11:00:00Z",
  "end_time": "2024-01-15T12:00:00Z",
  "status": "rescheduled"
}
```

**Note:** Conflict detection runs if `start_time` or `end_time` is changed.

---

### Delete Event

Delete an event.

**Endpoint:** `DELETE /api/calendar?action=delete&id=<event-id>`

**Response:**
```json
{
  "success": true,
  "message": "Event deleted successfully",
  "data": null
}
```

---

### Get Upcoming Events

Get all upcoming events for the authenticated user (next 7 days).

**Endpoint:** `GET /api/calendar?action=upcoming`

**Response:**
```json
{
  "success": true,
  "message": "Upcoming events fetched",
  "data": [...]
}
```

---

### Get Today's Events

Get all events scheduled for today.

**Endpoint:** `GET /api/calendar?action=today`

**Response:**
```json
{
  "success": true,
  "message": "Today's events fetched",
  "data": [...]
}
```

---

### Check Conflicts

Check if a time slot conflicts with existing events.

**Endpoint:** `GET /api/calendar?action=check-conflicts&start_time=ISO&end_time=ISO&exclude_event_id=uuid`

**Query Parameters:**
- `start_time` (required): Start time in ISO format
- `end_time` (required): End time in ISO format
- `exclude_event_id` (optional): Event ID to exclude from conflict check

**Response:**
```json
{
  "success": true,
  "message": "Conflict check completed",
  "data": {
    "hasConflicts": true,
    "conflicts": [
      {
        "id": "uuid",
        "title": "Existing Meeting",
        "start_time": "2024-01-15T10:30:00Z",
        "end_time": "2024-01-15T11:30:00Z"
      }
    ]
  }
}
```

---

## Email API

Base URL: `/api/email`

### Send Email

Send a single email.

**Endpoint:** `POST /api/email?action=send`

**Request Body:**
```json
{
  "to": "recipient@example.com",
  "subject": "Welcome to CRM",
  "text": "Plain text version",
  "html": "<h1>HTML version</h1>",
  "attachments": [
    {
      "filename": "document.pdf",
      "path": "/path/to/file.pdf"
    }
  ]
}
```

**Required Fields:**
- `to`: Recipient email address
- `subject`: Email subject
- `text` or `html`: Email content (at least one required)

**Response:**
```json
{
  "success": true,
  "message": "Email sent successfully",
  "data": {
    "messageId": "<abc123@example.com>"
  }
}
```

---

### Send Template Email

Send an email using a predefined template.

**Endpoint:** `POST /api/email?action=send-template`

**Available Templates:**
- `welcome`: Welcome new users
- `leadAssigned`: Notify user of new lead assignment
- `leadStatusChange`: Notify status change of a lead
- `passwordReset`: Send password reset link
- `dailyReport`: Send daily activity report

**Request Body:**
```json
{
  "template": "welcome",
  "to": "newuser@example.com",
  "data": {
    "name": "John Doe",
    "loginUrl": "https://crm.example.com/login",
    "username": "john@example.com"
  }
}
```

**Template-Specific Data:**

**Welcome Template:**
```json
{
  "template": "welcome",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "loginUrl": "https://crm.example.com",
    "username": "john@example.com"
  }
}
```

**Lead Assigned Template:**
```json
{
  "template": "leadAssigned",
  "to": "agent@example.com",
  "data": {
    "agentName": "Jane Smith",
    "leadName": "ABC Corp",
    "leadUrl": "https://crm.example.com/leads/123"
  }
}
```

**Lead Status Change Template:**
```json
{
  "template": "leadStatusChange",
  "to": "manager@example.com",
  "data": {
    "leadName": "ABC Corp",
    "oldStatus": "New",
    "newStatus": "Qualified",
    "leadUrl": "https://crm.example.com/leads/123"
  }
}
```

**Password Reset Template:**
```json
{
  "template": "passwordReset",
  "to": "user@example.com",
  "data": {
    "name": "John Doe",
    "resetUrl": "https://crm.example.com/reset?token=abc123"
  }
}
```

**Daily Report Template:**
```json
{
  "template": "dailyReport",
  "to": "manager@example.com",
  "data": {
    "userName": "Jane Smith",
    "date": "2024-01-15",
    "newLeads": 5,
    "convertedLeads": 2,
    "totalRevenue": 50000,
    "reportUrl": "https://crm.example.com/reports"
  }
}
```

---

### Send Bulk Email

Send multiple emails in a single request.

**Endpoint:** `POST /api/email?action=send-bulk`

**Request Body:**
```json
{
  "emails": [
    {
      "to": "user1@example.com",
      "subject": "Subject 1",
      "html": "<p>Email 1</p>"
    },
    {
      "to": "user2@example.com",
      "subject": "Subject 2",
      "html": "<p>Email 2</p>"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Sent 2 of 2 emails",
  "data": {
    "total": 2,
    "success": 2,
    "failed": 0,
    "results": [
      {
        "success": true,
        "messageId": "<abc@example.com>",
        "to": "user1@example.com"
      },
      {
        "success": true,
        "messageId": "<def@example.com>",
        "to": "user2@example.com"
      }
    ]
  }
}
```

---

## Response Format

All API responses follow this format:

**Success Response:**
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

**Error Response:**
```json
{
  "success": false,
  "message": "Error description",
  "errorCode": "ERROR_CODE",
  "errors": [ ... ]
}
```

---

## Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Missing or invalid authentication token |
| `INVALID_TOKEN` | 401 | JWT token is invalid or expired |
| `MISSING_PARAMS` | 400 | Required parameters are missing |
| `INVALID_ACTION` | 400 | Invalid action parameter |
| `CONFLICT` | 409 | Time slot conflict (calendar) |
| `INVALID_TEMPLATE` | 400 | Invalid email template name |
| `INVALID_EMAIL` | 400 | Invalid email format |
| `SEND_FAILED` | 500 | Email sending failed |
| `CALENDAR_ERROR` | 500 | Calendar operation error |
| `EMAIL_ERROR` | 500 | Email operation error |

---

## Rate Limiting

- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Email API**: 50 requests per hour

Rate limit headers are included in all responses:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642348800
```

---

## Examples

### Complete Workflow: Create Meeting and Send Notification

**Step 1: Create Calendar Event**
```http
POST /api/calendar?action=create
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Product Demo",
  "start_time": "2024-01-20T14:00:00Z",
  "end_time": "2024-01-20T15:00:00Z",
  "type": "demo",
  "lead_id": "lead-uuid",
  "attendees": ["client@example.com"]
}
```

**Step 2: Send Email Notification**
```http
POST /api/email?action=send
Authorization: Bearer <token>
Content-Type: application/json

{
  "to": "client@example.com",
  "subject": "Product Demo Scheduled",
  "html": "<h2>Your demo is scheduled</h2><p>Date: Jan 20, 2024 at 2:00 PM</p>"
}
```

---

## Support

For issues or questions:
- GitHub Issues: [github.com/DMHCAIT/crm-backend](https://github.com/DMHCAIT/crm-backend)
- Documentation: See `README.md` files in project root
