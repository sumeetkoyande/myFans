# OnlyFans Platform - Testing Guide

## 📋 Overview

This guide provides comprehensive testing strategies and implementation details for the OnlyFans-like platform, covering unit tests, integration tests, end-to-end tests, and performance testing.

## 🧪 Testing Strategy

### Testing Pyramid

```
    /\
   /E2E\      <- End-to-End Tests (Few)
  /______\
 / INTEG  \    <- Integration Tests (Some)
/__________ \
|   UNIT    |  <- Unit Tests (Many)
|___________|
```

### Test Coverage Goals

- **Unit Tests**: 80%+ coverage
- **Integration Tests**: Critical user flows
- **E2E Tests**: Primary user journeys
- **Performance Tests**: Load and stress testing

## 🔬 Backend Testing (NestJS)

### Test Environment Setup

```bash
# Install testing dependencies
cd backend
npm install --save-dev jest @nestjs/testing supertest @types/supertest

# Test configuration is already in package.json
```

**Jest Configuration** (`jest.config.js`):

```javascript
module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  coveragePathIgnorePatterns: [
    "/node_modules/",
    "/dist/",
    "/coverage/",
    "main.ts",
    ".module.ts",
    ".interface.ts",
    ".dto.ts",
  ],
  setupFilesAfterEnv: ["<rootDir>/test/setup.ts"],
}
```

### Unit Tests

#### 1. Service Tests

**User Service Tests** (`src/users/users.service.spec.ts`):

```typescript
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { UsersService } from "./users.service"
import { User } from "./entities/user.entity"
import { CreateUserDto } from "./dto/create-user.dto"
import { ConflictException, NotFoundException } from "@nestjs/common"

describe("UsersService", () => {
  let service: UsersService
  let repository: Repository<User>

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile()

    service = module.get<UsersService>(UsersService)
    repository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("create", () => {
    it("should create a new user successfully", async () => {
      const createUserDto: CreateUserDto = {
        username: "testuser",
        email: "test@example.com",
        password: "password123",
        role: "creator",
      }

      const expectedUser = {
        id: 1,
        ...createUserDto,
        password: "hashedPassword",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }

      mockRepository.findOne.mockResolvedValue(null)
      mockRepository.create.mockReturnValue(expectedUser)
      mockRepository.save.mockResolvedValue(expectedUser)

      const result = await service.create(createUserDto)

      expect(mockRepository.findOne).toHaveBeenCalledTimes(2) // Check username and email
      expect(mockRepository.create).toHaveBeenCalledWith(createUserDto)
      expect(mockRepository.save).toHaveBeenCalledWith(expectedUser)
      expect(result).toEqual(expectedUser)
    })

    it("should throw ConflictException if username already exists", async () => {
      const createUserDto: CreateUserDto = {
        username: "existinguser",
        email: "test@example.com",
        password: "password123",
        role: "creator",
      }

      mockRepository.findOne.mockResolvedValue({
        id: 1,
        username: "existinguser",
      })

      await expect(service.create(createUserDto)).rejects.toThrow(
        ConflictException
      )
    })
  })

  describe("findOne", () => {
    it("should return a user if found", async () => {
      const userId = 1
      const expectedUser = {
        id: userId,
        username: "testuser",
        email: "test@example.com",
      }

      mockRepository.findOne.mockResolvedValue(expectedUser)

      const result = await service.findOne(userId)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(result).toEqual(expectedUser)
    })

    it("should throw NotFoundException if user not found", async () => {
      const userId = 999

      mockRepository.findOne.mockResolvedValue(null)

      await expect(service.findOne(userId)).rejects.toThrow(NotFoundException)
    })
  })

  describe("update", () => {
    it("should update user profile successfully", async () => {
      const userId = 1
      const updateDto = { bio: "Updated bio" }
      const existingUser = { id: userId, username: "testuser" }
      const updatedUser = { ...existingUser, ...updateDto }

      mockRepository.findOne.mockResolvedValue(existingUser)
      mockRepository.save.mockResolvedValue(updatedUser)

      const result = await service.update(userId, updateDto)

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: userId },
      })
      expect(mockRepository.save).toHaveBeenCalledWith(updatedUser)
      expect(result).toEqual(updatedUser)
    })
  })
})
```

#### 2. Photos Service Tests with Like/Comment Features

**Photos Service Tests** (`src/photos/photos.service.spec.ts`):

