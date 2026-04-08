# 💧 Aqua Sense: IoT-Based Global Water Quality Monitoring

**Winner of 2nd Place at EUPHORIA 2026 Techno-Management Meet**

Aqua Sense is a comprehensive IoT and AI-driven solution designed to monitor water quality in real-time. By leveraging a custom sensor array and machine learning, it provides actionable insights for households, NGOs, and government bodies to ensure safe water consumption and management.

---

## 🚀 Key Features

* **Real-Time Monitoring:** Continuous tracking of critical water parameters including pH, Turbidity (NTU), Temperature, and Light Intensity.
* **AI-Powered Predictive Alerts:** Uses ML models to predict gradual rises in contamination and identify high-risk zones for algae formation.
* **Role-Based Access Control:** Tailored dashboards for:
    * **Citizens:** Personal household water health tracking.
    * **NGOs:** Monitoring regional water trends and advocacy.
    * **Government Officials:** Large-scale infrastructure management and policy-making.
* **Low-Latency Communication:** Utilizes MQTT protocol for efficient, real-time data transmission from hardware to the cloud.

---

## 🛠️ Tech Stack

### Hardware
* **Microcontroller:** ESP32 (Wi-Fi & Bluetooth enabled)
* **Sensor Array:** pH Sensor, Turbidity Sensor, DS18B20 Temperature Sensor, and LDR (Light Intensity).

### Software & Cloud
* **Backend:** FastAPI (Python)
* **Database:** PostgreSQL
* **Frontend:** Angular / Ionic (Cross-platform Web & Mobile App)
* **Machine Learning:** Random Forest (for anomaly detection and predictive analytics)
* **Protocol:** MQTT

---

## 📊 System Architecture

1.  **Data Acquisition:** ESP32 collects raw analog/digital data from the sensors.
2.  **Transmission:** Data is sent via MQTT to a central broker.
3.  **Processing:** FastAPI consumes the data, stores it in PostgreSQL, and runs it through the Random Forest model.
4.  **Visualization:** The Angular/Ionic app fetches processed data via REST APIs for the user dashboard.

---

## 💻 Code Snippets

### 1. Hardware: Sensor Data Reading (ESP32/C++)
```cpp
void loop() {
  float pHValue = analogRead(PH_PIN) * (3.3 / 4095.0) * 3.5; // Calibration factor
  float turbidity = analogRead(TURB_PIN);
  float temperature = sensors.getTempCByIndex(0);

  // JSON Payload
  String payload = "{\"ph\":" + String(pHValue) + ",\"turbidity\":" + String(turbidity) + "}";
  client.publish("aquasense/data", payload.c_str());
  
  delay(5000); 
}
2. Backend: Predictive Analytics (FastAPI/Python)
Python
from fastapi import FastAPI
from sklearn.ensemble import RandomForestClassifier

app = FastAPI()
model = load_model("water_quality_rf.pkl")

@app.post("/predict-risk")
async def predict_risk(ph: float, turbidity: float, temp: float):
    # Predicts 1 for Anomaly/Risk, 0 for Safe
    prediction = model.predict([[ph, turbidity, temp]])
    status = "Danger" if prediction[0] == 1 else "Safe"
    return {"status": status, "timestamp": "2026-04-08"}
📦 Installation & Setup
Clone the Repository

Bash
git clone [https://github.com/your-username/aqua-sense.git](https://github.com/your-username/aqua-sense.git)
Backend Setup

Bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
Frontend Setup

Bash
cd frontend
npm install
ionic serve
🏆 Achievements
Successfully developed as part of the Infosys Springboard Project Internship.

Awarded 2nd Place at EUPHORIA 2026 Techno-Management Meet.

📄 License
Distributed under the MIT License. See LICENSE for more information.

Developed by Vishal
