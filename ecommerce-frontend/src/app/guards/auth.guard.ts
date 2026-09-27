import { Injectable } from '@angular/core';
import { CanActivate, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastrService } from 'ngx-toastr';

@Injectable({
  providedIn: 'root'
})
export class AdminGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isAdminLoggedIn()) {
      return true;
    }
    this.toastr.warning('Please log in as an admin to continue.');
    return this.router.createUrlTree(['/admin-login']);
  }
}

@Injectable({
  providedIn: 'root'
})
export class UserGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {}

  canActivate(): boolean | UrlTree {
    if (this.auth.isUserLoggedIn()) {
      return true;
    }
    this.toastr.warning('Please log in to continue.');
    return this.router.createUrlTree(['/user-login']);
  }
}
