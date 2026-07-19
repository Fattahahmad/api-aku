// src/utils/date.util.js

/**
 * Mendapatkan string tanggal hari ini dalam zona waktu WIB (UTC+7).
 * Format: YYYY-MM-DD
 */
export const getWIBDate = (inputDate = new Date()) => {
  // Gunakan metode Date modern yang menangani format kalender dengan aman
  return new Intl.DateTimeFormat('fr-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(inputDate);
};

/**
 * Menambahkan hari pada suatu string tanggal (YYYY-MM-DD).
 * Format kembalian: YYYY-MM-DD dalam zona waktu WIB.
 */
export const addDays = (dateString, days) => {
  // Kita pastikan parse tanggal sebagai WIB, bukan UTC
  const dateParts = dateString.split('-');
  const date = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
  date.setUTCDate(date.getUTCDate() + days);
  
  return date.toISOString().split('T')[0];
};

/**
 * Menghitung batas Senin dan Minggu untuk minggu ini (berdasarkan waktu WIB).
 */
export const getWeekBoundaries = () => {
  // Kita cari tahu tanggal sekarang di WIB
  const wibDateString = getWIBDate();
  const dateParts = wibDateString.split('-');
  
  // Buat objek Date berdasar string WIB (kita treat sebagai jam 12 siang UTC agar aman dari pembulatan jam)
  const wibDateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2], 12, 0, 0));
  
  // getUTCDay() mengembalikan 0 (Minggu), 1 (Senin), ..., 6 (Sabtu)
  const dayOfWeek = wibDateObj.getUTCDay();
  
  const daysToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

  const sunday = new Date(wibDateObj);
  sunday.setUTCDate(sunday.getUTCDate() + daysToSunday);

  const monday = new Date(wibDateObj);
  monday.setUTCDate(monday.getUTCDate() - daysToMonday);

  // Fungsi utilitas ISO week number
  const getISOWeek = (date) => {
    const d = new Date(date);
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  return {
    from: monday.toISOString().split('T')[0],
    to: sunday.toISOString().split('T')[0],
    weekNumber: `${sunday.getUTCFullYear()}-W${String(getISOWeek(sunday)).padStart(2, '0')}`
  };
};
