# OnlyFans-Like Platform - Technical Documentation

## 📋 System Architecture Document

### Overview

This document provides comprehensive technical documentation for the OnlyFans-like platform, covering system architecture, implementation details, security considerations, and operational procedures.

## 🏗 System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Layer                             │
├─────────────────────────────────────────────────────────────────┤
│  Web Browser (Angular 18 SPA)                                  │
│  - Responsive UI (Tailwind CSS)                                │
│  - JWT Authentication                                           │
│  - Route Guards & Interceptors                                 │
│  - Stripe Payment Integration                                   │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ HTTP/REST API
                                │
┌─────────────────────────────────────────────────────────────────┐
│                     Application Layer                           │
├─────────────────────────────────────────────────────────────────┤
│  NestJS API Server                                              │
│  - Authentication Module (JWT + Passport)                      │
│  - User Management Module                                       │
│  - Photo Management Module                                      │
│  - Subscription Module                                          │
│  - Payment Module (Stripe Integration)                         │
│  - Security Middleware (Helmet, CORS, Rate Limiting)           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ TypeORM
                                │
┌─────────────────────────────────────────────────────────────────┐
│                       Data Layer                                │
├─────────────────────────────────────────────────────────────────┤
│  PostgreSQL Database                                            │
│  - Users Table                                                  │
│  - Photos Table                                                 │
│  - Subscriptions Table                                          │
│  - Indexes & Constraints                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                │ External APIs
                                │
┌─────────────────────────────────────────────────────────────────┐
│                    External Services                            │
├─────────────────────────────────────────────────────────────────┤
│  Stripe Payment Processing                                      │
│  - Checkout Sessions                                            │
│  - Webhook Events                                               │
│  - Subscription Management                                      │
└─────────────────────────────────────────────────────────────────┘
```

## 🔧 Backend Implementation Details

### Module Architecture

#### 1. Authentication Module (`/auth`)

**Purpose**: Handles user authentication, registration, and JWT token management.

**Key Components**:

```typescript
// JWT Strategy Implementation
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService
  ) {
    const secretOrKey = configService.get<string>("JWT_SECRET")
    if (!secretOrKey) {
      throw new Error("JWT_SECRET is required")
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    })
  }

  async validate(payload: any) {
    const user = await this.usersService.findByEmail(payload.email)
    if (!user || !user.isActive) {
      return null
    }
    return {
      userId: payload.sub,
      email: payload.email,
      isCreator: user.isCreator,
    }
  }
}
```

**Security Features**:

- bcrypt password hashing with salt rounds
- JWT token expiration (configurable)
- Rate limiting on auth endpoints
- Input validation with DTOs

#### 2. User Management Module (`/users`)

**Entity Definition**:

```typescript
@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ unique: true })
  email: string

  @Column()
  password: string

  @Column({ default: false })
  isCreator: boolean

  @Column({ default: true })
  isActive: boolean
}
```

**Business Logic**:

- User profile management
- Role-based permissions
- Account activation/deactivation

#### 3. Photo Management Module (`/photos`)

**Entity Definitions**:

```typescript
// Like Entity for photo interactions
@Entity()
export class Like {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Photo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;

  @CreateDateColumn()
  createdAt: Date;

  // Unique constraint to prevent duplicate likes
  @Unique(['user', 'photo'])
}

// Comment Entity for photo interactions
@Entity()
export class Comment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column('text')
  content: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Photo, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'photo_id' })
  photo: Photo;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

**File Upload Configuration**:

```typescript
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32)
          .fill(null)
          .map(() => Math.round(Math.random() * 16).toString(16))
          .join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(new BadRequestException('Only image files are allowed'), false);
      } else {
        cb(null, true);
      }
    },
  }),
)
```

**Access Control Logic**:

