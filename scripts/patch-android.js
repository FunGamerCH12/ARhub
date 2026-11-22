// Menambahkan izin notifikasi ke AndroidManifest.xml dan menyalin ikon.
// Dijalankan otomatis oleh workflow setelah "npx cap add android".
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "android/app/src/main/AndroidManifest.xml");

let manifest = fs.readFileSync(manifestPath, "utf8");
const permissions = [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM"
];

for (const permission of permissions) {
  if (manifest.includes(permission)) continue;
  manifest = manifest.replace(
    "<application",
    `<uses-permission android:name="${permission}" />\n\n    <application`
  );
  console.log("Izin ditambahkan:", permission);
}
fs.writeFileSync(manifestPath, manifest);

// Salin semua isi android-res/ ke res/ (ikon notifikasi + ikon peluncur).
// File dengan nama sama (ic_launcher.xml) menggantikan bawaan Capacitor.
const resDir = path.join(root, "android/app/src/main/res");
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}
copyDir(path.join(root, "android-res"), resDir);
console.log("Resource Android disalin ke", resDir);
