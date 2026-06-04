# 🌸 Fertility Tracker

แอพติดตามรอบเดือนและช่วงเจริญพันธุ์ เพื่อเพิ่มโอกาสมีลูก  
รองรับการติดตั้งบนมือถือ (PWA) และเชื่อมต่อ Google Sheets เป็น database

## ✨ Features

- 📅 ปฏิทินบันทึกวันเริ่มประจำเดือน
- ⭐ คำนวณวันไข่ตกและช่วงเจริญพันธุ์อัตโนมัติ
- 🌡️ บันทึกอุณหภูมิ BBT พร้อมกราฟ
- 🧪 บันทึกผล LH Test
- 😊 บันทึกอาการ/อารมณ์รายวัน
- 📝 Note รายวัน
- ☁️ ซิงค์ข้อมูลขึ้น Google Sheets
- 📱 ติดตั้งบนมือถือได้ (PWA)

## 🚀 การติดตั้ง

### 1. เปิดใช้งานผ่าน GitHub Pages

เข้าไปที่ `Settings → Pages → Branch: main → Save`

จากนั้นเข้าใช้งานได้ที่ `https://<your-username>.github.io/<repo-name>/`

### 2. ตั้งค่า Google Sheets (ทางเลือก — สำหรับซิงค์ข้อมูล)

**สร้าง Google Apps Script:**

1. เปิด [Google Sheets](https://sheets.google.com) → สร้าง Sheet ใหม่ ตั้งชื่อ `Fertility Tracker`
2. ไปที่ **Extensions → Apps Script**
3. ลบโค้ดเดิมทิ้ง แล้ววางเนื้อหาจากไฟล์ `Code.gs`
4. กด **Deploy → New Deployment**
   - Type: **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. กด **Deploy** → Copy URL ที่ได้

**เชื่อมต่อกับแอพ:**

1. เปิดแอพ → แท็บ **⚙️**
2. วาง URL ที่ได้จาก Apps Script
3. กด **💾 บันทึก URL และซิงค์**

## 📁 โครงสร้างไฟล์

```
fertility-tracker/
├── index.html   # แอพหลัก (PWA)
├── Code.gs      # Google Apps Script (API backend)
└── README.md
```

## 🛠️ Tech Stack

- Vanilla HTML/CSS/JavaScript (ไม่ต้อง build)
- Google Apps Script (REST API)
- Google Sheets (Database)
- localStorage (Offline cache)
- Canvas API (BBT Chart)
- PWA (ติดตั้งบนมือถือ)

## ⚠️ หมายเหตุ

ข้อมูลสุขภาพนี้เป็นเพียงการบันทึกส่วนตัว ไม่ใช่คำแนะนำทางการแพทย์