```typescript
// Enhanced photo access with subscription gating
async getCreatorPhotos(creatorId: number, requesterId?: number): Promise<CreatorContentAccess> {
  const allPhotos = await this.photosRepository.find({
    where: { creator: { id: creatorId } },
    relations: ['creator', 'likes', 'comments'],
    order: { createdAt: 'DESC' },
  });

  // If no requester, return only public photos
  if (!requesterId) {
    return {
      accessiblePhotos: allPhotos.filter(photo => !photo.isPremium),
      lockedPhotos: allPhotos.filter(photo => photo.isPremium).map(photo => ({
        id: photo.id,
        thumbnailUrl: '/assets/locked-thumbnail.jpg',
        isLocked: true,
        description: 'Premium content - Subscribe to view'
      })),
      hasSubscription: false
    };
  }

  // Check if requester is creator or subscriber
  const isCreator = requesterId === creatorId;
  const hasSubscription = isCreator ||
    await this.subscriptionsService.hasActiveSubscription(requesterId, creatorId);

  if (hasSubscription) {
    return {
      accessiblePhotos: allPhotos,
      lockedPhotos: [],
      hasSubscription: true
    };
  }

  // Return mixed content for non-subscribers
  return {
    accessiblePhotos: allPhotos.filter(photo => !photo.isPremium),
    lockedPhotos: allPhotos.filter(photo => photo.isPremium).map(photo => ({
      id: photo.id,
      thumbnailUrl: '/assets/locked-thumbnail.jpg',
      isLocked: true,
      description: 'Premium content - Subscribe to view'
    })),
    hasSubscription: false
  };
}

// Like management endpoints
async toggleLike(userId: number, photoId: number): Promise<{ liked: boolean; likeCount: number }> {
  const existingLike = await this.likesRepository.findOne({
    where: { user: { id: userId }, photo: { id: photoId } }
  });

  if (existingLike) {
    await this.likesRepository.remove(existingLike);
    return { liked: false, likeCount: await this.getLikeCount(photoId) };
  } else {
    const like = this.likesRepository.create({
      user: { id: userId },
      photo: { id: photoId }
    });
    await this.likesRepository.save(like);
    return { liked: true, likeCount: await this.getLikeCount(photoId) };
  }
}

// Comment management
async addComment(userId: number, photoId: number, content: string): Promise<Comment> {
  const comment = this.commentsRepository.create({
    content,
    user: { id: userId },
    photo: { id: photoId }
  });
  return await this.commentsRepository.save(comment);
}
```

#### 4. Payment Integration Module (`/payments`)

**Stripe Integration**:

```typescript
async createCheckoutSession(userId: number, creatorId: number): Promise<string> {
  const session = await this.stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Creator Subscription',
          },
          unit_amount: 999, // $9.99
          recurring: {
            interval: 'month',
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      userId: userId.toString(),
      creatorId: creatorId.toString(),
    },
    success_url: `${this.configService.get('FRONTEND_URL')}/dashboard?success=true`,
    cancel_url: `${this.configService.get('FRONTEND_URL')}/subscriptions?cancelled=true`,
  });

  return session.id;
}
```

**Webhook Handling**:

```typescript
@Post('stripe-webhook')
async handleStripeWebhook(
  @Req() req: RawBodyRequest<Request>,
  @Res() res: Response,
) {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

  let event: Stripe.Event;

  try {
    event = this.stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.log(`Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    await this.subscriptionsService.createFromStripeSession(session);
  }

  res.json({ received: true });
}
```

### Database Design

**Entity Relationships**:

```sql
-- Users table with role management
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_creator BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Photos with creator relationship and premium flag
CREATE TABLE photos (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_premium BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_photos_creator FOREIGN KEY (creator_id) REFERENCES users(id)
);

-- Subscriptions linking subscribers to creators
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    subscriber_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP,
    stripe_subscription_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    CONSTRAINT fk_subscriptions_subscriber FOREIGN KEY (subscriber_id) REFERENCES users(id),
    CONSTRAINT fk_subscriptions_creator FOREIGN KEY (creator_id) REFERENCES users(id),
    UNIQUE(subscriber_id, creator_id)
);

-- Likes for photo interactions
CREATE TABLE likes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_likes_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_likes_photo FOREIGN KEY (photo_id) REFERENCES photos(id),
    UNIQUE(user_id, photo_id)
);

