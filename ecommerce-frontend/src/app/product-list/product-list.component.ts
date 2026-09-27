import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProductService, Product, Category } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

type SortOption = 'newest' | 'price_low' | 'price_high' | 'rating';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  allProducts: Product[] = [];
  visibleProducts: Product[] = [];
  categories: Category[] = [];

  isLoading = true;
  activeCategory = '';
  activeSearch = '';
  sortBy: SortOption = 'newest';
  maxPrice = 200000;
  selectedMaxPrice = 200000;
  minRating = 0;

  constructor(
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private toastr: ToastrService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => {}
    });

    this.route.queryParams.subscribe((params) => {
      this.activeCategory = params['category'] || '';
      this.activeSearch = params['q'] || '';
      this.loadProducts();
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts({ category: this.activeCategory, q: this.activeSearch }).subscribe({
      next: (products) => {
        this.allProducts = products;
        const highestPrice = Math.max(...products.map((p) => p.price), 1000);
        this.maxPrice = Math.ceil(highestPrice / 1000) * 1000;
        this.selectedMaxPrice = this.maxPrice;
        this.applyFiltersAndSort();
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load products.');
        this.isLoading = false;
      }
    });
  }

  applyFiltersAndSort(): void {
    let result = this.allProducts.filter(
      (p) => p.price <= this.selectedMaxPrice && p.rating >= this.minRating
    );

    switch (this.sortBy) {
      case 'price_low':
        result = result.sort((a, b) => a.price - b.price);
        break;
      case 'price_high':
        result = result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result = result.sort((a, b) => b.rating - a.rating);
        break;
      default:
        // 'newest' — already ordered by created_at DESC from the API
        break;
    }

    this.visibleProducts = result;
  }

  onFilterChange(): void {
    this.applyFiltersAndSort();
  }

  selectCategory(slug: string): void {
    this.router.navigate(['/products'], { queryParams: slug ? { category: slug } : {} });
  }

  clearFilters(): void {
    this.selectedMaxPrice = this.maxPrice;
    this.minRating = 0;
    this.sortBy = 'newest';
    this.applyFiltersAndSort();
  }

  imageSrc(url: string): string {
    return this.productService.imageSrc(url);
  }

  discountPercent(product: Product): number | null {
    if (!product.mrp || product.mrp <= product.price) return null;
    return Math.round(((product.mrp - product.price) / product.mrp) * 100);
  }

  starArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((n) => n <= Math.round(rating));
  }

  addToCart(product: Product, event: Event): void {
    event.stopPropagation();
    if (!this.auth.isUserLoggedIn()) {
      this.toastr.info('Please sign in to add items to your cart.');
      this.router.navigate(['/user-login']);
      return;
    }
    if (product.stock <= 0) {
      this.toastr.warning('This item is currently out of stock.');
      return;
    }
    this.cartService.addToCart(product.id, 1).subscribe({
      next: () => this.toastr.success(`${product.name} added to cart.`),
      error: (err) => this.toastr.error(err?.error?.error || 'Could not add item to cart.')
    });
  }
}
