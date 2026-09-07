# AI Wardrobe

AI Wardrobe is a MERN application for organizing a personal wardrobe and generating weather-aware outfit ideas. The repository currently contains Phases 1 through 5: a React/Vite client, an Express API, cookie-based JWT sessions, MongoDB metadata, Cloudinary image storage, weather-aware recommendations, and an authenticated AI stylist conversation experience.

## Requirements

- Node.js 20 or newer
- npm 10 or newer
- MongoDB Atlas connection string for database-backed development
- OpenWeatherMap API key for live weather
- Gemini API key for optional AI refinement

## Setup

1. Install dependencies:

   ```bash
   npm install
   npm install --prefix client
   npm install --prefix server
   ```

2. Copy `.env.example` to `.env` at the repository root for the API configuration.

3. Copy `client/.env.example` to `client/.env` and set `VITE_API_URL` to the browser-accessible API base URL. For local development, use `http://localhost:5000/api/v1`; for production, use the deployed API URL, for example `https://api.example.com/api/v1`.

4. Set `MONGODB_URI` to a MongoDB Atlas or local MongoDB database and replace `JWT_SECRET` with a long random secret. Configure the Cloudinary, OpenWeatherMap, and optional Gemini variables in the root `.env`.

## Run

Run both applications:

```bash
npm run dev
```

Run the API alone:

```bash
npm start
```

Run them separately:

```bash
npm run dev:client
npm run dev:server
```

The client runs at `http://localhost:5173`. The API runs at `http://localhost:5000`.

Health check:

```text
GET http://localhost:5000/api/v1/health
```

Authentication endpoints:

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

Authentication uses an `HttpOnly` JWT cookie. Passwords are hashed before persistence and are never returned by the API.

Wardrobe endpoints require authentication:

```text
POST   /api/v1/wardrobe/items       multipart field: image
GET    /api/v1/wardrobe/items
GET    /api/v1/wardrobe/items/:id
PATCH  /api/v1/wardrobe/items/:id       JSON body: { "category": "..." }
DELETE /api/v1/wardrobe/items/:id
```

Images are held in memory during upload and stored in Cloudinary. MongoDB stores only the image URL and Cloudinary metadata. JPG, JPEG, PNG, and WEBP files up to 10 MB are accepted.
When `GEMINI_API_KEY` is configured, each successful upload also receives one best-effort image classification. Categories are allow-listed before saving. If Gemini is unavailable or not configured, the image upload still succeeds and remains uncategorized for manual editing.

Phase 4 endpoints require authentication:

```text
GET  /api/v1/weather?city=London
POST /api/v1/recommendations/outfit
POST /api/v1/recommendations/outfit/save
```

Weather is normalized on the server and provider keys never reach the frontend. Recommendations use only the authenticated user&apos;s actual wardrobe items. Without `OPENWEATHER_API_KEY`, weather-dependent endpoints return a clear `503` configuration response. Without `GEMINI_API_KEY`, deterministic wardrobe rules still provide recommendations.

Phase 5 stylist endpoints require authentication:

```text
GET    /api/v1/stylist/conversations
POST   /api/v1/stylist/conversations
GET    /api/v1/stylist/conversations/:id
POST   /api/v1/stylist/conversations/:id/messages
DELETE /api/v1/stylist/conversations/:id
```

The stylist uses a bounded recent conversation context and the authenticated user&apos;s wardrobe metadata. AI-provided clothing references are validated against that wardrobe before being stored or returned. Without `GEMINI_API_KEY`, conversation messages return a clear `503` configuration response.

Operational endpoints:

```text
GET /api/v1/health       liveness check
GET /api/v1/health/ready readiness and database check
```

The API emits an `X-Request-Id` header and structured request logs. Production startup requires `MONGODB_URI`, a `JWT_SECRET` of at least 32 characters, and `CLIENT_URL`. API, authentication, and AI routes have in-memory rate limits suitable for a single backend instance. Set `TRUST_PROXY=true` only when the deployment is behind a trusted proxy such as Render or Railway.

The endpoint returns the standard response shape:

```json
{
  "success": true,
  "message": "Request successful",
  "data": {
    "status": "ok",
    "service": "ai-wardrobe-api"
  }
}
```

## Checks

```bash
npm run lint
npm run build
npm test
```

## Project boundaries

The final product surfaces include an authenticated dashboard, saved outfit management, profile and recommendation preferences, responsive navigation, wardrobe management, weather-aware recommendations, and the AI stylist conversation experience.

Additional product endpoints:

```text
GET   /api/v1/outfits
PATCH /api/v1/outfits/:id/save
DELETE /api/v1/outfits/:id
PATCH /api/v1/users/me
```
