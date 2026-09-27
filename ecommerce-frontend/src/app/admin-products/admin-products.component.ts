import { Component, OnInit } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { ProductService, Product, Category } from '../services/product.service';

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  filteredProducts: Product[] = [];
  categories: Category[] = [];
  isLoading = true;
  searchTerm = '';

  // Edit modal state
  showEditModal = false;
  editForm: Partial<Product> = {};
  isUpdating = false;

  constructor(
    private productService: ProductService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.productService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => {}
    });
  }

  loadProducts(): void {
    this.isLoading = true;
    this.productService.getProducts().subscribe({
      next: (products) => {
        this.products = products;
        this.applySearch();
        this.isLoading = false;
      },
      error: () => {
        this.toastr.error('Failed to load products.');
        this.isLoading = false;
      }
    });
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = term
      ? this.products.filter(p => p.name.toLowerCase().includes(term) || (p.category_name ?? '').toLowerCase().includes(term))
      : [...this.products];
  }

  imageSrc(url: string): string {
    return this.productService.imageSrc(url);
  }

  discountPercent(p: Product): number | null {
    if (!p.mrp || p.mrp <= p.price) return null;
    return Math.round(((p.mrp - p.price) / p.mrp) * 100);
  }

  openEdit(product: Product): void {
    this.editForm = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: product.price,
      mrp: product.mrp ?? undefined,
      stock: product.stock,
      category_id: product.category_id ?? undefined
    };
    this.showEditModal = true;
  }

  closeEdit(): void {
    this.showEditModal = false;
    this.editForm = {};
  }

  saveEdit(): void {
    if (!this.editForm.name || !this.editForm.price) {
      this.toastr.warning('Name and price are required.');
      return;
    }
    this.isUpdating = true;
    this.productService.updateProduct(this.editForm).subscribe({
      next: () => {
        this.isUpdating = false;
        this.toastr.success('Product updated.');
        this.closeEdit();
        this.loadProducts();
      },
      error: (err) => {
        this.isUpdating = false;
        this.toastr.error(err?.error?.error || 'Update failed.');
      }
    });
  }

  delete(product: Product): void {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    this.productService.deleteProduct(product.id).subscribe({
      next: () => {
        this.toastr.success('Product deleted.');
        this.loadProducts();
      },
      error: (err) => this.toastr.error(err?.error?.error || 'Delete failed.')
    });
  }

  categoryName(id: number | null | undefined): string {
    if (!id) return '—';
    return this.categories.find(c => c.id === id)?.name ?? '—';
  }
}
