import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-user-register',
  templateUrl: './user-register.component.html',
  styleUrls: ['./user-register.component.css']
})
export class UserRegisterComponent {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  address = '';
  isSubmitting = false;

  private readonly apiUrl = `${environment.apiUrl}/userregister.php`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) {}

  register(): void {
    if (!this.name || !this.email || !this.password) {
      this.toastr.error('Name, email, and password are required.');
      return;
    }
    if (this.password.length < 6) {
      this.toastr.warning('Password must be at least 6 characters.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.toastr.warning('Passwords do not match.');
      return;
    }

    const userData = {
      name: this.name.trim(),
      email: this.email.trim(),
      password: this.password,
      address: this.address.trim()
    };

    this.isSubmitting = true;

    this.http.post(this.apiUrl, userData).subscribe({
      next: (response: any) => {
        this.isSubmitting = false;
        this.toastr.success(response.message || 'Registered successfully.');
        this.router.navigate(['/user-login']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.error || 'Registration failed. Please try again later.';
        this.toastr.error(errorMessage);
      }
    });
  }
}
