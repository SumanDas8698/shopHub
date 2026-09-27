import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { OrderService, Order } from '../services/order.service';

const ALL_STATUSES = ['All', 'Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;
type StatusFilter = typeof ALL_STATUSES[number];

@Component({
  selector: 'app-admin-orders',
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  activeFilter: StatusFilter = 'All';
  expandedOrderId: number | null = null;
  updatingOrderId: number | null = null;

  readonly allStatuses = ALL_STATUSES;
  readonly editableStatuses = ['Placed', 'Processing', 'Shipped', 'Delivered', 'Cancelled'] as const;

  constructor(
    private orderService: OrderService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.isLoading = true;
    this.orderService.getAllOrders(this.activeFilter === 'All' ? undefined : this.activeFilter).subscribe({
      next: (orders) => {
        this.orders = orders;
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load orders.');
        this.isLoading = false;
      }
    });
  }

  setFilter(filter: StatusFilter): void {
    this.activeFilter = filter;
    this.expandedOrderId = null;
    this.loadOrders();
  }

  toggleExpand(orderId: number): void {
    this.expandedOrderId = this.expandedOrderId === orderId ? null : orderId;
  }

  updateStatus(order: Order, newStatus: string): void {
    if (order.status === newStatus) return;
    this.updatingOrderId = order.id;
    this.orderService.updateOrderStatus(order.id, newStatus).subscribe({
      next: () => {
        this.toastr.success(`Order #${order.id} → ${newStatus}`);
        this.updatingOrderId = null;
        order.status = newStatus as Order['status'];
      },
      error: (err) => {
        this.updatingOrderId = null;
        this.toastr.error(err?.error?.error || 'Status update failed.');
      }
    });
  }

  statusChipClass(status: string): string {
    return 'chip chip-' + status.toLowerCase();
  }
}
