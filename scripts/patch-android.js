// Menyiapkan project Android hasil "npx cap add android":
//  1. izin + receiver di AndroidManifest.xml
//  2. ikon (android-res/)
//  3. kode native timer (android-native/*.java)
//  4. versionCode/versionName + tanda tangan rilis di app/build.gradle
// Dijalankan otomatis oleh workflow.
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const androidApp = path.join(root, "android/app");

function must(condition, message) {
  if (!condition) {
    console.error("GAGAL:", message);
    process.exit(1);
  }
}

/* ---------- 1. Manifest ---------- */
const manifestPath = path.join(androidApp, "src/main/AndroidManifest.xml");
let manifest = fs.readFileSync(manifestPath, "utf8");

const permissions = [
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",            // alarm tepat waktu otomatis (Android 13+)
  "android.permission.POST_PROMOTED_NOTIFICATIONS" // Live Updates / Hyper Island (Android 16+)
];

for (const permission of permissions) {
  if (manifest.includes(permission)) continue;
  manifest = manifest.replace(
    "<application",
    `<uses-permission android:name="${permission}" />\n\n    <application`
  );
  console.log("Izin ditambahkan:", permission);
}

if (!manifest.includes("PomodoroReceiver")) {
  must(manifest.includes("</application>"), "tag </application> tidak ditemukan di manifest");
  manifest = manifest.replace(
    "</application>",
    '    <receiver android:name=".PomodoroReceiver" android:exported="false" />\n    </application>'
  );
  console.log("Receiver timer ditambahkan");
}
fs.writeFileSync(manifestPath, manifest);

/* ---------- 2. Ikon ---------- */
const resDir = path.join(androidApp, "src/main/res");
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

/* ---------- 3. Kode native ---------- */
const javaDir = path.join(androidApp, "src/main/java/com/schoolhub/app");
must(fs.existsSync(javaDir), "folder paket com/schoolhub/app tidak ada (cek appId di capacitor.config.json)");
const nativeDir = path.join(root, "android-native");
for (const file of fs.readdirSync(nativeDir).filter(name => name.endsWith(".java"))) {
  fs.copyFileSync(path.join(nativeDir, file), path.join(javaDir, file));
  console.log("Kode native disalin:", file);
}

/* ---------- 4. build.gradle ---------- */
const gradlePath = path.join(androidApp, "build.gradle");
let gradle = fs.readFileSync(gradlePath, "utf8");

const versionCode = parseInt(process.env.VERSION_CODE || "1", 10);
const versionName = process.env.VERSION_NAME || "1.0";
must(gradle.includes("versionCode 1"), "versionCode bawaan tidak ditemukan");
must(gradle.includes('versionName "1.0"'), "versionName bawaan tidak ditemukan");
gradle = gradle.replace("versionCode 1", `versionCode ${versionCode}`);
gradle = gradle.replace('versionName "1.0"', `versionName "${versionName}"`);
console.log(`Versi: ${versionName} (kode ${versionCode})`);

// Lint rilis tidak boleh menggagalkan build
must(gradle.includes("    defaultConfig {"), "defaultConfig tidak ditemukan");
gradle = gradle.replace(
  "    defaultConfig {",
  "    lint {\n        checkReleaseBuilds false\n        abortOnError false\n    }\n    defaultConfig {"
);

// Tanda tangan rilis (hanya kalau kunci tersedia)
if (process.env.KEYSTORE_PATH) {
  for (const name of ["KEYSTORE_PASSWORD", "KEY_ALIAS", "KEY_PASSWORD"]) {
    must(process.env[name], `variabel ${name} kosong`);
  }
  must(gradle.includes("    buildTypes {"), "buildTypes tidak ditemukan");
  gradle = gradle.replace(
    "    buildTypes {",
    `    signingConfigs {
        release {
            storeFile file(System.getenv("KEYSTORE_PATH"))
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias System.getenv("KEY_ALIAS")
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {`
  );
  must(gradle.includes("        release {\n            minifyEnabled false"), "blok release tidak ditemukan");
  gradle = gradle.replace(
    "        release {\n            minifyEnabled false",
    "        release {\n            signingConfig signingConfigs.release\n            minifyEnabled false"
  );
  console.log("Tanda tangan rilis dipasang");
} else {
  console.log("Tanpa kunci: build debug");
}
fs.writeFileSync(gradlePath, gradle);

/* ---------- 5. gradle.properties ---------- */
const propsPath = path.join(root, "android/gradle.properties");
let props = fs.readFileSync(propsPath, "utf8");
for (const line of ["org.gradle.parallel=true", "org.gradle.caching=true"]) {
  if (!props.includes(line)) props += `\n${line}`;
}
fs.writeFileSync(propsPath, props + "\n");
console.log("Selesai.");
