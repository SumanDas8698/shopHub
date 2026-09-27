import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { ProductService, Product } from '../services/product.service';
import { CartService } from '../services/cart.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  isLoading = true;
  notFound = false;
  quantity = 1;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: CartService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      const id = Number(params['id']);
      if (!id) {
        this.notFound = true;
        this.isLoading = false;
        return;
      }
      this.loadProduct(id);
    });
  }

  loadProduct(id: number): void {
    this.isLoading = true;
    this.notFound = false;
    this.quantity = 1;
    this.productService.getProduct(id).subscribe({
      next: (product) => {
        this.product = product;
        this.isLoading = false;
      },
      error: () => {
        this.notFound = true;
        this.isLoading = false;
      }
    });
  }

  imageSrc(url: string): string {
    return this.productService.imageSrc(url);
  }

  discountPercent(): number | null {
    if (!this.product?.mrp || this.product.mrp <= this.product.price) return null;
    return Math.round(((this.product.mrp - this.product.price) / this.product.mrp) * 100);
  }

  starArray(rating: number): boolean[] {
    return [1, 2, 3, 4, 5].map((n) => n <= Math.round(rating));
  }

  increaseQty(): void {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQty(): void {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  addToCart(): void {
    if (!this.product) return;

    if (!this.auth.isUserLoggedIn()) {
      this.toastr.info('Please sign in to add items to your cart.');
      this.router.navigate(['/user-login']);
      return;
    }

    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () => this.toastr.success(`${this.product!.name} added to cart.`),
      error: (err) => this.toastr.error(err?.error?.error || 'Could not add item to cart.')
    });
  }

  buyNow(): void {
    if (!this.product) return;

    if (!this.auth.isUserLoggedIn()) {
      this.toastr.info('Please sign in to continue.');
      this.router.navigate(['/user-login']);
      return;
    }

    this.cartService.addToCart(this.product.id, this.quantity).subscribe({
      next: () => this.router.navigate(['/checkout']),
      error: (err) => this.toastr.error(err?.error?.error || 'Could not proceed to checkout.')
    });
  }
}
