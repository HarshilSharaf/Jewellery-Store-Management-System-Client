import { Injectable } from '@angular/core';
import { DbUserService } from 'Backend/Users/db-user.service';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  userImage = new BehaviorSubject<string>('')
  userName = new BehaviorSubject<string>('')

  constructor(private dbUserService:DbUserService) { }

  getUserDetails(userId:number): Observable<any> {
    return this.dbUserService.getUserDetails(userId)
  }

  updateUserDetails(userDetails:any): Observable<any> {
    return this.dbUserService.updateUserDetails(userDetails)
  }

  getUserImage(uid:number) {
    return this.dbUserService.getUserImage(uid)
  }

  updateUserImage(userDetails:any):Observable<any> {
    return this.dbUserService.updateUserImage(userDetails.uid, userDetails.image)
  }

  deleteUserImage(uid:number): Observable<any> {
    return this.dbUserService.deleteUserImage(uid)
  }
}
