import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface AppUser {
  id: number;
  name: string;
  email: string;
  address?: string;
}

export interface AppAdmin {
  id: number;
  username: string;
  email: string;
}

const USER_KEY = 'user';
const ADMIN_KEY = 'admin';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userSubject = new BehaviorSubject<AppUser | null>(this.readUser());
  private adminSubject = new BehaviorSubject<AppAdmin | null>(this.readAdmin());

  user$ = this.userSubject.asObservable();
  admin$ = this.adminSubject.asObservable();

  private readUser(): AppUser | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  }

  private readAdmin(): AppAdmin | null {
    const raw = localStorage.getItem(ADMIN_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw);
      return parsed && parsed.id ? parsed : null;
    } catch {
      return null;
    }
  }

  get currentUser(): AppUser | null {
    return this.userSubject.value;
  }

  get currentAdmin(): AppAdmin | null {
    return this.adminSubject.value;
  }

  isUserLoggedIn(): boolean {
    return !!this.userSubject.value?.id;
  }

  isAdminLoggedIn(): boolean {
    return !!this.adminSubject.value?.id;
  }

  setUser(user: AppUser): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.userSubject.next(user);
  }

  setAdmin(admin: AppAdmin): void {
    localStorage.setItem(ADMIN_KEY, JSON.stringify(admin));
    this.adminSubject.next(admin);
  }

  logoutUser(): void {
    localStorage.removeItem(USER_KEY);
    this.userSubject.next(null);
  }

  logoutAdmin(): void {
    localStorage.removeItem(ADMIN_KEY);
    this.adminSubject.next(null);
  }
}
