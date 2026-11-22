# School Hub: panduan build dan update APK

## 1. Isi 4 Secrets (sekali saja)
Repo di GitHub > Settings > Secrets and variables > Actions > New repository secret.
Isi dari file `RAHASIA-KUNCI-APK.txt`:

| Nama | Isi |
|---|---|
| `KEYSTORE_BASE64` | teks panjang dari file rahasia |
| `KEYSTORE_PASSWORD` | kata sandi |
| `KEY_ALIAS` | `schoolhub` |
| `KEY_PASSWORD` | sama dengan KEYSTORE_PASSWORD |

Jangan pernah menaruh kunci di repo. Simpan juga `schoolhub-release.jks` di tempat aman.
Kalau kunci hilang, APK baru tidak bisa dipasang di atas yang lama.

## 2. Build
Setiap push ke `main` menjalankan workflow. Hasilnya:
- Halaman **Releases** di repo: APK `SchoolHub-v1.N.apk` (paling mudah diunduh dari HP).
- Tab **Actions** > run terbaru > Artifacts.

## 3. Pasang
- **Pertama kali dengan kunci baru:** hapus dulu versi lama (tanda tangannya beda),
  lalu pasang APK baru. Salin cadangan data dari Lainnya > Pengaturan sebelum menghapus.
- **Selanjutnya:** unduh APK terbaru dan pasang langsung di atas versi lama. Data tetap ada.

## 4. Hitung mundur di notifikasi dan Hyper Island
- Notifikasi menampilkan hitung mundur yang digerakkan sistem Android, jadi tetap jalan
  walau aplikasi ditutup.
- Hyper Island memakai fitur Live Updates (Android 16 / HyperOS 3.0.300 ke atas).
  Buka Lainnya > Pengaturan untuk melihat statusnya dan membuka pengaturan terkait.
- Di HyperOS: Setelan > Aplikasi > School Hub > Penghemat baterai: **Tanpa batasan**,
  aktifkan **Mulai otomatis**, dan kunci aplikasi di Recents.
- Tombol **Uji notifikasi 20 detik** di Pengaturan untuk mengecek semuanya.
