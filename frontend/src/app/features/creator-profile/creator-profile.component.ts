import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Creator, CreatorContentAccess, Photo, User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { PaymentService } from '../../core/services/payment.service';
import { PhotoService } from '../../core/services/photo.service';
import { SubscriptionService } from '../../core/services/subscription.service';
import { LockedContentCardComponent } from '../../shared/components/locked-content-card/locked-content-card.component';
import { PhotoInteractionsComponent } from '../../shared/components/photo-interactions/photo-interactions.component';

@Component({
  selector: 'app-creator-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, PhotoInteractionsComponent, LockedContentCardComponent],
  templateUrl: './creator-profile.component.html',
})
export class CreatorProfileComponent implements OnInit {
  creator: Creator | null = null;
  creatorPhotos: Photo[] = [];
  samplePhotos: Photo[] = [];
  user: User | null = null;
  isSubscribed = false;
  loading = false;
  subscribing = false;
  creatorId: number = 0;
  contentAccess: CreatorContentAccess | null = null;
  totalContentCount = 0;
  premiumContentCount = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private subscriptionService: SubscriptionService,
    private photoService: PhotoService,
    private paymentService: PaymentService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.creatorId = +params['id'];
      if (this.creatorId) {
        this.loadCreatorProfile();
      }
    });

    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user && this.creatorId) {
        this.checkSubscriptionStatus();
      }
    });
  }

  async loadCreatorProfile(): Promise<void> {
    try {
      this.loading = true;

      // Load creator information
      this.subscriptionService.getCreatorById(this.creatorId).subscribe({
        next: (creator) => {
          this.creator = creator;
        },
        error: (error) => {
          console.error('Error loading creator:', error);
          this.loadMockCreator();
        },
      });

      // Load creator's photos with access control
      this.photoService.getCreatorPhotos(this.creatorId).subscribe({
        next: (contentData) => {
          this.contentAccess = contentData;
          this.creatorPhotos = contentData.photos || [];
          this.samplePhotos = contentData.publicPhotos || [];
          this.totalContentCount = contentData.totalCount || 0;
          this.premiumContentCount = contentData.premiumCount || 0;

          // If user has no access, show limited preview
          if (!contentData.hasAccess) {
            this.samplePhotos = contentData.photos.slice(0, 3);
          }
        },
        error: (error) => {
          console.error('Error loading photos:', error);
          this.loadMockPhotos();
        },
      });
    } catch (error) {
      console.error('Error loading creator profile:', error);
    } finally {
      this.loading = false;
    }
  }

  private loadMockCreator(): void {
    this.creator = {
      id: this.creatorId,
      email: 'creator@example.com',
      photoCount: 45,
      subscriptionPrice: 12.99,
      isActive: true,
    };
  }

  private loadMockPhotos(): void {
    const mockPhotos = [
      {
        id: 1,
        url: 'https://via.placeholder.com/400x400/FF69B4/FFFFFF?text=Sample+1',
        description: 'Sample preview content',
        creator: {
          id: this.creatorId,
          email: 'creator@example.com',
          isCreator: true,
          isActive: true,
        },
        isPremium: false,
      },
      {
        id: 2,
        url: 'https://via.placeholder.com/400x500/87CEEB/FFFFFF?text=Sample+2',
        description: 'Preview of my work',
        creator: {
          id: this.creatorId,
          email: 'creator@example.com',
          isCreator: true,
          isActive: true,
        },
        isPremium: false,
      },
      {
        id: 3,
        url: 'https://via.placeholder.com/400x600/FFB6C1/FFFFFF?text=Sample+3',
        description: 'Free preview content',
        creator: {
          id: this.creatorId,
          email: 'creator@example.com',
          isCreator: true,
          isActive: true,
        },
        isPremium: false,
      },
    ];

    this.contentAccess = {
      hasAccess: false,
      photos: mockPhotos,
      publicPhotos: mockPhotos,
      premiumPhotos: [],
      totalCount: 15,
      premiumCount: 12,
      previewCount: 3,
    };

    this.samplePhotos = mockPhotos;
    this.totalContentCount = 15;
    this.premiumContentCount = 12;
  }

  checkSubscriptionStatus(): void {
    if (this.user && this.creatorId) {
      this.subscriptionService.checkSubscription(this.creatorId).subscribe({
        next: (isSubscribed) => {
          this.isSubscribed = isSubscribed;
        },
        error: (error) => {
          console.error('Error checking subscription:', error);
          this.isSubscribed = false;
        },
      });
    }
  }

  async subscribeToCreator(): Promise<void> {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }

    if (!this.creator) {
      return;
    }

    try {
      this.subscribing = true;

      const response = await this.paymentService
        .createCheckoutSession(this.creator.id, this.creator.subscriptionPrice)
        .toPromise();

      if (response?.sessionId) {
        await this.paymentService.redirectToCheckout(response.sessionId);
      }
    } catch (error) {
      console.error('Subscription failed:', error);
      // Handle error (show notification, etc.)
    } finally {
      this.subscribing = false;
    }
  }

  openPhotoModal(photo: Photo): void {
    // Implement photo modal/lightbox functionality
    console.log('Opening photo:', photo);
  }

  goToGallery(): void {
    this.router.navigate(['/gallery']);
  }

  goBack(): void {
    this.router.navigate(['/subscriptions']);
  }
}
