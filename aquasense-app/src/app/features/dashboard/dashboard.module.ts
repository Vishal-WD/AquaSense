import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { DashboardPage } from './dashboard.page';
import { GaugeModule } from '../../shared/components/gauge/gauge.module';

@NgModule({
  declarations: [DashboardPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    GaugeModule,
    RouterModule.forChild([{ path: '', component: DashboardPage }])
  ]
})
export class DashboardPageModule {}