```typescript
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { PhotosService } from "./photos.service"
import { Photo } from "./entities/photo.entity"
import { Like } from "./like/like.entity"
import { Comment } from "./comment/comment.entity"
import { User } from "../users/entities/user.entity"
import { SubscriptionsService } from "../subscriptions/subscriptions.service"
import { NotFoundException } from "@nestjs/common"

describe("PhotosService", () => {
  let service: PhotosService
  let photoRepository: Repository<Photo>
  let likeRepository: Repository<Like>
  let commentRepository: Repository<Comment>
  let subscriptionsService: SubscriptionsService

  const mockPhotoRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    createQueryBuilder: jest.fn(),
  }

  const mockLikeRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
    count: jest.fn(),
  }

  const mockCommentRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    remove: jest.fn(),
  }

  const mockSubscriptionsService = {
    hasActiveSubscription: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PhotosService,
        {
          provide: getRepositoryToken(Photo),
          useValue: mockPhotoRepository,
        },
        {
          provide: getRepositoryToken(Like),
          useValue: mockLikeRepository,
        },
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: SubscriptionsService,
          useValue: mockSubscriptionsService,
        },
      ],
    }).compile()

    service = module.get<PhotosService>(PhotosService)
    photoRepository = module.get<Repository<Photo>>(getRepositoryToken(Photo))
    likeRepository = module.get<Repository<Like>>(getRepositoryToken(Like))
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment)
    )
    subscriptionsService =
      module.get<SubscriptionsService>(SubscriptionsService)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("getCreatorPhotos", () => {
    const mockPhotos = [
      { id: 1, title: "Public Photo", isPremium: false, creator: { id: 1 } },
      { id: 2, title: "Premium Photo", isPremium: true, creator: { id: 1 } },
    ]

    it("should return all photos for creator", async () => {
      const creatorId = 1
      const requesterId = 1 // Same as creator

      mockPhotoRepository.find.mockResolvedValue(mockPhotos)

      const result = await service.getCreatorPhotos(creatorId, requesterId)

      expect(result.accessiblePhotos).toHaveLength(2)
      expect(result.lockedPhotos).toHaveLength(0)
      expect(result.hasSubscription).toBeTruthy()
    })

    it("should return mixed content for subscribers", async () => {
      const creatorId = 1
      const requesterId = 2 // Different user

      mockPhotoRepository.find.mockResolvedValue(mockPhotos)
      mockSubscriptionsService.hasActiveSubscription.mockResolvedValue(true)

      const result = await service.getCreatorPhotos(creatorId, requesterId)

      expect(result.accessiblePhotos).toHaveLength(2)
      expect(result.lockedPhotos).toHaveLength(0)
      expect(result.hasSubscription).toBeTruthy()
    })

    it("should return locked content for non-subscribers", async () => {
      const creatorId = 1
      const requesterId = 2 // Different user

      mockPhotoRepository.find.mockResolvedValue(mockPhotos)
      mockSubscriptionsService.hasActiveSubscription.mockResolvedValue(false)

      const result = await service.getCreatorPhotos(creatorId, requesterId)

      expect(result.accessiblePhotos).toHaveLength(1) // Only public photo
      expect(result.lockedPhotos).toHaveLength(1) // Premium photo locked
      expect(result.hasSubscription).toBeFalsy()
      expect(result.lockedPhotos[0].isLocked).toBeTruthy()
    })

    it("should return only public photos for anonymous users", async () => {
      const creatorId = 1

      mockPhotoRepository.find.mockResolvedValue(mockPhotos)

      const result = await service.getCreatorPhotos(creatorId)

      expect(result.accessiblePhotos).toHaveLength(1) // Only public photo
      expect(result.lockedPhotos).toHaveLength(1) // Premium photo locked
      expect(result.hasSubscription).toBeFalsy()
    })
  })

  describe("toggleLike", () => {
    it("should create like when not exists", async () => {
      const userId = 1
      const photoId = 1
      const mockLike = { id: 1, user: { id: userId }, photo: { id: photoId } }

      mockLikeRepository.findOne.mockResolvedValue(null)
      mockLikeRepository.create.mockReturnValue(mockLike)
      mockLikeRepository.save.mockResolvedValue(mockLike)
      mockLikeRepository.count.mockResolvedValue(1)

      const result = await service.toggleLike(userId, photoId)

      expect(result.liked).toBeTruthy()
      expect(result.likeCount).toBe(1)
      expect(mockLikeRepository.create).toHaveBeenCalledWith({
        user: { id: userId },
        photo: { id: photoId },
      })
    })

    it("should remove like when exists", async () => {
      const userId = 1
      const photoId = 1
      const existingLike = {
        id: 1,
        user: { id: userId },
        photo: { id: photoId },
      }

      mockLikeRepository.findOne.mockResolvedValue(existingLike)
      mockLikeRepository.remove.mockResolvedValue(existingLike)
      mockLikeRepository.count.mockResolvedValue(0)

      const result = await service.toggleLike(userId, photoId)

      expect(result.liked).toBeFalsy()
      expect(result.likeCount).toBe(0)
      expect(mockLikeRepository.remove).toHaveBeenCalledWith(existingLike)
    })
  })

  describe("addComment", () => {
    it("should create new comment successfully", async () => {
      const userId = 1
      const photoId = 1
      const content = "Great photo!"
      const mockComment = {
        id: 1,
        content,
        user: { id: userId },
        photo: { id: photoId },
        createdAt: new Date(),
      }

      mockCommentRepository.create.mockReturnValue(mockComment)
      mockCommentRepository.save.mockResolvedValue(mockComment)

      const result = await service.addComment(userId, photoId, content)

      expect(result).toEqual(mockComment)
      expect(mockCommentRepository.create).toHaveBeenCalledWith({
        content,
        user: { id: userId },
        photo: { id: photoId },
      })
    })
  })

  describe("deleteComment", () => {
    it("should delete comment successfully when user owns it", async () => {
      const userId = 1
      const commentId = 1
      const photoId = 1
      const mockComment = {
        id: commentId,
        user: { id: userId },
        photo: { id: photoId },
      }

      mockCommentRepository.findOne.mockResolvedValue(mockComment)
      mockCommentRepository.remove.mockResolvedValue(mockComment)

      await service.deleteComment(userId, photoId, commentId)

      expect(mockCommentRepository.remove).toHaveBeenCalledWith(mockComment)
    })

    it("should throw NotFoundException when comment not found", async () => {
      const userId = 1
      const commentId = 999
      const photoId = 1

      mockCommentRepository.findOne.mockResolvedValue(null)

      await expect(
        service.deleteComment(userId, photoId, commentId)
      ).rejects.toThrow(NotFoundException)
    })

    it("should throw error when user does not own comment", async () => {
      const userId = 1
      const commentId = 1
      const photoId = 1
      const mockComment = {
        id: commentId,
        user: { id: 2 }, // Different user
        photo: { id: photoId },
      }

      mockCommentRepository.findOne.mockResolvedValue(mockComment)

      await expect(
        service.deleteComment(userId, photoId, commentId)
      ).rejects.toThrow("You can only delete your own comments")
    })
  })

  describe("getLikeCount", () => {
    it("should return correct like count", async () => {
      const photoId = 1
      mockLikeRepository.count.mockResolvedValue(5)

      const result = await service.getLikeCount(photoId)

      expect(result).toBe(5)
      expect(mockLikeRepository.count).toHaveBeenCalledWith({
        where: { photo: { id: photoId } },
      })
    })
  })

  describe("getComments", () => {
    it("should return photo comments with user info", async () => {
      const photoId = 1
      const mockComments = [
        {
          id: 1,
          content: "Great!",
          user: { id: 1, email: "user1@example.com" },
          createdAt: new Date(),
        },
        {
          id: 2,
          content: "Amazing!",
          user: { id: 2, email: "user2@example.com" },
          createdAt: new Date(),
        },
      ]

      mockCommentRepository.find.mockResolvedValue(mockComments)

      const result = await service.getComments(photoId)

      expect(result).toEqual(mockComments)
      expect(mockCommentRepository.find).toHaveBeenCalledWith({
        where: { photo: { id: photoId } },
        relations: ["user"],
        order: { createdAt: "DESC" },
      })
    })
  })
})
```

#### 3. Controller Tests

**Auth Controller Tests** (`src/auth/auth.controller.spec.ts`):

```typescript
import { Test, TestingModule } from "@nestjs/testing"
import { AuthController } from "./auth.controller"
import { AuthService } from "./auth.service"
import { LoginDto } from "./dto/login.dto"
import { CreateUserDto } from "../users/dto/create-user.dto"
import { UnauthorizedException } from "@nestjs/common"

describe("AuthController", () => {
  let controller: AuthController
  let authService: AuthService

  const mockAuthService = {
    login: jest.fn(),
    register: jest.fn(),
    validateUser: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile()

    controller = module.get<AuthController>(AuthController)
    authService = module.get<AuthService>(AuthService)
  })

  describe("login", () => {
    it("should return access token on successful login", async () => {
      const loginDto: LoginDto = {
        username: "testuser",
        password: "password123",
      }

      const expectedResult = {
        access_token: "jwt.token.here",
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "creator",
        },
      }

      mockAuthService.login.mockResolvedValue(expectedResult)

      const result = await controller.login(loginDto)

      expect(authService.login).toHaveBeenCalledWith(loginDto)
      expect(result).toEqual(expectedResult)
    })

    it("should throw UnauthorizedException for invalid credentials", async () => {
      const loginDto: LoginDto = {
        username: "testuser",
        password: "wrongpassword",
      }

      mockAuthService.login.mockRejectedValue(new UnauthorizedException())

      await expect(controller.login(loginDto)).rejects.toThrow(
        UnauthorizedException
      )
    })
  })

  describe("register", () => {
    it("should create new user successfully", async () => {
      const createUserDto: CreateUserDto = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        role: "creator",
      }

      const expectedResult = {
        access_token: "jwt.token.here",
        user: {
          id: 2,
          ...createUserDto,
          password: undefined,
        },
      }

      mockAuthService.register.mockResolvedValue(expectedResult)

      const result = await controller.register(createUserDto)

      expect(authService.register).toHaveBeenCalledWith(createUserDto)
      expect(result).toEqual(expectedResult)
    })
  })
})
```

#### 3. Guard Tests

**Auth Guard Tests** (`src/auth/guards/jwt-auth.guard.spec.ts`):

```typescript
import { ExecutionContext, UnauthorizedException } from "@nestjs/common"
import { JwtAuthGuard } from "./jwt-auth.guard"
import { JwtService } from "@nestjs/jwt"
import { Test, TestingModule } from "@nestjs/testing"

describe("JwtAuthGuard", () => {
  let guard: JwtAuthGuard
  let jwtService: JwtService

  const mockJwtService = {
    verify: jest.fn(),
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile()

    guard = module.get<JwtAuthGuard>(JwtAuthGuard)
    jwtService = module.get<JwtService>(JwtService)
  })

  const mockExecutionContext = (headers: any = {}) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({
          headers,
        }),
      }),
    } as ExecutionContext)

  describe("canActivate", () => {
    it("should return true for valid JWT token", async () => {
      const validToken = "Bearer valid.jwt.token"
      const decodedToken = { sub: 1, username: "testuser" }

      mockJwtService.verify.mockReturnValue(decodedToken)

      const context = mockExecutionContext({
        authorization: validToken,
      })

      const result = await guard.canActivate(context)

      expect(result).toBe(true)
      expect(jwtService.verify).toHaveBeenCalledWith("valid.jwt.token")
    })

    it("should throw UnauthorizedException for missing token", async () => {
      const context = mockExecutionContext({})

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it("should throw UnauthorizedException for invalid token format", async () => {
      const context = mockExecutionContext({
        authorization: "InvalidTokenFormat",
      })

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
    })

    it("should throw UnauthorizedException for expired token", async () => {
      const expiredToken = "Bearer expired.jwt.token"

      mockJwtService.verify.mockImplementation(() => {
        throw new Error("Token expired")
      })

      const context = mockExecutionContext({
        authorization: expiredToken,
      })

      await expect(guard.canActivate(context)).rejects.toThrow(
        UnauthorizedException
      )
    })
  })
})
```

