import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, Router } from '@angular/router';
import { FirebaseService } from '../services/firebase.service';
import { filter, take } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private firebase: FirebaseService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot): Promise<boolean> {
    const requiredRoles: string[] = route.data['roles'] || [];

    return new Promise((resolve) => {
      this.firebase.authLoaded$.pipe(
        filter(loaded => loaded),
        take(1)
      ).subscribe(() => {
        const user = this.firebase.getCurrentUser();
        if (!user) {
          this.router.navigate(['/auth/login']);
          resolve(false);
          return;
        }

        if (requiredRoles.length === 0 || requiredRoles.includes(user.role)) {
          resolve(true);
        } else {
          this.router.navigate(['/dashboard']);
          resolve(false);
        }
      });
    });
  }
}
