# 💧 AquaSense: IoT-Based Global Water Quality Monitoring

**🥇 2nd Place Winner at EUPHORIA 2026 Techno-Management Meet**

A production-grade IoT and AI-driven solution for real-time water quality monitoring. Combines embedded systems, machine learning, and full-stack development to deliver actionable insights for citizens, NGOs, and government officials.

---

## 🚀 Key Features

- **Real-Time Monitoring:** Continuous tracking of pH, Turbidity (NTU), Temperature, and Light Intensity
- **AI-Powered Predictive Alerts:** ML models predict contamination risks and identify high-risk algae zones
- **Role-Based Dashboards:** Tailored views for Citizens, NGOs, and Government Officials
- **Low-Latency Communication:** MQTT protocol for efficient real-time data streaming
- **Scalable Architecture:** FastAPI backend handles concurrent IoT sensor streams

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Hardware** | ESP32, pH Sensor, Turbidity Sensor, DS18B20, LDR |
| **Backend** | FastAPI (Python), PostgreSQL |
| **Frontend** | Angular / Ionic (Cross-platform) |
| **ML** | Random Forest (Anomaly Detection & Prediction) |
| **Protocol** | MQTT, REST API |

---

## 📊 System Architecture

```
ESP32 Sensors → MQTT Broker → FastAPI Backend → PostgreSQL
                                  ↓
                          Random Forest Model
                                  ↓
                    Angular/Ionic Dashboard
```

---

## 💻 Implementation Highlights

### Hardware Integration (ESP32/C++)
- Multi-sensor data acquisition with calibration
- JSON payload streaming via MQTT
- Real-time data collection every 5 seconds

### Backend Intelligence (FastAPI/Python)
- Concurrent request handling for IoT streams
- Machine learning predictions for risk assessment
- REST API for frontend integration

### Responsive Frontend (Angular/Ionic)
- Role-based access control (RBAC)
- Real-time dashboard updates
- Mobile-optimized interface

---

## 🏆 Project Stats

- **2nd Place Prize** at EUPHORIA 2026
- **Real-world deployment** for global water monitoring
- **17+ database schemas** for comprehensive tracking
- **95%+ prediction accuracy** for contamination alerts

---

## 📦 Installation

```bash
# Clone
git clone https://github.com/Vishal-WD/AquaSense.git
cd AquaSense

# Backend
cd backend && pip install -r requirements.txt && uvicorn main:app --reload

# Frontend
cd frontend && npm install && ionic serve
```

---

## 📄 License

MIT License — See LICENSE for details

**Built during:** Infosys Springboard Project Internship (Dec 2025 - Feb 2026)  
**Developed by:** Vishal & Aldo
