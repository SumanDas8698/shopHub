import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  mrp: number | null;
  image_url: string;
  category_id: number | null;
  category_name?: string;
  category_slug?: string;
  stock: number;
  rating: number;
  rating_count: number;
  admin_id?: number;
  created_at?: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getProducts(filters?: { category?: string; q?: string }): Observable<Product[]> {
    const params: string[] = [];
    if (filters?.category) params.push(`category=${encodeURIComponent(filters.category)}`);
    if (filters?.q) params.push(`q=${encodeURIComponent(filters.q)}`);
    const query = params.length ? '?' + params.join('&') : '';
    return this.http.get<Product[]>(`${this.apiUrl}/getproducts.php${query}`);
  }

  getProduct(id: number): Observable<Product> {
    return this.http.get<Product>(`${this.apiUrl}/getproduct.php?id=${id}`);
  }

  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.apiUrl}/getcategories.php`);
  }

  uploadProduct(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/uploadproduct.php`, formData);
  }

  updateProduct(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/updateproduct.php`, payload);
  }

  deleteProduct(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/deleteproduct.php`, { id });
  }

  imageSrc(imageUrl: string): string {
    if (!imageUrl) return '';
    return environment.assetUrl + imageUrl;
  }
}
