import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';

export interface PaymentHistory {
  id: string;
  date: Date;
  amount: number;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  description: string;
  creatorEmail?: string;
  invoiceUrl?: string;
  subscriptionPeriod: string;
}

@Component({
  selector: 'app-payments',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './payments.component.html',
})
export class PaymentsComponent implements OnInit {
  payments: PaymentHistory[] = [];
  user: User | null = null;
  loading = false;
  selectedStatus: string = 'all';

  constructor(private paymentService: PaymentService, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });
    this.loadPaymentHistory();
  }

  async loadPaymentHistory(): Promise<void> {
    try {
      this.loading = true;

      this.paymentService.getPaymentHistory().subscribe({
        next: (payments: PaymentHistory[]) => {
          this.payments = payments.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
        },
        error: (error) => {
          console.error('Error loading payment history:', error);
          this.loadMockPayments();
        },
      });
    } catch (error) {
      console.error('Error loading payment history:', error);
      this.loadMockPayments();
    } finally {
      this.loading = false;
    }
  }

  private loadMockPayments(): void {
    // Mock payment data for demonstration
    this.payments = [
      {
        id: 'pay_123456789',
        date: new Date('2024-01-15'),
        amount: 12.99,
        status: 'completed',
        description: 'Monthly Subscription',
        creatorEmail: 'photographer1@example.com',
        subscriptionPeriod: 'Jan 15, 2024 - Feb 15, 2024',
        invoiceUrl: '#',
      },
      {
        id: 'pay_987654321',
        date: new Date('2024-01-01'),
        amount: 9.99,
        status: 'completed',
        description: 'Monthly Subscription',
        creatorEmail: 'artist2@example.com',
        subscriptionPeriod: 'Jan 1, 2024 - Feb 1, 2024',
        invoiceUrl: '#',
      },
      {
        id: 'pay_555666777',
        date: new Date('2023-12-15'),
        amount: 12.99,
        status: 'completed',
        description: 'Monthly Subscription',
        creatorEmail: 'photographer1@example.com',
        subscriptionPeriod: 'Dec 15, 2023 - Jan 15, 2024',
        invoiceUrl: '#',
      },
      {
        id: 'pay_111222333',
        date: new Date('2023-12-10'),
        amount: 14.99,
        status: 'failed',
        description: 'Monthly Subscription',
        creatorEmail: 'creator3@example.com',
        subscriptionPeriod: 'Dec 10, 2023 - Jan 10, 2024',
      },
    ];
  }

  get filteredPayments(): PaymentHistory[] {
    if (this.selectedStatus === 'all') {
      return this.payments;
    }
    return this.payments.filter((payment) => payment.status === this.selectedStatus);
  }

  get totalSpent(): number {
    return this.payments
      .filter((p) => p.status === 'completed')
      .reduce((total, payment) => total + payment.amount, 0);
  }

  get monthlyTotal(): number {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    return this.payments
      .filter((p) => {
        const paymentDate = new Date(p.date);
        return (
          p.status === 'completed' &&
          paymentDate.getMonth() === currentMonth &&
          paymentDate.getFullYear() === currentYear
        );
      })
      .reduce((total, payment) => total + payment.amount, 0);
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed':
        return 'M5 13l4 4L19 7';
      case 'pending':
        return 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'failed':
        return 'M6 18L18 6M6 6l12 12';
      case 'refunded':
        return 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6';
      default:
        return 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  downloadInvoice(payment: PaymentHistory): void {
    if (payment.invoiceUrl) {
      window.open(payment.invoiceUrl, '_blank');
    } else {
      // Generate PDF invoice
      console.log('Generating invoice for payment:', payment.id);
      alert('Invoice download functionality coming soon!');
    }
  }

  retryPayment(payment: PaymentHistory): void {
    if (payment.status === 'failed') {
      console.log('Retrying payment:', payment.id);
      alert('Payment retry functionality coming soon!');
    }
  }

  requestRefund(payment: PaymentHistory): void {
    if (payment.status === 'completed') {
      const confirmed = confirm(
        `Are you sure you want to request a refund for this payment of $${payment.amount}?\n\nThis will cancel your subscription to ${payment.creatorEmail}.`
      );

      if (confirmed) {
        console.log('Requesting refund for payment:', payment.id);
        alert('Refund request functionality coming soon!');
      }
    }
  }

  filterByStatus(status: string): void {
    this.selectedStatus = status;
  }

  getPaymentCountByStatus(status: string): number {
    return this.payments.filter((p) => p.status === status).length;
  }
}
