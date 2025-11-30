import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { SubscriptionService } from '../../core/services/subscription.service';

export interface AnalyticsData {
  totalEarnings: number;
  monthlyEarnings: number;
  subscribers: number;
  totalContent: number;
  avgSubscriptionPrice: number;
  recentSubscribers: any[];
  earningsHistory: { month: string; amount: number }[];
  topContent: { id: number; title: string; views: number; earnings: number }[];
}

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './analytics.component.html',
})
export class AnalyticsComponent implements OnInit {
  user: User | null = null;
  analytics: AnalyticsData | null = null;
  loading = false;
  selectedPeriod = 'month';

  constructor(private authService: AuthService, private subscriptionService: SubscriptionService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user && (user.isCreator || user.role === 'creator')) {
        this.loadAnalytics();
      }
    });
  }

  async loadAnalytics(): Promise<void> {
    try {
      this.loading = true;

      // In a real app, you'd make API calls here
      setTimeout(() => {
        this.loadMockAnalytics();
        this.loading = false;
      }, 1000);
    } catch (error) {
      console.error('Error loading analytics:', error);
      this.loadMockAnalytics();
      this.loading = false;
    }
  }

  private loadMockAnalytics(): void {
    this.analytics = {
      totalEarnings: 2847.5,
      monthlyEarnings: 450.25,
      subscribers: 34,
      totalContent: 67,
      avgSubscriptionPrice: 12.99,
      recentSubscribers: [
        { email: 'user1@example.com', date: new Date('2024-01-15'), amount: 12.99 },
        { email: 'user2@example.com', date: new Date('2024-01-14'), amount: 12.99 },
        { email: 'user3@example.com', date: new Date('2024-01-13'), amount: 12.99 },
        { email: 'user4@example.com', date: new Date('2024-01-12'), amount: 12.99 },
        { email: 'user5@example.com', date: new Date('2024-01-11'), amount: 12.99 },
      ],
      earningsHistory: [
        { month: 'Jul 2023', amount: 125.5 },
        { month: 'Aug 2023', amount: 189.25 },
        { month: 'Sep 2023', amount: 267.75 },
        { month: 'Oct 2023', amount: 334.5 },
        { month: 'Nov 2023', amount: 412.25 },
        { month: 'Dec 2023', amount: 468.0 },
        { month: 'Jan 2024', amount: 450.25 },
      ],
      topContent: [
        { id: 1, title: 'Premium photoshoot behind the scenes', views: 89, earnings: 45.67 },
        { id: 2, title: 'Exclusive sunset session', views: 76, earnings: 38.92 },
        { id: 3, title: 'Premium lifestyle content', views: 65, earnings: 33.25 },
        { id: 4, title: 'Special subscriber content', views: 54, earnings: 27.63 },
        { id: 5, title: 'Premium artistic photos', views: 47, earnings: 24.07 },
      ],
    };
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  }

  getGrowthPercentage(): number {
    if (!this.analytics?.earningsHistory || this.analytics.earningsHistory.length < 2) {
      return 0;
    }

    const current =
      this.analytics.earningsHistory[this.analytics.earningsHistory.length - 1].amount;
    const previous =
      this.analytics.earningsHistory[this.analytics.earningsHistory.length - 2].amount;

    return ((current - previous) / previous) * 100;
  }

  downloadEarningsReport(): void {
    // Implement earnings report download
    console.log('Downloading earnings report...');
    alert('Earnings report download functionality coming soon!');
  }

  requestPayout(): void {
    if (this.analytics && this.analytics.totalEarnings > 0) {
      const confirmed = confirm(
        `Request payout of ${this.formatCurrency(
          this.analytics.totalEarnings
        )}?\n\nFunds will be transferred to your linked bank account within 1-3 business days.`
      );

      if (confirmed) {
        console.log('Requesting payout...');
        alert(
          'Payout request submitted successfully! You will receive an email confirmation shortly.'
        );
      }
    }
  }

  get canRequestPayout(): boolean {
    return this.analytics ? this.analytics.totalEarnings >= 25.0 : false;
  }
}
