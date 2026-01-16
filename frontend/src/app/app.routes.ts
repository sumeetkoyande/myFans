import { Routes } from '@angular/router';
import { AuthGuard, CreatorGuard } from './core/guards/auth.guard';
import { AnalyticsComponent } from './features/analytics/analytics.component';
import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { ContentManagerComponent } from './features/content-manager/content-manager.component';
import { CreatorProfileComponent } from './features/creator-profile/creator-profile.component';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { GalleryComponent } from './features/gallery/gallery.component';
import { PaymentsComponent } from './features/payments/payments.component';
import { ProfileComponent } from './features/profile/profile.component';
import { SubscriptionsComponent } from './features/subscriptions/subscriptions.component';
import { UploadComponent } from './features/upload/upload.component';

export const routes: Routes = [
  {
    path: '',
    redirectTo: '/dashboard',
    pathMatch: 'full',
  },
  {
    path: 'login',
    component: LoginComponent,
  },
  {
    path: 'register',
    component: RegisterComponent,
  },
  {
    path: 'dashboard',
    component: DashboardComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'profile',
    component: ProfileComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'gallery',
    component: GalleryComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'subscriptions',
    component: SubscriptionsComponent,
  },
  {
    path: 'browse-creators',
    component: SubscriptionsComponent,
  },
  {
    path: 'creator/:id',
    component: CreatorProfileComponent,
  },
  {
    path: 'payments',
    component: PaymentsComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'upload',
    component: UploadComponent,
    canActivate: [AuthGuard, CreatorGuard],
  },
  {
    path: 'content-manager',
    component: ContentManagerComponent,
    canActivate: [AuthGuard, CreatorGuard],
  },
  {
    path: 'analytics',
    component: AnalyticsComponent,
    canActivate: [AuthGuard, CreatorGuard],
  },
  {
    path: '**',
    redirectTo: '/login',
  },
];
