import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { FirebaseService } from '../../../core/services/firebase.service';

@Component({
  selector: 'app-login',
  template: `
    <ion-content class="login-content" [fullscreen]="true">
      <div class="login-container">
        <div class="login-card">
          <div class="logo-section">
            <div class="logo-icon">
              <ion-icon name="water"></ion-icon>
            </div>
            <h1 class="app-title">AquaSense</h1>
            <p class="app-subtitle">Environmental IoT Water Management</p>
          </div>

          <div class="form-section">
            <div class="input-group">
              <ion-icon name="mail-outline" class="input-icon"></ion-icon>
              <input type="email" [(ngModel)]="email" placeholder="Email Address" class="premium-input" />
            </div>

            <div class="input-group">
              <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
              <input type="password" [(ngModel)]="password" placeholder="Password" class="premium-input" />
            </div>

            <div *ngIf="error" class="error-banner">
              <ion-icon name="alert-circle"></ion-icon>
              {{ error }}
            </div>

            <button class="login-btn" (click)="onLogin()" [disabled]="loading">
              <span *ngIf="!loading">Sign In</span>
              <ion-spinner *ngIf="loading" name="crescent"></ion-spinner>
            </button>

            <div class="divider">
              <span>or</span>
            </div>

            <button class="register-btn" (click)="goToRegister()">
              Create Account
            </button>
          </div>

          <div class="role-hint">
            <p><ion-icon name="shield-checkmark"></ion-icon> <strong>.gov.in</strong> emails → Admin Access</p>
            <p><ion-icon name="globe"></ion-icon> NGO emails → Global Auditor</p>
            <p><ion-icon name="person"></ion-icon> Standard emails → Citizen</p>
          </div>
        </div>

        <div class="particles">
          <div class="particle" *ngFor="let p of particles" [ngStyle]="p.style"></div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .login-content {
      --background: #0a0e1a;
    }

    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      position: relative;
      overflow: hidden;
      padding: 20px;
    }

    .login-card {
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(20px);
      border: 1px solid rgba(56, 189, 248, 0.15);
      border-radius: 24px;
      padding: 48px 40px;
      width: 100%;
      max-width: 440px;
      position: relative;
      z-index: 10;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05);
      animation: slideUp 0.8s cubic-bezier(0.22, 1, 0.36, 1);
    }

    @keyframes slideUp {
      from { opacity: 0; transform: translateY(40px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-section {
      text-align: center;
      margin-bottom: 36px;
    }

    .logo-icon {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #0ea5e9, #06b6d4, #10b981);
      border-radius: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      color: white;
      box-shadow: 0 8px 32px rgba(14, 165, 233, 0.35);
      animation: pulse 3s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 8px 32px rgba(14, 165, 233, 0.35); }
      50% { box-shadow: 0 8px 48px rgba(14, 165, 233, 0.55); }
    }

    .app-title {
      font-size: 28px;
      font-weight: 800;
      background: linear-gradient(135deg, #38bdf8, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin: 0;
      letter-spacing: -0.5px;
    }

    .app-subtitle {
      color: #94a3b8;
      font-size: 13px;
      margin: 6px 0 0;
      letter-spacing: 0.5px;
    }

    .form-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
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
      padding: 16px 16px 16px 48px;
      color: #e2e8f0;
      font-size: 15px;
      outline: none;
      transition: all 0.3s;
      box-sizing: border-box;
    }

    .premium-input:focus {
      border-color: #0ea5e9;
      box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.15);
    }

    .premium-input:focus + .input-icon,
    .input-group:focus-within .input-icon {
      color: #0ea5e9;
    }

    .premium-input::placeholder {
      color: #64748b;
    }

    .error-banner {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 10px;
      padding: 12px 16px;
      color: #fca5a5;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-5px); }
      75% { transform: translateX(5px); }
    }

    .login-btn {
      background: linear-gradient(135deg, #0ea5e9, #06b6d4);
      border: none;
      border-radius: 14px;
      padding: 16px;
      font-size: 16px;
      font-weight: 700;
      color: white;
      cursor: pointer;
      transition: all 0.3s;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    .login-btn:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(14, 165, 233, 0.4);
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #475569;
      font-size: 12px;
    }

    .divider::before, .divider::after {
      content: '';
      flex: 1;
      height: 1px;
      background: rgba(100, 116, 139, 0.3);
    }

    .register-btn {
      background: transparent;
      border: 1px solid rgba(56, 189, 248, 0.3);
      border-radius: 14px;
      padding: 14px;
      font-size: 15px;
      font-weight: 600;
      color: #38bdf8;
      cursor: pointer;
      transition: all 0.3s;
    }

    .register-btn:hover {
      background: rgba(56, 189, 248, 0.08);
      border-color: rgba(56, 189, 248, 0.5);
    }

    .role-hint {
      margin-top: 28px;
      padding-top: 20px;
      border-top: 1px solid rgba(100, 116, 139, 0.15);
    }

    .role-hint p {
      color: #64748b;
      font-size: 11.5px;
      margin: 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .role-hint ion-icon {
      font-size: 14px;
      color: #0ea5e9;
    }

    .role-hint strong {
      color: #94a3b8;
    }

    /* Animated particles background */
    .particles {
      position: absolute;
      inset: 0;
      z-index: 1;
      pointer-events: none;
    }

    .particle {
      position: absolute;
      border-radius: 50%;
      animation: float linear infinite;
      opacity: 0.15;
    }

    @keyframes float {
      0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
      10% { opacity: 0.15; }
      90% { opacity: 0.15; }
      100% { transform: translateY(-10vh) rotate(720deg); opacity: 0; }
    }
  `],
  standalone: false
})
export class LoginPage {
  email = '';
  password = '';
  error = '';
  loading = false;
  particles: { style: any }[] = [];

  constructor(private firebase: FirebaseService, private router: Router) {
    this.generateParticles();
  }

  generateParticles() {
    const colors = ['#0ea5e9', '#06b6d4', '#10b981', '#8b5cf6'];
    for (let i = 0; i < 20; i++) {
      this.particles.push({
        style: {
          left: Math.random() * 100 + '%',
          width: Math.random() * 6 + 3 + 'px',
          height: Math.random() * 6 + 3 + 'px',
          background: colors[Math.floor(Math.random() * colors.length)],
          'animation-duration': Math.random() * 15 + 10 + 's',
          'animation-delay': Math.random() * 10 + 's'
        }
      });
    }
  }

  async onLogin() {
    if (!this.email || !this.password) {
      this.error = 'Please fill in all fields';
      return;
    }
    this.loading = true;
    this.error = '';
    try {
      const user = await this.firebase.login(this.email, this.password);
      if (user.role === 'admin') {
        this.router.navigate(['/admin/uid-registration']);
      } else {
        this.router.navigate(['/dashboard']);
      }
    } catch (err: any) {
      this.error = err.message?.replace('Firebase: ', '') || 'Login failed';
    }
    this.loading = false;
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }
}
