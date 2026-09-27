import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../services/auth.service';
import { CartService } from '../services/cart.service';
import { ProductService, Category } from '../services/product.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  categories: Category[] = [];
  searchTerm = '';
  cartCount = 0;
  isMobileMenuOpen = false;

  constructor(
    public auth: AuthService,
    private cart: CartService,
    private products: ProductService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.products.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => {
        // Category strip is non-critical; fail silently so the navbar still renders.
      }
    });

    this.cart.cartCount$.subscribe((count) => (this.cartCount = count));
  }

  get isUserLoggedIn(): boolean {
    return this.auth.isUserLoggedIn();
  }

  get isAdminLoggedIn(): boolean {
    return this.auth.isAdminLoggedIn();
  }

  get currentUser() {
    return this.auth.currentUser;
  }

  get firstName(): string {
    const name = this.auth.currentUser?.name ?? '';
    return name.split(' ')[0] || 'there';
  }

  get currentAdmin() {
    return this.auth.currentAdmin;
  }

  onSearch(): void {
    const term = this.searchTerm.trim();
    this.router.navigate(['/products'], { queryParams: term ? { q: term } : {} });
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  logoutUser(): void {
    this.auth.logoutUser();
    this.toastr.info('You have been logged out.');
    this.router.navigate(['/']);
  }

  logoutAdmin(): void {
    this.auth.logoutAdmin();
    this.toastr.info('Admin logged out.');
    this.router.navigate(['/']);
  }
}
