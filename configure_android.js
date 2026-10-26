/**
 * configure_android.js
 * ปรับแต่ง android/app/build.gradle เพื่อรองรับการอัปเดตแอป APK ทับของเดิมได้ทันที 100%
 * - กำหนด versionCode เพิ่มขึ้นตามเวลาเสมอ (Monotonically increasing)
 * - กำหนด versionName ตามแท็กเวอร์ชัน
 * - ผูก haimiya.keystore เข้ากับ signingConfigs ถาวร (แก้ปัญหา signature mismatch)
 */

const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');

if (!fs.existsSync(gradlePath)) {
  console.error('❌ ไม่พบไฟล์:', gradlePath);
  process.exit(1);
}

let content = fs.readFileSync(gradlePath, 'utf8');

// คำนวณ versionCode จาก timestamp (พอดีกับ 32-bit int และเพิ่มขึ้นตลอดกาล ไม่น้อยกว่าเวอร์ชันเดิม)
const timestamp = Math.floor(Date.now() / 1000);
const versionCode = Math.max(1793031300, timestamp);

const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const versionName = `v2.${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}.${pad(now.getHours())}${pad(now.getMinutes())}`;

console.log(`📌 กำหนด versionCode: ${versionCode}`);
console.log(`📌 กำหนด versionName: ${versionName}`);

// แทนที่ versionCode และ versionName ใน defaultConfig
content = content.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
content = content.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);

