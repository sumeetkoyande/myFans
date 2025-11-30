import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Photo, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PhotoService } from '../../core/services/photo.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <header class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between h-16">
            <div class="flex items-center">
              <h1 class="text-xl font-semibold text-gray-900">Dashboard</h1>
            </div>
            <div class="flex items-center space-x-4">
              <span class="text-gray-700">{{ user?.email }}</span>
              <button
                (click)="logout()"
                class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Creator Dashboard -->
          <div *ngIf="user?.isCreator" class="space-y-6">
            <div class="bg-white shadow rounded-lg p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">Creator Dashboard</h2>
              <div class="flex space-x-4">
                <a routerLink="/upload" class="btn-primary"> Upload Photos </a>
                <a routerLink="/my-content" class="btn-secondary"> Manage Content </a>
              </div>
            </div>

            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Your Photos</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div *ngFor="let photo of photos" class="relative">
                  <img
                    [src]="photo.url"
                    [alt]="photo.description"
                    class="w-full h-48 object-cover rounded-lg"
                  />
                  <div *ngIf="photo.isPremium" class="absolute top-2 right-2">
                    <span class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Premium</span>
                  </div>
                  <p class="mt-2 text-sm text-gray-600">{{ photo.description }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Subscriber Dashboard -->
          <div *ngIf="!user?.isCreator" class="space-y-6">
            <div class="bg-white shadow rounded-lg p-6">
              <h2 class="text-lg font-medium text-gray-900 mb-4">Subscriber Dashboard</h2>
              <p class="text-gray-600 mb-4">Discover and subscribe to your favorite creators</p>
              <a routerLink="/subscriptions" class="btn-primary">Browse Creators</a>
            </div>

            <div class="bg-white shadow rounded-lg p-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Available Content</h3>
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div *ngFor="let photo of photos" class="relative">
                  <img
                    [src]="photo.url"
                    [alt]="photo.description"
                    class="w-full h-48 object-cover rounded-lg"
                  />
                  <div *ngIf="photo.isPremium" class="absolute top-2 right-2">
                    <span class="bg-yellow-500 text-white px-2 py-1 rounded text-xs">Premium</span>
                  </div>
                  <div class="mt-2">
                    <p class="text-sm text-gray-600">{{ photo.description }}</p>
                    <p class="text-xs text-gray-500">by {{ photo.creator.email }}</p>
                    <button
                      *ngIf="photo.isPremium"
                      (click)="subscribeToCreator(photo.creator.id)"
                      class="mt-2 btn-primary text-xs"
                    >
                      Subscribe to Access
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  user: User | null = null;
  photos: Photo[] = [];

  constructor(private authService: AuthService, private photoService: PhotoService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadPhotos();
  }

  loadPhotos(): void {
    this.photoService.getPhotos().subscribe({
      next: (photos) => {
        this.photos = photos;
      },
      error: (err) => {
        console.error('Error loading photos:', err);
      },
    });
  }

  subscribeToCreator(creatorId: number): void {
    // This will be implemented with PaymentService
    console.log('Subscribe to creator:', creatorId);
  }

  logout(): void {
    this.authService.logout();
  }
}
