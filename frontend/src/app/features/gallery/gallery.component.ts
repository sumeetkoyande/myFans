import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { Creator, Photo, PhotoWithCreator, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PhotoService } from '../../core/services/photo.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { PhotoInteractionsComponent } from '../../shared/components/photo-interactions/photo-interactions.component';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, PhotoInteractionsComponent],
  templateUrl: './gallery.component.html',
})
export class GalleryComponent implements OnInit, OnDestroy {
  photos = signal<PhotoWithCreator[]>([]);
  creators = signal<Creator[]>([]);
  filteredPhotos = signal<PhotoWithCreator[]>([]);
  filterForm: FormGroup;
  user = signal<User | null>(null);
  loading = signal(false);
  selectedCreator = signal<Creator | null>(null);
  viewMode = signal<'grid' | 'list'>('grid');
  sortBy = signal<'newest' | 'oldest' | 'creator'>('newest');
  showPremiumOnly = signal(false);
  private subscriptions = new Subscription();

  constructor(
    private photoService: PhotoService,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      creatorFilter: [''],
      sortBy: ['newest'],
      premiumOnly: [false],
    });
  }

  ngOnInit(): void {
    // Subscribe to user changes
    const userSub = this.authService.currentUser$.subscribe((user) => {
      this.user.set(user);
      this.cdr.markForCheck();
    });
    this.subscriptions.add(userSub);

    this.loadSubscribedContent();
    this.setupFilters();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  setupFilters(): void {
    this.filterForm.valueChanges.subscribe((filters) => {
      this.applyFilters(filters);
    });
  }

  async loadSubscribedContent(): Promise<void> {
    try {
      this.loading.set(true);

      // Load subscribed creators
      const creatorsSub = this.subscriptionService.getMySubscriptions().subscribe({
        next: (subscriptions) => {
          const activeCreators = subscriptions
            .filter((sub) => sub.isActive)
            .map((sub) => sub.creator);
          this.creators.set(activeCreators);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading subscriptions:', error);
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
      this.subscriptions.add(creatorsSub);

      // Load photos from subscribed creators
      const photosSub = this.photoService.getPhotos().subscribe({
        next: (photos) => {
          // Convert Photo[] to PhotoWithCreator[]
          const convertedPhotos = photos.map((photo) => this.convertPhotoToPhotoWithCreator(photo));
          this.photos.set(convertedPhotos);
          this.filteredPhotos.set([...convertedPhotos]);
          this.applySorting();
          this.loading.set(false);
          this.cdr.markForCheck();
        },
        error: (error) => {
          console.error('Error loading content:', error);
          // Fallback to mock data for demonstration
          this.loadMockContent();
          this.loading.set(false);
          this.cdr.markForCheck();
        },
      });
      this.subscriptions.add(photosSub);
    } catch (error) {
      console.error('Error loading content:', error);
      this.loadMockContent();
    }
  }

  private loadMockContent(): void {
    // Mock data for demonstration
    const mockPhotos: PhotoWithCreator[] = [
      {
        id: 1,
        url: 'https://via.placeholder.com/400x600/FF69B4/FFFFFF?text=Premium+Content',
        description: 'Beautiful sunset photography session',
        creator: {
          id: 1,
          email: 'photographer1@example.com',
          photoCount: 25,
          subscriptionPrice: 9.99,
          isActive: true,
        },
        isPremium: true,
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/400x400/87CEEB/FFFFFF?text=Free+Preview',
        description: 'Behind the scenes from todays shoot',
        creator: {
          id: 1,
          email: 'photographer1@example.com',
          photoCount: 25,
          subscriptionPrice: 9.99,
          isActive: true,
        },
        isPremium: false,
      },
      {
        id: 3,
        url: 'https://via.placeholder.com/400x500/FFB6C1/FFFFFF?text=Exclusive+Content',
        description: 'Exclusive content for subscribers',
        creator: {
          id: 2,
          email: 'artist2@example.com',
          photoCount: 42,
          subscriptionPrice: 14.99,
          isActive: true,
        },
        isPremium: true,
      },
    ];

    this.photos.set(mockPhotos);
    this.creators.set([
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
    ]);

    this.filteredPhotos.set([...mockPhotos]);
    this.applySorting();
    this.loading.set(false);
    this.cdr.markForCheck();
  }

  applyFilters(filters: any): void {
    let filtered = [...this.photos()];

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

    this.filteredPhotos.set(filtered);
    this.sortBy.set(filters.sortBy);
    this.applySorting();
    this.cdr.markForCheck();
  }

  applySorting(): void {
    const currentPhotos = [...this.filteredPhotos()];
    switch (this.sortBy()) {
      case 'newest':
        currentPhotos.sort((a, b) => b.id - a.id);
        break;
      case 'oldest':
        currentPhotos.sort((a, b) => a.id - b.id);
        break;
      case 'creator':
        currentPhotos.sort((a, b) => a.creator.email.localeCompare(b.creator.email));
        break;
    }
    this.filteredPhotos.set(currentPhotos);
    this.cdr.markForCheck();
  }

  toggleViewMode(): void {
    this.viewMode.set(this.viewMode() === 'grid' ? 'list' : 'grid');
  }

  selectCreator(creator: Creator): void {
    this.selectedCreator.set(creator);
    this.filterForm.patchValue({ creatorFilter: creator.id });
  }

  clearFilters(): void {
    this.filterForm.reset({
      searchTerm: '',
      creatorFilter: '',
      sortBy: 'newest',
      premiumOnly: false,
    });
    this.selectedCreator.set(null);
  }

  openPhotoModal(photo: PhotoWithCreator): void {
    // Implement photo modal/lightbox functionality
    console.log('Opening photo:', photo);
  }

  likePhoto(photo: PhotoWithCreator): void {
    // Implement like functionality
    console.log('Liked photo:', photo.id);
  }

  downloadPhoto(photo: PhotoWithCreator): void {
    // Implement download functionality for premium subscribers
    if (photo.isPremium) {
      console.log('Downloading premium content:', photo.id);
      // Add actual download logic here
    }
  }

  private convertPhotoToPhotoWithCreator(photo: Photo): PhotoWithCreator {
    // Find the creator in our creators list to get full Creator data
    const creatorData = this.creators().find((c) => c.id === photo.creator.id);

    return {
      id: photo.id,
      url: photo.url,
      description: photo.description,
      isPremium: photo.isPremium,
      creator: creatorData || {
        id: photo.creator.id,
        email: photo.creator.email,
        photoCount: 0,
        subscriptionPrice: photo.creator.subscriptionPrice || 9.99,
        isActive: photo.creator.isActive,
      },
    };
  }

  getPhotoCountForCreator(creatorId: number): number {
    return this.photos().filter((p) => p.creator.id === creatorId).length;
  }

  selectAllCreators(): void {
    this.selectedCreator.set(null);
    this.filteredPhotos.set(this.photos());
    this.filteredPhotos = this.photos;
  }
}
