# AKU API - Backend Application

Backend RESTful API untuk **AKU** (Aplikasi Self-Improvement & Emotional Tracking) yang menyediakan layanan pelacakan suasana hati harian (*Mood Tracker*), analisis emosi berbasis *Rule-Based Scoring* & Gemini AI, pelacak kebiasaan (*Habit Tracker*), serta sistem autentikasi aman.

---

## 📌 Pilar Utama Fitur Aplikasi AKU

Sistem ini dirancang untuk memfasilitasi *self-improvement* mandiri pengguna yang dibagi ke dalam **tiga pilar utama** dan **satu pilar pendukung**:

### 1. Fitur "Aku Paham" (Mood Tracker & Analisis AI)
* **Teori Emosi Plutchik**: Mengklasifikasikan emosi harian ke dalam 8 emosi dasar (*Joy, Trust, Fear, Surprise, Sadness, Disgust, Anger, Anticipation*).
* **Pencatatan Emosi & Jurnal**: Pengguna memasukkan emosi, intensitas suasana hati (skala `1 - 10`), serta catatan jurnal harian.
* **Rule-Based Scoring (If-Then Logic)**: 
  * Intensitas 1-10 dipetakan (*mapped*) ke skala 1-5 menggunakan rumus $\lceil \text{intensity} / 2 \rceil$.
  * Skor mood harian (*Daily Mood Score*) dihitung berdasarkan kelompok emosi:
    * **Emosi Positif (`Joy`, `Trust`)**: $\text{Score} = \text{Mapped Intensity}$
    * **Emosi Negatif (`Sadness`, `Fear`, `Anger`, `Disgust`)**: $\text{Score} = 6 - \text{Mapped Intensity}$
    * **Emosi Netral/Transisi (`Surprise`, `Anticipation`)**: Skor seimbang `3` (atau `4` untuk Anticipation berintensitas tinggi).
  * Di akhir minggu, rata-rata skor diklasifikasikan ke dalam **Weekly Mood State (Kategori Risiko)**: *Sangat Baik*, *Baik*, *Cukup*, *Perlu Perhatian*, atau *Sangat Perlu Perhatian*.
* **AI Predictive Analysis & Insight**: Google Gemini AI membaca data *Rule-Based* untuk menghasilkan:
  * **Summary**: Narasi ringkasan pola emosi mingguan.
  * **Prediction**: Prediksi tren suasana hati pengguna di masa depan.
  * **Suggestion**: Rekomendasi aktivitas/tindakan konkret untuk pengguna.

### 2. Fitur "Aku Lebih Baik" (Habit Tracker)
* **Pembuatan Target**: Membuat dan mengedit target kebiasaan baru yang ingin dibangun pengguna.
* **Pencatatan Streak ("Streak Hari Ini")**: Memantau progres harian dan menandai keberhasilan target habit.
* **Kalkulasi Akumulasi**: Menghitung secara otomatis rentetan keberhasilan (*streak*) dan persentase penyelesaian (*completion rate*) secara akurat.

### 3. Fitur "Aku Tenang" (Latihan Pernapasan)
* **Panduan Interaktif Sisi Client (FE)**: Menyediakan panduan animasi visual tarik/hembus napas serta kontrol mulai/jeda.
* **Tanpa Riwayat Data**: Didesain murni di sisi antarmuka (FE) tanpa menyimpan riwayat ke database untuk menjaga privasi penuh pengguna.

### 4. Fitur Pendukung (Autentikasi Pengguna)
* **Registrasi & Login**: Keamanan identitas pengguna menggunakan enkripsi kata sandi (Bcrypt) dan JSON Web Token (JWT).
* **Manajemen Profil & Streak**: Pengelolaan data profil pengguna dan konsistensi check-in.

---

## 🛠️ Teknologi & Stack (Tech Stack)

* **Runtime**: Node.js (ES Module)
* **Framework**: Express.js (v5)
* **Database**: PostgreSQL (Supabase / Managed PostgreSQL)
* **Database Migration**: `node-pg-migrate`
* **AI Integration**: Google Generative AI (`@google/generative-ai` - Gemini Flash)
* **Caching**: Redis / Upstash Redis (Optional fallback)
* **Scheduler**: Upstash QStash (Automated Weekly Jobs)
* **Validasi Input**: Joi Validation Library

---

## 📁 Struktur Direktori Project

```text
api-aku/
├── database/
│   └── migrations/             # Berkas migrasi database PostgreSQL
├── public/                     # Static files
├── src/
│   ├── config/                 # Konfigurasi Database (pg) & Supabase
│   ├── controllers/            # Controller pemrosesan logika bisnis & API
│   │   ├── auth.controller.js
│   │   ├── dashboard.controller.js
│   │   ├── habit.controller.js
│   │   ├── insight.controller.js
│   │   ├── log.controller.js
│   │   ├── scheduler.controller.js
│   │   └── user.controller.js
│   ├── exceptions/             # Custom Error Classes (ClientError, NotFound, dsb)
│   ├── middlewares/            # Auth JWT, Error Handler, Joi Validator
│   ├── models/                 # Query SQL ke database (User, Log, Habit, Insight)
│   ├── routes/                 # Definisi Rute API Express
│   ├── services/               # Layanan eksternal (Rule-Based FID, Gemini AI, Redis)
│   ├── utils/                  # Utilitas tanggal WIB & helper
│   ├── validators/             # Skema validasi request Joi
│   ├── app.js                  # Inisialisasi Express app
│   └── server.js               # Server entry point
├── .env.example                # Template variabel lingkungan
├── moodmate-collection.json    # Collection Postman untuk pengujian API
├── package.json
└── README.md
```

