import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { UpdateProfileRequest, User, UserProfile } from '../models';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getProfile(): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/profile`);
  }

  updateProfile(data: UpdateProfileRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/profile`, data);
  }

  deleteAccount(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/account`);
  }

  getCreatorArea(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/creator-area`);
  }

  getUserArea(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/user-area`);
  }
}
