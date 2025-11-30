import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Photo, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PhotoService } from '../../core/services/photo.service';

@Component({
  selector: 'app-content-manager',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './content-manager.component.html',
})
export class ContentManagerComponent implements OnInit {
  photos: Photo[] = [];
  filteredPhotos: Photo[] = [];
  user: User | null = null;
  loading = false;
  selectedPhotos: number[] = [];
  editingPhoto: Photo | null = null;
  editForm: FormGroup;

  // Filters
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'newest' | 'oldest' | 'premium' | 'free' = 'newest';
  filterBy: 'all' | 'premium' | 'free' = 'all';
  searchTerm = '';

  constructor(
    private photoService: PhotoService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.editForm = this.fb.group({
      description: ['', [Validators.required]],
      isPremium: [false],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });

    this.loadMyPhotos();
  }

  async loadMyPhotos(): Promise<void> {
    try {
      this.loading = true;

      this.photoService.getPhotos().subscribe({
        next: (photos) => {
          // Filter to only show current user's photos
          this.photos = photos.filter(
            (photo) =>
              photo.creator.id === this.user?.id || photo.creator.email === this.user?.email
          );
          this.applyFilters();
        },
        error: (error) => {
          console.error('Error loading photos:', error);
          this.loadMockPhotos();
        },
      });
    } catch (error) {
      console.error('Error loading photos:', error);
      this.loadMockPhotos();
    } finally {
      this.loading = false;
    }
  }

  private loadMockPhotos(): void {
    // Mock photos for the current user
    this.photos = [
      {
        id: 1,
        url: 'https://via.placeholder.com/400x600/FF69B4/FFFFFF?text=Premium+Photo+1',
        description: 'Exclusive premium content for subscribers',
        creator: this.user!,
        isPremium: true,
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/400x400/87CEEB/FFFFFF?text=Free+Preview',
        description: 'Free preview content for everyone',
        creator: this.user!,
        isPremium: false,
      },
      {
        id: 3,
        url: 'https://via.placeholder.com/400x500/FFB6C1/FFFFFF?text=Premium+Photo+2',
        description: 'Behind the scenes premium content',
        creator: this.user!,
        isPremium: true,
      },
      {
        id: 4,
        url: 'https://via.placeholder.com/400x300/98FB98/FFFFFF?text=Free+Content',
        description: 'Another free preview photo',
        creator: this.user!,
        isPremium: false,
      },
    ];
    this.applyFilters();
  }

  applyFilters(): void {
    let filtered = [...this.photos];

    // Filter by type
    if (this.filterBy === 'premium') {
      filtered = filtered.filter((photo) => photo.isPremium);
    } else if (this.filterBy === 'free') {
      filtered = filtered.filter((photo) => !photo.isPremium);
    }

    // Search filter
    if (this.searchTerm) {
      const search = this.searchTerm.toLowerCase();
      filtered = filtered.filter((photo) => photo.description.toLowerCase().includes(search));
    }

    // Sort
    switch (this.sortBy) {
      case 'newest':
        filtered.sort((a, b) => b.id - a.id);
        break;
      case 'oldest':
        filtered.sort((a, b) => a.id - b.id);
        break;
      case 'premium':
        filtered.sort((a, b) => (b.isPremium ? 1 : 0) - (a.isPremium ? 1 : 0));
        break;
      case 'free':
        filtered.sort((a, b) => (a.isPremium ? 1 : 0) - (b.isPremium ? 1 : 0));
        break;
    }

    this.filteredPhotos = filtered;
  }

  onSearch(event: any): void {
    this.searchTerm = event.target.value;
    this.applyFilters();
  }

  onSortChange(event: any): void {
    this.sortBy = event.target.value;
    this.applyFilters();
  }

  onFilterChange(event: any): void {
    this.filterBy = event.target.value;
    this.applyFilters();
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  selectPhoto(photoId: number): void {
    const index = this.selectedPhotos.indexOf(photoId);
    if (index > -1) {
      this.selectedPhotos.splice(index, 1);
    } else {
      this.selectedPhotos.push(photoId);
    }
  }

  selectAllPhotos(): void {
    if (this.selectedPhotos.length === this.filteredPhotos.length) {
      this.selectedPhotos = [];
    } else {
      this.selectedPhotos = this.filteredPhotos.map((photo) => photo.id);
    }
  }

  isPhotoSelected(photoId: number): boolean {
    return this.selectedPhotos.includes(photoId);
  }

  get allPhotosSelected(): boolean {
    return (
      this.filteredPhotos.length > 0 && this.selectedPhotos.length === this.filteredPhotos.length
    );
  }

  get somePhotosSelected(): boolean {
    return (
      this.selectedPhotos.length > 0 && this.selectedPhotos.length < this.filteredPhotos.length
    );
  }

  editPhoto(photo: Photo): void {
    this.editingPhoto = photo;
    this.editForm.patchValue({
      description: photo.description,
      isPremium: photo.isPremium,
    });
  }

  cancelEdit(): void {
    this.editingPhoto = null;
    this.editForm.reset();
  }

  async savePhoto(): Promise<void> {
    if (this.editForm.valid && this.editingPhoto) {
      try {
        const formValue = this.editForm.value;

        // Update locally for now (you'd call an API here)
        const photoIndex = this.photos.findIndex((p) => p.id === this.editingPhoto!.id);
        if (photoIndex > -1) {
          this.photos[photoIndex] = {
            ...this.photos[photoIndex],
            description: formValue.description,
            isPremium: formValue.isPremium,
          };
        }

        this.applyFilters();
        this.cancelEdit();

        // Show success message
        alert('Photo updated successfully!');
      } catch (error) {
        console.error('Error updating photo:', error);
        alert('Failed to update photo. Please try again.');
      }
    }
  }

  deletePhoto(photo: Photo): void {
    const confirmed = confirm(`Are you sure you want to delete "${photo.description}"?`);
    if (confirmed) {
      // Remove from local array (you'd call an API here)
      this.photos = this.photos.filter((p) => p.id !== photo.id);
      this.selectedPhotos = this.selectedPhotos.filter((id) => id !== photo.id);
      this.applyFilters();

      alert('Photo deleted successfully!');
    }
  }

  deleteSelectedPhotos(): void {
    if (this.selectedPhotos.length === 0) return;

    const confirmed = confirm(
      `Are you sure you want to delete ${this.selectedPhotos.length} selected photo(s)?`
    );

    if (confirmed) {
      // Remove selected photos
      this.photos = this.photos.filter((photo) => !this.selectedPhotos.includes(photo.id));
      this.selectedPhotos = [];
      this.applyFilters();

      alert('Selected photos deleted successfully!');
    }
  }

  togglePremiumForSelected(): void {
    if (this.selectedPhotos.length === 0) return;

    const selectedPhotoObjects = this.photos.filter((photo) =>
      this.selectedPhotos.includes(photo.id)
    );

    const allPremium = selectedPhotoObjects.every((photo) => photo.isPremium);
    const newPremiumStatus = !allPremium;

    // Update premium status for selected photos
    this.photos = this.photos.map((photo) =>
      this.selectedPhotos.includes(photo.id) ? { ...photo, isPremium: newPremiumStatus } : photo
    );

    this.applyFilters();

    const action = newPremiumStatus ? 'marked as premium' : 'marked as free';
    alert(`${this.selectedPhotos.length} photo(s) ${action}.`);
  }

  get premiumPhotosCount(): number {
    return this.photos.filter((photo) => photo.isPremium).length;
  }

  get freePhotosCount(): number {
    return this.photos.filter((photo) => !photo.isPremium).length;
  }
}
