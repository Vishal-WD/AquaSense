import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import { FirebaseService, PublicStation, AppUser } from '../../core/services/firebase.service';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-menu-button></ion-menu-button>
        </ion-buttons>
        <ion-title>
          <div class="toolbar-title">
            <ion-icon name="map"></ion-icon>
            Public Stations Map
          </div>
        </ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="map-content" [fullscreen]="true">
      <div id="mapContainer" class="map-container"></div>

      <!-- Add Station Modal (Admin only) -->
      <div *ngIf="showAddForm && user?.role === 'admin'" class="station-form-overlay" (click)="showAddForm = false">
        <div class="station-form" (click)="$event.stopPropagation()">
          <h3><ion-icon name="add-circle"></ion-icon> Add Public Station</h3>
          <div class="form-group">
            <label>Station Name</label>
            <input type="text" [(ngModel)]="newStation.name" placeholder="e.g., Borewell #142" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Latitude</label>
              <input type="number" [(ngModel)]="newStation.lat" step="0.0001" />
            </div>
            <div class="form-group">
              <label>Longitude</label>
              <input type="number" [(ngModel)]="newStation.lng" step="0.0001" />
            </div>
          </div>
          <div class="form-group">
            <label>Type</label>
            <select [(ngModel)]="newStation.type">
              <option value="borewell">Borewell</option>
              <option value="pipeline">Pipeline</option>
              <option value="tank">Water Tank</option>
              <option value="river">River/Lake</option>
            </select>
          </div>
          <div class="form-group">
            <label>City</label>
            <input type="text" [(ngModel)]="newStation.city" />
          </div>
          <div class="form-actions">
            <button class="btn-cancel" (click)="showAddForm = false">Cancel</button>
            <button class="btn-save" (click)="saveStation()">
              <ion-icon name="checkmark"></ion-icon> Save Station
            </button>
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="map-legend">
        <div class="legend-item"><span class="dot safe"></span> Active</div>
        <div class="legend-item"><span class="dot warning"></span> Maintenance</div>
        <div class="legend-item"><span class="dot critical"></span> Offline</div>
      </div>

      <!-- Fab button for admin -->
      <ion-fab *ngIf="user?.role === 'admin'" vertical="bottom" horizontal="end" slot="fixed">
        <ion-fab-button (click)="showAddForm = true" color="primary">
          <ion-icon name="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
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

    .toolbar-title ion-icon { color: #10b981; }

    .map-content {
      --background: #0a0e1a;
    }

    .map-container {
      width: 100%;
      height: 100%;
      background: #0f172a;
    }

    .map-legend {
      position: absolute;
      bottom: 20px;
      left: 20px;
      background: rgba(15, 23, 42, 0.9);
      backdrop-filter: blur(12px);
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 12px;
      padding: 12px 16px;
      z-index: 1000;
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: #94a3b8;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
    }

    .dot.safe { background: #10b981; }
    .dot.warning { background: #f59e0b; }
    .dot.critical { background: #ef4444; }

    .station-form-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .station-form {
      background: #0f172a;
      border: 1px solid rgba(100, 116, 139, 0.2);
      border-radius: 20px;
      padding: 32px;
      width: 100%;
      max-width: 420px;
      animation: slideUp 0.3s ease;
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .station-form h3 {
      color: #e2e8f0;
      margin: 0 0 24px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
    }

    .station-form h3 ion-icon { color: #0ea5e9; }

    .form-group {
      margin-bottom: 16px;
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
      margin-bottom: 6px;
      display: block;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .station-form input, .station-form select {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 10px;
      padding: 12px;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      box-sizing: border-box;
    }

    .station-form select {
      cursor: pointer;
    }

    .station-form input:focus, .station-form select:focus {
      border-color: #0ea5e9;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      margin-top: 24px;
    }

    .btn-cancel {
      flex: 1;
      background: transparent;
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 12px;
      padding: 12px;
      color: #94a3b8;
      font-weight: 600;
      cursor: pointer;
    }

    .btn-save {
      flex: 1;
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      border: none;
      border-radius: 12px;
      padding: 12px;
      color: white;
      font-weight: 700;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    ion-fab-button {
      --background: linear-gradient(135deg, #0ea5e9, #06b6d4);
    }
  `],
  standalone: false
})
export class MapPage implements OnInit, AfterViewInit, OnDestroy {
  map: L.Map | null = null;
  user: AppUser | null = null;
  stations: PublicStation[] = [];
  showAddForm = false;
  newStation: Partial<PublicStation> = { type: 'borewell', status: 'safe', city: '', state: '', country: '', name: '', lat: 0, lng: 0 };

  constructor(private firebase: FirebaseService) {}

  ngOnInit() {
    this.firebase.currentUser$.subscribe(user => {
      this.user = user;
      if (user) {
        this.newStation.city = user.city;
        this.newStation.state = user.state;
      }
    });
  }

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnDestroy() {
    this.map?.remove();
  }

  private async initMap() {
    // Default center (India)
    this.map = L.map('mapContainer', {
      center: [20.5937, 78.9629],
      zoom: 5,
      zoomControl: true
    });

    // Dark map tiles
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      maxZoom: 19
    }).addTo(this.map);

    // Try geolocation for citizens
    if (this.user?.role === 'citizen' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.map?.setView([pos.coords.latitude, pos.coords.longitude], 12);
        },
        () => {} // Silently fail
      );
    }

    // Load stations
    await this.loadStations();

    // Admin: click to add station
    if (this.user?.role === 'admin') {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        if (!this.showAddForm) {
          this.newStation.lat = parseFloat(e.latlng.lat.toFixed(6));
          this.newStation.lng = parseFloat(e.latlng.lng.toFixed(6));
          this.showAddForm = true;
        }
      });
    }
  }

  private async loadStations() {
    try {
      this.stations = await this.firebase.getPublicStations();
      this.stations.forEach(station => this.addMarker(station));
    } catch (err) {
      console.error('Error loading stations:', err);
    }
  }

  private addMarker(station: PublicStation) {
    if (!this.map) return;

    const colorMap = { safe: '#10b981', warning: '#f59e0b', critical: '#ef4444', maintenance: '#64748b', offline: '#334155' };
    const color = colorMap[station.status] || '#64748b';

    const icon = L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 24px; height: 24px;
        background: ${color};
        border: 3px solid rgba(255,255,255,0.3);
        border-radius: 50%;
        box-shadow: 0 2px 8px ${color}66;
      "></div>`,
      iconSize: [24, 24],
      iconAnchor: [12, 12]
    });

    const marker = L.marker([station.lat, station.lng], { icon })
      .addTo(this.map!)
      .bindPopup(`
        <div style="font-family: sans-serif; min-width: 180px;">
          <h4 style="margin: 0 0 8px; color: #1e293b;">${station.name}</h4>
          <p style="margin: 4px 0; font-size: 12px; color: #475569;">
            <strong>Type:</strong> ${station.type}
          </p>
          <p style="margin: 4px 0; font-size: 12px; color: #475569;">
            <strong>City:</strong> ${station.city}
          </p>
          <div style="margin-top: 12px; display: flex; justify-content: space-between; align-items: center;">
            <span style="
              background: ${color}22;
              color: ${color};
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 11px;
              font-weight: 700;
            ">${station.status.toUpperCase()}</span>

            ${station.assigned_device_id ? `
              <a href="/reports?uid=${station.assigned_device_id}&name=${encodeURIComponent(station.name)}"
                 style="background: #0ea5e9; color: white; padding: 4px 10px; border-radius: 6px; font-size: 11px; text-decoration: none; font-weight: 600;">
                View Trends
              </a>
            ` : ''}
          </div>
        </div>
      `);
  }

  async saveStation() {
    if (!this.newStation.name || !this.newStation.lat || !this.newStation.lng) return;

    try {
      const station: any = {
        ...this.newStation,
        country: 'India', // Defaulting to India for manually added stations
        created_at: Date.now(),
        updated_at: Date.now(),
        state: this.user?.state || ''
      };
      await this.firebase.addStation(station as PublicStation);
      this.addMarker(station as PublicStation);
      this.showAddForm = false;
      this.newStation = { type: 'borewell', status: 'safe', city: this.user?.city || '', state: this.user?.state || '', country: '', name: '', lat: 0, lng: 0 };
    } catch (err) {
      console.error('Error saving station:', err);
    }
  }
}
