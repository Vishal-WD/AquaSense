import { Component, OnInit, OnDestroy } from '@angular/core';
import { FirebaseService, ManualAlert, AppUser } from '../../core/services/firebase.service';

@Component({
  selector: 'app-alerts',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="toolbar-title">
            <ion-icon name="notifications"></ion-icon>
            Community Alerts
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="alerts-content" [fullscreen]="true">
      <div class="alerts-container">
        <!-- Issue Alert Button (Gov/NGO) -->
        <div *ngIf="user?.role === 'admin' || user?.role === 'ngo'" class="issue-alert-section">
          <button class="issue-alert-btn" (click)="showForm = !showForm">
            <ion-icon name="megaphone"></ion-icon>
            Issue New Alert
          </button>

          <div *ngIf="showForm" class="alert-form">
            <div class="form-group">
              <label>Alert Message</label>
              <textarea [(ngModel)]="newAlert.message" placeholder="Describe the alert..." rows="3"></textarea>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Severity</label>
                <select [(ngModel)]="newAlert.severity">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div class="form-group">
                <label>City</label>
                <input type="text" [(ngModel)]="newAlert.city" />
              </div>
            </div>
            <button class="submit-alert-btn" (click)="submitAlert()">
              <ion-icon name="send"></ion-icon> Send Alert
            </button>
          </div>
        </div>

        <!-- Alerts List -->
        <div *ngIf="alerts.length === 0" class="no-alerts">
          <ion-icon name="checkmark-circle-outline"></ion-icon>
          <h3>No Active Alerts</h3>
          <p>Your community is currently safe.</p>
        </div>

        <div *ngFor="let alert of alerts" class="alert-card" [ngClass]="alert.severity">
          <div class="alert-header">
            <div class="alert-severity-badge" [ngClass]="alert.severity">
              <ion-icon [name]="getSeverityIcon(alert.severity)"></ion-icon>
              {{ alert.severity | uppercase }}
            </div>
            <div class="alert-meta">
              <span class="alert-authority">{{ alert.authority }}</span>
              <span class="alert-time">{{ formatTime(alert.timestamp) }}</span>
            </div>
          </div>
          <p class="alert-message">{{ alert.message }}</p>
          <div class="alert-footer">
            <span class="alert-city"><ion-icon name="location"></ion-icon> {{ alert.city }}</span>
            <span class="alert-type" [ngClass]="alert.type">{{ alert.type }}</span>
          </div>
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
    }

    .toolbar-title ion-icon { color: #f59e0b; }

    .alerts-content {
      --background: #0a0e1a;
    }

    .alerts-container {
      padding: 16px;
      max-width: 800px;
      margin: 0 auto;
    }

    .issue-alert-section {
      margin-bottom: 24px;
    }

    .issue-alert-btn {
      width: 100%;
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1));
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 14px;
      padding: 14px;
      color: #fbbf24;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .issue-alert-btn:hover {
      background: linear-gradient(135deg, rgba(245, 158, 11, 0.25), rgba(239, 68, 68, 0.15));
    }

    .alert-form {
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 16px;
      padding: 24px;
      margin-top: 12px;
      animation: slideDown 0.3s ease;
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-row .form-group { flex: 1; }

    .form-group label {
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      display: block;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .alert-form input, .alert-form select, .alert-form textarea {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 10px;
      padding: 12px;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
      font-family: inherit;
      resize: vertical;
    }

    .alert-form input:focus, .alert-form select:focus, .alert-form textarea:focus {
      border-color: #f59e0b;
    }

    .submit-alert-btn {
      width: 100%;
      background: linear-gradient(135deg, #f59e0b, #ef4444);
      border: none;
      border-radius: 12px;
      padding: 13px;
      color: white;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    .no-alerts {
      text-align: center;
      padding: 60px 24px;
      color: #64748b;
    }

    .no-alerts ion-icon {
      font-size: 48px;
      color: #10b981;
    }

    .no-alerts h3 { color: #94a3b8; }

    .alert-card {
      background: rgba(15, 23, 42, 0.6);
      border-radius: 16px;
      padding: 20px;
      margin-bottom: 12px;
      border-left: 4px solid;
      transition: transform 0.2s;
    }

    .alert-card:hover {
      transform: translateX(4px);
    }

    .alert-card.info { border-left-color: #0ea5e9; }
    .alert-card.warning { border-left-color: #f59e0b; }
    .alert-card.critical {
      border-left-color: #ef4444;
      background: rgba(239, 68, 68, 0.06);
    }

    .alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }

    .alert-severity-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.5px;
    }

    .alert-severity-badge.info { background: rgba(14, 165, 233, 0.15); color: #38bdf8; }
    .alert-severity-badge.warning { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
    .alert-severity-badge.critical { background: rgba(239, 68, 68, 0.15); color: #f87171; }

    .alert-meta {
      display: flex;
      gap: 8px;
      font-size: 12px;
      color: #64748b;
    }

    .alert-authority {
      background: rgba(139, 92, 246, 0.1);
      padding: 2px 8px;
      border-radius: 6px;
      color: #a78bfa;
      font-weight: 600;
    }

    .alert-message {
      color: #cbd5e1;
      font-size: 14px;
      margin: 0 0 12px;
      line-height: 1.5;
    }

    .alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #64748b;
    }

    .alert-city {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .alert-type {
      padding: 2px 8px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 11px;
    }

    .alert-type.manual { background: rgba(100, 116, 139, 0.15); color: #94a3b8; }
    .alert-type.automatic { background: rgba(14, 165, 233, 0.1); color: #38bdf8; }
  `],
  standalone: false
})
export class AlertsPage implements OnInit, OnDestroy {
  user: AppUser | null = null;
  alerts: ManualAlert[] = [];
  showForm = false;
  newAlert: { message: string; severity: string; city: string } = { message: '', severity: 'warning', city: '' };

  private unsubscribe: (() => void) | null = null;

  constructor(private firebase: FirebaseService) {}

  ngOnInit() {
    this.firebase.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.newAlert.city = user.city;
        const cityFilter = user.role === 'ngo' ? null : user.city;
        this.unsubscribe = this.firebase.subscribeAlerts(cityFilter, (alerts) => {
          this.alerts = alerts;
        });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribe?.();
  }

  getSeverityIcon(severity: string): string {
    switch (severity) {
      case 'info': return 'information-circle';
      case 'warning': return 'warning';
      case 'critical': return 'alert-circle';
      default: return 'notifications';
    }
  }

  formatTime(ts: number): string {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async submitAlert() {
    if (!this.newAlert.message) return;
    try {
      await this.firebase.issueAlert({
        message: this.newAlert.message,
        city: this.newAlert.city || this.user?.city || '',
        state: this.user?.state || '',
        severity: (this.newAlert.severity || 'warning') as 'info' | 'warning' | 'critical',
        timestamp: Date.now(),
        authority: this.user?.role === 'admin' ? 'Gov' : 'NGO',
        author_name: this.user?.name || '',
        type: 'manual'
      });
      this.showForm = false;
      this.newAlert = { message: '', severity: 'warning', city: this.user?.city || '' };
    } catch (err) {
      console.error('Error issuing alert:', err);
    }
  }
}
