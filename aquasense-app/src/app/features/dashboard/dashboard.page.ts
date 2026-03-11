import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService, SensorReading, AppUser } from '../../core/services/firebase.service';
import { AnalyticsService, TrendResult, AlgaeRiskResult } from '../../core/services/analytics.service';

@Component({
  selector: 'app-dashboard',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="toolbar-title">
            <ion-icon name="water"></ion-icon>
            My Sensor
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <div class="connection-status" [ngClass]="connectionStatus">
            <div class="status-dot"></div>
            <span>{{ connectionStatus === 'connected' ? 'Live' : 'Offline' }}</span>
          </div>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="dashboard-content" [fullscreen]="true">
      <!-- No device assigned -->
      <div *ngIf="!user?.assigned_device_id" class="no-device">
        <div class="no-device-card">
          <ion-icon name="hardware-chip-outline" class="big-icon"></ion-icon>
          <h2>No Sensor Assigned</h2>
          <p>A Government Official needs to register your Unique Device ID (UID).</p>
          <p class="uid-hint">Contact your local water authority to get your AquaSense device provisioned.</p>
        </div>
      </div>

      <!-- Dashboard content -->
      <div *ngIf="user?.assigned_device_id" class="dashboard-grid">
        <!-- UID Banner -->
        <div class="uid-banner">
          <div class="uid-info">
            <span class="uid-label">Device UID</span>
            <span class="uid-value">{{ user?.assigned_device_id }}</span>
          </div>
          <div class="last-updated" *ngIf="latestReading">
            <ion-icon name="time-outline"></ion-icon>
            <span>{{ lastUpdatedText }}</span>
          </div>
        </div>

        <!-- Gauges Row -->
        <div class="gauges-row">
          <app-gauge
            [value]="latestReading?.ph || 0"
            [min]="0" [max]="14"
            [warningMin]="6.8" [warningMax]="8.2"
            [criticalMin]="6.5" [criticalMax]="8.5"
            label="pH Level" unit="pH"
            [decimals]="2">
          </app-gauge>

          <app-gauge
            [value]="latestReading?.ntu || 0"
            [min]="0" [max]="10"
            [warningMin]="0" [warningMax]="3"
            [criticalMin]="0" [criticalMax]="5"
            label="Turbidity" unit="NTU"
            [decimals]="2">
          </app-gauge>

          <app-gauge
            [value]="latestReading?.temp || 0"
            [min]="0" [max]="50"
            [warningMin]="0" [warningMax]="30"
            [criticalMin]="0" [criticalMax]="35"
            label="Temperature" unit="°C"
            [decimals]="1">
          </app-gauge>

          <app-gauge
            [value]="latestReading?.light || 0"
            [min]="0" [max]="100"
            [warningMin]="20" [warningMax]="100"
            [criticalMin]="10" [criticalMax]="100"
            label="Light" unit="lux"
            [decimals]="0">
          </app-gauge>
        </div>

        <!-- Overall Status Card -->
        <div class="status-card" [ngClass]="overallStatus">
          <div class="status-header">
            <ion-icon [name]="statusIcon"></ion-icon>
            <h3>{{ statusText }}</h3>
          </div>
          <p class="status-description">{{ statusDescription }}</p>
        </div>

        <!-- Trend Analysis Cards -->
        <div class="analysis-row" *ngIf="readings.length > 10">
          <div class="analysis-card">
            <div class="analysis-header">
              <ion-icon name="trending-up"></ion-icon>
              <span>pH Trend (24h)</span>
            </div>
            <div class="analysis-body" *ngIf="phTrend">
              <div class="trend-value" [ngClass]="phTrend.riskLevel">
                Slope: {{ phTrend.slope > 0 ? '+' : '' }}{{ phTrend.slope.toFixed(4) }}
              </div>
              <div class="trend-prediction">
                6h Forecast: <strong>{{ phTrend.prediction6h.toFixed(2) }} pH</strong>
              </div>
              <div class="trend-badge" [ngClass]="phTrend.riskLevel">
                {{ phTrend.isRising ? '↑ Rising' : '→ Stable' }}
              </div>
            </div>
          </div>

          <div class="analysis-card">
            <div class="analysis-header">
              <ion-icon name="analytics"></ion-icon>
              <span>Turbidity Trend</span>
            </div>
            <div class="analysis-body" *ngIf="ntuTrend">
              <div class="trend-value" [ngClass]="ntuTrend.riskLevel">
                Slope: {{ ntuTrend.slope > 0 ? '+' : '' }}{{ ntuTrend.slope.toFixed(4) }}
              </div>
              <div class="trend-prediction">
                6h Forecast: <strong>{{ ntuTrend.prediction6h.toFixed(2) }} NTU</strong>
              </div>
              <div class="trend-badge" [ngClass]="ntuTrend.riskLevel">
                {{ ntuTrend.isRising ? '↑ Rising' : '→ Stable' }}
              </div>
            </div>
          </div>

          <div class="analysis-card algae-card" *ngIf="algaeRisk">
            <div class="analysis-header">
              <ion-icon name="leaf"></ion-icon>
              <span>Algae Risk Analysis</span>
            </div>
            <div class="analysis-body">
              <div class="algae-score" [ngClass]="algaeRisk.risk ? 'critical' : 'safe'">
                Risk Score: {{ algaeRisk.score }}%
              </div>
              <div class="algae-factors" *ngIf="algaeRisk.factors.length > 0">
                <div *ngFor="let f of algaeRisk.factors" class="factor-tag">
                  <ion-icon name="warning"></ion-icon> {{ f }}
                </div>
              </div>
              <div class="algae-status" [ngClass]="algaeRisk.risk ? 'critical' : 'safe'">
                {{ algaeRisk.risk ? '⚠ HIGH RISK' : '✓ Low Risk' }}
              </div>
            </div>
          </div>
        </div>

        <!-- No data state -->
        <div *ngIf="!latestReading && !loadingData" class="no-data">
          <ion-icon name="cloud-offline-outline"></ion-icon>
          <h3>Waiting for sensor data...</h3>
          <p>Your ESP32 device hasn't sent any readings yet.</p>
        </div>

        <div *ngIf="loadingData" class="loading-state">
          <ion-spinner name="crescent"></ion-spinner>
          <p>Connecting to live sensor feed...</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-toolbar {
      --background: rgba(10, 14, 26, 0.95);
      --color: #e2e8f0;
      --border-width: 0;
    }

    .toolbar-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      font-size: 18px;
    }

    .toolbar-title ion-icon {
      color: #0ea5e9;
      font-size: 22px;
    }

    .connection-status {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 600;
    }

    .connection-status.connected {
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
    }

    .connection-status.disconnected {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
    }

    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }

    .connected .status-dot {
      background: #10b981;
      box-shadow: 0 0 6px #10b981;
      animation: livePulse 2s infinite;
    }

    .disconnected .status-dot {
      background: #ef4444;
    }

    @keyframes livePulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .dashboard-content {
      --background: #0a0e1a;
    }

    .dashboard-grid {
      padding: 16px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .uid-banner {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(16, 185, 129, 0.08));
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 16px;
      padding: 16px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .uid-label {
      color: #64748b;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      display: block;
    }

    .uid-value {
      color: #38bdf8;
      font-size: 18px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
      letter-spacing: 2px;
    }

    .last-updated {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #64748b;
      font-size: 12px;
    }

    .gauges-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 20px;
    }

    .status-card {
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid;
    }

    .status-card.safe {
      background: rgba(16, 185, 129, 0.08);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .status-card.warning {
      background: rgba(245, 158, 11, 0.08);
      border-color: rgba(245, 158, 11, 0.2);
    }

    .status-card.critical {
      background: rgba(239, 68, 68, 0.08);
      border-color: rgba(239, 68, 68, 0.2);
      animation: hazardPulse 2s ease-in-out infinite;
    }

    @keyframes hazardPulse {
      0%, 100% { border-color: rgba(239, 68, 68, 0.2); }
      50% { border-color: rgba(239, 68, 68, 0.5); }
    }

    .status-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 8px;
    }

    .status-header ion-icon {
      font-size: 24px;
    }

    .safe .status-header { color: #34d399; }
    .warning .status-header { color: #fbbf24; }
    .critical .status-header { color: #f87171; }

    .status-header h3 {
      margin: 0;
      font-size: 18px;
      font-weight: 700;
    }

    .status-description {
      color: #94a3b8;
      font-size: 13px;
      margin: 0;
    }

    .analysis-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 16px;
    }

    .analysis-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 16px;
      padding: 20px;
    }

    .analysis-header {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      margin-bottom: 14px;
    }

    .analysis-header ion-icon {
      color: #0ea5e9;
      font-size: 18px;
    }

    .trend-value {
      font-size: 16px;
      font-weight: 700;
      font-family: 'Courier New', monospace;
      margin-bottom: 8px;
    }

    .trend-value.safe { color: #34d399; }
    .trend-value.warning { color: #fbbf24; }
    .trend-value.critical { color: #f87171; }

    .trend-prediction {
      color: #94a3b8;
      font-size: 13px;
      margin-bottom: 10px;
    }

    .trend-prediction strong {
      color: #e2e8f0;
    }

    .trend-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 700;
    }

    .trend-badge.safe { background: rgba(16, 185, 129, 0.15); color: #34d399; }
    .trend-badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .trend-badge.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .algae-score {
      font-size: 20px;
      font-weight: 800;
      margin-bottom: 12px;
    }

    .algae-score.safe { color: #34d399; }
    .algae-score.critical { color: #f87171; }

    .factor-tag {
      background: rgba(245, 158, 11, 0.1);
      border-radius: 8px;
      padding: 6px 12px;
      font-size: 12px;
      color: #fbbf24;
      margin-bottom: 6px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .algae-status {
      margin-top: 10px;
      font-weight: 700;
      font-size: 14px;
    }

    .algae-status.safe { color: #34d399; }
    .algae-status.critical { color: #f87171; }

    .no-device {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: 24px;
    }

    .no-device-card {
      background: rgba(15, 23, 42, 0.7);
      border: 1px dashed rgba(100, 116, 139, 0.3);
      border-radius: 24px;
      padding: 48px;
      text-align: center;
      max-width: 420px;
    }

    .big-icon {
      font-size: 64px;
      color: #334155;
      margin-bottom: 16px;
    }

    .no-device-card h2 {
      color: #e2e8f0;
      margin: 0 0 8px;
    }

    .no-device-card p {
      color: #64748b;
      font-size: 14px;
      margin: 0 0 8px;
    }

    .uid-hint {
      color: #475569 !important;
      font-size: 12px !important;
    }

    .no-data, .loading-state {
      text-align: center;
      padding: 60px 24px;
      color: #64748b;
    }

    .no-data ion-icon {
      font-size: 48px;
      color: #334155;
      margin-bottom: 12px;
    }

    .no-data h3 { color: #94a3b8; }
  `],
  standalone: false
})
export class DashboardPage implements OnInit, OnDestroy {
  user: AppUser | null = null;
  latestReading: SensorReading | null = null;
  readings: SensorReading[] = [];
  connectionStatus: 'connected' | 'disconnected' = 'disconnected';
  loadingData = true;

  phTrend: TrendResult | null = null;
  ntuTrend: TrendResult | null = null;
  algaeRisk: AlgaeRiskResult | null = null;

  overallStatus: 'safe' | 'warning' | 'critical' = 'safe';
  statusText = 'Analyzing...';
  statusIcon = 'shield-checkmark';
  statusDescription = '';
  lastUpdatedText = '';

  private unsubscribe: (() => void) | null = null;
  private unsubscribeLatest: (() => void) | null = null;

  constructor(
    private firebase: FirebaseService,
    private analytics: AnalyticsService
  ) {}

  ngOnInit() {
    this.firebase.currentUser$.subscribe(user => {
      this.user = user;
      if (user?.assigned_device_id) {
        this.subscribeToSensor(user.assigned_device_id);
      } else {
        this.loadingData = false;
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
    this.unsubscribeLatest?.();
  }

  private subscribeToSensor(deviceId: string) {
    this.loadingData = true;

    this.unsubscribe = this.firebase.subscribeSensorData(deviceId, (readings) => {
      this.readings = readings;
      this.loadingData = false;
      this.connectionStatus = 'connected';

      if (readings.length > 0) {
        this.latestReading = readings[readings.length - 1];
        this.updateLastUpdated();
        this.runAnalytics();
      }
    });
  }

  private runAnalytics() {
    if (!this.latestReading) return;

    // Water quality status
    const status = this.analytics.getWaterQualityStatus(this.latestReading);
    this.overallStatus = status.overall;

    switch (status.overall) {
      case 'safe':
        this.statusText = 'Water Quality: Safe';
        this.statusIcon = 'shield-checkmark';
        this.statusDescription = 'All parameters are within acceptable limits. Your water is safe for consumption.';
        break;
      case 'warning':
        this.statusText = 'Water Quality: Caution';
        this.statusIcon = 'warning';
        this.statusDescription = 'Some parameters are approaching threshold levels. Monitor closely.';
        break;
      case 'critical':
        this.statusText = 'Water Quality: HAZARD';
        this.statusIcon = 'alert-circle';
        this.statusDescription = 'Critical values detected! Do NOT use this water for consumption. Contact authorities immediately.';
        break;
    }

    // Trend analysis
    if (this.readings.length > 10) {
      this.phTrend = this.analytics.analyzeTrend(this.readings, 'ph');
      this.ntuTrend = this.analytics.analyzeTrend(this.readings, 'ntu');
      this.algaeRisk = this.analytics.detectAlgaeRisk(this.readings);
    }
  }

  private updateLastUpdated() {
    if (!this.latestReading) return;
    const ts = this.latestReading.server_time;
    if (!ts) {
      this.lastUpdatedText = 'Just now';
      return;
    }
    const diff = Date.now() - ts;
    if (diff < 60000) this.lastUpdatedText = 'Just now';
    else if (diff < 3600000) this.lastUpdatedText = `${Math.floor(diff / 60000)}m ago`;
    else this.lastUpdatedText = `${Math.floor(diff / 3600000)}h ago`;
  }
}
