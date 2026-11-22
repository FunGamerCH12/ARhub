# Panduan Android - Notifikasi Pomodoro

## Izin di AndroidManifest.xml
Dua izin ini ditambahkan otomatis oleh `scripts/patch-android.js` saat workflow jalan.
Kalau mau menambah manual, taruh di atas tag `<application`:

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

- POST_NOTIFICATIONS: wajib di Android 13+ (diminta lewat dialog saat tekan Mulai).
- SCHEDULE_EXACT_ALARM: supaya alarm tepat waktu. Di Android 14+ izin ini bisa
  tidak aktif otomatis; kalau mati, notifikasi tetap muncul tapi bisa telat
  beberapa menit. Aktifkan lewat: Setelan > Aplikasi > School Hub >
  "Alarm & pengingat".

## Instal plugin (kalau project dikerjakan di laptop)
    npm install @capacitor/local-notifications
    npx cap sync

## Ikon kecil notifikasi (smallIcon)
1. Ikon harus putih polos dengan latar transparan (Android mewarnai sendiri).
2. Taruh file di: android/app/src/main/res/drawable/ic_stat_pomodoro.xml
   (atau .png). Nama file = nilai `NOTIF_SMALL_ICON` di app.js (tanpa ekstensi).
3. Di project ini file contohnya ada di android-res/drawable/ dan disalin
   otomatis oleh workflow.
4. Kalau ikon tidak ditemukan, Android memakai ikon bawaan.

## Catatan
- Channel "pomodoro" dibuat sekali. Kalau kamu ubah importance saat uji coba,
  hapus dulu aplikasinya lalu pasang ulang (Android tidak mengubah channel lama).
- Notifikasi menetap bisa digeser pengguna di Android 14+; ini aturan sistem.
- Notifikasi menetap baru hilang saat app dibuka lagi setelah timer selesai,
  karena JavaScript berhenti di latar belakang.

## Timer lanjut otomatis (v2)
- Selesai fokus -> istirahat mulai sendiri -> selesai -> fokus lagi, tanpa tekan Mulai.
- Saat Mulai ditekan, 8 fase ke depan dijadwalkan sekaligus (ID 1100-1107),
  jadi notifikasi tetap berbunyi walau app ditutup. ID 1002 = notifikasi menetap.
- Untuk mematikan lanjut-otomatis: ubah `FOCUS_AUTO_CONTINUE` jadi `false` di app.js.
- Kalau app ditinggal lebih dari 8 fase (sekitar 2 jam), timer berhenti dan hanya
  8 fase yang dihitung ke statistik.

## Tombol Kembali & ikon (v3)
- Tombol Kembali Android: menutup jendela yang terbuka (kalender, dialog, form),
  lalu kembali ke Home, lalu keluar dari aplikasi. Butuh plugin @capacitor/app
  (sudah ada di package.json).
- Ikon peluncur adaptif (ungu-gelap + ikon timer) ditaruh di android-res/ dan
  menggantikan ikon bawaan Capacitor untuk Android 8 ke atas. Android 13 ke atas
  juga mendapat versi satu warna untuk "ikon bertema".
