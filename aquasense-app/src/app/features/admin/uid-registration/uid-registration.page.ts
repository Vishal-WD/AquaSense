import { Component, OnInit } from '@angular/core';
import { FirebaseService, AppUser } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-uid-registration',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="toolbar-title">
            <ion-icon name="hardware-chip"></ion-icon>
            UID Registration
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="admin-content" [fullscreen]="true">
      <div class="admin-container">
        <!-- Registration Form -->
        <div class="register-card">
          <h3><ion-icon name="add-circle"></ion-icon> Register New Device UID</h3>
          <p class="card-desc">Assign an AquaSense device to a registered citizen.</p>

          <div class="form-group">
            <label>Device Unique ID</label>
            <input type="text" [(ngModel)]="deviceId" placeholder="e.g., TN-CH-108" class="uid-input" />
          </div>

          <div class="form-group">
            <label>Assign to Citizen (Email)</label>
            <input type="text" [(ngModel)]="citizenSearch" placeholder="Search by email..." class="search-input"
                   (input)="filterCitizens()" />
          </div>

          <div *ngIf="filteredCitizens.length > 0" class="citizen-list">
            <div *ngFor="let c of filteredCitizens" class="citizen-item"
                 [class.selected]="selectedCitizen?.uid === c.uid"
                 (click)="selectCitizen(c)">
              <div class="citizen-info">
                <span class="citizen-name">{{ c.name }}</span>
                <span class="citizen-email">{{ c.email }}</span>
              </div>
              <div class="citizen-city">{{ c.city }}</div>
              <div *ngIf="c.assigned_device_id" class="citizen-uid">{{ c.assigned_device_id }}</div>
            </div>
          </div>

          <div *ngIf="selectedCitizen" class="selected-banner">
            <ion-icon name="person"></ion-icon>
            Selected: <strong>{{ selectedCitizen.name }}</strong> ({{ selectedCitizen.email }})
          </div>

          <div *ngIf="success" class="success-msg">
            <ion-icon name="checkmark-circle"></ion-icon> {{ success }}
          </div>

          <div *ngIf="error" class="error-msg">
            <ion-icon name="alert-circle"></ion-icon> {{ error }}
          </div>

          <button class="assign-btn" (click)="assignUID()" [disabled]="!deviceId || !selectedCitizen">
            <ion-icon name="link"></ion-icon> Assign Device UID
          </button>
        </div>

        <!-- Registered Devices Table -->
        <div class="devices-card">
          <h3><ion-icon name="list"></ion-icon> Registered Devices</h3>
          <div class="devices-table">
            <div class="table-header">
              <span>Citizen</span>
              <span>Email</span>
              <span>Device UID</span>
              <span>City</span>
            </div>
            <div *ngFor="let u of assignedUsers" class="table-row">
              <span class="name-cell">{{ u.name }}</span>
              <span class="email-cell">{{ u.email }}</span>
              <span class="uid-cell">{{ u.assigned_device_id }}</span>
              <span class="city-cell">{{ u.city }}</span>
            </div>
            <div *ngIf="assignedUsers.length === 0" class="empty-table">
              No devices registered yet.
            </div>
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

    .toolbar-title ion-icon { color: #8b5cf6; }

    .admin-content {
      --background: #0a0e1a;
    }

    .admin-container {
      padding: 16px;
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .register-card, .devices-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid rgba(100, 116, 139, 0.15);
      border-radius: 20px;
      padding: 28px;
    }

    .register-card h3, .devices-card h3 {
      color: #e2e8f0;
      font-size: 18px;
      margin: 0 0 6px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .register-card h3 ion-icon { color: #0ea5e9; }
    .devices-card h3 ion-icon { color: #10b981; }

    .card-desc {
      color: #64748b;
      font-size: 13px;
      margin: 0 0 20px;
    }

    .form-group {
      margin-bottom: 14px;
    }

    .form-group label {
      display: block;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .uid-input, .search-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 12px;
      padding: 14px 16px;
      color: #e2e8f0;
      font-size: 15px;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.3s;
    }

    .uid-input {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      letter-spacing: 2px;
      font-size: 18px;
      text-transform: uppercase;
    }

    .uid-input:focus, .search-input:focus {
      border-color: #0ea5e9;
    }

    .citizen-list {
      max-height: 200px;
      overflow-y: auto;
      margin-bottom: 12px;
    }

    .citizen-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 14px;
      border-radius: 10px;
      cursor: pointer;
      transition: background 0.2s;
      margin-bottom: 4px;
    }

    .citizen-item:hover { background: rgba(14, 165, 233, 0.08); }
    .citizen-item.selected { background: rgba(14, 165, 233, 0.15); border: 1px solid rgba(14, 165, 233, 0.3); }

    .citizen-name { color: #e2e8f0; font-weight: 600; font-size: 14px; }
    .citizen-email { color: #64748b; font-size: 12px; }
    .citizen-city { color: #94a3b8; font-size: 12px; }
    .citizen-uid { color: #38bdf8; font-family: monospace; font-size: 12px; }

    .citizen-info { display: flex; flex-direction: column; gap: 2px; }

    .selected-banner {
      background: rgba(14, 165, 233, 0.1);
      border: 1px solid rgba(14, 165, 233, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      color: #7dd3fc;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .success-msg {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      color: #6ee7b7;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .error-msg {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fca5a5;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 14px;
    }

    .assign-btn {
      width: 100%;
      background: linear-gradient(135deg, #8b5cf6, #6d28d9);
      border: none;
      border-radius: 14px;
      padding: 15px;
      color: white;
      font-weight: 700;
      font-size: 15px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: all 0.3s;
    }

    .assign-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(139, 92, 246, 0.4);
    }

    .assign-btn:disabled { opacity: 0.4; cursor: not-allowed; }

    .devices-table {
      margin-top: 16px;
    }

    .table-header {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1.5fr 1fr;
      padding: 10px 14px;
      background: rgba(30, 41, 59, 0.5);
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .table-row {
      display: grid;
      grid-template-columns: 1.5fr 2fr 1.5fr 1fr;
      padding: 12px 14px;
      border-bottom: 1px solid rgba(100, 116, 139, 0.08);
      font-size: 13px;
      transition: background 0.2s;
    }

    .table-row:hover { background: rgba(14, 165, 233, 0.04); }

    .name-cell { color: #e2e8f0; font-weight: 600; }
    .email-cell { color: #94a3b8; }
    .uid-cell { color: #38bdf8; font-family: monospace; font-weight: 700; }
    .city-cell { color: #64748b; }

    .empty-table {
      text-align: center;
      padding: 32px;
      color: #475569;
      font-size: 14px;
    }
  `],
  standalone: false
})
export class UidRegistrationPage implements OnInit {
  user: AppUser | null = null;
  deviceId = '';
  citizenSearch = '';
  citizens: AppUser[] = [];
  filteredCitizens: AppUser[] = [];
  selectedCitizen: AppUser | null = null;
  assignedUsers: AppUser[] = [];
  success = '';
  error = '';

  constructor(private firebase: FirebaseService) {}

  async ngOnInit() {
    this.firebase.currentUser$.subscribe(async (user) => {
      this.user = user;
      if (user) {
        await this.loadUsers();
      }
    });
  }

  async loadUsers() {
    try {
      const allUsers = this.user?.city
        ? await this.firebase.getUsersByCity(this.user.city)
        : await this.firebase.getAllUsers();
      this.citizens = allUsers.filter(u => u.role === 'citizen');
      this.assignedUsers = this.citizens.filter(u => u.assigned_device_id);
    } catch (err) {
      console.error('Error loading users:', err);
    }
  }

  filterCitizens() {
    if (!this.citizenSearch) {
      this.filteredCitizens = [];
      return;
    }
    const search = this.citizenSearch.toLowerCase();
    this.filteredCitizens = this.citizens.filter(c =>
      c.email.toLowerCase().includes(search) || c.name.toLowerCase().includes(search)
    );
  }

  selectCitizen(citizen: AppUser) {
    this.selectedCitizen = citizen;
    this.citizenSearch = citizen.email;
    this.filteredCitizens = [];
  }

  async assignUID() {
    if (!this.deviceId || !this.selectedCitizen) return;
    this.error = '';
    this.success = '';
    try {
      await this.firebase.registerDeviceUID(this.selectedCitizen.uid, this.deviceId.toUpperCase());
      this.success = `Device ${this.deviceId.toUpperCase()} assigned to ${this.selectedCitizen.name}`;
      this.deviceId = '';
      this.selectedCitizen = null;
      this.citizenSearch = '';
      await this.loadUsers();
    } catch (err: any) {
      this.error = err.message || 'Failed to assign UID';
    }
  }
}
