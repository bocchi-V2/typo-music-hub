/**
 * generate_ios_mobileconfig.js
 * สร้างไฟล์ .mobileconfig สำหรับผู้ใช้ iOS (iPhone/iPad)
 * ให้สามารถดาวน์โหลดและติดตั้งเป็นแอปไอคอนลงหน้าจอโฮมได้ใน 1 คลิก
 */

const fs = require('fs');
const path = require('path');

const iconPath = path.join(__dirname, 'app-icon.jpg');
const iconBase64 = fs.readFileSync(iconPath).toString('base64');

const mobileConfig = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>PayloadContent</key>
    <array>
        <dict>
            <key>FullScreen</key>
            <true/>
            <key>IsRemovable</key>
            <true/>
            <key>Precomposed</key>
            <true/>
            <key>Icon</key>
            <data>${iconBase64}</data>
            <key>Label</key>
            <string>Haimiya Typo</string>
            <key>PayloadDescription</key>
            <string>Haimiya Typo – เว็บแอปตัดต่อคลิปไทโป</string>
            <key>PayloadDisplayName</key>
            <string>Haimiya Typo</string>
            <key>PayloadIdentifier</key>
            <string>com.haimiya.typo.webclip</string>
            <key>PayloadType</key>
            <string>com.apple.webClip.managed</string>
            <key>PayloadUUID</key>
            <string>9F8A7B6C-5D4E-3F2A-1B0C-9E8D7C6B5A4F</string>
            <key>PayloadVersion</key>
            <integer>1</integer>
            <key>URL</key>
            <string>https://bocchi-v2.github.io/typo-music-hub/</string>
        </dict>
    </array>
    <key>PayloadDisplayName</key>
    <string>Haimiya Typo (iOS Web App)</string>
    <key>PayloadIdentifier</key>
    <string>com.haimiya.typo.profile</string>
    <key>PayloadOrganization</key>
    <string>Haimiya Studio</string>
    <key>PayloadDescription</key>
    <string>โปรไฟล์ติดตั้งแอป Haimiya Typo ลงหน้าจอ iPhone/iPad</string>
    <key>PayloadRemovalDisallowed</key>
    <false/>
    <key>PayloadType</key>
    <string>Configuration</string>
    <key>PayloadUUID</key>
    <string>3E4F5A6B-7C8D-9E0F-1A2B-3C4D5E6F7A8B</string>
    <key>PayloadVersion</key>
    <integer>1</integer>
</dict>
</plist>`;

fs.writeFileSync(path.join(__dirname, 'haimiya-typo.mobileconfig'), mobileConfig, 'utf8');
console.log('✅ สร้าง haimiya-typo.mobileconfig สำเร็จ!');
