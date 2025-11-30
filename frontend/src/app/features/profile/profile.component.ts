import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { User } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from '../../core/services/user.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  user: User | null = null;
  loading = false;
  message = '';
  messageClass = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private userService: UserService,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }],
      displayName: [''],
      bio: [''],
      subscriptionPrice: [9.99, [Validators.min(1)]],
      currentPassword: [''],
      newPassword: ['', [Validators.minLength(6)]],
      confirmPassword: [''],
    });
  }

  ngOnInit(): void {
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      if (user) {
        this.profileForm.patchValue({
          email: user.email,
          displayName: user.displayName || '',
          bio: user.bio || '',
          subscriptionPrice: user.subscriptionPrice || 9.99,
        });
      }
    });
  }

  onProfileImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Handle profile image upload
      console.log('Profile image selected:', file.name);
      this.showMessage('Profile image upload functionality coming soon!', 'info');
    }
  }

  canChangePassword(): boolean {
    const form = this.profileForm.value;
    return !!(
      form.currentPassword &&
      form.newPassword &&
      form.confirmPassword &&
      form.newPassword === form.confirmPassword
    );
  }

  async updateProfile(): Promise<void> {
    if (this.profileForm.valid && this.user) {
      try {
        this.loading = true;
        const formValue = this.profileForm.value;

        const updateData = {
          displayName: formValue.displayName,
          bio: formValue.bio,
          subscriptionPrice:
            this.user?.role === 'creator' || this.user?.isCreator
              ? formValue.subscriptionPrice
              : undefined,
        };

        await this.userService.updateProfile(updateData).toPromise();
        this.showMessage('Profile updated successfully!', 'success');
      } catch (error) {
        console.error('Error updating profile:', error);
        this.showMessage('Failed to update profile. Please try again.', 'error');
      } finally {
        this.loading = false;
      }
    }
  }

  async changePassword(): Promise<void> {
    if (this.canChangePassword()) {
      try {
        this.loading = true;
        const formValue = this.profileForm.value;

        await this.authService
          .changePassword(formValue.currentPassword, formValue.newPassword)
          .toPromise();

        // Reset password fields
        this.profileForm.patchValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        });

        this.showMessage('Password changed successfully!', 'success');
      } catch (error) {
        console.error('Error changing password:', error);
        this.showMessage('Failed to change password. Please check your current password.', 'error');
      } finally {
        this.loading = false;
      }
    }
  }

  async becomeCreator(): Promise<void> {
    if (confirm('Are you sure you want to become a creator? This action cannot be undone.')) {
      try {
        this.loading = true;
        await this.authService.becomeCreator().toPromise();
        this.showMessage('Congratulations! You are now a creator!', 'success');

        // Refresh user data
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } catch (error) {
        console.error('Error becoming creator:', error);
        this.showMessage('Failed to become creator. Please try again.', 'error');
      } finally {
        this.loading = false;
      }
    }
  }

  async deleteAccount(): Promise<void> {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently lost.'
    );

    if (confirmed) {
      const doubleConfirmed = confirm(
        'This is your final warning. Deleting your account will permanently remove all your content, subscriptions, and payment history. Type "DELETE" if you are absolutely sure.'
      );

      if (doubleConfirmed) {
        try {
          this.loading = true;
          await this.userService.deleteAccount().toPromise();
          await this.authService.logout();
          this.router.navigate(['/']);
        } catch (error) {
          console.error('Error deleting account:', error);
          this.showMessage('Failed to delete account. Please contact support.', 'error');
        } finally {
          this.loading = false;
        }
      }
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard']);
  }

  private showMessage(message: string, type: 'success' | 'error' | 'info'): void {
    this.message = message;
    this.messageClass = {
      success: 'bg-green-100 border border-green-400 text-green-700',
      error: 'bg-red-100 border border-red-400 text-red-700',
      info: 'bg-blue-100 border border-blue-400 text-blue-700',
    }[type];

    setTimeout(() => {
      this.message = '';
    }, 5000);
  }
}
