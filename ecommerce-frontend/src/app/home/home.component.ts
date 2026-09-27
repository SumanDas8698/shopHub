import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProductService, Product, Category } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  featuredProducts: Product[] = [];
  categories: Category[] = [];
  isLoading = true;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.featuredProducts = products.slice(0, 8);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.productService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => {}
    });
  }

  imageSrc(url: string): string {
    return this.productService.imageSrc(url);
  }

  goToCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: { category: slug } });
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    if (!this.auth.isUserLoggedIn()) {
      this.toastr.info('Please sign in to add items to your cart.');
      this.router.navigate(['/user-login']);
      return;
    }
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => this.toastr.success(`${product.name} added to cart.`),
      error: () => this.toastr.error('Could not add item to cart.')
    });
  }

  discountPercent(product: Product): number | null {
    if (!product.mrp || product.mrp <= product.price) return null;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  starArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((n) => n <= Math.round(rating));
  }
}