-- Comments for photo interactions
CREATE TABLE comments (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    photo_id INTEGER NOT NULL REFERENCES photos(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_comments_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT fk_comments_photo FOREIGN KEY (photo_id) REFERENCES photos(id)
);

-- Indexes for performance
CREATE INDEX idx_photos_creator_id ON photos(creator_id);
CREATE INDEX idx_photos_is_premium ON photos(is_premium);
CREATE INDEX idx_subscriptions_subscriber_id ON subscriptions(subscriber_id);
CREATE INDEX idx_subscriptions_creator_id ON subscriptions(creator_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_likes_user_id ON likes(user_id);
CREATE INDEX idx_likes_photo_id ON likes(photo_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_photo_id ON comments(photo_id);
CREATE INDEX idx_comments_created_at ON comments(created_at);
```

## 🎨 Frontend Implementation Details

### Component Architecture

#### 1. Social Interaction Components

**PhotoInteractionsComponent**:

```typescript
@Component({
  selector: "app-photo-interactions",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  template: `
    <!-- Like and Comment Interface -->
    <div class="space-y-4">
      <!-- Like Button -->
      <div class="flex items-center space-x-2">
        <button
          (click)="toggleLike()"
          [class]="getLikeButtonClass()"
          class="flex items-center space-x-1 px-3 py-1 rounded-full transition-colors"
        >
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path
              d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
            />
          </svg>
          <span>{{ likeCount }}</span>
        </button>
      </div>

      <!-- Comments Section -->
      <div class="space-y-3">
        <h4 class="font-medium text-gray-900">
          Comments ({{ comments.length }})
        </h4>

        <!-- Comment Form -->
        <form (ngSubmit)="addComment()" class="flex space-x-2">
          <input
            [(ngModel)]="newComment"
            name="comment"
            type="text"
            placeholder="Add a comment..."
            class="flex-1 border border-gray-300 rounded-lg px-3 py-2"
          />
          <button
            type="submit"
            [disabled]="!newComment.trim()"
            class="btn-primary"
          >
            Post
          </button>
        </form>

        <!-- Comments List -->
        <div class="space-y-2 max-h-60 overflow-y-auto">
          <div
            *ngFor="let comment of comments"
            class="flex justify-between items-start p-3 bg-gray-50 rounded-lg"
          >
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900">
                {{ comment.user.email }}
              </p>
              <p class="text-sm text-gray-600">{{ comment.content }}</p>
              <p class="text-xs text-gray-400 mt-1">
                {{ comment.createdAt | date : "short" }}
              </p>
            </div>
            <button
              *ngIf="canDeleteComment(comment)"
              (click)="deleteComment(comment.id)"
              class="text-red-600 hover:text-red-800 text-sm"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class PhotoInteractionsComponent {
  @Input() photoId!: number
  @Input() currentUserId?: number

  liked = false
  likeCount = 0
  comments: Comment[] = []
  newComment = ""

  constructor(private photoService: PhotoService) {}

  ngOnInit() {
    this.loadInteractions()
  }

  async toggleLike() {
    if (!this.currentUserId) return

    try {
      const result = await this.photoService
        .toggleLike(this.photoId)
        .toPromise()
      this.liked = result.liked
      this.likeCount = result.likeCount
    } catch (error) {
      console.error("Error toggling like:", error)
    }
  }

  async addComment() {
    if (!this.newComment.trim() || !this.currentUserId) return

    try {
      const comment = await this.photoService
        .addComment(this.photoId, this.newComment)
        .toPromise()
      this.comments.unshift(comment)
      this.newComment = ""
    } catch (error) {
      console.error("Error adding comment:", error)
    }
  }
}
```

**LockedContentCardComponent**:

```typescript
@Component({
  selector: "app-locked-content-card",
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="relative overflow-hidden rounded-lg bg-gradient-to-br from-purple-400 via-pink-500 to-red-500 shadow-lg"
    >
      <!-- Locked Content Overlay -->
      <div class="aspect-square flex items-center justify-center p-6">
        <div class="text-center text-white">
          <!-- Lock Icon -->
          <svg
            class="w-16 h-16 mx-auto mb-4 opacity-90"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fill-rule="evenodd"
              d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
              clip-rule="evenodd"
            />
          </svg>

          <!-- Premium Badge -->
          <div
            class="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-yellow-400 text-yellow-900 mb-3"
          >
            <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path
                d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
              />
            </svg>
            PREMIUM
          </div>

          <!-- Content Description -->
          <h3 class="text-lg font-semibold mb-2">Exclusive Content</h3>
          <p class="text-sm opacity-90 mb-4">{{ description }}</p>

          <!-- Subscribe Button -->
          <button
            (click)="onSubscribeClick()"
            class="px-6 py-2 bg-white text-purple-600 font-semibold rounded-full hover:bg-gray-100 transition-colors"
          >
            Subscribe to View
          </button>
        </div>
      </div>
    </div>
  `,
})
export class LockedContentCardComponent {
  @Input() description = "Premium content - Subscribe to view"
  @Input() creatorId!: number
  @Output() subscribeClick = new EventEmitter<number>()

  onSubscribeClick() {
    this.subscribeClick.emit(this.creatorId)
  }
}
```

#### 2. Authentication Flow

**Login Component**:

```typescript
@Component({
  selector: "app-login",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <!-- Responsive login form with Tailwind CSS -->
    <div
      class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center"
    >
      <!-- Form implementation with validation -->
    </div>
  `,
})
export class LoginComponent {
  loginForm: FormGroup

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.fb.group({
      email: ["", [Validators.required, Validators.email]],
      password: ["", [Validators.required, Validators.minLength(6)]],
    })
  }

  onSubmit(): void {
    if (this.loginForm.valid) {
      this.authService.login(this.loginForm.value).subscribe({
        next: () => this.router.navigate(["/dashboard"]),
        error: (err: any) => this.handleError(err),
      })
    }
  }
}
```

#### 2. Route Protection

**Auth Guard Implementation**:

```typescript
@Injectable({
  providedIn: "root",
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated()) {
      return true
    } else {
      this.router.navigate(["/login"])
      return false
    }
  }
}

@Injectable({
  providedIn: "root",
})
export class CreatorGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isAuthenticated() && this.authService.isCreator()) {
      return true
    } else {
      this.router.navigate(["/dashboard"])
      return false
    }
  }
}
```

#### 3. HTTP Interceptor

**Token Attachment**:

```typescript
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService)
  const token = authService.getToken()

  if (token) {
    const authReq = req.clone({
      headers: req.headers.set("Authorization", `Bearer ${token}`),
    })
    return next(authReq)
  }

  return next(req)
}
```

### Service Layer Architecture

#### 1. Authentication Service

```typescript
@Injectable({
  providedIn: "root",
})
export class AuthService {
  private apiUrl = "http://localhost:3000/auth"
  private currentUserSubject = new BehaviorSubject<User | null>(null)
  public currentUser$ = this.currentUserSubject.asObservable()

  constructor(
    private http: HttpClient,
    private jwtHelper: JwtHelperService,
    private router: Router
  ) {
    this.initializeUser()
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap((response) => {
          localStorage.setItem("access_token", response.access_token)
          this.currentUserSubject.next(response.user)
        })
      )
  }

  isAuthenticated(): boolean {
    const token = this.getToken()
    return token ? !this.jwtHelper.isTokenExpired(token) : false
  }
}
```

#### 2. Photo Management Service

```typescript
@Injectable({
  providedIn: "root",
})
export class PhotoService {
  private apiUrl = "http://localhost:3000/photos"

  constructor(private http: HttpClient) {}

  uploadPhoto(file: File, photoData: UploadPhotoRequest): Observable<Photo> {
    const formData = new FormData()
    formData.append("file", file)
    formData.append("description", photoData.description)
    formData.append("isPremium", photoData.isPremium.toString())

    return this.http.post<Photo>(`${this.apiUrl}/upload`, formData)
  }

  getPhotos(): Observable<Photo[]> {
    return this.http.get<Photo[]>(`${this.apiUrl}/list`)
  }

  // Enhanced creator content with subscription gating
  getCreatorPhotos(creatorId: number): Observable<CreatorContentAccess> {
    return this.http.get<CreatorContentAccess>(
      `${this.apiUrl}/creator/${creatorId}`
    )
  }

  // Like functionality
  toggleLike(
    photoId: number
  ): Observable<{ liked: boolean; likeCount: number }> {
    return this.http.post<{ liked: boolean; likeCount: number }>(
      `${this.apiUrl}/${photoId}/like`,
      {}
    )
  }

  getLikes(
    photoId: number
  ): Observable<{ likeCount: number; userHasLiked: boolean }> {
    return this.http.get<{ likeCount: number; userHasLiked: boolean }>(
      `${this.apiUrl}/${photoId}/likes`
    )
  }

  // Comment functionality
  getComments(photoId: number): Observable<Comment[]> {
    return this.http.get<Comment[]>(`${this.apiUrl}/${photoId}/comments`)
  }

  addComment(photoId: number, content: string): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/${photoId}/comments`, {
      content,
    })
  }

  deleteComment(photoId: number, commentId: number): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/${photoId}/comments/${commentId}`
    )
  }

  // Photo management
  deletePhoto(photoId: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${photoId}`)
  }

  updatePhoto(photoId: number, updates: Partial<Photo>): Observable<Photo> {
    return this.http.patch<Photo>(`${this.apiUrl}/${photoId}`, updates)
  }
}
```

### UI/UX Design System

**Tailwind Configuration**:

```javascript
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#fef2f2",
          500: "#ef4444",
          600: "#dc2626",
          700: "#b91c1c",
        },
        secondary: {
          50: "#f8fafc",
          500: "#64748b",
          600: "#475569",
          700: "#334155",
        },
      },
    },
  },
  plugins: [require("@tailwindcss/forms"), require("@tailwindcss/typography")],
}
```

**Custom Component Classes**:

```scss
@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition duration-200;
  }

  .btn-secondary {
    @apply bg-secondary-200 hover:bg-secondary-300 text-secondary-800 font-medium py-2 px-4 rounded-lg transition duration-200;
  }

  .input-field {
    @apply block w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500;
  }
}
```

## 🔒 Security Implementation

### Backend Security Measures

#### 1. Middleware Configuration

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  const configService = app.get(ConfigService)

  // Security middleware
  app.use(helmet())
  app.use(compression())

  // CORS configuration
  app.enableCors({
    origin: configService.get<string>("FRONTEND_URL", "http://localhost:4200"),
    credentials: true,
  })

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
    })
  )

  await app.listen(3000)
}
```