### Integration Tests

#### 1. API Integration Tests

**Auth Integration Tests** (`src/auth/auth.integration.spec.ts`):

```typescript
import { Test, TestingModule } from "@nestjs/testing"
import { INestApplication } from "@nestjs/common"
import * as request from "supertest"
import { AppModule } from "../app.module"
import { getRepositoryToken } from "@nestjs/typeorm"
import { User } from "../users/entities/user.entity"
import { Repository } from "typeorm"

describe("AuthController (Integration)", () => {
  let app: INestApplication
  let userRepository: Repository<User>

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = moduleFixture.createNestApplication()
    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User)
    )

    await app.init()
  })

  beforeEach(async () => {
    // Clean database before each test
    await userRepository.clear()
  })

  afterAll(async () => {
    await app.close()
  })

  describe("POST /auth/register", () => {
    it("should register a new user successfully", async () => {
      const createUserDto = {
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        role: "creator",
      }

      const response = await request(app.getHttpServer())
        .post("/auth/register")
        .send(createUserDto)
        .expect(201)

      expect(response.body).toHaveProperty("access_token")
      expect(response.body.user).toMatchObject({
        username: createUserDto.username,
        email: createUserDto.email,
        role: createUserDto.role,
      })
      expect(response.body.user).not.toHaveProperty("password")
    })

    it("should return 400 for invalid email format", async () => {
      const invalidUserDto = {
        username: "testuser",
        email: "invalid-email",
        password: "Password123!",
        role: "creator",
      }

      await request(app.getHttpServer())
        .post("/auth/register")
        .send(invalidUserDto)
        .expect(400)
    })

    it("should return 409 for duplicate username", async () => {
      const createUserDto = {
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        role: "creator",
      }

      // First registration
      await request(app.getHttpServer())
        .post("/auth/register")
        .send(createUserDto)
        .expect(201)

      // Second registration with same username
      const duplicateUserDto = {
        ...createUserDto,
        email: "different@example.com",
      }

      await request(app.getHttpServer())
        .post("/auth/register")
        .send(duplicateUserDto)
        .expect(409)
    })
  })

  describe("POST /auth/login", () => {
    beforeEach(async () => {
      // Create a test user
      await request(app.getHttpServer()).post("/auth/register").send({
        username: "testuser",
        email: "test@example.com",
        password: "Password123!",
        role: "creator",
      })
    })

    it("should login with valid credentials", async () => {
      const loginDto = {
        username: "testuser",
        password: "Password123!",
      }

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(200)

      expect(response.body).toHaveProperty("access_token")
      expect(response.body.user).toMatchObject({
        username: "testuser",
        email: "test@example.com",
        role: "creator",
      })
    })

    it("should return 401 for invalid credentials", async () => {
      const loginDto = {
        username: "testuser",
        password: "wrongpassword",
      }

      await request(app.getHttpServer())
        .post("/auth/login")
        .send(loginDto)
        .expect(401)
    })
  })
})
```

#### 2. Database Integration Tests

**Photo Service Integration Tests** (`src/photos/photos.integration.spec.ts`):

```typescript
import { Test, TestingModule } from "@nestjs/testing"
import { getRepositoryToken } from "@nestjs/typeorm"
import { Repository } from "typeorm"
import { PhotosService } from "./photos.service"
import { Photo } from "./entities/photo.entity"
import { User } from "../users/entities/user.entity"
import { NotFoundException } from "@nestjs/common"

describe("PhotosService (Integration)", () => {
  let service: PhotosService
  let photoRepository: Repository<Photo>
  let userRepository: Repository<User>
  let testUser: User

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        // Configure test database connection here
      ],
      providers: [PhotosService],
    }).compile()

    service = module.get<PhotosService>(PhotosService)
    photoRepository = module.get<Repository<Photo>>(getRepositoryToken(Photo))
    userRepository = module.get<Repository<User>>(getRepositoryToken(User))
  })

  beforeEach(async () => {
    // Clean and setup test data
    await photoRepository.clear()
    await userRepository.clear()

    testUser = await userRepository.save({
      username: "testcreator",
      email: "creator@example.com",
      password: "hashedpassword",
      role: "creator",
    })
  })

  describe("create", () => {
    it("should create a photo with database transaction", async () => {
      const createPhotoDto = {
        title: "Test Photo",
        description: "A test photo",
        filename: "test.jpg",
        isPremium: true,
        price: 10.0,
      }

      const result = await service.create(createPhotoDto, testUser.id)

      expect(result).toMatchObject({
        title: createPhotoDto.title,
        description: createPhotoDto.description,
        isPremium: createPhotoDto.isPremium,
        price: createPhotoDto.price,
        creatorId: testUser.id,
      })

      // Verify in database
      const savedPhoto = await photoRepository.findOne({
        where: { id: result.id },
      })
      expect(savedPhoto).toBeTruthy()
    })
  })

  describe("findCreatorPhotos", () => {
    beforeEach(async () => {
      // Create test photos
      await photoRepository.save([
        {
          title: "Free Photo",
          filename: "free.jpg",
          isPremium: false,
          creator: testUser,
        },
        {
          title: "Premium Photo",
          filename: "premium.jpg",
          isPremium: true,
          price: 15.0,
          creator: testUser,
        },
      ])
    })

    it("should return creator photos with proper filtering", async () => {
      const photos = await service.findCreatorPhotos(testUser.id, false)

      expect(photos).toHaveLength(1)
      expect(photos[0].title).toBe("Free Photo")
    })

    it("should return premium photos for authenticated requests", async () => {
      const photos = await service.findCreatorPhotos(testUser.id, true)

      expect(photos).toHaveLength(2)
      expect(photos.some((p) => p.isPremium)).toBe(true)
    })
  })
})
```

## 🌐 Frontend Testing (Angular)

### Test Environment Setup

```bash
cd frontend

# Testing dependencies are already included in Angular CLI
# Additional testing utilities
npm install --save-dev @angular/cdk/testing @angular/material/testing
```

**Karma Configuration** (`karma.conf.js`):

```javascript
module.exports = function (config) {
  config.set({
    basePath: "",
    frameworks: ["jasmine", "@angular-devkit/build-angular"],
    plugins: [
      require("karma-jasmine"),
      require("karma-chrome-headless"),
      require("karma-jasmine-html-reporter"),
      require("karma-coverage"),
      require("@angular-devkit/build-angular/plugins/karma"),
    ],
    client: {
      jasmine: {
        // you can add configuration options for Jasmine here
        // the possible options are listed at https://jasmine.github.io/api/edge/Configuration.html
        random: true,
        seed: "4321",
      },
      clearContext: false, // leave Jasmine Spec Runner output visible in browser
    },
    jasmineHtmlReporter: {
      suppressAll: true, // removes the duplicated traces
    },
    coverageReporter: {
      dir: require("path").join(__dirname, "./coverage/onlyfans-frontend"),
      subdir: ".",
      reporters: [{ type: "html" }, { type: "text-summary" }, { type: "lcov" }],
      check: {
        global: {
          statements: 80,
          branches: 70,
          functions: 80,
          lines: 80,
        },
      },
    },
    reporters: ["progress", "kjhtml", "coverage"],
    port: 9876,
    colors: true,
    logLevel: config.LOG_INFO,
    autoWatch: true,
    browsers: ["Chrome"],
    singleRun: false,
    restartOnFileChange: true,
  })
}
```

### Unit Tests

#### 1. Component Tests

**Login Component Tests** (`src/app/features/auth/login/login.component.spec.ts`):

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { ReactiveFormsModule } from "@angular/forms"
import { Router } from "@angular/router"
import { of, throwError } from "rxjs"
import { LoginComponent } from "./login.component"
import { AuthService } from "../../../core/services/auth.service"

