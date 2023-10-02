import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { from, Observable } from 'rxjs';
import { Router } from '@angular/router';
import { Auth } from 'Backend/Auth/auth';
import * as bcrypt from 'bcryptjs';
import { StoreService } from '../../../../../Backend/Shared/store.service';
import { LoggerService } from '../../../../../Backend/Shared/logger.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // public responseData: BehaviorSubject<HttpResponse> = new BehaviorSubject<HttpResponse>({ status: 400, message: "Some Error Occured!" });
  public isLoggedIn = false
  // myData: BehaviorSubject<number> = new BehaviorSubject<number>(0);

  constructor(
    private router: Router,
    private DBAuth: Auth,
    private storeService: StoreService,
    private loggerService: LoggerService
  ) {}

  public async login(username: string, password: string) {
    const userData = await this.DBAuth.loginUser(username)
    return new Promise(async (resolve, reject) => {
      if (userData.length !== 0 && userData) {
        if (!await bcrypt.compare(password, userData[0].password)) {
          reject('Password is Incorrect')
        }
        else {
          const authData = {
            uid: userData[0].UID,
            userName: userData[0].userName,
            email: userData[0].email,
            type: userData[0].type,
            lastLogin: userData[0].last_login_date,
            expiration: new Date(new Date().getTime() + (24 * 60 * 60 * 1000)).toISOString()
          }
          await this.storeService.set('authData', authData)

          resolve({
            status: 200,
            ...authData
          })
        }
      }
      else {
        reject('Username Not Found')
      }
    })

  }


  public checkLogin(): Observable<boolean> {
    return from(new Promise<boolean>(async (resolve,reject) => {
      const authData = await this.storeService.get('authData')

      if (!authData) {
        reject(false)
        return
      }
      else {
        const currentDate = new Date().getTime()
        const expirationDate = new Date(authData.expiration).getTime()
          if (authData && (currentDate < expirationDate)) {
            resolve(true)
          }
          else {
            await this.storeService.delete('authData')
            reject(false)
          }
      }
    }))
  }

  public async logout() {
    this.loggerService.LogInfo('logout() Request Started.');
    try {
      await this.storeService.delete('authData');
      this.loggerService.LogInfo('logout() Request Completed.');
      this.router.navigate(['login']);
    } catch (error) {
      this.loggerService.LogError(error as string, "logout()")
    }


  }

} 