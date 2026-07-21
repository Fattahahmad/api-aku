# Panduan Integrasi API AKU (Front-End Documentation)

Dokumen ini disusun khusus sebagai panduan lengkap dan terperinci untuk **Front-End Developer (FE)** dalam mengonsumsi seluruh *endpoint* RESTful API dari aplikasi **AKU**. Setiap folder dan request dijelaskan lengkap dengan metode HTTP, URL, *Header*, *Request Body*, serta contoh struktur *Response JSON*.

---

## 📌 Ketentuan Umum & Authentication Header

1. **Base URL**:
   * Local: `http://localhost:3000/api/v1`
   * Staging/Production: `https://your-domain.com/api/v1`
2. **Content-Type**:
   * Semua *request* bertipe `POST`, `PUT`, `PATCH` wajib mengirimkan Header:  
     `Content-Type: application/json`
3. **Authorization Header**:
   * Seluruh *endpoint* (kecuali Register & Login) membutuhkan JWT Token di Header:  
     `Authorization: Bearer <token_jwt_hasil_login>`

---

## 📂 1. Folder: Authentication

### 1.1 Registrasi Pengguna Baru
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/auth/register`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "name": "Budi Santoso",
    "email": "budi@example.com",
    "password": "password123456"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "User berhasil terdaftar",
    "data": {
      "user": {
        "id": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "name": "Budi Santoso",
        "email": "budi@example.com"
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.2 Login Pengguna
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/auth/login`
* **Headers**: `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "email": "budi@example.com",
    "password": "password123456"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Login berhasil",
    "data": {
      "user": {
        "id": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "avatar_url": null,
        "current_streak": 3
      },
      "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
  ```

### 1.3 Get Profile Pengguna
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/users/me`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "user": {
        "id": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "name": "Budi Santoso",
        "email": "budi@example.com",
        "avatar_url": "https://xxx.supabase.co/storage/v1/object/public/...",
        "current_streak": 3,
        "created_at": "2026-07-20T04:54:46.000Z"
      }
    }
  }
  ```

---

## 📂 2. Folder: Dashboard

### 2.1 Get Dashboard Summary
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/dashboard/summary`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "total_checkins": 12,
      "average_intensity": "7.2",
      "recent_emotions": [
        {
          "emotion": "Joy",
          "intensity": 8,
          "created_at": "2026-07-21T10:00:00.000Z"
        }
      ],
      "ai_insight": "Terus jaga konsistensi track mood harian untuk insight yang lebih baik."
    }
  }
  ```

---

## 📂 3. Folder: Mood Logs (Pilar "Aku Paham")

> 💡 **Aturan Penting**:
> * `emotion` wajib salah satu dari 8 Emosi Plutchik: `"Joy"`, `"Trust"`, `"Fear"`, `"Surprise"`, `"Sadness"`, `"Disgust"`, `"Anger"`, `"Anticipation"`.
> * `intensity` berjarak integer `1` sampai `10`.
> * Pengguna hanya bisa melakukan check-in **1 kali per hari (WIB)**.

