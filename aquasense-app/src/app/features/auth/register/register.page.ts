import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-register',
  template: `
    <ion-content class="register-content" [fullscreen]="true">
      <div class="register-container">
        <div class="register-card">
          <div class="header-section">
            <button class="back-btn" (click)="goBack()">
              <ion-icon name="arrow-back"></ion-icon>
            </button>
            <div class="logo-mini">
              <ion-icon name="water"></ion-icon>
            </div>
            <h1 class="title">Create Account</h1>
            <p class="subtitle">Join the AquaSense water monitoring network</p>
          </div>

          <div class="form-section">
            <div class="input-group">
              <ion-icon name="person-outline" class="input-icon"></ion-icon>
              <input type="text" [(ngModel)]="name" placeholder="Full Name" class="premium-input" />
            </div>

            <div class="input-group">
              <ion-icon name="mail-outline" class="input-icon"></ion-icon>
              <input type="email" [(ngModel)]="email" placeholder="Email Address" class="premium-input" />
            </div>

            <div class="input-group">
              <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
              <input type="password" [(ngModel)]="password" placeholder="Password (min. 6 chars)" class="premium-input" />
            </div>

            <div class="row-inputs">
              <div class="input-group half">
                <ion-icon name="location-outline" class="input-icon"></ion-icon>
                <input type="text" [(ngModel)]="city" placeholder="City" class="premium-input" />
              </div>
              <div class="input-group half">
                <ion-icon name="map-outline" class="input-icon"></ion-icon>
                <input type="text" [(ngModel)]="state" placeholder="State" class="premium-input" />
              </div>
            </div>

            <div *ngIf="detectedRole" class="role-badge" [ngClass]="detectedRole">
              <ion-icon [name]="roleIcon"></ion-icon>
              <span>Detected Role: <strong>{{ detectedRole | titlecase }}</strong></span>
            </div>

            <div *ngIf="error" class="error-banner">
              <ion-icon name="alert-circle"></ion-icon>
              {{ error }}
            </div>

            <div *ngIf="success" class="success-banner">
              <ion-icon name="checkmark-circle"></ion-icon>
              {{ success }}
            </div>

            <button class="register-btn" (click)="onRegister()" [disabled]="loading">
              <span *ngIf="!loading">Create Account</span>
              <ion-spinner *ngIf="loading" name="crescent"></ion-spinner>
            </button>

            <p class="login-link" (click)="goBack()">
              Already have an account? <strong>Sign In</strong>
            </p>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .register-content {
      --background: #0a0e1a;
    }

    .register-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }

    .register-card {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(56, 189, 248, 0.15);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 480px;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5);
      animation: slideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .header-section {
      text-align: center;
      margin-bottom: 32px;
      position: relative;
    }

    .back-btn {
      position: absolute;
      left: 0;
      top: 0;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 12px;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #94a3b8;
      cursor: pointer;
      transition: all 0.3s;
    }

    .back-btn:hover {
      color: #38bdf8;
      border-color: rgba(56, 189, 248, 0.3);
    }

    .logo-mini {
      width: 52px;
      height: 52px;
      margin: 0 auto 12px;
      background: linear-gradient(135deg, #0ea5e9, #10b981);
      border-radius: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 26px;
      color: white;
    }

    .title {
      font-size: 24px;
      font-weight: 800;
      color: #e2e8f0;
      margin: 0;
    }

    .subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin: 6px 0 0;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .row-inputs {
      display: flex;
      gap: 12px;
    }

    .half {
      flex: 1;
    }

    .input-group {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: 16px;
      top: 50%;
      transform: translateY(-50%);
      color: #64748b;
      font-size: 18px;
      z-index: 1;
      transition: color 0.3s;
    }

    .premium-input {
      width: 100%;
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(100, 116, 139, 0.3);
      border-radius: 14px;
      padding: 14px 14px 14px 46px;
      color: #e2e8f0;
      font-size: 14px;
      outline: none;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .premium-input:focus {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
    }

    .input-group:focus-within .input-icon {
      color: #0ea5e9;
    }

    .premium-input::placeholder {
      color: #64748b;
    }

    .role-badge {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 10px;
      font-size: 13px;
      animation: fadeIn 0.3s ease;
    }

    .role-badge.admin {
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.3);
      color: #c4b5fd;
    }

    .role-badge.ngo {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #6ee7b7;
    }

    .role-badge.citizen {
      background: rgba(14, 165, 233, 0.15);
      border: 1px solid rgba(14, 165, 233, 0.3);
      color: #7dd3fc;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 10px 14px;
      color: #fca5a5;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .success-banner {
      background: rgba(16, 185, 129, 0.15);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 10px;
      padding: 10px 14px;
      color: #6ee7b7;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .register-btn {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      border: none;
      border-radius: 14px;
      padding: 15px;
      font-size: 16px;
      font-weight: 700;
      color: white;
      cursor: pointer;
      transition: all 0.3s;
      margin-top: 4px;
    }

    .register-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
    }

    .register-btn:disabled {
      opacity: 0.6;
    }

    .login-link {
      text-align: center;
      color: #64748b;
      font-size: 13px;
      cursor: pointer;
      margin: 4px 0 0;
    }

    .login-link strong {
      color: #38bdf8;
    }
  `],
  standalone: false
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  city = '';
  state = '';
  error = '';
  success = '';
  loading = false;

  constructor(private firebase: FirebaseService, private router: Router) {}

  get detectedRole(): string {
    if (!this.email) return '';
    if (this.email.endsWith('@gov.in')) return 'admin';
    const ngoEmails = ['ngo@aquasense.org', 'monitor@waterwatch.org'];
    if (ngoEmails.includes(this.email.toLowerCase())) return 'ngo';
    if (this.email.includes('@')) return 'citizen';
    return '';
  }

  get roleIcon(): string {
    switch (this.detectedRole) {
      case 'admin': return 'shield-checkmark';
      case 'ngo': return 'globe';
      default: return 'person';
    }
  }

  async onRegister() {
    if (!this.name || !this.email || !this.password || !this.city || !this.state) {
      this.error = 'Please fill in all fields';
      return;
    }
    if (this.password.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      const user = await this.firebase.register(this.name, this.email, this.password, this.city, this.state);
      this.success = `Account created! You've been assigned the ${user.role.toUpperCase()} role.`;
      setTimeout(() => {
        if (user.role === 'admin') {
          this.router.navigate(['/admin/uid-registration']);
        } else {
          this.router.navigate(['/dashboard']);
        }
      }, 1500);
    } catch (err: any) {
      this.error = err.message?.replace('Firebase: ', '') || 'Registration failed';
    }
    this.loading = false;
  }

  goBack() {
    this.router.navigate(['/auth/login']);
  }
}
