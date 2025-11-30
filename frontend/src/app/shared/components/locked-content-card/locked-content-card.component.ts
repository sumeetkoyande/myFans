import { CommonModule } from '@angular/common';
import { Component, Input, signal } from '@angular/core';

@Component({
  selector: 'app-locked-content-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="relative group">
      <!-- Blurred Thumbnail Background -->
      <div
        class="aspect-w-1 aspect-h-1 bg-gradient-to-br from-gray-200 via-gray-300 to-gray-400 rounded-lg overflow-hidden"
      >
        <div class="w-full h-64 flex items-center justify-center relative">
          <!-- Blurred Background Pattern -->
          <div
            class="absolute inset-0 bg-gradient-to-br from-purple-100 via-pink-100 to-purple-200 opacity-70"
          ></div>

          <!-- Lock Icon -->
          <div class="relative z-10 text-center">
            <div
              class="w-16 h-16 bg-white bg-opacity-90 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
            >
              <svg
                class="w-8 h-8 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>

            <div class="bg-white bg-opacity-90 rounded-lg px-4 py-3 shadow-lg">
              <h3 class="text-sm font-semibold text-gray-800 mb-1">Premium Content</h3>
              <p class="text-xs text-gray-600">Subscribe to unlock</p>
            </div>
          </div>

          <!-- Overlay Gradient -->
          <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        </div>
      </div>

      <!-- Action Overlay on Hover -->
      <div
        class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-20 transition-all duration-300 rounded-lg flex items-center justify-center opacity-0 hover:opacity-100"
      >
        <button
          (click)="onSubscribeClick()"
          class="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium text-sm transform scale-95 hover:scale-100 transition-transform shadow-lg hover:bg-purple-700"
        >
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
            />
          </svg>
          Subscribe to View
        </button>
      </div>

      <!-- Premium Badge -->
      <div class="absolute top-3 left-3 z-20">
        <span
          class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg"
        >
          <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
            />
          </svg>
          Premium
        </span>
      </div>

      <!-- Content Count Indicator -->
      <div class="absolute bottom-3 right-3 z-20">
        <span
          class="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-black bg-opacity-60 text-white backdrop-blur-sm"
        >
          <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          {{ contentCount }} posts
        </span>
      </div>
    </div>
  `,
})
export class LockedContentCardComponent {
  @Input() contentCount = signal(0);
  @Input() onSubscribeClick = () => {};
}
