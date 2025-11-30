import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Creator, SubscriptionDetails } from '../models';

@Injectable({
  providedIn: 'root',
})
export class SubscriptionService {
  private apiUrl = `${environment.apiUrl}/subscriptions`;

  constructor(private http: HttpClient) {}

  subscribe(creatorId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/subscribe`, { creatorId });
  }

  getMySubscriptions(): Observable<SubscriptionDetails[]> {
    return this.http.get<SubscriptionDetails[]>(`${this.apiUrl}/my-subscriptions`);
  }

  getMySubscribers(): Observable<SubscriptionDetails[]> {
    return this.http.get<SubscriptionDetails[]>(`${this.apiUrl}/my-subscribers`);
  }

  // Get available creators from the backend
  getAvailableCreators(): Observable<Creator[]> {
    return this.http.get<Creator[]>(`${environment.apiUrl}/users/creators`);
  }

  getCreatorById(creatorId: number): Observable<Creator> {
    return this.http.get<Creator>(`${environment.apiUrl}/users/creators/${creatorId}`);
  }

  checkSubscription(creatorId: number): Observable<boolean> {
    return this.http.get<boolean>(`${this.apiUrl}/check/${creatorId}`);
  }
}
