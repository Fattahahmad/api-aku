# MoodMate API

Backend API untuk aplikasi pelacakan mood harian dengan analisis emosi berbasis AI.

## Deskripsi

MoodMate membantu pengguna mencatat mood harian, menganalisis emosi dengan AI, dan memberikan insight serta rekomendasi personal.

## Fitur Utama

- **Autentikasi** - Register, login dengan JWT
- **Check-in Harian** - Input mood (0-5) + jurnal
- **Streak Tracking** - Hitung konsistensi check-in harian
- **AI Analisis** - Deteksi emosi via HuggingFace
- **Weekly Summary** - Ringkasan mingguan via HuggingFace
- **Dashboard** - Statistik mood + insight AI
- **Redis Cache** - Cache emotion analysis (optional)
- **Scheduler** - Weekly summary otomatis via QStash

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Database**: PostgreSQL (Supabase)
- **Cache**: Redis (Upstash) - optional
- **AI**: Google Gemini, HuggingFace Inference API
- **Storage**: Supabase Storage
- **Scheduler**: Upstash QStash / Node-Cron

## Instalasi

```bash
npm install
npm run migrate:up  # Jalankan migration database
npm run dev         # Development
npm start           # Production
```

## Environment Variables

```env
# Server
HOST=localhost
PORT=3000

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your_secret_key

# Supabase Storage
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# AI Services
GEMINI_API_KEY=your_gemini_key

# Optional - Redis (jika kosong, sistem tetap berjalan)
REDIS_URL=redis://localhost:6379

# HuggingFace API
HF_DAILY_ENDPOINT=https://Nuragafi-mood-tracker-api.hf.space/predict
HF_WEEKLY_ENDPOINT=https://Nuragafi-mood-tracker-api.hf.space/summary/weekly

# QStash Scheduler
QSTASH_URL=https://qstash-us-east-1.upstash.io
QSTASH_TOKEN=xxx
QSTASH_CURRENT_SIGNING_KEY=sig_xxx
QSTASH_NEXT_SIGNING_KEY=sig_xxx
```

## Struktur Folder

```
src/
├── app.js                      # Express app configuration
├── server.js                   # Server entry point
├── config/
│   ├── database.js            # PostgreSQL connection
│   └── supabase.js            # Supabase client
├── controllers/
│   ├── auth.controller.js     # Auth endpoints
│   ├── user.controller.js       # User profile
│   ├── log.controller.js        # Daily check-in
│   ├── insight.controller.js    # Weekly insights
│   └── dashboard.controller.js    # Dashboard summary
├── models/
│   ├── user.model.js            # User queries
│   ├── log.model.js             # Log queries
│   ├── insight.model.js         # Insight queries
│   ├── dashboard.model.js       # Dashboard queries
│   └── ai_analyses.model.js     # AI analysis storage
├── routes/
│   ├── auth.routes.js           # /api/v1/auth
│   ├── user.routes.js           # /api/v1/users
│   ├── log.routes.js            # /api/v1/logs
│   ├── insight.routes.js        # /api/v1/insights
│   └── scheduler.routes.js      # /api/v1/scheduler
├── services/
│   ├── gemini.service.js        # Google Gemini AI
│   ├── hf.service.js            # HuggingFace AI
│   ├── redis.service.js         # Redis cache
│   └── qstash.service.js        # QStash scheduler
├── middlewares/
│   ├── auth.middleware.js       # JWT auth
│   ├── validate.middleware.js   # Joi validation
│   └── error.middleware.js      # Error handler
├── exceptions/
│   ├── ClientError.js
│   ├── NotFoundError.js
│   ├── InvariantError.js
│   └── AuthenticationError.js
└── jobs/
    └── hf-scheduler.js          # Weekly job scheduler
```

## API Endpoints

### Auth
- `POST /api/v1/auth/register` - Register user
- `POST /api/v1/auth/login` - Login, dapatkan JWT

