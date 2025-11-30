import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PhotoService } from '../../core/services/photo.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="bg-white shadow rounded-lg p-6">
          <h2 class="text-2xl font-bold text-gray-900 mb-6">Upload Photos</h2>

          <form [formGroup]="uploadForm" (ngSubmit)="onSubmit()" class="space-y-6">
            <!-- File Upload -->
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2"> Select Photo </label>
              <div
                class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-primary-400 transition-colors"
              >
                <div class="space-y-1 text-center">
                  <svg
                    class="mx-auto h-12 w-12 text-gray-400"
                    stroke="currentColor"
                    fill="none"
                    viewBox="0 0 48 48"
                  >
                    <path
                      d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    />
                  </svg>
                  <div class="flex text-sm text-gray-600">
                    <label
                      for="file-upload"
                      class="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        class="sr-only"
                        accept="image/*"
                        (change)="onFileSelected($event)"
                      />
                    </label>
                    <p class="pl-1">or drag and drop</p>
                  </div>
                  <p class="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                </div>
              </div>
              <div *ngIf="selectedFile" class="mt-2 text-sm text-gray-600">
                Selected: {{ selectedFile.name }}
              </div>
            </div>

            <!-- Description -->
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                formControlName="description"
                rows="3"
                class="input-field mt-1"
                placeholder="Add a description for your photo..."
              ></textarea>
            </div>

            <!-- Premium Toggle -->
            <div class="flex items-center">
              <input
                id="isPremium"
                formControlName="isPremium"
                type="checkbox"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="isPremium" class="ml-2 block text-sm text-gray-900">
                Mark as premium content (subscribers only)
              </label>
            </div>

            <!-- Error Message -->
            <div *ngIf="error" class="text-red-600 text-sm">
              {{ error }}
            </div>

            <!-- Submit Button -->
            <div class="flex space-x-4">
              <button
                type="submit"
                [disabled]="uploadForm.invalid || !selectedFile || loading"
                class="btn-primary disabled:opacity-50"
              >
                <span *ngIf="loading" class="mr-2">Uploading...</span>
                Upload Photo
              </button>
              <button type="button" (click)="cancel()" class="btn-secondary">Cancel</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
})
export class UploadComponent {
  uploadForm: FormGroup;
  selectedFile: File | null = null;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private photoService: PhotoService, private router: Router) {
    this.uploadForm = this.fb.group({
      description: ['', [Validators.required]],
      isPremium: [false],
    });
  }

  onFileSelected(event: Event): void {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      const file = target.files[0];

      // Validate file type
      if (!file.type.startsWith('image/')) {
        this.error = 'Please select an image file.';
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.error = 'File size must be less than 5MB.';
        return;
      }

      this.selectedFile = file;
      this.error = '';
    }
  }

  onSubmit(): void {
    if (this.uploadForm.valid && this.selectedFile) {
      this.loading = true;
      this.error = '';

      this.photoService.uploadPhoto(this.selectedFile, this.uploadForm.value).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Upload failed. Please try again.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/dashboard']);
  }
}