describe("LoginComponent", () => {
  let component: LoginComponent
  let fixture: ComponentFixture<LoginComponent>
  let authService: jasmine.SpyObj<AuthService>
  let router: jasmine.SpyObj<Router>

  beforeEach(async () => {
    const authServiceSpy = jasmine.createSpyObj("AuthService", ["login"])
    const routerSpy = jasmine.createSpyObj("Router", ["navigate"])

    await TestBed.configureTestingModule({
      imports: [LoginComponent, ReactiveFormsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(LoginComponent)
    component = fixture.componentInstance
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should initialize form with empty values", () => {
    expect(component.loginForm.get("username")?.value).toBe("")
    expect(component.loginForm.get("password")?.value).toBe("")
  })

  it("should validate required fields", () => {
    const usernameControl = component.loginForm.get("username")
    const passwordControl = component.loginForm.get("password")

    expect(usernameControl?.hasError("required")).toBeTruthy()
    expect(passwordControl?.hasError("required")).toBeTruthy()
    expect(component.loginForm.invalid).toBeTruthy()
  })

  it("should call authService.login on valid form submission", () => {
    const loginResponse = {
      access_token: "fake-jwt-token",
      user: { id: 1, username: "testuser", role: "creator" },
    }

    authService.login.and.returnValue(of(loginResponse))

    component.loginForm.patchValue({
      username: "testuser",
      password: "password123",
    })

    component.onSubmit()

    expect(authService.login).toHaveBeenCalledWith({
      username: "testuser",
      password: "password123",
    })
    expect(router.navigate).toHaveBeenCalledWith(["/dashboard"])
  })

  it("should handle login error", () => {
    const errorResponse = { error: { message: "Invalid credentials" } }
    authService.login.and.returnValue(throwError(() => errorResponse))

    component.loginForm.patchValue({
      username: "testuser",
      password: "wrongpassword",
    })

    component.onSubmit()

    expect(component.errorMessage).toBe("Invalid credentials")
    expect(component.isLoading).toBeFalsy()
  })

  it("should show loading state during login", () => {
    authService.login.and.returnValue(
      of({
        access_token: "token",
        user: { id: 1, username: "test", role: "creator" },
      })
    )

    component.loginForm.patchValue({
      username: "testuser",
      password: "password123",
    })

    // Start login
    component.onSubmit()
    expect(component.isLoading).toBeTruthy()
  })
})
```

#### 2. PhotoInteractions Component Tests

**PhotoInteractions Component Tests** (`src/app/shared/components/photo-interactions/photo-interactions.component.spec.ts`):

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { ReactiveFormsModule, FormsModule } from "@angular/forms"
import { CommonModule } from "@angular/common"
import { of, throwError } from "rxjs"
import { PhotoInteractionsComponent } from "./photo-interactions.component"
import { PhotoService } from "../../../core/services/photo.service"
import { AuthService } from "../../../core/services/auth.service"

describe("PhotoInteractionsComponent", () => {
  let component: PhotoInteractionsComponent
  let fixture: ComponentFixture<PhotoInteractionsComponent>
  let photoService: jasmine.SpyObj<PhotoService>
  let authService: jasmine.SpyObj<AuthService>

  const mockComments = [
    {
      id: 1,
      content: "Great photo!",
      user: { id: 1, email: "user1@example.com" },
      createdAt: new Date(),
    },
    {
      id: 2,
      content: "Amazing work!",
      user: { id: 2, email: "user2@example.com" },
      createdAt: new Date(),
    },
  ]

  beforeEach(async () => {
    const photoServiceSpy = jasmine.createSpyObj("PhotoService", [
      "getLikes",
      "toggleLike",
      "getComments",
      "addComment",
      "deleteComment",
    ])
    const authServiceSpy = jasmine.createSpyObj("AuthService", [
      "getCurrentUser",
    ])

    await TestBed.configureTestingModule({
      imports: [
        PhotoInteractionsComponent,
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [
        { provide: PhotoService, useValue: photoServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents()

    fixture = TestBed.createComponent(PhotoInteractionsComponent)
    component = fixture.componentInstance
    photoService = TestBed.inject(PhotoService) as jasmine.SpyObj<PhotoService>
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>

    // Set required inputs
    component.photoId = 1
    component.currentUserId = 1

    // Mock service responses
    photoService.getLikes.and.returnValue(
      of({ likeCount: 5, userHasLiked: false })
    )
    photoService.getComments.and.returnValue(of(mockComments))
    authService.getCurrentUser.and.returnValue({
      id: 1,
      email: "test@example.com",
    } as any)
  })

  it("should create", () => {
    expect(component).toBeTruthy()
  })

  it("should load initial data on init", () => {
    component.ngOnInit()

    expect(photoService.getLikes).toHaveBeenCalledWith(1)
    expect(photoService.getComments).toHaveBeenCalledWith(1)
    expect(component.likeCount).toBe(5)
    expect(component.liked).toBeFalsy()
    expect(component.comments).toEqual(mockComments)
  })

  describe("toggleLike", () => {
    it("should toggle like successfully", async () => {
      const toggleResponse = { liked: true, likeCount: 6 }
      photoService.toggleLike.and.returnValue(of(toggleResponse))

      await component.toggleLike()

      expect(photoService.toggleLike).toHaveBeenCalledWith(1)
      expect(component.liked).toBeTruthy()
      expect(component.likeCount).toBe(6)
    })

    it("should handle like toggle error", async () => {
      photoService.toggleLike.and.returnValue(
        throwError(() => new Error("Like failed"))
      )
      spyOn(console, "error")

      await component.toggleLike()

      expect(console.error).toHaveBeenCalledWith(
        "Error toggling like:",
        jasmine.any(Error)
      )
    })

    it("should not toggle like if user not authenticated", async () => {
      component.currentUserId = undefined

      await component.toggleLike()

      expect(photoService.toggleLike).not.toHaveBeenCalled()
    })
  })

  describe("addComment", () => {
    beforeEach(() => {
      component.comments = [...mockComments]
      component.newComment = "New test comment"
    })

    it("should add comment successfully", async () => {
      const newComment = {
        id: 3,
        content: "New test comment",
        user: { id: 1, email: "test@example.com" },
        createdAt: new Date(),
      }
      photoService.addComment.and.returnValue(of(newComment))

      await component.addComment()

      expect(photoService.addComment).toHaveBeenCalledWith(
        1,
        "New test comment"
      )
      expect(component.comments).toContain(newComment)
      expect(component.newComment).toBe("")
    })

    it("should not add empty comment", async () => {
      component.newComment = "   "

      await component.addComment()

      expect(photoService.addComment).not.toHaveBeenCalled()
    })

    it("should handle comment add error", async () => {
      photoService.addComment.and.returnValue(
        throwError(() => new Error("Comment failed"))
      )
      spyOn(console, "error")

      await component.addComment()

      expect(console.error).toHaveBeenCalledWith(
        "Error adding comment:",
        jasmine.any(Error)
      )
    })
  })

  describe("deleteComment", () => {
    beforeEach(() => {
      component.comments = [...mockComments]
    })

    it("should delete comment successfully", async () => {
      photoService.deleteComment.and.returnValue(of(void 0))

      await component.deleteComment(1)

      expect(photoService.deleteComment).toHaveBeenCalledWith(1, 1)
      expect(component.comments.length).toBe(1)
      expect(component.comments.find((c) => c.id === 1)).toBeUndefined()
    })

    it("should handle delete comment error", async () => {
      photoService.deleteComment.and.returnValue(
        throwError(() => new Error("Delete failed"))
      )
      spyOn(console, "error")

      await component.deleteComment(1)

      expect(console.error).toHaveBeenCalledWith(
        "Error deleting comment:",
        jasmine.any(Error)
      )
      expect(component.comments.length).toBe(2) // Should remain unchanged
    })
  })

  describe("canDeleteComment", () => {
    it("should return true if user owns the comment", () => {
      const comment = { id: 1, user: { id: 1 } } as any
      component.currentUserId = 1

      expect(component.canDeleteComment(comment)).toBeTruthy()
    })

    it("should return false if user does not own the comment", () => {
      const comment = { id: 1, user: { id: 2 } } as any
      component.currentUserId = 1

      expect(component.canDeleteComment(comment)).toBeFalsy()
    })

    it("should return false if no current user", () => {
      const comment = { id: 1, user: { id: 1 } } as any
      component.currentUserId = undefined

      expect(component.canDeleteComment(comment)).toBeFalsy()
    })
  })

  describe("getLikeButtonClass", () => {
    it("should return liked class when user has liked", () => {
      component.liked = true

      const classes = component.getLikeButtonClass()

      expect(classes).toContain("text-red-600")
      expect(classes).toContain("bg-red-50")
    })

    it("should return default class when user has not liked", () => {
      component.liked = false

      const classes = component.getLikeButtonClass()

      expect(classes).toContain("text-gray-600")
      expect(classes).toContain("bg-gray-50")
    })
  })
})
```

#### 3. Service Tests

**Auth Service Tests** (`src/app/core/services/auth.service.spec.ts`):

````typescript
import { TestBed } from "@angular/core/testing"
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing"
import { AuthService } from "./auth.service"
import { LoginDto, RegisterDto, AuthResponse } from "../models"

describe("AuthService", () => {
  let service: AuthService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService],
    })

    service = TestBed.inject(AuthService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
    localStorage.clear()
  })

  describe("login", () => {
    it("should authenticate user and store token", () => {
      const loginDto: LoginDto = {
        username: "testuser",
        password: "password123",
      }

      const mockResponse: AuthResponse = {
        access_token: "fake-jwt-token",
        user: {
          id: 1,
          username: "testuser",
          email: "test@example.com",
          role: "creator",
        },
      }

      service.login(loginDto).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(localStorage.getItem("token")).toBe("fake-jwt-token")
        expect(service.getCurrentUser()).toEqual(mockResponse.user)
      })

      const req = httpMock.expectOne("http://localhost:3000/auth/login")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual(loginDto)

      req.flush(mockResponse)
    })

    it("should handle login error", () => {
      const loginDto: LoginDto = {
        username: "testuser",
        password: "wrongpassword",
      }

      service.login(loginDto).subscribe({
        error: (error) => {
          expect(error.status).toBe(401)
        },
      })

      const req = httpMock.expectOne("http://localhost:3000/auth/login")
      req.flush(
        { message: "Invalid credentials" },
        { status: 401, statusText: "Unauthorized" }
      )
    })
  })

  describe("register", () => {
    it("should register new user successfully", () => {
      const registerDto: RegisterDto = {
        username: "newuser",
        email: "new@example.com",
        password: "password123",
        role: "creator",
      }

      const mockResponse: AuthResponse = {
        access_token: "fake-jwt-token",
        user: {
          id: 2,
          username: "newuser",
          email: "new@example.com",
          role: "creator",
        },
      }

      service.register(registerDto).subscribe((response) => {
        expect(response).toEqual(mockResponse)
        expect(localStorage.getItem("token")).toBe("fake-jwt-token")
      })

      const req = httpMock.expectOne("http://localhost:3000/auth/register")
      expect(req.request.method).toBe("POST")
      expect(req.request.body).toEqual(registerDto)

      req.flush(mockResponse)
    })
  })

  describe("logout", () => {
    it("should clear token and user data", () => {
      // Set initial state
      localStorage.setItem("token", "fake-token")
      service["currentUserSubject"].next({
        id: 1,
        username: "testuser",
        email: "test@example.com",
        role: "creator",
      })

      service.logout()

      expect(localStorage.getItem("token")).toBeNull()
      expect(service.getCurrentUser()).toBeNull()
    })
  })

  describe("isAuthenticated", () => {
    it("should return true when valid token exists", () => {
      localStorage.setItem("token", "valid-token")
      expect(service.isAuthenticated()).toBeTruthy()
    })

    it("should return false when no token exists", () => {
      expect(service.isAuthenticated()).toBeFalsy()
    })
  })
})

