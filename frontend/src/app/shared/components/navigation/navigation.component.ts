import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { User } from '../../../core/models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-navigation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navigation.component.html',
})
export class NavigationComponent implements OnInit, OnDestroy {
  user = signal<User | null>(null);
  isMenuOpen = signal(false);
  isUserMenuOpen = signal(false);
  shouldShowNavigation = signal(true);
  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to user changes
    const userSub = this.authService.currentUser$.subscribe((user) => {
      this.user.set(user);
      this.cdr.markForCheck();
    });
    this.subscriptions.add(userSub);

    // Hide navigation on login/register pages
    const routeSub = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const hiddenRoutes = ['/login', '/register'];
        this.shouldShowNavigation.set(!hiddenRoutes.includes(event.url));
        this.cdr.markForCheck();
      });
    this.subscriptions.add(routeSub);

    // Check initial route
    const hiddenRoutes = ['/login', '/register'];
    this.shouldShowNavigation.set(!hiddenRoutes.includes(this.router.url));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  toggleMobileMenu(): void {
    this.isMenuOpen.set(!this.isMenuOpen());
    this.isUserMenuOpen.set(false);
  }

  toggleUserMenu(): void {
    this.isUserMenuOpen.set(!this.isUserMenuOpen());
    this.isMenuOpen.set(false);
  }

  closeMenus(): void {
    this.isMenuOpen.set(false);
    this.isUserMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.closeMenus();
  }

  isActive(route: string): boolean {
    return this.router.url === route || this.router.url.startsWith(route + '/');
  }
}
