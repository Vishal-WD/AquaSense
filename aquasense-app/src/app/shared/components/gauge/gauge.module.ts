import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { GaugeComponent } from './gauge.component';

@NgModule({
  declarations: [GaugeComponent],
  imports: [CommonModule, IonicModule],
  exports: [GaugeComponent]
})
export class GaugeModule {}
