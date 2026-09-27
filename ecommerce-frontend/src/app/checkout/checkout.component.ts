import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { CartService, CartItem } from '../services/cart.service';
import { OrderService } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';

@Component({
  selector: 'app-checkout',
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cart: CartItem[] = [];
  isLoading = true;
  isPlacingOrder = false;

  form = {
    full_name: '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
    payment_method: 'COD' as 'COD' | 'Card' | 'UPI'
  };

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private auth: AuthService,
    private productService: ProductService,
    private toastr: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/user-login']);
      return;
    }
    this.form.full_name = user.name || '';
    if (user.address) {
      this.form.address_line = user.address;
    }

    this.cartService.cartItems$.subscribe((items) => {
      this.cart = items;
      this.isLoading = false;
      if (items.length === 0 && !this.isPlacingOrder) {
        this.toastr.info('Your cart is empty.');
        this.router.navigate(['/cart']);
      }
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

  selectPayment(method: 'COD' | 'Card' | 'UPI'): void {
    this.form.payment_method = method;
  }

  isFormValid(): boolean {
    return !!(
      this.form.full_name.trim() &&
      this.form.phone.trim().length >= 10 &&
      this.form.address_line.trim() &&
      this.form.city.trim() &&
      this.form.state.trim() &&
      this.form.pincode.trim().length >= 5
    );
  }

  placeOrder(): void {
    if (!this.isFormValid()) {
      this.toastr.warning('Please fill in all delivery details correctly.');
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      this.router.navigate(['/user-login']);
      return;
    }

    this.isPlacingOrder = true;

    this.orderService.placeOrder({
      user_id: user.id,
      full_name: this.form.full_name.trim(),
      phone: this.form.phone.trim(),
      address_line: this.form.address_line.trim(),
      city: this.form.city.trim(),
      state: this.form.state.trim(),
      pincode: this.form.pincode.trim(),
      payment_method: this.form.payment_method
    }).subscribe({
      next: (res: any) => {
        this.isPlacingOrder = false;
        this.cartService.refreshCart();
        this.toastr.success('Order placed successfully!');
        this.router.navigate(['/order-success', res.order_id]);
      },
      error: (err) => {
        this.isPlacingOrder = false;
        this.toastr.error(err?.error?.error || 'Could not place order. Please try again.');
      }
    });
  }
}
