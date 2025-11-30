import { CommonModule } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Comment, Like, Photo, PhotoWithCreator } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';
import { PhotoService } from '../../../core/services/photo.service';

@Component({
  selector: 'app-photo-interactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 mt-4">
      <!-- Photo Display -->
      <div class="p-4">
        <img
          [src]="photo().url"
          [alt]="photo().description"
          class="w-full h-64 object-cover rounded-lg"
        />
        <p class="mt-2 text-gray-700">{{ photo().description }}</p>
        <p class="text-sm text-gray-500">by {{ photo().creator.email }}</p>
      </div>

      <!-- Like and Comment Actions -->
      <div class="px-4 py-2 border-t border-gray-200 flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <!-- Like Button -->
          <button
            (click)="toggleLike()"
            [disabled]="isLiking()"
            class="flex items-center space-x-2 text-gray-600 hover:text-red-500 transition-colors"
            [class.text-red-500]="isLikedByUser()"
          >
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
              />
            </svg>
            <span>{{ likesCount() }} {{ likesCount() === 1 ? 'Like' : 'Likes' }}</span>
          </button>

          <!-- Comment Button -->
          <button
            (click)="toggleComments()"
            class="flex items-center space-x-2 text-gray-600 hover:text-blue-500 transition-colors"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-3.582 8-8 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 3.582-8 8-8s8 3.582 8 8z"
              />
            </svg>
            <span
              >{{ comments().length }} {{ comments().length === 1 ? 'Comment' : 'Comments' }}</span
            >
          </button>
        </div>
      </div>

      <!-- Comments Section -->
      <div *ngIf="showComments()" class="border-t border-gray-200">
        <!-- Add Comment -->
        <div class="p-4 border-b border-gray-100">
          <div class="flex space-x-3">
            <div class="flex-1">
              <textarea
                [(ngModel)]="newComment"
                placeholder="Write a comment..."
                rows="2"
                class="w-full p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              ></textarea>
              <div class="mt-2 flex justify-end">
                <button
                  (click)="addComment()"
                  [disabled]="!newComment.trim() || isCommenting()"
                  class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ isCommenting() ? 'Posting...' : 'Post Comment' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Comments List -->
        <div class="max-h-96 overflow-y-auto">
          <div
            *ngFor="let comment of comments()"
            class="p-4 border-b border-gray-100 last:border-b-0"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="flex items-center space-x-2 mb-1">
                  <span class="font-semibold text-gray-900">{{
                    comment.user.name || comment.user.email.split('@')[0]
                  }}</span>
                  <span class="text-sm text-gray-500">{{ formatDate(comment.createdAt) }}</span>
                </div>
                <p class="text-gray-700">{{ comment.content }}</p>
              </div>
              <button
                *ngIf="canDeleteComment(comment)"
                (click)="deleteComment(comment.id)"
                class="text-red-500 hover:text-red-700 ml-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          <div *ngIf="comments().length === 0" class="p-4 text-center text-gray-500">
            No comments yet. Be the first to comment!
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PhotoInteractionsComponent implements OnInit {
  @Input({ required: true }) photo = signal<Photo | PhotoWithCreator>({} as Photo);

  likes = signal<Like[]>([]);
  comments = signal<Comment[]>([]);
  likesCount = signal(0);
  isLikedByUser = signal(false);
  showComments = signal(false);
  isLiking = signal(false);
  isCommenting = signal(false);
  newComment = '';

  constructor(private photoService: PhotoService, private authService: AuthService) {}

  ngOnInit() {
    this.loadLikes();
    this.loadComments();
  }

  loadLikes() {
    this.photoService.getPhotoLikes(this.photo().id).subscribe({
      next: (response) => {
        this.likes.set(response.likes);
        this.likesCount.set(response.count);

        const currentUser = this.authService.getCurrentUser();
        if (currentUser) {
          const userLike = response.likes.find((like) => like.user.id === currentUser.id);
          this.isLikedByUser.set(!!userLike);
        }
      },
      error: (error) => console.error('Error loading likes:', error),
    });
  }

  loadComments() {
    this.photoService.getPhotoComments(this.photo().id).subscribe({
      next: (comments) => {
        this.comments.set(comments);
      },
      error: (error) => console.error('Error loading comments:', error),
    });
  }

  toggleLike() {
    this.isLiking.set(true);

    const action = this.isLikedByUser()
      ? this.photoService.unlikePhoto(this.photo().id)
      : this.photoService.likePhoto(this.photo().id);

    action.subscribe({
      next: (response) => {
        this.isLikedByUser.set(response.isLiked);
        this.loadLikes(); // Refresh likes
        this.isLiking.set(false);
      },
      error: (error) => {
        console.error('Error toggling like:', error);
        this.isLiking.set(false);
      },
    });
  }

  toggleComments() {
    this.showComments.set(!this.showComments());
    if (this.showComments()) {
      this.loadComments();
    }
  }

  addComment() {
    if (!this.newComment.trim()) return;

    this.isCommenting.set(true);
    this.photoService.commentOnPhoto(this.photo().id, this.newComment.trim()).subscribe({
      next: () => {
        this.newComment = '';
        this.loadComments();
        this.isCommenting.set(false);
      },
      error: (error) => {
        console.error('Error adding comment:', error);
        this.isCommenting.set(false);
      },
    });
  }

  deleteComment(commentId: number) {
    if (confirm('Are you sure you want to delete this comment?')) {
      this.photoService.deleteComment(commentId).subscribe({
        next: () => {
          this.loadComments();
        },
        error: (error) => console.error('Error deleting comment:', error),
      });
    }
  }

  canDeleteComment(comment: Comment): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    // User can delete their own comment or if they own the photo
    return comment.user.id === currentUser.id || this.photo().creator.id === currentUser.id;
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