#### 2. Input Validation

```typescript
// DTO with validation decorators
export class CreateUserDto {
  @IsEmail()
  @IsNotEmpty()
  email: string

  @IsString()
  @MinLength(6)
  @MaxLength(50)
  password: string

  @IsBoolean()
  @IsOptional()
  isCreator?: boolean
}
```

#### 3. File Upload Security

```typescript
const fileFilter = (req, file, cb) => {
  // Check file type
  if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
    cb(new BadRequestException("Only image files are allowed"), false)
  } else {
    cb(null, true)
  }
}

const limits = {
  fileSize: 5 * 1024 * 1024, // 5MB limit
  files: 1, // Single file upload
}
```

### Frontend Security Measures

#### 1. XSS Protection

- Angular's built-in sanitization
- Proper data binding (avoid innerHTML)
- Content Security Policy headers

#### 2. Authentication Security

- JWT token expiration handling
- Automatic token refresh
- Secure token storage considerations

#### 3. Route Protection

- Guard-based access control
- Role-based routing
- Unauthorized access handling

## 📊 Performance Optimization

### Backend Optimizations

#### 1. Database Optimization

```sql
-- Performance indexes
CREATE INDEX CONCURRENTLY idx_photos_creator_premium ON photos(creator_id, is_premium);
CREATE INDEX CONCURRENTLY idx_subscriptions_active ON subscriptions(subscriber_id) WHERE status = 'active';
```

