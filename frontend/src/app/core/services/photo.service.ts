import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CreatorContentAccess, Photo, UploadPhotoRequest } from '../models';

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

  getCreatorPhotos(creatorId: number): Observable<CreatorContentAccess> {
    return this.http.get<CreatorContentAccess>(`${this.apiUrl}/creator/${creatorId}`);
  }

  updatePhoto(
    id: number,
    updateData: { description?: string; isPremium?: boolean }
  ): Observable<Photo> {
    return this.http.put<Photo>(`${this.apiUrl}/${id}`, updateData);
  }

  deletePhoto(id: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/${id}`);
  }

  getMyPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/my/photos`);
  }

  // Like/Unlike methods
  likePhoto(photoId: number): Observable<{ message: string; isLiked: boolean }> {
    return this.http.post<{ message: string; isLiked: boolean }>(
      `${this.apiUrl}/${photoId}/like`,
      {}
    );
  }

  unlikePhoto(photoId: number): Observable<{ message: string; isLiked: boolean }> {
    return this.http.delete<{ message: string; isLiked: boolean }>(
      `${this.apiUrl}/${photoId}/like`
    );
  }

  getPhotoLikes(photoId: number): Observable<{ count: number; likes: any[] }> {
    return this.http.get<{ count: number; likes: any[] }>(`${this.apiUrl}/${photoId}/likes`);
  }

  // Comment methods
  commentOnPhoto(photoId: number, content: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${photoId}/comment`, { content });
  }

  getPhotoComments(photoId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/${photoId}/comments`);
  }

  deleteComment(commentId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.apiUrl}/comment/${commentId}`);
  }
}
