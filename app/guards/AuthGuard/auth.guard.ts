import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { AuthService } from '../../shared/services/Auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  async canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<boolean> {
    try {
      const isLoggedIn = await this.authService.checkLogin();
      return isLoggedIn;
    } catch (error) {
      console.log("Error From checkLogin:", error);
      this.router.navigate(['/login']);
      return false;
    }
  }
}
