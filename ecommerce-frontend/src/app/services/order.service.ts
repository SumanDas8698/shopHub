import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name: string;
  price: number;
  quantity: number;
}

export interface Order {
  id: number;
  user_id: number;
  total_amount: number;
  payment_method: 'COD' | 'Card' | 'UPI';
  status: 'Placed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  created_at: string;
  customer_name?: string;
  customer_email?: string;
  items: OrderItem[];
}

export interface CheckoutPayload {
  user_id: number;
  full_name: string;
  phone: string;
  address_line: string;
  city: string;
  state: string;
  pincode: string;
  payment_method: 'COD' | 'Card' | 'UPI';
}

export interface DashboardStats {
  summary: {
    total_revenue: number;
    total_orders: number;
    total_products: number;
    total_users: number;
    pending_orders: number;
    low_stock_count: number;
  };
  sales_over_time: { date: string; total: number }[];
  top_products: { product_name: string; total_sold: number; revenue: number }[];
  status_breakdown: { status: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  placeOrder(payload: CheckoutPayload): Observable<any> {
    return this.http.post(`${this.apiUrl}/placeorder.php`, payload);
  }

  getMyOrders(userId: number): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.apiUrl}/getorders.php?user_id=${userId}`);
  }

  getAllOrders(status?: string): Observable<Order[]> {
    const query = status && status !== 'All' ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<Order[]>(`${this.apiUrl}/getallorders.php${query}`);
  }

  updateOrderStatus(orderId: number, status: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateorderstatus.php`, { order_id: orderId, status });
  }

  getDashboardStats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.apiUrl}/dashboardstats.php`);
  }
}