// ตรวจสอบว่ามี signingConfigs แล้วหรือยัง
if (!content.includes('signingConfigs {')) {
  const signingBlock = `
    signingConfigs {
        haimiyaSign {
            storeFile file("haimiya.keystore")
            storePassword "HaimiyaTypo2026"
            keyAlias "haimiya"
            keyPassword "HaimiyaTypo2026"
        }
    }
`;
  content = content.replace(/buildTypes\s*\{/, `${signingBlock}\n    buildTypes {`);
}

// ตรวจสอบและผูก signingConfig ให้กับ debug และ release
if (content.includes('buildTypes {')) {
  // สำหรับ debug
  if (!content.includes('debug {')) {
    content = content.replace(
      'buildTypes {',
      'buildTypes {\n        debug {\n            signingConfig signingConfigs.haimiyaSign\n        }'
    );
  } else if (!content.includes('signingConfig signingConfigs.haimiyaSign')) {
    content = content.replace(
      /debug\s*\{/,
      'debug {\n            signingConfig signingConfigs.haimiyaSign'
    );
  }

  // สำหรับ release
  if (content.includes('release {') && !content.includes('release {\n            signingConfig signingConfigs.haimiyaSign')) {
    content = content.replace(
      /release\s*\{/,
      'release {\n            signingConfig signingConfigs.haimiyaSign'
    );
  }
}

// กำหนด minSdkVersion ให้เป็น 22 เพื่อการันตีการรองรับ Android 10 (API 29), 11, 12, 13, 14, 15 และเวอร์ชันเก่ากว่า 100%
if (content.includes('minSdkVersion')) {
  content = content.replace(/minSdkVersion\s+\d+/, 'minSdkVersion 22');
} else if (content.includes('defaultConfig {')) {
  content = content.replace('defaultConfig {', 'defaultConfig {\n        minSdkVersion 22');
}

fs.writeFileSync(gradlePath, content, 'utf8');
console.log('✅ แก้ไข android/app/build.gradle เรียบร้อยแล้ว (รองรับ Android 10 ขึ้นไป 100%)!');

// ตรวจสอบและตั้งค่า android/variables.gradle ถ้ามี
const variablesGradlePath = path.join(__dirname, 'android', 'variables.gradle');
if (fs.existsSync(variablesGradlePath)) {
  let vContent = fs.readFileSync(variablesGradlePath, 'utf8');
  vContent = vContent.replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 22');
  fs.writeFileSync(variablesGradlePath, vContent, 'utf8');
  console.log('✅ อัปเดต android/variables.gradle: minSdkVersion = 22');
}

// ซิงค์ versionName และ versionCode เข้าไปยัง www/app.js และ www/version.json
// เพื่อให้แอป APK มีเลขเวอร์ชันตรงกับ Release บน GitHub 100% ป้องกันบั๊กแจ้งเตือนอัปเดตเวอร์ชันตัวเอง
const wwwAppJs = path.join(__dirname, 'www', 'app.js');
if (fs.existsSync(wwwAppJs)) {
  let js = fs.readFileSync(wwwAppJs, 'utf8');
  js = js.replace(/const CURRENT_APP_VERSION = '[^']+';/, `const CURRENT_APP_VERSION = '${versionName}';`);
  js = js.replace(/const CURRENT_VERSION_CODE = \d+;/, `const CURRENT_VERSION_CODE = ${versionCode};`);
  fs.writeFileSync(wwwAppJs, js, 'utf8');
  console.log(`✅ อัปเดต www/app.js ให้ตรงกับเวอร์ชัน APK: ${versionName} (${versionCode})`);
}

const wwwVersionJson = path.join(__dirname, 'www', 'version.json');
if (fs.existsSync(wwwVersionJson)) {
  try {
    const vData = JSON.parse(fs.readFileSync(wwwVersionJson, 'utf8'));
    vData.version = versionName.replace(/^v/, '');
    vData.versionCode = versionCode;
    vData.updatedAt = new Date().toISOString();
    fs.writeFileSync(wwwVersionJson, JSON.stringify(vData, null, 2), 'utf8');
    console.log(`✅ อัปเดต www/version.json ให้ตรงกับเวอร์ชัน APK: ${vData.version}`);
  } catch(e) {}
}

const mainActPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'java', 'com', 'haimiya', 'typo', 'MainActivity.java');
if (fs.existsSync(mainActPath)) {
  let javaContent = fs.readFileSync(mainActPath, 'utf8');
  javaContent = javaContent.replace(/public static int CURRENT_VERSION_CODE = \d+;/, `public static int CURRENT_VERSION_CODE = ${versionCode};`);
  fs.writeFileSync(mainActPath, javaContent, 'utf8');
  console.log(`✅ อัปเดต MainActivity.java CURRENT_VERSION_CODE: ${versionCode}`);
}

// ปรับแต่ง AndroidManifest.xml เพื่อเปิดใช้งาน Picture-in-Picture และเพิ่ม Permissions ที่จำเป็น
const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');

  const permissionsToAdd = [
    '<uses-permission android:name="android.permission.WAKE_LOCK" />',
    '<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />',
    '<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />',
    '<uses-permission android:name="android.permission.INTERNET" />',
    '<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />',
    '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="29" />',
    '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />'
  ];

  permissionsToAdd.forEach(p => {
    if (!manifest.includes(p)) {
      manifest = manifest.replace('</manifest>', `    ${p}\n</manifest>`);
    }
  });

  // ปรับแต่ง <application เพื่อรองรับ HTTP cleartext และ legacy external storage บน Android 10
  if (!manifest.includes('android:usesCleartextTraffic')) {
    manifest = manifest.replace(
      /<application\b([^>]*)>/,
      (match, attrs) => {
        let newAttrs = attrs;
        if (!newAttrs.includes('android:usesCleartextTraffic')) {
          newAttrs += ' android:usesCleartextTraffic="true"';
        }
        if (!newAttrs.includes('android:requestLegacyExternalStorage')) {
          newAttrs += ' android:requestLegacyExternalStorage="true"';
        }
        return `<application${newAttrs}>`;
      }
    );
  }

  // เพิ่ม android:supportsPictureInPicture="true" และ resizeableActivity ใน <activity
  if (!manifest.includes('android:supportsPictureInPicture="true"')) {
    manifest = manifest.replace(
      /<activity\b([^>]*)>/,
      (match, attrs) => {
        let newAttrs = attrs;
        if (!newAttrs.includes('android:supportsPictureInPicture')) {
          newAttrs += ' android:supportsPictureInPicture="true"';
        }
        if (!newAttrs.includes('android:resizeableActivity')) {
          newAttrs += ' android:resizeableActivity="true"';
        }
        return `<activity${newAttrs}>`;
      }
    );
    console.log('✅ เพิ่ม android:supportsPictureInPicture="true" ใน AndroidManifest.xml สำเร็จ');
  }

  fs.writeFileSync(manifestPath, manifest, 'utf8');
}

// บันทึก .build_version ให้ GitHub Actions ใช้เป็น tag_name ของ Release
fs.writeFileSync(path.join(__dirname, '.build_version'), versionName, 'utf8');
console.log(`✅ บันทึก .build_version: ${versionName}`);

