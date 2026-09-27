import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService, CartItem } from '../services/cart.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.css']
})
export class CartComponent implements OnInit {
  cart: CartItem[] = [];
  isLoading = true;

  constructor(
    private cartService: CartService,
    private auth: AuthService,
    private productService: ProductService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.auth.isUserLoggedIn()) {
      this.toastr.info('Please log in to view your cart.');
      this.router.navigate(['/user-login']);
      return;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cart = items;
      this.isLoading = false;
    });
    this.cartService.refreshCart();
  }

  imageSrc(url: string): string {
    return this.productService.imageSrc(url);
  }

  get subtotal(): number {
    return this.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  get totalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  increaseQty(item: CartItem): void {
    if (item.quantity >= item.stock) {
      this.toastr.warning(`Only ${item.stock} left in stock.`);
      return;
    }
    this.cartService.updateQuantity(item.id, item.quantity + 1).subscribe({
      error: () => this.toastr.error('Could not update quantity.')
    });
  }

  decreaseQty(item: CartItem): void {
    if (item.quantity <= 1) return;
    this.cartService.updateQuantity(item.id, item.quantity - 1).subscribe({
      error: () => this.toastr.error('Could not update quantity.')
    });
  }

  remove(item: CartItem): void {
    this.cartService.removeFromCart(item.id).subscribe({
      next: () => this.toastr.success(`${item.name} removed from cart.`),
      error: () => this.toastr.error('Failed to remove item. Please try again.')
    });
  }

  proceedToCheckout(): void {
    this.router.navigate(['/checkout']);
  }
}
