import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div
      class="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"
    >
      <div class="max-w-md w-full space-y-8">
        <div>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Or
            <a routerLink="/login" class="font-medium text-primary-600 hover:text-primary-500">
              sign in to existing account
            </a>
          </p>
        </div>
        <form class="mt-8 space-y-6" [formGroup]="registerForm" (ngSubmit)="onSubmit()">
          <div class="space-y-4">
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700"
                >Email address</label
              >
              <input
                id="email"
                name="email"
                type="email"
                formControlName="email"
                required
                class="input-field mt-1"
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                formControlName="password"
                required
                class="input-field mt-1"
                placeholder="Enter your password"
              />
            </div>
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700"
                >Confirm Password</label
              >
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                formControlName="confirmPassword"
                required
                class="input-field mt-1"
                placeholder="Confirm your password"
              />
            </div>
            <div class="flex items-center">
              <input
                id="isCreator"
                name="isCreator"
                type="checkbox"
                formControlName="isCreator"
                class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label for="isCreator" class="ml-2 block text-sm text-gray-900">
                I want to be a content creator
              </label>
            </div>
          </div>

          <div *ngIf="error" class="text-red-600 text-sm text-center">
            {{ error }}
          </div>

          <div>
            <button
              type="submit"
              [disabled]="registerForm.invalid || loading"
              class="btn-primary w-full flex justify-center disabled:opacity-50"
            >
              <span *ngIf="loading" class="mr-2">Loading...</span>
              Create Account
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  registerForm: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.registerForm = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required]],
        isCreator: [false],
      },
      { validator: this.passwordMatchValidator }
    );
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
    } else if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';

      const { confirmPassword, ...registerData } = this.registerForm.value;

      this.authService.register(registerData).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err: any) => {
          this.error = err.error?.message || 'Registration failed. Please try again.';
          this.loading = false;
        },
        complete: () => {
          this.loading = false;
        },
      });
    }
  }
}