### 3.1 Create Daily Mood Log (Check-in)
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/logs`
* **Headers**: 
  * `Authorization: Bearer {{bearerToken}}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "emotion": "Joy",
    "intensity": 8,
    "journal_text": "Hari ini persentasi proyek berjalan lancar!"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Jurnal harian berhasil disimpan!",
    "data": {
      "log": {
        "id": "c3e434c6-c8d0-496b-bd55-0aa85bf6603a",
        "user_id": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "emotion": "Joy",
        "intensity": 8,
        "journal_text": "Hari ini persentasi proyek berjalan lancar!",
        "created_at": "2026-07-21T07:25:00.000Z"
      },
      "suggestion": "Pertahankan energi positif ini! Luangkan waktu sejenak untuk bersyukur.",
      "streak": 4
    }
  }
  ```

### 3.2 Cek Status Check-in Hari Ini
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/logs/today`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "has_checked_in": true,
      "log_data": {
        "id": "c3e434c6-c8d0-496b-bd55-0aa85bf6603a",
        "emotion": "Joy",
        "intensity": 8,
        "journal_text": "Hari ini persentasi proyek berjalan lancar!",
        "created_at": "2026-07-21T07:25:00.000Z"
      }
    }
  }
  ```

### 3.3 Get Monthly Calendar Logs
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/logs/calendar?month=7&year=2026`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "logs": [
        {
          "log_date": "2026-07-20",
          "emotion": "Joy",
          "intensity": 10,
          "journal_text": "Hari Senin yang menyenangkan"
        },
        {
          "log_date": "2026-07-21",
          "emotion": "Sadness",
          "intensity": 8,
          "journal_text": "Selasa agak sedih"
        }
      ]
    }
  }
  ```

### 3.4 Update Log Hari Ini
* **Method**: `PUT`
* **Endpoint**: `{{baseUrl}}/logs/:logId`
* **Headers**: 
  * `Authorization: Bearer {{bearerToken}}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "emotion": "Trust",
    "intensity": 7,
    "journal_text": "Jurnal yang diperbarui"
  }
  ```
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Jurnal harian berhasil diperbarui!",
    "data": {
      "log": {
        "id": "c3e434c6-c8d0-496b-bd55-0aa85bf6603a",
        "emotion": "Trust",
        "intensity": 7,
        "journal_text": "Jurnal yang diperbarui"
      }
    }
  }
  ```

### 3.5 Get All Logs History (Paginasi)
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/logs?page=1&limit=10`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "logs": [ ... ],
      "pagination": {
        "total_items": 15,
        "total_pages": 2,
        "current_page": 1,
        "limit": 10
      }
    }
  }
  ```

### 3.6 Delete Log Hari Ini
* **Method**: `DELETE`
* **Endpoint**: `{{baseUrl}}/logs/:logId`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "message": "Jurnal harian berhasil dihapus."
  }
  ```

---

## 📂 4. Folder: Habits (Pilar "Aku Lebih Baik")

### 4.1 Buat Target Habit Baru
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/habits`
* **Headers**: 
  * `Authorization: Bearer {{bearerToken}}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "title": "Olahraga Pagi",
    "description": "Stretching & Jogging 15 menit",
    "targetDate": "2026-12-31"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Habit berhasil dibuat",
    "data": {
      "habit": {
        "id": "a8f12345-6789-41ed-af75-123456789abc",
        "user_id": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "title": "Olahraga Pagi",
        "description": "Stretching & Jogging 15 menit",
        "target_date": "2026-12-31T00:00:00.000Z",
        "created_at": "2026-07-21T07:00:00.000Z"
      }
    }
  }
  ```

### 4.2 Get Daftar Habit
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/habits`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "habits": [
        {
          "id": "a8f12345-6789-41ed-af75-123456789abc",
          "title": "Olahraga Pagi",
          "description": "Stretching & Jogging 15 menit",
          "total_completions": "5"
        }
      ]
    }
  }
  ```

### 4.3 Get Habit By ID
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/habits/:habitId`
* **Headers**: `Authorization: Bearer {{bearerToken}}`

### 4.4 Update Habit
* **Method**: `PATCH`
* **Endpoint**: `{{baseUrl}}/habits/:habitId`
* **Headers**: 
  * `Authorization: Bearer {{bearerToken}}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "title": "Judul Habit Baru",
    "description": "Deskripsi diperbarui"
  }
  ```

### 4.5 Tandai Habit Selesai ("Streak Hari Ini")
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/habits/:habitId/completions`
* **Headers**: 
  * `Authorization: Bearer {{bearerToken}}`
  * `Content-Type: application/json`
* **Request Body**:
  ```json
  {
    "date": "2026-07-21",
    "note": "Selesai lari 2 km"
  }
  ```
* **Response Sukses (201 Created)**:
  ```json
  {
    "status": "success",
    "message": "Habit berhasil ditandai selesai",
    "data": {
      "completion": {
        "id": "b7e98765-4321-41ed-af75-987654321cba",
        "habit_id": "a8f12345-6789-41ed-af75-123456789abc",
        "completed_at": "2026-07-21",
        "note": "Selesai lari 2 km"
      },
      "streak": 5
    }
  }
  ```

