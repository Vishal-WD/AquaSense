import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { FirebaseService, SensorReading, AppUser, ManualAlert } from '../../core/services/firebase.service';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { ActivatedRoute } from '@angular/router';
import { AnalyticsService } from '../../core/services/analytics.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="toolbar-title">
            <ion-icon name="bar-chart"></ion-icon>
            Trends & Reports
          </div>
        </ion-title>

      </ion-toolbar>
    </ion-header>

    <ion-content class="reports-content" [fullscreen]="true">
      <div class="reports-container">
        <!-- Controls -->
        <div class="controls-bar">
          <div class="param-selector">
            <button *ngFor="let p of params" class="param-btn" [class.active]="selectedParam === p.key"
                    (click)="selectParam(p.key)">
              <ion-icon [name]="p.icon"></ion-icon> {{ p.label }}
            </button>
          </div>
        </div>

        <!-- Main Chart -->
        <div class="chart-card">
          <div class="chart-header">
            <h3 *ngIf="stationName">{{ stationName }} ({{ getParamLabel() }}) — 7-Day Trend</h3>
            <h3 *ngIf="!stationName">{{ getParamLabel() }} — 7-Day Trend</h3>
            <div class="chart-legend">
              <span class="legend-item historical"><span class="line"></span> Historical</span>
              <span class="legend-item prediction"><span class="line dashed"></span> Prediction</span>
            </div>
          </div>
          <div class="chart-wrapper">
            <canvas #trendChart></canvas>
          </div>
        </div>

        <!-- Stats Row -->
        <div class="stats-row" *ngIf="readings.length > 0">
          <div class="stat-card">
            <span class="stat-label">Current</span>
            <span class="stat-value">{{ currentValue.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Average (7d)</span>
            <span class="stat-value">{{ avgValue.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Min</span>
            <span class="stat-value">{{ minValue.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Max</span>
            <span class="stat-value">{{ maxValue.toFixed(2) }}</span>
          </div>
          <div class="stat-card">
            <span class="stat-label">Trend Slope</span>
            <span class="stat-value" [ngClass]="slope > 0.1 ? 'rising' : slope < -0.1 ? 'falling' : 'stable'">
              {{ slope > 0 ? '+' : '' }}{{ slope.toFixed(4) }}
            </span>
          </div>
        </div>

        <!-- Export Buttons -->
        <div class="export-row">
          <button class="export-btn" (click)="exportCSV()">
            <ion-icon name="document-text"></ion-icon> Export CSV
          </button>
        </div>

        <div *ngIf="readings.length === 0" class="no-data">
          <ion-icon name="analytics-outline"></ion-icon>
          <h3>No Data Available</h3>
          <p>Sensor data will appear once your device starts streaming.</p>
        </div>
      </div>

        <!-- Historical Alerts Section -->
        <div class="alerts-section" *ngIf="stationAlerts.length > 0" style="margin-top: 24px;">
          <h4 style="color: #94a3b8; font-size: 14px; text-transform: uppercase; margin: 0 0 12px; padding: 0 16px;">Historical Alerts</h4>
          <ion-list style="background: transparent; padding: 0 16px;">
            <ion-item *ngFor="let alert of stationAlerts" style="--background: rgba(255,255,255,0.03); border-radius: 8px; margin-bottom: 8px; border-left: 4px solid var(--ion-color-{{ alert.severity }});">
              <ion-label>
                <h3 style="color: #f8fafc; font-weight: 500;">{{ alert.message }}</h3>
                <p style="color: #94a3b8; font-size: 12px; margin-top: 4px;">{{ alert.timestamp | date:'medium' }}</p>
              </ion-label>
              <ion-badge slot="end" [color]="alert.severity">{{ alert.severity | titlecase }}</ion-badge>
            </ion-item>
          </ion-list>
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
    }

    .toolbar-title ion-icon { color: #06b6d4; }

    .reports-content {
      --background: #0a0e1a;
    }

    .reports-container {
      padding: 16px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .controls-bar {
      margin-bottom: 20px;
    }

    .param-selector {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }

    .param-btn {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 12px;
      padding: 10px 18px;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.3s;
    }

    .param-btn.active {
      background: rgba(14, 165, 233, 0.15);
      border-color: rgba(14, 165, 233, 0.4);
      color: #38bdf8;
    }

    .param-btn:hover:not(.active) {
      border-color: rgba(100, 116, 139, 0.4);
      color: #cbd5e1;
    }

    .chart-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 20px;
      padding: 24px;
      margin-bottom: 20px;
    }

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .chart-header h3 {
      color: #e2e8f0;
      font-size: 16px;
      margin: 0;
    }

    .chart-legend {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #64748b;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .line {
      width: 20px;
      height: 2px;
      background: #0ea5e9;
    }

    .line.dashed {
      background: repeating-linear-gradient(90deg, #f59e0b 0, #f59e0b 4px, transparent 4px, transparent 8px);
    }

    .chart-wrapper {
      position: relative;
      height: 300px;
    }

    .stats-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }

    .stat-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.12);
      border-radius: 14px;
      padding: 16px;
      text-align: center;
    }

    .stat-label {
      display: block;
      color: #64748b;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 6px;
    }

    .stat-value {
      display: block;
      color: #e2e8f0;
      font-size: 22px;
      font-weight: 800;
      font-family: 'Courier New', monospace;
    }

    .stat-value.rising { color: #f87171; }
    .stat-value.falling { color: #34d399; }
    .stat-value.stable { color: #fbbf24; }

    .export-row {
      display: flex;
      gap: 12px;
    }

    .export-btn {
      background: rgba(30, 41, 59, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 12px;
      padding: 12px 24px;
      color: #94a3b8;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .export-btn:hover {
      border-color: rgba(14, 165, 233, 0.4);
      color: #38bdf8;
    }

    .no-data {
      text-align: center;
      padding: 60px 24px;
      color: #64748b;
    }

    .no-data ion-icon { font-size: 48px; color: #334155; }
    .no-data h3 { color: #94a3b8; }
  `],
  standalone: false
})
export class ReportsPage implements OnInit, AfterViewInit {
  @ViewChild('trendChart') chartRef!: ElementRef<HTMLCanvasElement>;
  chart: Chart | null = null;

  user: AppUser | null = null;
  readings: SensorReading[] = [];
  hourlyData: SensorReading[] = [];
  stationAlerts: ManualAlert[] = [];

  selectedParam: 'ph' | 'ntu' | 'temp' | 'light' = 'ph';
  params = [
    { key: 'ph' as const, label: 'pH', icon: 'flask' },
    { key: 'ntu' as const, label: 'Turbidity', icon: 'water' },
    { key: 'temp' as const, label: 'Temperature', icon: 'thermometer' },
    { key: 'light' as const, label: 'Light', icon: 'sunny' }
  ];

  currentValue = 0;
  avgValue = 0;
  minValue = 0;
  maxValue = 0;
  slope = 0;

  stationName: string = '';

  constructor(
    private firebase: FirebaseService,
    private analytics: AnalyticsService,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const targetUid = params['uid'];
      const targetName = params['name'];
      
      if (targetName) {
        this.stationName = targetName;
      }

      this.firebase.currentUser$.subscribe(user => {
        this.user = user;
        
        if (targetUid) {
          // Viewing a specific station from map
          this.loadData(targetUid);
          this.loadAlerts(targetUid);
        } else if (user?.assigned_device_id) {
          // Defaulting to user's assigned sensor
          this.stationName = 'My Sensor';
          this.loadData(user.assigned_device_id);
          this.loadAlerts(user.assigned_device_id);
        }
      });
    });
  }

  async loadAlerts(deviceId: string) {
    try {
      this.stationAlerts = [];
      const db = getFirestore();
      const q = query(
        collection(db, 'manual_alerts'),
        where('station_id', '==', deviceId)
      );
      const snap = await getDocs(q);
      const alerts = snap.docs.map(d => ({ id: d.id, ...d.data() } as ManualAlert));
      // Sort oldest to newest (or newest to oldest)
      this.stationAlerts = alerts.sort((a, b) => b.timestamp - a.timestamp);
    } catch (err) {
      console.error('Error fetching historical alerts', err);
    }
  }

  ngAfterViewInit() {
    // Chart will be created when data arrives
  }

  getParamLabel(): string {
    return this.params.find(p => p.key === this.selectedParam)?.label || '';
  }

  selectParam(param: 'ph' | 'ntu' | 'temp' | 'light') {
    this.selectedParam = param;
    this.updateChart();
  }

  private loadData(deviceId: string) {
    this.firebase.subscribeSensorData(deviceId, (readings) => {
      this.readings = readings;
      this.hourlyData = this.analytics.computeHourlyAverages(readings);
      this.updateChart();
    });
  }

  private updateChart() {
    if (!this.chartRef?.nativeElement || this.hourlyData.length === 0) return;

    const values = this.hourlyData.map(r => r[this.selectedParam]);
    const labels = this.hourlyData.map(r => {
      const d = new Date(r.server_time);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' +
             d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    });

    // Stats
    this.currentValue = values[values.length - 1] || 0;
    this.avgValue = values.reduce((a, b) => a + b, 0) / values.length;
    this.minValue = Math.min(...values);
    this.maxValue = Math.max(...values);

    // Linear regression for prediction
    const regression = this.analytics.linearRegression(values);
    this.slope = regression.slope;

    // Generate prediction points (2d = next 2 points if daily)
    const predictionCount = 2;
    const predictionValues: (number | null)[] = [...values.map(() => null as number | null)];
    const predictionLabels = [...labels];

    // Set the last historical point as the first prediction point
    predictionValues[predictionValues.length - 1] = values[values.length - 1];

    for (let i = 1; i <= predictionCount; i++) {
      const predictedVal = this.analytics.predictFuture(regression.slope, values[values.length - 1], i);
      predictionValues.push(predictedVal);
      const futureTime = new Date(this.hourlyData[this.hourlyData.length - 1].server_time + i * 86400000); // add 1 day
      predictionLabels.push(
        futureTime.toLocaleDateString([], { month: 'short', day: 'numeric' })
      );
    }

    // Destroy old chart
    this.chart?.destroy();

    // Create new chart
    this.chart = new Chart(this.chartRef.nativeElement, {
      type: 'line',
      data: {
        labels: predictionLabels,
        datasets: [
          {
            label: this.getParamLabel(),
            data: values.concat(new Array(predictionCount).fill(null)),
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHitRadius: 10,
            borderWidth: 2
          },
          {
            label: 'Prediction',
            data: predictionValues,
            borderColor: '#f59e0b',
            borderDash: [6, 4],
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            borderColor: 'rgba(100, 116, 139, 0.2)',
            borderWidth: 1,
            titleColor: '#e2e8f0',
            bodyColor: '#94a3b8',
            cornerRadius: 8,
            padding: 12
          }
        },
        scales: {
          x: {
            ticks: {
              color: '#475569',
              maxRotation: 45,
              font: { size: 10 },
              maxTicksLimit: 12
            },
            grid: { color: 'rgba(100, 116, 139, 0.08)' }
          },
          y: {
            ticks: { color: '#475569', font: { size: 11 } },
            grid: { color: 'rgba(100, 116, 139, 0.08)' }
          }
        }
      }
    });
  }

  exportCSV() {
    if (this.readings.length === 0) return;

    const headers = 'Timestamp,pH,NTU,Temperature,Light\n';
    const rows = this.readings.map(r =>
      `${new Date(r.server_time).toISOString()},${r.ph},${r.ntu},${r.temp},${r.light}`
    ).join('\n');

    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aquasense_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
