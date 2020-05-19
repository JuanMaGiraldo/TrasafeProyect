import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LoadInfoPage } from './load-info.page';

const routes: Routes = [
  {
    path: '',
    component: LoadInfoPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LoadInfoPageRoutingModule {}
