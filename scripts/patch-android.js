// Menambahkan izin notifikasi ke AndroidManifest.xml dan menyalin ikon.
// Dijalankan otomatis oleh workflow setelah "npx cap add android".
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const manifestPath = path.join(root, "android/app/src/main/AndroidManifest.xml");
const drawableDir = path.join(root, "android/app/src/main/res/drawable");

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

fs.mkdirSync(drawableDir, { recursive: true });
fs.copyFileSync(
  path.join(root, "android-res/drawable/ic_stat_pomodoro.xml"),
  path.join(drawableDir, "ic_stat_pomodoro.xml")
);
console.log("Ikon notifikasi disalin ke res/drawable");