**Photo Service Tests** (`src/app/core/services/photo.service.spec.ts`):

```typescript
import { TestBed } from '@angular/core/testing'
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
import { PhotoService } from './photo.service'
import { Photo, Comment, CreatorContentAccess } from '../models'

describe('PhotoService', () => {
  let service: PhotoService
  let httpMock: HttpTestingController

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PhotoService]
    })

    service = TestBed.inject(PhotoService)
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  describe('getCreatorPhotos', () => {
    it('should fetch creator photos with subscription access', () => {
      const mockResponse: CreatorContentAccess = {
        accessiblePhotos: [
          { id: 1, title: 'Public Photo', isPremium: false } as Photo,
          { id: 2, title: 'Premium Photo', isPremium: true } as Photo
        ],
        lockedPhotos: [],
        hasSubscription: true
      }

      service.getCreatorPhotos(1).subscribe(response => {
        expect(response).toEqual(mockResponse)
        expect(response.accessiblePhotos.length).toBe(2)
        expect(response.hasSubscription).toBeTruthy()
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/creator/1')
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })

    it('should return locked content for non-subscribers', () => {
      const mockResponse: CreatorContentAccess = {
        accessiblePhotos: [
          { id: 1, title: 'Public Photo', isPremium: false } as Photo
        ],
        lockedPhotos: [
          {
            id: 2,
            thumbnailUrl: '/assets/locked-thumbnail.jpg',
            isLocked: true,
            description: 'Premium content - Subscribe to view'
          }
        ],
        hasSubscription: false
      }

      service.getCreatorPhotos(1).subscribe(response => {
        expect(response.accessiblePhotos.length).toBe(1)
        expect(response.lockedPhotos.length).toBe(1)
        expect(response.hasSubscription).toBeFalsy()
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/creator/1')
      req.flush(mockResponse)
    })
  })

  describe('toggleLike', () => {
    it('should toggle like successfully', () => {
      const mockResponse = { liked: true, likeCount: 5 }

      service.toggleLike(1).subscribe(response => {
        expect(response).toEqual(mockResponse)
        expect(response.liked).toBeTruthy()
        expect(response.likeCount).toBe(5)
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/1/like')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({})
      req.flush(mockResponse)
    })
  })

  describe('getLikes', () => {
    it('should fetch like information', () => {
      const mockResponse = { likeCount: 10, userHasLiked: true }

      service.getLikes(1).subscribe(response => {
        expect(response).toEqual(mockResponse)
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/1/likes')
      expect(req.request.method).toBe('GET')
      req.flush(mockResponse)
    })
  })

  describe('getComments', () => {
    it('should fetch photo comments', () => {
      const mockComments: Comment[] = [
        {
          id: 1,
          content: 'Great photo!',
          user: { id: 1, email: 'user1@example.com' },
          createdAt: new Date()
        } as Comment,
        {
          id: 2,
          content: 'Amazing work!',
          user: { id: 2, email: 'user2@example.com' },
          createdAt: new Date()
        } as Comment
      ]

      service.getComments(1).subscribe(comments => {
        expect(comments).toEqual(mockComments)
        expect(comments.length).toBe(2)
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/1/comments')
      expect(req.request.method).toBe('GET')
      req.flush(mockComments)
    })
  })

  describe('addComment', () => {
    it('should add new comment', () => {
      const commentContent = 'New comment'
      const mockComment: Comment = {
        id: 3,
        content: commentContent,
        user: { id: 1, email: 'test@example.com' },
        createdAt: new Date()
      } as Comment

      service.addComment(1, commentContent).subscribe(comment => {
        expect(comment).toEqual(mockComment)
        expect(comment.content).toBe(commentContent)
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/1/comments')
      expect(req.request.method).toBe('POST')
      expect(req.request.body).toEqual({ content: commentContent })
      req.flush(mockComment)
    })
  })

  describe('deleteComment', () => {
    it('should delete comment successfully', () => {
      service.deleteComment(1, 2).subscribe()

      const req = httpMock.expectOne('http://localhost:3000/photos/1/comments/2')
      expect(req.request.method).toBe('DELETE')
      req.flush(null)
    })
  })

  describe('uploadPhoto', () => {
    it('should upload photo with form data', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' })
      const photoData = {
        description: 'Test photo',
        isPremium: true
      }
      const mockPhoto: Photo = {
        id: 1,
        url: '/uploads/test.jpg',
        description: 'Test photo',
        isPremium: true
      } as Photo

      service.uploadPhoto(file, photoData).subscribe(photo => {
        expect(photo).toEqual(mockPhoto)
      })

      const req = httpMock.expectOne('http://localhost:3000/photos/upload')
      expect(req.request.method).toBe('POST')
      expect(req.request.body instanceof FormData).toBeTruthy()
      req.flush(mockPhoto)
    })
  })
})
````

#### 3. Guard Tests

**Auth Guard Tests** (`src/app/core/guards/auth.guard.spec.ts`):

```typescript
import { TestBed } from "@angular/core/testing"
import { Router } from "@angular/router"
import { AuthGuard } from "./auth.guard"
import { AuthService } from "../services/auth.service"

