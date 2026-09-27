import { Component } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { ToastrService } from 'ngx-toastr';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

interface AdminRegistrationData {
  username: string;
  email: string;
  password: string;
}

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['./admin-register.component.css']
})
export class AdminRegisterComponent {
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;

  private readonly apiUrl = `${environment.apiUrl}/adminregister.php`;

  constructor(
    private http: HttpClient,
    private toastr: ToastrService,
    private router: Router
  ) {}

  register(): void {
    if (!this.username || !this.email || !this.password) {
      this.toastr.warning('All fields are required.');
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

    const registrationData: AdminRegistrationData = {
      username: this.username.trim(),
      email: this.email.trim(),
      password: this.password
    };

    this.isSubmitting = true;

    this.http.post(this.apiUrl, registrationData).subscribe({
      next: () => {
        this.isSubmitting = false;
        this.toastr.success('Registered successfully! Please log in.');
        this.router.navigate(['/admin-login']);
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting = false;
        const errorMessage = err.error?.error || 'Registration failed. Please try again.';
        this.toastr.error(errorMessage);
      }
    });
  }
}
