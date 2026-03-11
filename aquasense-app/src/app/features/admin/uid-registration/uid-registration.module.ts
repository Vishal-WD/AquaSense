import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';
import { UidRegistrationPage } from './uid-registration.page';

@NgModule({
  declarations: [UidRegistrationPage],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([{ path: '', component: UidRegistrationPage }])
  ]
})
export class UidRegistrationPageModule {}
