import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { LoadInfoPageRoutingModule } from './load-info-routing.module';

import { LoadInfoPage } from './load-info.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    LoadInfoPageRoutingModule
  ],
  declarations: [LoadInfoPage]
})
export class LoadInfoPageModule {}