### 4.6 Batalkan Completion Habit
* **Method**: `DELETE`
* **Endpoint**: `{{baseUrl}}/habits/:habitId/completions?date=2026-07-21`
* **Headers**: `Authorization: Bearer {{bearerToken}}`

### 4.7 Get Habit Summary Global (Rate & Streak)
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/habits/summary?from=2026-07-01&to=2026-07-31`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "activeHabits": 3,
      "totalCompleted": 15,
      "completionRate": 83,
      "bestStreak": {
        "habitId": "a8f12345-6789-41ed-af75-123456789abc",
        "title": "Olahraga Pagi",
        "streak": 5
      },
      "dailyCompletions": [
        { "date": "2026-07-20", "count": 2 },
        { "date": "2026-07-21", "count": 3 }
      ]
    }
  }
  ```

### 4.8 Hapus Habit
* **Method**: `DELETE`
* **Endpoint**: `{{baseUrl}}/habits/:habitId`
* **Headers**: `Authorization: Bearer {{bearerToken}}`

---

## 📂 5. Folder: Insights & AI Analysis

### 5.1 Get Weekly Insights (Hasil Rule-Based & AI)
* **Method**: `GET`
* **Endpoint**: `{{baseUrl}}/insights/weekly`
* **Headers**: `Authorization: Bearer {{bearerToken}}`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "data": {
      "week_number": "2026-W30",
      "week_range": {
        "from": "2026-07-20",
        "to": "2026-07-26"
      },
      "mood_trend": [
        {
          "day": "Sen",
          "date": "2026-07-20",
          "emotion": "senang",
          "intensity": 10
        },
        {
          "day": "Sel",
          "date": "2026-07-21",
          "emotion": "sedih",
          "intensity": 8
        }
      ],
      "fid_aggregates": [
        {
          "emotion": "Joy",
          "emotionId": "senang",
          "frequency": 1,
          "avgIntensity": "10.0",
          "persistence": 1
        }
      ],
      "summary": {
        "text": "Minggu ini Anda mengalami spektrum emosi dengan dominasi emosi senang...",
        "suggestion": "Lanjutkan kegiatan positif ini dan luangkan waktu untuk refleksi diri."
      },
      "mood_state": "Baik"
    }
  }
  ```
  > 💡 **Pro Tip FE**: 
  > * Gunakan `mood_trend` untuk menggambar **Line Chart / Bar Chart 7 Hari**.
  > * Gunakan `mood_state` (`Sangat Baik` / `Baik` / `Cukup` / `Perlu Perhatian` / `Sangat Perlu Perhatian`) untuk menampilkan **Badge Warna Kategori Kesehatan Mental**.

### 5.2 Trigger Manual Weekly Summary Scheduler (Testing Purpose)
* **Method**: `POST`
* **Endpoint**: `{{baseUrl}}/scheduler/weekly-summary`
* **Headers**: `Content-Type: application/json`
* **Response Sukses (200 OK)**:
  ```json
  {
    "status": "success",
    "processed": 1,
    "details": [
      {
        "userId": "f0c19424-57e2-41ed-af75-4664f66abcde",
        "status": "processed",
        "data": { "weekNumber": "2026-W30" }
      }
    ]
  }
  ```

---

## 🛑 Format Error Standard (Semua Endpoint)

Jika terjadi kesalahan input atau error validasi, API selalu mengembalikan format JSON yang konsisten:

### 1. Error Validasi / Input Tidak Sesuai (400 Bad Request)
```json
{
  "status": "fail",
  "message": "Emosi harus salah satu dari: Joy, Sadness, Trust, Disgust, Fear, Anger, Surprise, Anticipation"
}
```

### 2. Unauthorized / Token Kadaluwarsa (401 Unauthorized)
```json
{
  "status": "fail",
  "message": "Akses ditolak. Token tidak ditemukan atau tidak valid."
}
```

### 3. Resource Tidak Ditemukan (404 Not Found)
```json
{
  "status": "fail",
  "message": "Habit tidak ditemukan"
}
```
