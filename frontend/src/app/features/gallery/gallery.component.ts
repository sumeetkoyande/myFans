import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Creator, Photo, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PhotoService } from '../../core/services/photo.service';
import { SubscriptionService } from '../../core/services/subscription.service';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './gallery.component.html',
})
export class GalleryComponent implements OnInit {
  photos: Photo[] = [];
  creators: Creator[] = [];
  filteredPhotos: Photo[] = [];
  filterForm: FormGroup;
  user: User | null = null;
  loading = false;
  selectedCreator: Creator | null = null;
  viewMode: 'grid' | 'list' = 'grid';
  sortBy: 'newest' | 'oldest' | 'creator' = 'newest';
  showPremiumOnly = false;

  constructor(
    private photoService: PhotoService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private fb: FormBuilder
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      creatorFilter: [''],
      sortBy: ['newest'],
      premiumOnly: [false],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
    });

    this.loadSubscribedContent();
    this.setupFilters();
  }

  setupFilters(): void {
    this.filterForm.valueChanges.subscribe((filters) => {
      this.applyFilters(filters);
    });
  }

  async loadSubscribedContent(): Promise<void> {
    try {
      this.loading = true;

      // Load subscribed creators
      this.subscriptionService.getMySubscriptions().subscribe({
        next: (subscriptions) => {
          this.creators = subscriptions
            .filter((sub) => sub.isActive)
            .map((sub) => sub.creator as Creator);
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
        },
      });

      // Load photos from subscribed creators
      this.photoService.getSubscribedContent().subscribe({
        next: (photos) => {
          this.photos = photos;
          this.filteredPhotos = [...photos];
          this.applySorting();
        },
        error: (error) => {
          console.error('Error loading content:', error);
          // Fallback to mock data for demonstration
          this.loadMockContent();
        },
      });
    } catch (error) {
      console.error('Error loading content:', error);
      this.loadMockContent();
    } finally {
      this.loading = false;
    }
  }

  private loadMockContent(): void {
    // Mock data for demonstration
    this.photos = [
      {
        id: 1,
        url: 'https://via.placeholder.com/400x600/FF69B4/FFFFFF?text=Premium+Content',
        description: 'Beautiful sunset photography session',
        creator: { id: 1, email: 'photographer1@example.com', isCreator: true, isActive: true },
        isPremium: true,
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/400x400/87CEEB/FFFFFF?text=Free+Preview',
        description: 'Behind the scenes from todays shoot',
        creator: { id: 1, email: 'photographer1@example.com', isCreator: true, isActive: true },
        isPremium: false,
      },
      {
        id: 3,
        url: 'https://via.placeholder.com/400x500/FFB6C1/FFFFFF?text=Exclusive+Content',
        description: 'Exclusive content for subscribers',
        creator: { id: 2, email: 'artist2@example.com', isCreator: true, isActive: true },
        isPremium: true,
      },
    ];

    this.creators = [
      {
        id: 1,
        email: 'photographer1@example.com',
        photoCount: 25,
        subscriptionPrice: 9.99,
        isActive: true,
      },
      {
        id: 2,
        email: 'artist2@example.com',
        photoCount: 42,
        subscriptionPrice: 14.99,
        isActive: true,
      },
    ];

    this.filteredPhotos = [...this.photos];
    this.applySorting();
  }

  applyFilters(filters: any): void {
    let filtered = [...this.photos];

    // Search term filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(
        (photo) =>
          photo.description.toLowerCase().includes(searchTerm) ||
          photo.creator.email.toLowerCase().includes(searchTerm)
      );
    }

    // Creator filter
    if (filters.creatorFilter) {
      filtered = filtered.filter((photo) => photo.creator.id === +filters.creatorFilter);
    }

    // Premium only filter
    if (filters.premiumOnly) {
      filtered = filtered.filter((photo) => photo.isPremium);
    }

    this.filteredPhotos = filtered;
    this.sortBy = filters.sortBy;
    this.applySorting();
  }

  applySorting(): void {
    switch (this.sortBy) {
      case 'newest':
        this.filteredPhotos.sort((a, b) => b.id - a.id);
        break;
      case 'oldest':
        this.filteredPhotos.sort((a, b) => a.id - b.id);
        break;
      case 'creator':
        this.filteredPhotos.sort((a, b) => a.creator.email.localeCompare(b.creator.email));
        break;
    }
  }

  toggleViewMode(): void {
    this.viewMode = this.viewMode === 'grid' ? 'list' : 'grid';
  }

  selectCreator(creator: Creator): void {
    this.selectedCreator = creator;
    this.filterForm.patchValue({ creatorFilter: creator.id });
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      creatorFilter: '',
      sortBy: 'newest',
      premiumOnly: false,
    });
    this.selectedCreator = null;
  }

  openPhotoModal(photo: Photo): void {
    // Implement photo modal/lightbox functionality
    console.log('Opening photo:', photo);
  }

  likePhoto(photo: Photo): void {
    // Implement like functionality
    console.log('Liked photo:', photo.id);
  }

  downloadPhoto(photo: Photo): void {
    // Implement download functionality for premium subscribers
    if (photo.isPremium) {
      console.log('Downloading premium content:', photo.id);
      // Add actual download logic here
    }
  }
}
