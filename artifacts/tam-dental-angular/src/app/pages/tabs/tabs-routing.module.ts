import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      { path: 'home', loadChildren: () => import('../home/home.module').then(m => m.HomePageModule) },
      { path: 'appointments', loadChildren: () => import('../appointments/appointments.module').then(m => m.AppointmentsPageModule) },
      { path: 'health', loadChildren: () => import('../health/health.module').then(m => m.HealthPageModule) },
      { path: 'billing', loadChildren: () => import('../billing/billing.module').then(m => m.BillingPageModule) },
      { path: 'profile', loadChildren: () => import('../profile/profile.module').then(m => m.ProfilePageModule) },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class TabsRoutingModule {}
