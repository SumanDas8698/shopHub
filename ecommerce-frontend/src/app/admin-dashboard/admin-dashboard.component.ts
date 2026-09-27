import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { OrderService, DashboardStats } from '../services/order.service';
import { AuthService } from '../services/auth.service';

// Chart is loaded via CDN in index.html; declared in chart-global.d.ts
declare var Chart: any;

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('salesCanvas') salesCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('topProductsCanvas') topProductsCanvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusCanvas') statusCanvasRef!: ElementRef<HTMLCanvasElement>;

  stats: DashboardStats | null = null;
  isLoading = true;
  chartsReady = false;

  private salesChart: any;
  private topProductsChart: any;
  private statusChart: any;

  readonly STATUS_COLORS: Record<string, string> = {
    Placed: '#4a90d9',
    Processing: '#f5a623',
    Shipped: '#9b59b6',
    Delivered: '#27ae60',
    Cancelled: '#e74c3c'
  };

  constructor(
    private orderService: OrderService,
    public auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadStats();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    if (this.stats) {
      this.buildCharts();
    }
  }

  ngOnDestroy(): void {
    this.salesChart?.destroy();
    this.topProductsChart?.destroy();
    this.statusChart?.destroy();
  }

  loadStats(): void {
    this.isLoading = true;
    this.orderService.getDashboardStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
        if (this.chartsReady) {
          setTimeout(() => this.buildCharts(), 0);
        }
      },
      error: () => {
        this.toastr.error('Failed to load dashboard stats.');
        this.isLoading = false;
      }
    });
  }

  private buildCharts(): void {
    if (!this.stats) return;
    this.buildSalesChart();
    this.buildTopProductsChart();
    this.buildStatusChart();
  }

  private buildSalesChart(): void {
    const ctx = this.salesCanvasRef?.nativeElement;
    if (!ctx || !this.stats) return;

    this.salesChart?.destroy();

    const labels = this.stats.sales_over_time.map(d => {
      const dt = new Date(d.date);
      return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
    });
    const data = this.stats.sales_over_time.map(d => d.total);

    this.salesChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Revenue (₹)',
          data,
          fill: true,
          tension: 0.4,
          borderColor: '#f3a847',
          backgroundColor: 'rgba(243,168,71,0.12)',
          pointBackgroundColor: '#f3a847',
          pointRadius: 4,
          borderWidth: 2.5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx: any) => `₹${ctx.parsed.y.toLocaleString('en-IN')}`
            }
          }
        },
        scales: {
          x: { grid: { display: false } },
          y: {
            ticks: {
              callback: (v: number) => `₹${v.toLocaleString('en-IN')}`
            }
          }
        }
      }
    });
  }

  private buildTopProductsChart(): void {
    const ctx = this.topProductsCanvasRef?.nativeElement;
    if (!ctx || !this.stats) return;

    this.topProductsChart?.destroy();

    const labels = this.stats.top_products.map(p =>
      p.product_name.length > 20 ? p.product_name.substring(0, 18) + '…' : p.product_name
    );
    const data = this.stats.top_products.map(p => p.total_sold);

    this.topProductsChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Units Sold',
          data,
          backgroundColor: '#131921',
          borderRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true, ticks: { stepSize: 1 } }
        }
      }
    });
  }

  private buildStatusChart(): void {
    const ctx = this.statusCanvasRef?.nativeElement;
    if (!ctx || !this.stats) return;

    this.statusChart?.destroy();

    const labels = this.stats.status_breakdown.map(s => s.status);
    const data = this.stats.status_breakdown.map(s => s.count);
    const colors = labels.map(l => this.STATUS_COLORS[l] || '#aaa');

    this.statusChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: colors,
          hoverOffset: 8,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '60%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: { font: { size: 12 }, padding: 14 }
          }
        }
      }
    });
  }

  formatCurrency(value: number): string {
    return '₹' + value.toLocaleString('en-IN', { maximumFractionDigits: 0 });
  }
}
