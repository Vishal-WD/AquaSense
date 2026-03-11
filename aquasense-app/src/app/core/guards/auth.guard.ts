import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { filter, map, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private firebase: FirebaseService, private router: Router) {}

  canActivate(): Promise<boolean> {
    return new Promise((resolve) => {
      this.firebase.authLoaded$.pipe(
        filter(loaded => loaded),
        take(1)
      ).subscribe(() => {
        if (this.firebase.isAuthenticated()) {
          resolve(true);
        } else {
          this.router.navigate(['/auth/login']);
          resolve(false);
        }
      });
    });
  }
}