#### 2. Query Optimization

```typescript
// Efficient query with relations
async getPhotosWithCreator(userId: number): Promise<Photo[]> {
  return this.photosRepository
    .createQueryBuilder('photo')
    .leftJoinAndSelect('photo.creator', 'creator')
    .where('photo.isPremium = false')
    .orWhere('photo.creator.id = :userId', { userId })
    .orWhere(qb => {
      const subQuery = qb.subQuery()
        .select('subscription.creator_id')
        .from(Subscription, 'subscription')
        .where('subscription.subscriber_id = :userId')
        .andWhere('subscription.status = :status')
        .getQuery();
      return `photo.creator.id IN ${subQuery}`;
    })
    .setParameter('userId', userId)
    .setParameter('status', 'active')
    .getMany();
}
```

### Frontend Optimizations

#### 1. Lazy Loading

```typescript
const routes: Routes = [
  {
    path: "dashboard",
    loadComponent: () =>
      import("./features/dashboard/dashboard.component").then(
        (m) => m.DashboardComponent
      ),
    canActivate: [AuthGuard],
  },
]
```

#### 2. OnPush Change Detection

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  // ... component configuration
})
export class OptimizedComponent {
  // Component implementation
}
```

## 🚀 Deployment Architecture

### Production Environment Setup

#### 1. Backend Deployment

```dockerfile
# Dockerfile for NestJS backend
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### 2. Frontend Deployment