describe("AuthGuard", () => {
  let guard: AuthGuard
  let authService: jasmine.SpyObj<AuthService>
  let router: jasmine.SpyObj<Router>

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj("AuthService", [
      "isAuthenticated",
    ])
    const routerSpy = jasmine.createSpyObj("Router", ["navigate"])

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    })

    guard = TestBed.inject(AuthGuard)
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>
  })

  it("should allow access when user is authenticated", () => {
    authService.isAuthenticated.and.returnValue(true)

    const result = guard.canActivate()

    expect(result).toBeTruthy()
    expect(router.navigate).not.toHaveBeenCalled()
  })

  it("should redirect to login when user is not authenticated", () => {
    authService.isAuthenticated.and.returnValue(false)

    const result = guard.canActivate()

    expect(result).toBeFalsy()
    expect(router.navigate).toHaveBeenCalledWith(["/auth/login"])
  })
})
```

### Integration Tests

#### 1. Component Integration Tests

**Dashboard Component Integration** (`src/app/features/dashboard/dashboard.component.integration.spec.ts`):

```typescript
import { ComponentFixture, TestBed } from "@angular/core/testing"
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing"
import { DashboardComponent } from "./dashboard.component"
import { AuthService } from "../../core/services/auth.service"
import { PhotoService } from "../../core/services/photo.service"
import { of } from "rxjs"

describe("DashboardComponent (Integration)", () => {
  let component: DashboardComponent
  let fixture: ComponentFixture<DashboardComponent>
  let httpMock: HttpTestingController

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent, HttpClientTestingModule],
      providers: [AuthService, PhotoService],
    }).compileComponents()

    fixture = TestBed.createComponent(DashboardComponent)
    component = fixture.componentInstance
    httpMock = TestBed.inject(HttpTestingController)
  })

  afterEach(() => {
    httpMock.verify()
  })

  it("should load user photos on init", () => {
    const mockPhotos = [
      { id: 1, title: "Photo 1", isPremium: false },
      { id: 2, title: "Photo 2", isPremium: true },
    ]

    const mockUser = {
      id: 1,
      username: "creator",
      role: "creator",
    }

    // Set up authenticated user
    localStorage.setItem("token", "fake-token")
    localStorage.setItem("user", JSON.stringify(mockUser))

    fixture.detectChanges() // Triggers ngOnInit

    // Expect API calls
    const userReq = httpMock.expectOne("http://localhost:3000/users/profile")
    userReq.flush(mockUser)

    const photosReq = httpMock.expectOne(
      "http://localhost:3000/photos/my-photos"
    )
    photosReq.flush(mockPhotos)

    expect(component.photos).toEqual(mockPhotos)
  })
})
```

## 🔄 End-to-End Testing

### Cypress Setup

```bash
# Install Cypress
npm install --save-dev cypress

