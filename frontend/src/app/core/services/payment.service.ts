import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  createCheckoutSession(creatorId: number): Observable<{ sessionId: string }> {
    return this.http.post<{ sessionId: string }>(`${this.apiUrl}/create-checkout-session`, {
      creatorId,
    });
  }

  async redirectToCheckout(sessionId: string): Promise<void> {
    // Simple redirect to Stripe Checkout
    window.location.href = `https://checkout.stripe.com/pay/${sessionId}`;
  }
}
