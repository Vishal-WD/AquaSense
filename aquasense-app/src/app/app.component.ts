import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService, AppUser } from './core/services/firebase.service';
import { SeederService } from './core/services/seeder.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent implements OnInit {
  user: AppUser | null = null;
  isAuthenticated = false;

  public citizenPages = [
    { title: 'My Sensor', url: '/dashboard', icon: 'speedometer' },
    { title: 'Water Stations', url: '/stations', icon: 'water' },
    { title: 'Public Map', url: '/map', icon: 'map' },
    { title: 'Alerts', url: '/alerts', icon: 'notifications' },
    { title: 'Trends', url: '/reports', icon: 'bar-chart' },
  ];

  public adminPages = [
    { title: 'My Sensor', url: '/dashboard', icon: 'speedometer' },
    { title: 'Water Stations', url: '/stations', icon: 'water' },
    { title: 'Public Map', url: '/map', icon: 'map' },
    { title: 'Alerts', url: '/alerts', icon: 'notifications' },
    { title: 'Trends', url: '/reports', icon: 'bar-chart' },
    { title: 'UID Registration', url: '/admin/uid-registration', icon: 'hardware-chip' },
  ];

  public ngoPages = [
    { title: 'Dashboard', url: '/dashboard', icon: 'speedometer' },
    { title: 'Water Stations', url: '/stations', icon: 'water' },
    { title: 'All Stations', url: '/map', icon: 'map' },
    { title: 'Global Alerts', url: '/alerts', icon: 'notifications' },
    { title: 'Trends', url: '/reports', icon: 'bar-chart' },
  ];

  constructor(
    private firebase: FirebaseService,
    private seeder: SeederService,
    private router: Router
  ) {}

  ngOnInit() {
    this.firebase.currentUser$.subscribe(user => {
      this.user = user;
      this.isAuthenticated = !!user;
    });
  }

  get appPages() {
    if (!this.user) return this.citizenPages;
    switch (this.user.role) {
      case 'admin': return this.adminPages;
      case 'ngo': return this.ngoPages;
      default: return this.citizenPages;
    }
  }

  get roleBadge(): string {
    if (!this.user) return '';
    switch (this.user.role) {
      case 'admin': return 'Government Official';
      case 'ngo': return 'NGO Auditor';
      default: return 'Citizen';
    }
  }

  get roleColor(): string {
    if (!this.user) return '';
    switch (this.user.role) {
      case 'admin': return 'purple';
      case 'ngo': return 'green';
      default: return 'blue';
    }
  }

  // Temporary DEV function to trigger seeding
  async seedDemoData() {
    if (confirm('This will inject 30 days of synthetic data for external stations into Firebase. Proceed?')) {
      try {
        const count = await this.seeder.seedExternalStations();
        alert(`Successfully seeded ${count} stations!`);
      } catch (e: any) {
        alert(`Error: ${e.message}`);
      }
    }
  }

  async logout() {
    await this.firebase.logout();
    this.router.navigate(['/auth/login']);
  }
}
