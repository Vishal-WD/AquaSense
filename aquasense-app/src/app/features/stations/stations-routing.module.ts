import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { StationsPage } from './stations.page';

const routes: Routes = [
  {
    path: '',
    component: StationsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class StationsPageRoutingModule {}