# Initialize Cypress
npx cypress open
```

**Cypress Configuration** (`cypress.config.ts`):

```typescript
import { defineConfig } from "cypress"

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:4200",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    pageLoadTimeout: 60000,
    env: {
      apiUrl: "http://localhost:3000",
    },
  },
  component: {
    devServer: {
      framework: "angular",
      bundler: "webpack",
    },
    specPattern: "**/*.component.cy.ts",
  },
})
```

### E2E Test Scenarios

#### 1. User Authentication Flow

**Authentication E2E Tests** (`cypress/e2e/auth.cy.ts`):

```typescript
describe("User Authentication", () => {
  beforeEach(() => {
    cy.visit("/")
  })

  describe("Registration", () => {
    it("should register a new creator successfully", () => {
      cy.get('[data-cy="register-link"]').click()

      cy.get('[data-cy="username-input"]').type("newcreator")
      cy.get('[data-cy="email-input"]').type("creator@example.com")
      cy.get('[data-cy="password-input"]').type("Password123!")
      cy.get('[data-cy="role-select"]').select("creator")

      cy.get('[data-cy="register-button"]').click()

      cy.url().should("include", "/dashboard")
      cy.get('[data-cy="user-menu"]').should("contain", "newcreator")
    })

    it("should show validation errors for invalid input", () => {
      cy.get('[data-cy="register-link"]').click()

      cy.get('[data-cy="email-input"]').type("invalid-email")
      cy.get('[data-cy="password-input"]').type("weak")
      cy.get('[data-cy="register-button"]').click()

      cy.get('[data-cy="email-error"]').should(
        "contain",
        "Invalid email format"
      )
      cy.get('[data-cy="password-error"]').should(
        "contain",
        "Password must be at least 8 characters"
      )
    })
  })

  describe("Login", () => {
    beforeEach(() => {
      // Create a test user via API
      cy.request("POST", `${Cypress.env("apiUrl")}/auth/register`, {
        username: "testcreator",
        email: "test@example.com",
        password: "Password123!",
        role: "creator",
      })
    })

    it("should login with valid credentials", () => {
      cy.get('[data-cy="login-link"]').click()

      cy.get('[data-cy="username-input"]').type("testcreator")
      cy.get('[data-cy="password-input"]').type("Password123!")
      cy.get('[data-cy="login-button"]').click()

      cy.url().should("include", "/dashboard")
      cy.get('[data-cy="welcome-message"]').should(
        "contain",
        "Welcome, testcreator"
      )
    })

    it("should show error for invalid credentials", () => {
      cy.get('[data-cy="login-link"]').click()

      cy.get('[data-cy="username-input"]').type("testcreator")
      cy.get('[data-cy="password-input"]').type("wrongpassword")
      cy.get('[data-cy="login-button"]').click()

      cy.get('[data-cy="error-message"]').should(
        "contain",
        "Invalid credentials"
      )
    })
  })

  describe("Logout", () => {
    beforeEach(() => {
      // Login first
      cy.login("testcreator", "Password123!")
    })

    it("should logout successfully", () => {
      cy.get('[data-cy="user-menu"]').click()
      cy.get('[data-cy="logout-button"]').click()

      cy.url().should("eq", Cypress.config().baseUrl + "/")
      cy.get('[data-cy="login-link"]').should("be.visible")
    })
  })
})
```

#### 2. Photo Management Flow

**Photo Management E2E Tests** (`cypress/e2e/photos.cy.ts`):

```typescript
describe("Photo Management", () => {
  beforeEach(() => {
    cy.login("testcreator", "Password123!")
  })

  describe("Photo Upload", () => {
    it("should upload a new photo successfully", () => {
      cy.visit("/upload")

      cy.get('[data-cy="photo-title"]').type("Test Photo")
      cy.get('[data-cy="photo-description"]').type("This is a test photo")
      cy.get('[data-cy="photo-price"]').type("15.99")
      cy.get('[data-cy="premium-checkbox"]').check()

      // Upload file
      cy.get('[data-cy="file-input"]').selectFile(
        "cypress/fixtures/test-image.jpg"
      )

      cy.get('[data-cy="upload-button"]').click()

      cy.get('[data-cy="success-message"]').should(
        "contain",
        "Photo uploaded successfully"
      )
      cy.url().should("include", "/dashboard")
    })

    it("should validate required fields", () => {
      cy.visit("/upload")

      cy.get('[data-cy="upload-button"]').click()

      cy.get('[data-cy="title-error"]').should("contain", "Title is required")
      cy.get('[data-cy="file-error"]').should("contain", "Please select a file")
    })
  })

  describe("Photo Gallery", () => {
    beforeEach(() => {
      // Create test photos via API
      cy.createTestPhotos("testcreator")
    })

    it("should display user photos in dashboard", () => {
      cy.visit("/dashboard")

      cy.get('[data-cy="photo-card"]').should("have.length.at.least", 1)
      cy.get('[data-cy="photo-title"]').first().should("not.be.empty")
    })

    it("should allow editing photo details", () => {
      cy.visit("/dashboard")

      cy.get('[data-cy="edit-photo-button"]').first().click()

      cy.get('[data-cy="photo-title"]').clear().type("Updated Title")
      cy.get('[data-cy="save-button"]').click()

      cy.get('[data-cy="success-message"]').should(
        "contain",
        "Photo updated successfully"
      )
    })
  })
})
```

#### 3. Like and Comment Functionality

**Social Features E2E Tests** (`cypress/e2e/social-features.cy.ts`):

```typescript
describe("Like and Comment Functionality", () => {
  beforeEach(() => {
    cy.login("testuser", "Password123!")
  })

  describe("Photo Likes", () => {
    beforeEach(() => {
      // Create test photo
      cy.createTestPhoto("testcreator", {
        title: "Test Photo for Likes",
        description: "Testing like functionality",
        isPremium: false,
      })
    })

    it("should like and unlike a photo", () => {
      cy.visit("/gallery")

      // Initial state - not liked
      cy.get('[data-cy="photo-card"]')
        .first()
        .within(() => {
          cy.get('[data-cy="like-button"]').should(
            "not.have.class",
            "text-red-600"
          )
          cy.get('[data-cy="like-count"]').should("contain", "0")

          // Click like
          cy.get('[data-cy="like-button"]').click()

          // Should be liked now
          cy.get('[data-cy="like-button"]').should("have.class", "text-red-600")
          cy.get('[data-cy="like-count"]').should("contain", "1")

          // Click unlike
          cy.get('[data-cy="like-button"]').click()

          // Should be unliked
          cy.get('[data-cy="like-button"]').should(
            "not.have.class",
            "text-red-600"
          )
          cy.get('[data-cy="like-count"]').should("contain", "0")
        })
    })

    it("should show correct like count with multiple users", () => {
      // Like photo with first user
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]')
        .first()
        .within(() => {
          cy.get('[data-cy="like-button"]').click()
          cy.get('[data-cy="like-count"]').should("contain", "1")
        })

      // Login as different user and like same photo
      cy.logout()
      cy.login("anotheruser", "Password123!")
      cy.visit("/gallery")

      cy.get('[data-cy="photo-card"]')
        .first()
        .within(() => {
          cy.get('[data-cy="like-count"]').should("contain", "1")
          cy.get('[data-cy="like-button"]').click()
          cy.get('[data-cy="like-count"]').should("contain", "2")
        })
    })
  })

  describe("Photo Comments", () => {
    beforeEach(() => {
      cy.createTestPhoto("testcreator", {
        title: "Test Photo for Comments",
        description: "Testing comment functionality",
        isPremium: false,
      })
    })

    it("should add and display comments", () => {
      cy.visit("/gallery")

      cy.get('[data-cy="photo-card"]').first().click()

      // Add comment
      cy.get('[data-cy="comment-input"]').type("This is a test comment!")
      cy.get('[data-cy="comment-submit"]').click()

      // Verify comment appears
      cy.get('[data-cy="comment-item"]').should("have.length", 1)
      cy.get('[data-cy="comment-content"]').should(
        "contain",
        "This is a test comment!"
      )
      cy.get('[data-cy="comment-author"]').should("contain", "testuser")

      // Comment count should update
      cy.get('[data-cy="comment-count"]').should("contain", "1")
    })

    it("should not submit empty comments", () => {
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()

      // Try to submit empty comment
      cy.get('[data-cy="comment-submit"]').should("be.disabled")

      // Type spaces only
      cy.get('[data-cy="comment-input"]').type("   ")
      cy.get('[data-cy="comment-submit"]').should("be.disabled")
    })

    it("should allow users to delete their own comments", () => {
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()

      // Add comment
      cy.get('[data-cy="comment-input"]').type("Comment to be deleted")
      cy.get('[data-cy="comment-submit"]').click()

      // Delete comment
      cy.get('[data-cy="comment-item"]').within(() => {
        cy.get('[data-cy="delete-comment"]').click()
      })

      cy.get('[data-cy="confirm-delete"]').click()

      // Comment should be removed
      cy.get('[data-cy="comment-item"]').should("not.exist")
      cy.get('[data-cy="comment-count"]').should("contain", "0")
    })

    it("should not show delete button for other users comments", () => {
      // Add comment as first user
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()
      cy.get('[data-cy="comment-input"]').type("Comment from first user")
      cy.get('[data-cy="comment-submit"]').click()

      // Login as different user
      cy.logout()
      cy.login("anotheruser", "Password123!")
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()

      // Delete button should not be visible
      cy.get('[data-cy="comment-item"]').within(() => {
        cy.get('[data-cy="delete-comment"]').should("not.exist")
      })
    })

    it("should display comments in chronological order", () => {
      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()

      // Add multiple comments
      cy.get('[data-cy="comment-input"]').type("First comment")
      cy.get('[data-cy="comment-submit"]').click()

      cy.wait(1000) // Ensure different timestamps

      cy.get('[data-cy="comment-input"]').type("Second comment")
      cy.get('[data-cy="comment-submit"]').click()

      cy.wait(1000)

      cy.get('[data-cy="comment-input"]').type("Third comment")
      cy.get('[data-cy="comment-submit"]').click()

      // Verify order (newest first)
      cy.get('[data-cy="comment-content"]')
        .first()
        .should("contain", "Third comment")
      cy.get('[data-cy="comment-content"]')
        .eq(1)
        .should("contain", "Second comment")
      cy.get('[data-cy="comment-content"]')
        .eq(2)
        .should("contain", "First comment")
    })
  })

  describe("Combined Like and Comment Interactions", () => {
    it("should handle likes and comments together", () => {
      cy.createTestPhoto("testcreator", {
        title: "Interactive Photo",
        description: "Testing combined interactions",
        isPremium: false,
      })

      cy.visit("/gallery")
      cy.get('[data-cy="photo-card"]').first().click()

      // Like the photo
      cy.get('[data-cy="like-button"]').click()
      cy.get('[data-cy="like-count"]').should("contain", "1")

      // Add comment
      cy.get('[data-cy="comment-input"]').type("Great photo! Liked it!")
      cy.get('[data-cy="comment-submit"]').click()

      // Both interactions should persist
      cy.reload()

      cy.get('[data-cy="like-button"]').should("have.class", "text-red-600")
      cy.get('[data-cy="like-count"]').should("contain", "1")
      cy.get('[data-cy="comment-item"]').should("have.length", 1)
      cy.get('[data-cy="comment-content"]').should(
        "contain",
        "Great photo! Liked it!"
      )
    })
  })
})
```

#### 4. Subscription Flow

**Subscription E2E Tests** (`cypress/e2e/subscriptions.cy.ts`):

```typescript
describe("Subscription Management", () => {
  describe("Creator Subscription", () => {
    beforeEach(() => {
      cy.login("testsubscriber", "Password123!")
    })

    it("should subscribe to a creator successfully", () => {
      cy.visit("/creators/testcreator")

      cy.get('[data-cy="subscribe-button"]').click()

      // Handle Stripe checkout (in test mode)
      cy.origin("https://checkout.stripe.com", () => {
        cy.get('[data-testid="test-payment-method-card"]').click()
        cy.get('[data-testid="confirm-payment"]').click()
      })

      cy.url().should("include", "/subscription-success")
      cy.get('[data-cy="success-message"]').should(
        "contain",
        "Subscription successful"
      )
    })
  })

  describe("Subscription Management", () => {
    beforeEach(() => {
      cy.login("testsubscriber", "Password123!")
      // Create test subscription
      cy.createTestSubscription("testsubscriber", "testcreator")
    })

    it("should display active subscriptions", () => {
      cy.visit("/subscriptions")

      cy.get('[data-cy="subscription-card"]').should("have.length.at.least", 1)
      cy.get('[data-cy="creator-name"]').should("contain", "testcreator")
      cy.get('[data-cy="status"]').should("contain", "Active")
    })

    it("should cancel subscription successfully", () => {
      cy.visit("/subscriptions")

      cy.get('[data-cy="cancel-subscription"]').first().click()
      cy.get('[data-cy="confirm-cancel"]').click()

      cy.get('[data-cy="success-message"]').should(
        "contain",
        "Subscription cancelled"
      )
      cy.get('[data-cy="status"]').should("contain", "Cancelled")
    })
  })
})
```

### Custom Cypress Commands

**Custom Commands** (`cypress/support/commands.ts`):

```typescript
declare global {
  namespace Cypress {
    interface Chainable {
      login(username: string, password: string): Chainable<void>
      logout(): Chainable<void>
      createTestPhoto(creatorUsername: string, photoData: any): Chainable<void>
      createTestPhotos(creatorUsername: string): Chainable<void>
      createTestSubscription(
        subscriber: string,
        creator: string
      ): Chainable<void>
      likePhoto(photoId: number): Chainable<void>
      addComment(photoId: number, content: string): Chainable<void>
    }
  }
}

