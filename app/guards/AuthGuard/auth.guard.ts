import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { catchError, map, Observable, of, retry } from 'rxjs';
import { AuthService } from 'src/app/shared/services/Auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) { }

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean | Observable<boolean> {

    // return new Observable<boolean>(obs => {

    //   this.authService.checkLogin().subscribe({
    //     next: (response: HttpResponse) => {
    //       if (response.status == 200) { obs.next(true) }
    //       else {
    //         this.router.navigate(['/login'])
    //         obs.next(false)
    //       }
    //     },
    //     error: (error) =>{
    //       console.log("Error From check Login:",error)
    //       this.router.navigate(['/login'])
    //       obs.next(false)
    //     }
    //   })

    // })


    return this.authService.checkLogin().pipe(
      retry(1),
      map(() => true),
      catchError(() => {
        this.router.navigate(['/login']);
        return of(false);
      })
    );
   

  }
  
}
