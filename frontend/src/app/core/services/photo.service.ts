import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { Photo, UploadPhotoRequest } from '../models';

@Injectable({
  providedIn: 'root',
})
export class PhotoService {
  private apiUrl = `${environment.apiUrl}/photos`;

  constructor(private http: HttpClient) {}

  uploadPhoto(file: File, photoData: UploadPhotoRequest): Observable<Photo> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('description', photoData.description);
    formData.append('isPremium', photoData.isPremium.toString());

    return this.http.post<Photo>(`${this.apiUrl}/upload`, formData);
  }

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/list`);
  }

  getPhotoById(id: number): Observable<Photo> {
    return this.http.get<Photo>(`${this.apiUrl}/${id}`);
  }

  getSubscribedContent(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/subscribed-content`);
  }

  getCreatorPhotos(creatorId: number): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/creator/${creatorId}`);
  }
}
