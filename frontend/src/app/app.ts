import { Component, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { NavigationComponent } from './shared/components/navigation/navigation.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavigationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App implements OnInit {
  protected readonly title = signal('OnlyFans Frontend');

  constructor(private router: Router) {}

  ngOnInit() {
    // Track route changes if needed
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe(() => {
      // Handle route changes if needed
    });
  }
}
