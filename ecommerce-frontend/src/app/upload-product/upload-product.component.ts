import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { ProductService, Category } from '../services/product.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-upload-product',
  templateUrl: './upload-product.component.html',
  styleUrls: ['./upload-product.component.css']
})
export class UploadProductComponent implements OnInit {
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  name = '';
  description = '';
  price: number | null = null;
  mrp: number | null = null;
  stock: number | null = null;
  categoryId = '';
  image: File | null = null;
  imagePreview: string | null = null;

  categories: Category[] = [];
  isSubmitting = false;

  constructor(
    private productService: ProductService,
    private auth: AuthService,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.productService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: () => this.toastr.warning('Could not load categories. You can still upload without one.')
    });
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.image = input.files[0];
      const reader = new FileReader();
      reader.onload = () => (this.imagePreview = reader.result as string);
      reader.readAsDataURL(this.image);
    }
  }

  resetForm(): void {
    this.name = '';
    this.description = '';
    this.price = null;
    this.mrp = null;
    this.stock = null;
    this.categoryId = '';
    this.image = null;
    this.imagePreview = null;
    if (this.fileInput) {
      this.fileInput.nativeElement.value = '';
    }
  }

  upload(): void {
    if (!this.name || !this.description || !this.price || this.price <= 0 || !this.image) {
      this.toastr.error('Please fill in name, description, price, and select an image.');
      return;
    }

    const admin = this.auth.currentAdmin;
    if (!admin?.id) {
      this.toastr.error('Admin not logged in. Please log in again.');
      return;
    }

    const formData = new FormData();
    formData.append('name', this.name);
    formData.append('description', this.description);
    formData.append('price', this.price.toString());
    if (this.mrp) formData.append('mrp', this.mrp.toString());
    formData.append('stock', (this.stock ?? 0).toString());
    if (this.categoryId) formData.append('category_id', this.categoryId);
    formData.append('admin_id', admin.id.toString());
    formData.append('image', this.image, this.image.name);

    this.isSubmitting = true;

    this.productService.uploadProduct(formData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.toastr.success(response.message || 'Product uploaded successfully.');
        this.resetForm();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.error || 'Upload failed. Please try again.';
        this.toastr.error(errorMessage);
      }
    });
  }
}
