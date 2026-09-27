import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
  name: string;
  price: number;
  image_url: string;
  stock: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private apiUrl = environment.apiUrl;

  private cartItemsSubject = new BehaviorSubject<CartItem[]>([]);
  cartItems$ = this.cartItemsSubject.asObservable();

  private cartCountSubject = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCountSubject.asObservable();

  constructor(private http: HttpClient, private auth: AuthService) {
    // Whenever the logged-in user changes, refresh the cart immediately
    this.auth.user$.subscribe(user => {
      if (user?.id) {
        this.refreshCart();
      } else {
        this.cartItemsSubject.next([]);
        this.cartCountSubject.next(0);
      }
    });
  }

  refreshCart(): void {
    const user = this.auth.currentUser;
    if (!user?.id) {
      this.cartItemsSubject.next([]);
      this.cartCountSubject.next(0);
      return;
    }
    this.http.get<CartItem[]>(`${this.apiUrl}/getcart.php?user_id=${user.id}`).subscribe({
      next: (items) => {
        this.cartItemsSubject.next(items);
        this.cartCountSubject.next(items.reduce((sum, i) => sum + i.quantity, 0));
      },
      error: () => {
        // Leave previous state in place on transient errors
      }
    });
  }

  addToCart(productId: number, quantity: number = 1): Observable<any> {
    const user = this.auth.currentUser;
    const payload = { user_id: user?.id, product_id: productId, quantity };
    return this.http.post(`${this.apiUrl}/addtocart.php`, payload).pipe(
      tap(() => this.refreshCart())
    );
  }

  removeFromCart(cartItemId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/removefromcart.php`, { id: cartItemId }).pipe(
      tap(() => this.refreshCart())
    );
  }

  updateQuantity(cartItemId: number, quantity: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/updatecartquantity.php`, { id: cartItemId, quantity }).pipe(
      tap(() => this.refreshCart())
    );
  }

  get currentItems(): CartItem[] {
    return this.cartItemsSubject.value;
  }

  cartTotal(): number {
    return this.currentItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}