```dockerfile
# Multi-stage build for Angular
FROM node:18-alpine as build

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/* /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
```

#### 3. Database Configuration

```yaml
# docker-compose.yml for production
version: "3.8"
services:
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: onlyfans_prod
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  backend:
    build: ./backend
    environment:
      DATABASE_URL: postgresql://${DB_USER}:${DB_PASSWORD}@postgres:5432/onlyfans_prod
      JWT_SECRET: ${JWT_SECRET}
      STRIPE_SECRET_KEY: ${STRIPE_SECRET_KEY}
    depends_on:
      - postgres
    ports:
      - "3000:3000"

  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend

volumes:
  postgres_data:
```

### Monitoring and Logging

#### 1. Application Monitoring

```typescript
// Winston logger configuration
import { WinstonModule } from "nest-winston"
import * as winston from "winston"

const logger = WinstonModule.createLogger({
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({
      filename: "logs/error.log",
      level: "error",
    }),
    new winston.transports.File({
      filename: "logs/combined.log",
    }),
  ],
})
```

#### 2. Health Checks

```typescript
@Controller("health")
export class HealthController {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>
  ) {}

  @Get()
  async check(): Promise<any> {
    try {
      await this.userRepository.query("SELECT 1")
      return {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      }
    } catch (error) {
      throw new ServiceUnavailableException("Database connection failed")
    }
  }
}
```

## 📈 Scalability Considerations

### Horizontal Scaling

#### 1. Load Balancing

- Multiple backend instances behind load balancer
- Session-less design with JWT tokens
- Database connection pooling

#### 2. File Storage

- Migration from local storage to S3/CDN
- Implement image optimization and resizing
- Caching strategies for frequently accessed content

#### 3. Database Scaling

- Read replicas for query distribution
- Database sharding for large datasets
- Caching layer with Redis

### Caching Strategy

```typescript
// Redis caching implementation
@Injectable()
export class CacheService {
  constructor(
    @Inject("REDIS_CLIENT")
    private readonly redisClient: Redis
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const cached = await this.redisClient.get(key)
    return cached ? JSON.parse(cached) : null
  }

  async set<T>(key: string, value: T, ttl: number = 3600): Promise<void> {
    await this.redisClient.setex(key, ttl, JSON.stringify(value))
  }
}
```

---

This technical documentation provides comprehensive coverage of the platform's architecture, implementation details, security measures, and deployment strategies. It serves as both a reference for developers and a guide for system administrators managing the platform.
