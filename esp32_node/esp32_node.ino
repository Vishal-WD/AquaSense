/*
 * ═══════════════════════════════════════════════════════════════
 *  AquaSense ESP32 — IoT Water Quality Sensor Node
 *  Pushes data to Firebase RTDB: WaterHistory/{DEVICE_UID}/
 * ═══════════════════════════════════════════════════════════════
 *
 *  Data Schema per reading:
 *    { ph, ntu, temp, light, server_time }
 *
 *  The DEVICE_UID is provisioned by a Government Official
 *  through the Captive Portal setup flow.
 * ═══════════════════════════════════════════════════════════════
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// ─── EEPROM Layout ───
// Bytes 0-31:   WiFi SSID (32 bytes)
// Bytes 32-95:  WiFi Password (64 bytes)
// Bytes 96-127: Device UID (32 bytes)
// Byte  128:    Config Flag (0xAA = configured)
#define EEPROM_SIZE 256
#define SSID_ADDR   0
#define PASS_ADDR   32
#define UID_ADDR    96
#define FLAG_ADDR   128
#define CONFIG_FLAG 0xAA

// ─── Firebase Config ───
const String FIREBASE_HOST = "https://devfest-3c6e5-default-rtdb.firebaseio.com";

// ─── Runtime Vars ───
String wifi_ssid = "";
String wifi_pass = "";
String device_uid = "";
bool isConfigured = false;

// ─── Sensor Simulation (replace with real sensor reads in production) ───
float sim_ph = 7.1;
float sim_ntu = 0.5;
float sim_temp = 28.5;
float sim_light = 45.0;

// ─── EEPROM Helpers ───
void writeStringToEEPROM(int addr, String data, int maxLen) {
  for (int i = 0; i < maxLen; i++) {
    if (i < data.length()) {
      EEPROM.write(addr + i, data[i]);
    } else {
      EEPROM.write(addr + i, 0);
    }
  }
  EEPROM.commit();
}

String readStringFromEEPROM(int addr, int maxLen) {
  String result = "";
  for (int i = 0; i < maxLen; i++) {
    char c = EEPROM.read(addr + i);
    if (c == 0) break;
    result += c;
  }
  return result;
}

void loadConfig() {
  EEPROM.begin(EEPROM_SIZE);
  if (EEPROM.read(FLAG_ADDR) == CONFIG_FLAG) {
    wifi_ssid = readStringFromEEPROM(SSID_ADDR, 32);
    wifi_pass = readStringFromEEPROM(PASS_ADDR, 64);
    device_uid = readStringFromEEPROM(UID_ADDR, 32);
    isConfigured = true;
    Serial.println("[CONFIG] Loaded from EEPROM:");
    Serial.println("  SSID: " + wifi_ssid);
    Serial.println("  UID:  " + device_uid);
  } else {
    Serial.println("[CONFIG] No config found. Starting Captive Portal...");
    isConfigured = false;
  }
}

void saveConfig(String ssid, String pass, String uid) {
  writeStringToEEPROM(SSID_ADDR, ssid, 32);
  writeStringToEEPROM(PASS_ADDR, pass, 64);
  writeStringToEEPROM(UID_ADDR, uid, 32);
  EEPROM.write(FLAG_ADDR, CONFIG_FLAG);
  EEPROM.commit();
  Serial.println("[CONFIG] Saved to EEPROM.");
}

// ─── Captive Portal ───
#include <WebServer.h>
WebServer server(80);

const char CAPTIVE_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AquaSense Setup</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', sans-serif; background: #0a0e1a; color: #e2e8f0;
           display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .card { background: rgba(15,23,42,0.9); border: 1px solid rgba(56,189,248,0.15);
            border-radius: 20px; padding: 40px 32px; width: 90%; max-width: 380px;
            box-shadow: 0 20px 50px rgba(0,0,0,0.5); }
    .logo { text-align: center; margin-bottom: 24px; }
    .logo h1 { font-size: 24px; background: linear-gradient(135deg, #38bdf8, #34d399);
               -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .logo p { color: #64748b; font-size: 12px; margin-top: 4px; }
    label { display: block; color: #94a3b8; font-size: 12px; font-weight: 600;
            margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
    input { width: 100%; background: rgba(30,41,59,0.8); border: 1px solid rgba(100,116,139,0.3);
            border-radius: 12px; padding: 14px; color: #e2e8f0; font-size: 14px;
            margin-bottom: 16px; outline: none; }
    input:focus { border-color: #0ea5e9; }
    .uid-input { font-family: monospace; font-size: 18px; font-weight: 700;
                 letter-spacing: 3px; text-transform: uppercase; text-align: center; }
    button { width: 100%; background: linear-gradient(135deg, #0ea5e9, #06b6d4);
             border: none; border-radius: 14px; padding: 15px; color: white;
             font-weight: 700; font-size: 16px; cursor: pointer; margin-top: 8px; }
    button:hover { opacity: 0.9; }
    .hint { text-align: center; color: #475569; font-size: 11px; margin-top: 16px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo">
      <h1>&#x1F4A7; AquaSense Setup</h1>
      <p>ESP32 Sensor Node Configuration</p>
    </div>
    <form action="/save" method="POST">
      <label>WiFi Network Name (SSID)</label>
      <input type="text" name="ssid" required placeholder="Your WiFi name">
      <label>WiFi Password</label>
      <input type="password" name="pass" required placeholder="WiFi password">
      <label>Device Unique ID (Assigned by Official)</label>
      <input type="text" name="uid" required placeholder="TN-CH-108" class="uid-input">
      <button type="submit">Save & Connect</button>
    </form>
    <p class="hint">This ID links your sensor to the AquaSense cloud dashboard.</p>
  </div>
</body>
</html>
)rawliteral";

void handleRoot() {
  server.send(200, "text/html", CAPTIVE_HTML);
}

void handleSave() {
  String ssid = server.arg("ssid");
  String pass = server.arg("pass");
  String uid = server.arg("uid");

  if (ssid.length() > 0 && uid.length() > 0) {
    saveConfig(ssid, pass, uid);
    server.send(200, "text/html",
      "<html><body style='background:#0a0e1a;color:#34d399;font-family:sans-serif;"
      "display:flex;align-items:center;justify-content:center;height:100vh;'>"
      "<div style='text-align:center;'>"
      "<h2>&#10003; Configuration Saved!</h2>"
      "<p style='color:#94a3b8;margin-top:12px;'>Device UID: <strong style='color:#38bdf8;'>"
      + uid + "</strong></p>"
      "<p style='color:#64748b;margin-top:8px;'>Rebooting in 3 seconds...</p>"
      "</div></body></html>");
    delay(3000);
    ESP.restart();
  } else {
    server.send(400, "text/html", "<h2>Error: Missing fields</h2>");
  }
}

void startCaptivePortal() {
  WiFi.softAP("AquaSense-Setup", "aqua1234");
  Serial.println("[PORTAL] Access Point started: AquaSense-Setup");
  Serial.print("[PORTAL] IP: ");
  Serial.println(WiFi.softAPIP());

  server.on("/", handleRoot);
  server.on("/save", HTTP_POST, handleSave);
  server.begin();
  Serial.println("[PORTAL] Web server started. Connect to WiFi 'AquaSense-Setup' and open 192.168.4.1");

  // Keep serving until configured
  while (true) {
    server.handleClient();
    delay(10);
  }
}

// ─── WiFi Connection ───
bool connectWiFi() {
  WiFi.begin(wifi_ssid.c_str(), wifi_pass.c_str());
  Serial.print("[WIFI] Connecting to " + wifi_ssid);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 40) {
    delay(500);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WIFI] Connected! IP: " + WiFi.localIP().toString());
    return true;
  } else {
    Serial.println("\n[WIFI] Connection FAILED after 20s.");
    return false;
  }
}

// ─── Sensor Simulation ───
void simulateSensorData() {
  // pH: Random walk around 7.0-7.5
  sim_ph += (random(-15, 15) / 100.0);
  sim_ph = constrain(sim_ph, 4.0, 9.5);

  // Turbidity (NTU): Small fluctuations
  sim_ntu += (random(-5, 8) / 100.0);
  sim_ntu = constrain(sim_ntu, 0.0, 8.0);

  // Temperature: Slow drift
  sim_temp += (random(-3, 3) / 10.0);
  sim_temp = constrain(sim_temp, 15.0, 42.0);

  // Light: Varies with time of day simulation
  sim_light += (random(-5, 5));
  sim_light = constrain(sim_light, 0.0, 100.0);
}

// ─── Firebase Push ───
void pushToFirebase() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("[ERROR] WiFi disconnected. Skipping push.");
    return;
  }

  simulateSensorData();

  // Build JSON matching AquaSense schema
  StaticJsonDocument<256> doc;
  doc["ph"] = round(sim_ph * 100) / 100.0;
  doc["ntu"] = round(sim_ntu * 100) / 100.0;
  doc["temp"] = round(sim_temp * 10) / 10.0;
  doc["light"] = round(sim_light);
  doc["server_time"] = millis();  // In production use NTP or Firebase server timestamp

  String jsonPayload;
  serializeJson(doc, jsonPayload);

  // POST to WaterHistory/{DEVICE_UID}/
  String url = FIREBASE_HOST + "/WaterHistory/" + device_uid + ".json";

  HTTPClient http;
  http.begin(url);
  http.addHeader("Content-Type", "application/json");

  Serial.println("[TX] " + jsonPayload + " → " + device_uid);

  int httpCode = http.POST(jsonPayload);

  if (httpCode == 200) {
    Serial.println("[TX] ✓ Firebase POST success (200)");
  } else {
    Serial.println("[TX] ✗ Firebase POST error (" + String(httpCode) + ")");
  }

  http.end();
}

// ─── Setup ───
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("═══════════════════════════════════════");
  Serial.println("  AquaSense ESP32 Sensor Node v2.0");
  Serial.println("═══════════════════════════════════════");

  loadConfig();

  if (!isConfigured) {
    startCaptivePortal();  // Blocks until configured & reboots
  }

  if (!connectWiFi()) {
    Serial.println("[FATAL] Cannot reach WiFi. Restarting in 10s...");
    delay(10000);
    ESP.restart();
  }

  Serial.println("[READY] Streaming to WaterHistory/" + device_uid + "/");
  Serial.println("[READY] Push interval: 60 seconds");
}

// ─── Loop ───
void loop() {
  pushToFirebase();
  delay(60 * 1000);  // 1-minute cycle (change to 15*60*1000 for 15-min production cycle)
}
