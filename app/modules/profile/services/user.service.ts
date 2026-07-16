import { Injectable, signal } from '@angular/core';
import { DbUserService } from 'Backend/Users/db-user.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  readonly userImage = signal<string>('');
  readonly userName = signal<string>('');

  constructor(private dbUserService:DbUserService) { }

  getUserDetails(userId:number): Promise<any> {
    return this.dbUserService.getUserDetails(userId)
  }

  updateUserDetails(userDetails:any): Promise<any> {
    return this.dbUserService.updateUserDetails(userDetails)
  }

  getUserImage(uid:number): Promise<any> {
    return this.dbUserService.getUserImage(uid)
  }

  updateUserImage(userDetails:any): Promise<any> {
    return this.dbUserService.updateUserImage(userDetails.uid, userDetails.image)
  }

  deleteUserImage(uid:number): Promise<any> {
    return this.dbUserService.deleteUserImage(uid)
  }
}