Cypress.Commands.add("login", (username: string, password: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/auth/login`,
    body: {
      username,
      password,
    },
  }).then((response) => {
    window.localStorage.setItem("token", response.body.access_token)
    window.localStorage.setItem("user", JSON.stringify(response.body.user))
  })
})

Cypress.Commands.add(
  "createTestPhoto",
  (creatorUsername: string, photoData: any) => {
    cy.request({
      method: "POST",
      url: `${Cypress.env("apiUrl")}/photos`,
      headers: {
        Authorization: `Bearer ${window.localStorage.getItem("token")}`,
      },
      body: photoData,
    })
  }
)

Cypress.Commands.add("createTestPhotos", (creatorUsername: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/photos`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: {
      title: "Test Photo 1",
      description: "Test Description",
      filename: "test1.jpg",
      isPremium: false,
    },
  })

  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/photos`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: {
      title: "Premium Photo 1",
      description: "Premium Content",
      filename: "premium1.jpg",
      isPremium: true,
      price: 19.99,
    },
  })
})

Cypress.Commands.add("likePhoto", (photoId: number) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/photos/${photoId}/like`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: {},
  })
})

Cypress.Commands.add("addComment", (photoId: number, content: string) => {
  cy.request({
    method: "POST",
    url: `${Cypress.env("apiUrl")}/photos/${photoId}/comments`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem("token")}`,
    },
    body: { content },
  })
})

Cypress.Commands.add("logout", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("token")
    win.localStorage.removeItem("user")
  })
  cy.visit("/")
})
```

## ⚡ Performance Testing

### Load Testing with Artillery

```bash
# Install Artillery
npm install -g artillery

# Create test configuration
```

**Artillery Configuration** (`performance/load-test.yml`):

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 60
      arrivalRate: 5
      name: "Warm up"
    - duration: 120
      arrivalRate: 10
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 20
      name: "Sustained load"
  variables:
    usernames:
      - "user1"
      - "user2"
      - "user3"
  processor: "./processor.js"

scenarios:
  - name: "Authentication Flow"
    weight: 30
    flow:
      - post:
          url: "/auth/login"
          json:
            username: "{{ $randomString() }}"
            password: "password123"
          capture:
            - json: "$.access_token"
              as: "token"
      - get:
          url: "/users/profile"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Photo Upload and Retrieval"
    weight: 50
    flow:
      - function: "authenticate"
      - post:
          url: "/photos"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            title: "Load Test Photo {{ $randomString() }}"
            description: "Performance test upload"
            filename: "test-{{ $randomString() }}.jpg"
            isPremium: false
      - get:
          url: "/photos"
          headers:
            Authorization: "Bearer {{ token }}"

  - name: "Social Interactions"
    weight: 30
    flow:
      - function: "authenticate"
      - get:
          url: "/photos/1/likes"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/photos/1/like"
          headers:
            Authorization: "Bearer {{ token }}"
          json: {}
      - get:
          url: "/photos/1/comments"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/photos/1/comments"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            content: "Performance test comment {{ $randomString() }}"

  - name: "Subscription Operations"
    weight: 20
    flow:
      - function: "authenticate"
      - get:
          url: "/subscriptions"
          headers:
            Authorization: "Bearer {{ token }}"
      - post:
          url: "/payments/create-subscription"
          headers:
            Authorization: "Bearer {{ token }}"
          json:
            creatorId: 1
            priceId: "price_test"
```

**Artillery Processor** (`performance/processor.js`):

```javascript
module.exports = {
  authenticate: authenticate,
}

function authenticate(requestParams, context, ee, next) {
  // Simulate authentication
  context.vars.token = "test-jwt-token"
  return next()
}
```

### Stress Testing

**Stress Test Configuration** (`performance/stress-test.yml`):

```yaml
config:
  target: "http://localhost:3000"
  phases:
    - duration: 300
      arrivalRate: 50
      name: "Stress test"
    - duration: 120
      arrivalRate: 100
      name: "Peak load"
  variables:
    testData:
      - username: "stressuser1"
      - username: "stressuser2"

scenarios:
  - name: "High Load Photo Retrieval"
    weight: 70
    flow:
      - get:
          url: "/photos/public"
          think: 1

  - name: "Concurrent User Registration"
    weight: 30
    flow:
      - post:
          url: "/auth/register"
          json:
            username: "stress-{{ $randomString() }}"
            email: "stress-{{ $randomString() }}@example.com"
            password: "StressTest123!"
            role: "subscriber"
```

## 📊 Test Reporting and CI/CD

### Test Reporting Setup

**Jest Coverage Configuration** (Backend):

```json
{
  "collectCoverageFrom": [
    "src/**/*.{js,ts}",
    "!src/main.ts",
    "!src/**/*.module.ts",
    "!src/**/*.interface.ts",
    "!src/**/*.dto.ts",
    "!src/migrations/**"
  ],
  "coverageThreshold": {
    "global": {
      "branches": 80,
      "functions": 80,
      "lines": 80,
      "statements": 80
    }
  }
}
```

### CI/CD Pipeline with GitHub Actions

**GitHub Actions Workflow** (`.github/workflows/test.yml`):

```yaml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-tests:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: backend/package-lock.json

      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run backend unit tests
        working-directory: ./backend
        run: npm run test
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          JWT_SECRET: test-secret

      - name: Run backend integration tests
        working-directory: ./backend
        run: npm run test:e2e
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db

      - name: Upload backend coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./backend/coverage/lcov.info
          flags: backend

  frontend-tests:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"
          cache: "npm"
          cache-dependency-path: frontend/package-lock.json

      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run frontend unit tests
        working-directory: ./frontend
        run: npm run test:coverage

      - name: Upload frontend coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./frontend/coverage/lcov.info
          flags: frontend

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests, frontend-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci

      - name: Start backend
        working-directory: ./backend
        run: |
          npm run build
          npm start &
        env:
          NODE_ENV: test
          DATABASE_URL: sqlite://test.db

      - name: Start frontend
        working-directory: ./frontend
        run: npm start &

      - name: Wait for services
        run: |
          npx wait-on http://localhost:3000
          npx wait-on http://localhost:4200

      - name: Run Cypress tests
        working-directory: ./frontend
        run: npx cypress run
        env:
          CYPRESS_baseUrl: http://localhost:4200

      - name: Upload E2E artifacts
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: cypress-screenshots
          path: frontend/cypress/screenshots

  performance-tests:
    runs-on: ubuntu-latest
    needs: [backend-tests]

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "18"

      - name: Install Artillery
        run: npm install -g artillery

      - name: Start backend for performance testing
        working-directory: ./backend
        run: |
          npm ci
          npm run build
          npm start &
        env:
          NODE_ENV: test

      - name: Wait for backend
        run: npx wait-on http://localhost:3000

      - name: Run performance tests
        run: artillery run performance/load-test.yml

      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: artillery-report.html
```

### Test Commands Summary

```bash
# Backend Testing
cd backend
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
npm run test:e2e         # Integration tests

# Frontend Testing
cd frontend
npm run test              # Unit tests
npm run test:watch        # Watch mode
npm run test:coverage     # Coverage report
ng e2e                   # E2E tests with Cypress

# Performance Testing
artillery run performance/load-test.yml     # Load testing
artillery run performance/stress-test.yml   # Stress testing

# Full Test Suite
npm run test:all         # Run all tests (requires setup script)
```

This comprehensive testing guide ensures robust quality assurance for the OnlyFans-like platform with thorough coverage across all layers of the application.
