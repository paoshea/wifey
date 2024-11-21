# API Documentation

## Overview

The Wifey API provides endpoints for managing coverage spots, user contributions, and leaderboard data. All endpoints are RESTful and return JSON responses.

## Base URL

```
https://api.wifey.app/v1
```

## Authentication

All API requests require authentication using JWT tokens. Include the token in the Authorization header:

```http
Authorization: Bearer <your_token>
```

## Error Handling

The API uses conventional HTTP response codes:

- 200: Success
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error

Error Response Format:
```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

## Rate Limiting

- 100 requests per minute per IP
- 1000 requests per hour per user
- Rate limit headers included in responses

## Endpoints

### Coverage

#### Get Coverage Points

```http
GET /api/coverage/cellular
```

Query Parameters:
- `bounds`: Geographic bounds (required)
  - `minLat`: Minimum latitude
  - `maxLat`: Maximum latitude
  - `minLng`: Minimum longitude
  - `maxLng`: Maximum longitude
- `provider`: Filter by provider (optional)
- `type`: Coverage type (cellular/wifi)
- `minSignalStrength`: Minimum signal strength (0-100)

Response:
```json
{
  "points": [
    {
      "id": "string",
      "location": {
        "latitude": number,
        "longitude": number
      },
      "signalStrength": number,
      "provider": "string",
      "type": "cellular|wifi",
      "technology": "2G|3G|4G|5G",
      "reliability": number,
      "timestamp": "string"
    }
  ],
  "metadata": {
    "total": number,
    "coverage": number
  }
}
```

#### Mark Coverage Spot

```http
POST /api/coverage/contribute
```

Request Body:
```json
{
  "location": {
    "latitude": number,
    "longitude": number
  },
  "signalStrength": number,
  "provider": "string",
  "type": "cellular|wifi",
  "technology": "2G|3G|4G|5G",
  "reliability": number
}
```

### Leaderboard

#### Get Global Rankings

```http
GET /api/leaderboard
```

Query Parameters:
- `timeframe`: daily|weekly|monthly|allTime
- `limit`: Number of entries (default: 10)
- `offset`: Pagination offset (default: 0)

Response:
```json
{
  "entries": [
    {
      "userId": "string",
      "username": "string",
      "avatar": "string",
      "rank": number,
      "points": number,
      "contributions": number,
      "badges": number,
      "streak": {
        "current": number,
        "longest": number
      },
      "level": number
    }
  ],
  "metadata": {
    "total": number,
    "timeframe": "string"
  }
}
```

#### Get User Rank

```http
GET /api/leaderboard/user/{userId}
```

Response includes user's rank and nearby competitors.

### User Achievements

#### Get User Badges

```http
GET /api/users/{userId}/badges
```

Response:
```json
{
  "badges": [
    {
      "id": "string",
      "name": "string",
      "description": "string",
      "icon": "string",
      "earnedAt": "string",
      "rarity": "common|rare|epic|legendary"
    }
  ]
}
```

#### Get User Stats

```http
GET /api/users/{userId}/stats
```

Response:
```json
{
  "contributions": number,
  "points": number,
  "streak": {
    "current": number,
    "longest": number
  },
  "level": number,
  "badges": number,
  "rank": number
}
```

## Websocket API

### Real-time Updates

Connect to:
```
wss://api.wifey.app/v1/ws
```

Events:
- `coverage.new`: New coverage point added
- `coverage.update`: Coverage point updated
- `leaderboard.update`: Rankings updated
- `achievement.earned`: User earned achievement

## Data Models

### Coverage Point
```typescript
interface CoveragePoint {
  id: string;
  location: {
    latitude: number;
    longitude: number;
  };
  signalStrength: number; // 0-100
  provider: string;
  type: 'cellular' | 'wifi';
  technology: '2G' | '3G' | '4G' | '5G';
  reliability: number; // 0-1
  timestamp: string; // ISO date
  metadata?: Record<string, any>;
}
```

### Leaderboard Entry
```typescript
interface LeaderboardEntry {
  userId: string;
  username: string;
  avatar?: string;
  rank: number;
  points: number;
  contributions: number;
  badges: number;
  streak: {
    current: number;
    longest: number;
  };
  level: number;
}
```

### Badge
```typescript
interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: {
    type: 'points' | 'streak' | 'contributions';
    threshold: number;
  };
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}
```

## Best Practices

1. Use appropriate HTTP methods
2. Include error handling
3. Implement rate limiting
4. Cache responses
5. Validate input
6. Handle timeouts
7. Use HTTPS
8. Version APIs

## SDK Examples

### JavaScript/TypeScript
```typescript
import { WifeyAPI } from '@wifey/sdk';

const api = new WifeyAPI({
  apiKey: 'your_api_key',
  environment: 'production'
});

// Get coverage points
const coverage = await api.coverage.getPoints({
  bounds: {
    minLat: 8.0,
    maxLat: 11.2,
    minLng: -85.9,
    maxLng: -82.6
  }
});

// Mark coverage spot
const point = await api.coverage.markSpot({
  location: {
    latitude: 10.0,
    longitude: -84.0
  },
  signalStrength: 85,
  provider: 'Verizon',
  type: 'cellular',
  technology: '5G'
});
```

## Rate Limits & Quotas

| Endpoint | Rate Limit | Quota |
|----------|------------|-------|
| GET /coverage/* | 100/min | 10000/day |
| POST /coverage/* | 10/min | 1000/day |
| GET /leaderboard/* | 60/min | 5000/day |
| GET /users/* | 60/min | 5000/day |

## Support

For API support:
- Email: api@wifey.app
- Documentation: https://docs.wifey.app
- Status: https://status.wifey.app
