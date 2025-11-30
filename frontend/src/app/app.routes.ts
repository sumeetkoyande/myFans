import { Routes } from '@angular/router';
import { AuthGuard, CreatorGuard } from './core/guards/auth.guard';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';
import { UploadComponent } from './features/upload/upload.component';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
  { path: 'upload', component: UploadComponent, canActivate: [AuthGuard, CreatorGuard] },
  { path: 'subscriptions', component: SubscriptionsComponent, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '/dashboard' },
];
