// ============================================================
//  Fertility Tracker — Google Apps Script API
//  วิธีใช้: Extensions > Apps Script > วาง code นี้
//           Deploy > New Deployment > Web App
//           Execute as: Me | Who has access: Anyone
// ============================================================

const SHEET_NAME_PERIODS  = "periods";
const SHEET_NAME_DAYDATA  = "daydata";
const SHEET_NAME_SETTINGS = "settings";

// ── Bootstrap: สร้าง sheet ถ้ายังไม่มี ──────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function initSheets() {
  getOrCreateSheet(SHEET_NAME_PERIODS,  ["date", "created_at"]);
  getOrCreateSheet(SHEET_NAME_DAYDATA,  ["date", "bbt", "lh", "symptoms", "note", "updated_at"]);
  getOrCreateSheet(SHEET_NAME_SETTINGS, ["key", "value", "updated_at"]);
}

// ── CORS helper ──────────────────────────────────────────────
function response(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── GET handler ──────────────────────────────────────────────
function doGet(e) {
  try {
    initSheets();
    const action = e.parameter.action || "all";

    if (action === "all") {
      return response({
        ok: true,
        periods:  getPeriodsData(),
        daydata:  getDayData(),
        settings: getSettings(),
      });
    }
    if (action === "periods")  return response({ ok: true, data: getPeriodsData() });
    if (action === "daydata")  return response({ ok: true, data: getDayData() });
    if (action === "settings") return response({ ok: true, data: getSettings() });

    return response({ ok: false, error: "unknown action" });
  } catch (err) {
    return response({ ok: false, error: err.message });
  }
}

// ── POST handler ─────────────────────────────────────────────
function doPost(e) {
  try {
    initSheets();
    const body = JSON.parse(e.postData.contents);
    const { action, payload } = body;

    if (action === "sync") {
      // รับข้อมูลทั้งหมดจาก client แล้ว overwrite
      syncAll(payload);
      return response({ ok: true, message: "synced" });
    }

    if (action === "add_period") {
      addPeriod(payload.date);
      return response({ ok: true });
    }

    if (action === "remove_period") {
      removePeriod(payload.date);
      return response({ ok: true });
    }

    if (action === "save_daydata") {
      saveDayData(payload.date, payload.data);
      return response({ ok: true });
    }

    if (action === "save_settings") {
      saveSettings(payload);
      return response({ ok: true });
    }

    return response({ ok: false, error: "unknown action" });
  } catch (err) {
    return response({ ok: false, error: err.message });
  }
}

// ── Periods ──────────────────────────────────────────────────
function getPeriodsData() {
  const sheet = getOrCreateSheet(SHEET_NAME_PERIODS, ["date","created_at"]);
  const rows  = sheet.getDataRange().getValues();
  return rows.slice(1).map(r => r[0]).filter(Boolean);
}

function addPeriod(date) {
  const sheet  = getOrCreateSheet(SHEET_NAME_PERIODS, ["date","created_at"]);
  const exists = getPeriodsData().includes(date);
  if (!exists) sheet.appendRow([date, new Date().toISOString()]);
}

function removePeriod(date) {
  const sheet = getOrCreateSheet(SHEET_NAME_PERIODS, ["date","created_at"]);
  const data  = sheet.getDataRange().getValues();
  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0] === date) { sheet.deleteRow(i + 1); break; }
  }
}

// ── Day Data ─────────────────────────────────────────────────
function getDayData() {
  const sheet = getOrCreateSheet(SHEET_NAME_DAYDATA, ["date","bbt","lh","symptoms","note","updated_at"]);
  const rows  = sheet.getDataRange().getValues();
  const result = {};
  rows.slice(1).forEach(r => {
    if (!r[0]) return;
    const obj = {};
    if (r[1] !== "") obj.bbt = parseFloat(r[1]);
    if (r[2] !== "") obj.lh  = r[2];
    if (r[3] !== "") obj.symptoms = r[3].split(",").filter(Boolean);
    if (r[4] !== "") obj.note = r[4];
    result[r[0]] = obj;
  });
  return result;
}

function saveDayData(date, data) {
  const sheet = getOrCreateSheet(SHEET_NAME_DAYDATA, ["date","bbt","lh","symptoms","note","updated_at"]);
  const rows  = sheet.getDataRange().getValues();
  const now   = new Date().toISOString();
  const row   = [
    date,
    data.bbt  != null ? data.bbt  : "",
    data.lh   != null ? data.lh   : "",
    (data.symptoms || []).join(","),
    data.note || "",
    now,
  ];

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][0] === date) {
      sheet.getRange(i + 1, 1, 1, row.length).setValues([row]);
      return;
    }
  }
  sheet.appendRow(row);
}

// ── Settings ─────────────────────────────────────────────────
function getSettings() {
  const sheet  = getOrCreateSheet(SHEET_NAME_SETTINGS, ["key","value","updated_at"]);
  const rows   = sheet.getDataRange().getValues();
  const result = {};
  rows.slice(1).forEach(r => { if (r[0]) result[r[0]] = r[1]; });
  return result;
}

function saveSettings(settings) {
  const sheet = getOrCreateSheet(SHEET_NAME_SETTINGS, ["key","value","updated_at"]);
  const rows  = sheet.getDataRange().getValues();
  const now   = new Date().toISOString();
  Object.entries(settings).forEach(([key, value]) => {
    let found = false;
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][0] === key) {
        sheet.getRange(i + 1, 1, 1, 3).setValues([[key, value, now]]);
        found = true; break;
      }
    }
    if (!found) sheet.appendRow([key, value, now]);
  });
}

// ── Full sync ─────────────────────────────────────────────────
function syncAll(payload) {
  const { cycles, dayData, cycleLen, periodLen } = payload;

  // Periods — clear & rewrite
  const ps = getOrCreateSheet(SHEET_NAME_PERIODS, ["date","created_at"]);
  if (ps.getLastRow() > 1) ps.deleteRows(2, ps.getLastRow() - 1);
  const now = new Date().toISOString();
  (cycles || []).sort().forEach(d => ps.appendRow([d, now]));

  // DayData — clear & rewrite
  const ds = getOrCreateSheet(SHEET_NAME_DAYDATA, ["date","bbt","lh","symptoms","note","updated_at"]);
  if (ds.getLastRow() > 1) ds.deleteRows(2, ds.getLastRow() - 1);
  Object.entries(dayData || {}).forEach(([date, data]) => {
    ds.appendRow([
      date,
      data.bbt  != null ? data.bbt  : "",
      data.lh   != null ? data.lh   : "",
      (data.symptoms || []).join(","),
      data.note || "",
      now,
    ]);
  });

  // Settings
  saveSettings({ cycleLen: String(cycleLen || 28), periodLen: String(periodLen || 5) });
}
