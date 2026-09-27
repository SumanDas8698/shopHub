import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

interface AdminAuthResponse {
  message: string;
  admin: {
    id: number;
    username: string;
    email: string;
  };
}

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css']
})
export class AdminLoginComponent {
  email = '';
  password = '';
  isSubmitting = false;

  private readonly apiUrl = `${environment.apiUrl}/adminlogin.php`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.toastr.warning('Please enter both email and password.');
      return;
    }

    this.isSubmitting = true;

    this.http.post<AdminAuthResponse>(this.apiUrl, { email: this.email, password: this.password }).subscribe({
      next: (response) => {
        this.isSubmitting = false;
        this.auth.setAdmin(response.admin);
        this.toastr.success('Logged in successfully!');
        this.router.navigate(['/admin-dashboard']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.error || 'An unknown error occurred. Please try again.';
        this.toastr.error(errorMessage);
      }
    });
  }
}
