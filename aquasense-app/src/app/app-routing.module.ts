import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { RoleGuard } from './core/guards/role.guard';

const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth/login',
    loadChildren: () => import('./features/auth/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'auth/register',
    loadChildren: () => import('./features/auth/register/register.module').then(m => m.RegisterPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'map',
    loadChildren: () => import('./features/map/map.module').then(m => m.MapPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'alerts',
    loadChildren: () => import('./features/alerts/alerts.module').then(m => m.AlertsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'reports',
    loadChildren: () => import('./features/reports/reports.module').then(m => m.ReportsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: 'admin/uid-registration',
    loadChildren: () => import('./features/admin/uid-registration/uid-registration.module').then(m => m.UidRegistrationPageModule),
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] }
  },
  {
    path: 'stations',
    loadChildren: () => import('./features/stations/stations.module').then( m => m.StationsPageModule),
    canActivate: [AuthGuard]
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
