import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { AppointmentsPage } from './appointments.page';

const routes: Routes = [{ path: '', component: AppointmentsPage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [AppointmentsPage],
})
export class AppointmentsPageModule {}
