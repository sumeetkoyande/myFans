import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';

interface Creator {
  id: number;
  email: string;
  photoCount: number;
  subscriptionPrice: number;
}

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900">Discover Creators</h1>
          <p class="text-gray-600 mt-2">
            Subscribe to access premium content from your favorite creators
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let creator of creators"
            class="bg-white rounded-lg shadow-md overflow-hidden"
          >
            <div class="p-6">
              <div class="flex items-center mb-4">
                <div class="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center">
                  <span class="text-primary-600 font-semibold text-lg">
                    {{ creator.email.charAt(0).toUpperCase() }}
                  </span>
                </div>
                <div class="ml-4">
                  <h3 class="text-lg font-semibold text-gray-900">{{ creator.email }}</h3>
                  <p class="text-sm text-gray-600">{{ creator.photoCount }} photos</p>
                </div>
              </div>

              <div class="mb-4">
                <span class="text-2xl font-bold text-gray-900"
                  >\${{ creator.subscriptionPrice }}</span
                >
                <span class="text-gray-600">/month</span>
              </div>

              <button
                (click)="subscribeToCreator(creator.id)"
                [disabled]="loading"
                class="btn-primary w-full disabled:opacity-50"
              >
                <span *ngIf="loading" class="mr-2">Processing...</span>
                Subscribe Now
              </button>
            </div>
          </div>
        </div>

        <!-- Current Subscriptions -->
        <div *ngIf="currentSubscriptions.length > 0" class="mt-12">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Your Subscriptions</h2>
          <div class="bg-white rounded-lg shadow">
            <div class="px-6 py-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900">Active Subscriptions</h3>
            </div>
            <ul class="divide-y divide-gray-200">
              <li
                *ngFor="let subscription of currentSubscriptions"
                class="px-6 py-4 flex items-center justify-between"
              >
                <div>
                  <p class="text-sm font-medium text-gray-900">{{ subscription.creatorEmail }}</p>
                  <p class="text-sm text-gray-600">
                    Started {{ subscription.startDate | date : 'shortDate' }}
                  </p>
                </div>
                <div class="flex items-center space-x-4">
                  <span class="text-sm text-green-600 font-medium">Active</span>
                  <button class="text-sm text-red-600 hover:text-red-700">Cancel</button>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SubscriptionsComponent implements OnInit {
  creators: Creator[] = [];
  currentSubscriptions: any[] = [];
  loading = false;
  user: User | null = null;

  constructor(private paymentService: PaymentService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadCreators();
    this.loadCurrentSubscriptions();
  }

  loadCreators(): void {
    // Mock data - in real app, this would come from an API
    this.creators = [
      { id: 1, email: 'creator1@example.com', photoCount: 25, subscriptionPrice: 9.99 },
      { id: 2, email: 'creator2@example.com', photoCount: 42, subscriptionPrice: 14.99 },
      { id: 3, email: 'creator3@example.com', photoCount: 18, subscriptionPrice: 7.99 },
    ];
  }

  loadCurrentSubscriptions(): void {
    // Mock data - in real app, this would come from an API
    this.currentSubscriptions = [];
  }

  async subscribeToCreator(creatorId: number): Promise<void> {
    try {
      this.loading = true;

      const response = await this.paymentService.createCheckoutSession(creatorId).toPromise();
      if (response?.sessionId) {
        await this.paymentService.redirectToCheckout(response.sessionId);
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      // Handle error (show notification, etc.)
    } finally {
      this.loading = false;
    }
  }
}