---

## ⚙️ Panduan Instalasi & Pengoperasian Lokal

### 1. Prasyarat
* Node.js (versi v18+ direkomendasikan)
* Basis data PostgreSQL yang aktif

### 2. Langkah Instalasi

1. **Clone repository & masuk ke direktori project:**
   ```bash
   cd api-aku
   ```

2. **Install seluruh dependensi:**
   ```bash
   npm install
   ```

3. **Konfigurasi Environment Variables:**
   Salin file `.env.example` menjadi `.env` lalu sesuaikan isinya:
   ```env
   PORT=3000
   NODE_ENV=development
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Jalankan Migrasi Database:**
   ```bash
   npm run migrate:up
   ```

5. **Jalankan Aplikasi:**
   * **Mode Development (Auto-reload):**
     ```bash
     npm run dev
     ```
   * **Mode Production:**
     ```bash
     npm start
     ```

---

## 📑 Dokumentasi API Endpoints

### 🔐 Autentikasi (`/api/v1/auth`)
* `POST /api/v1/auth/register` — Registrasi pengguna baru.
* `POST /api/v1/auth/login` — Login pengguna & mengembalikan token JWT.

### 👤 Pengguna (`/api/v1/users`)
* `GET /api/v1/users/me` — Mengambil data profil pengguna yang sedang login.
* `PUT /api/v1/users/me` — Memperbarui data profil pengguna.
* `POST /api/v1/users/logout` — Logout dari sistem.

### 📝 Mood Logs (`/api/v1/logs`)
* `POST /api/v1/logs` — Mencatat mood harian (Emosi Plutchik, Intensitas 1-10, Jurnal). Mengembalikan *suggestion* harian dari AI.
* `GET /api/v1/logs/today` — Mengecek status check-in hari ini.
* `GET /api/v1/logs/calendar` — Mengambil riwayat mood bulanan (Query: `?month=7&year=2026`).
* `GET /api/v1/logs/date/:date` — Mengambil detail log pada tanggal tertentu (`YYYY-MM-DD`).
* `PUT /api/v1/logs/:id` — Memperbarui log mood hari ini.
* `DELETE /api/v1/logs/:id` — Menghapus log mood hari ini.
* `GET /api/v1/logs` — Mengambil riwayat log mood dengan paginasi.

### 🎯 Habits (`/api/v1/habits`)
* `GET /api/v1/habits` — Mengambil daftar habit aktif milik pengguna.
* `POST /api/v1/habits` — Membuat target habit baru.
* `GET /api/v1/habits/:id` — Mengambil detail habit berdasarkan ID.
* `PATCH /api/v1/habits/:id` — Memperbarui data habit.
* `DELETE /api/v1/habits/:id` — Menghapus habit.
* `POST /api/v1/habits/:id/completions` — Menandai habit selesai pada tanggal tertentu (*Streak hari ini*).
* `DELETE /api/v1/habits/:id/completions` — Membatalkan tanda selesai habit (Query: `?date=YYYY-MM-DD`).
* `GET /api/v1/habits/summary` — Statistik & persentase penyelesaian habit mingguan/bulanan.
* `GET /api/v1/habits/insights` — Insight performa per habit.

### 📊 Dashboard (`/api/v1/dashboard`)
* `GET /api/v1/dashboard/summary` — Ringkasan total check-in, rata-rata intensitas, dan insight cepat AI.

### 💡 Insights & Weekly Analysis (`/api/v1/insights`)
* `GET /api/v1/insights/weekly` — Mengambil hasil agregasi emosi mingguan, tren 7 hari, narasi summary AI, saran kegiatan (*suggestion*), dan kategori status risiko (*mood_state*).

### ⏰ Scheduler (`/api/v1/scheduler`)
* `POST /api/v1/scheduler/weekly-summary` — Trigger pemrosesan otomatis laporan mingguan (Diintegrasikan dengan QStash / Cron).

---

## 🧪 Pengujian Otomatis (Postman Collection)

File `moodmate-collection.json` disediakan di akar direktori untuk pengujian API secara menyeluruh menggunakan **Postman Collection Runner**:
1. Impor `moodmate-collection.json` ke aplikasi Postman.
2. Jalankan **Run Collection**.
3. Skrip otomatis akan mendaftarkan user baru dengan email dinamik unik, menangkap `bearerToken`, serta menguji seluruh siklus rute API dari Registrasi hingga Weekly Insights secara otomatis.

---

## 📄 Lisensi & Hak Cipta

Dokumen ini disusun sebagai bagian dari Dokumentasi Sistem Backend Aplikasi **AKU**. Hak cipta dilindungi oleh pengembang project Tugas Akhir.