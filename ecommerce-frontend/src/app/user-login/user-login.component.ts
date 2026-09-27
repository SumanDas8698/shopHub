import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-user-login',
  templateUrl: './user-login.component.html',
  styleUrls: ['./user-login.component.css']
})
export class UserLoginComponent {
  email = '';
  password = '';
  isSubmitting = false;

  private readonly apiUrl = `${environment.apiUrl}/userlogin.php`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router,
    private auth: AuthService
  ) {}

  login(): void {
    if (!this.email || !this.password) {
      this.toastr.error('Email and password are required.');
      return;
    }

    this.isSubmitting = true;

    this.http.post(this.apiUrl, { email: this.email, password: this.password }).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        if (response.user) {
          this.auth.setUser(response.user);
          this.toastr.success(response.message || 'Logged in successfully.');
          this.router.navigate(['/']);
        } else {
          this.toastr.error(response.error || 'Invalid email or password.');
        }
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.error || 'Login failed. Please try again later.';
        this.toastr.error(errorMessage);
      }
    });
  }
}
