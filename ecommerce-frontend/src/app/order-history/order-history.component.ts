import { Component, OnInit } from '@angular/core';
import { OrderService, Order } from '../services/order.service';
import { AuthService } from '../services/auth.service';
import { ProductService } from '../services/product.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-order-history',
  templateUrl: './order-history.component.html',
  styleUrls: ['./order-history.component.css']
})
export class OrderHistoryComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  expandedOrderId: number | null = null;

  constructor(
    private orderService: OrderService,
    private auth: AuthService,
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (!user) {
      this.isLoading = false;
      return;
    }

    this.orderService.getMyOrders(user.id).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load your orders.');
        this.isLoading = false;
      }
    });
  }

  toggleExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  statusChipClass(status: string): string {
    return 'chip-' + status.toLowerCase();
  }
}