### User
- `GET /api/v1/users/me` - Get profile
- `PUT /api/v1/users/me` - Update profile + avatar
- `POST /api/v1/users/logout` - Logout

### Logs
- `POST /api/v1/logs` - Create daily log (auto AI analysis)
- `GET /api/v1/logs/today` - Check today status
- `GET /api/v1/logs/calendar?month=X&year=Y` - Monthly calendar
- `GET /api/v1/logs/date/:date` - Log by date
- `PUT /api/v1/logs/:id` - Update log
- `DELETE /api/v1/logs/:id` - Delete log
- `GET /api/v1/logs` - History with pagination

### Dashboard
- `GET /api/v1/dashboard/summary` - Statistik + AI insight

### Insights
- `GET /api/v1/insights/weekly` - Weekly trend + summary
- `POST /api/v1/insights/weekly-trigger` - Manual weekly trigger

### Scheduler
- `POST /api/v1/scheduler/weekly-summary` - QStash trigger

## Developer Documentation

### Models

#### user.model.js
- `findUserByEmail(email)` - Cari user by email
- `findUserById(id)` - Cari user by UUID
- `createUser(name, email, hashedPassword)` - Buat user baru
- `updateUserProfile(userId, name, avatarUrl)` - Update profil
- `updateUserStreak(userId)` - Update streak (logic terpisah hari)

#### log.model.js
- `createDailyLog(userId, moodScore, journalText)` - Buat log harian
- `checkLogToday(userId)` - Cek apakah sudah check-in
- `getMonthlyLogs(userId, month, year)` - Ambil log 1 bulan
- `getLogByDate(userId, dateString)` - Log spesifik tanggal

#### ai_analyses.model.js
- `createAIAnalysis(userId, logId, inputType, emotion, confidence)` - Simpan hasil AI
- `getWeeklyAIAnalyses(userId, startDate, endDate)` - Ambil data untuk weekly summary

### Services

#### hf.service.js
- `analyzeDailyEmotion(journalText)` - POST ke HF daily endpoint, return `{emotion, confidence}`
- `generateWeeklySummaryFromHF(weeklyLogs)` - POST array `[{date, emotion, confidence}]` ke HF weekly endpoint

#### gemini.service.js
- `generateDailySuggestion(moodScore, journalText)` - Buat rekomendasi harian
- `generateWeeklySummary(averageScore, emotionDistribution)` - Buat ringkasan mingguan
- `generateDashboardInsight(totalCheckins, averageMood, emotionTrend)` - AI insight dashboard

#### redis.service.js
- `cacheEmotionResult(journalText, emotion, confidence)` - Cache hasil emotion (24 jam)
- `getEmotionResult(journalText)` - Ambil dari cache
- `incrementRateLimit(key)` - Rate limiting simple

### Controllers

#### log.controller.js
- `createLog` - Buat log + panggil HF + simpan ke `ai_analyses` + return suggestion Gemini

#### insight.controller.js
- `getWeeklyInsights` - Query trend + emotion + ai_analyses → kirim ke HF weekly

### Variables Penting

- `mood_score`: Integer 0-5 (very sad → very happy)
- `emotion_label`: String (sadness, joy, anger, fear, calm, dll)
- `confidence`: Float 0.0 - 1.0
- `current_streak`: Counter konsistensi check-in

## ML Model

Model HuggingFace untuk analisis emosi:
- **Endpoint**: https://Nuragafi-mood-tracker-api.hf.space
- **Model**: Fine-tuned untuk deteksi emosi Indonesia/Inggris

## Deployment (Vercel)

1. Set environment variables di Vercel Dashboard
2. Build command: `npm run migrate:up && npm install`
3. Output directory: (default)
4. QStash scheduler: buat di https://console.upstash.com/qstash/schedules
   - URL: `https://your-api.vercel.app/api/v1/scheduler/weekly-summary`
   - Cron: `0 1 * * 0` (Minggu jam 01:00 UTC = 08:00 WIB)