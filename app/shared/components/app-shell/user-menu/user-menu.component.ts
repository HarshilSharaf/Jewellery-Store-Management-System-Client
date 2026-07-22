import { ChangeDetectionStrategy, Component, ElementRef, HostListener, OnInit, ViewChild, effect, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideUser, lucideLogOut } from '@ng-icons/lucide';

import { AuthService } from '../../../services/Auth/auth.service';
import { UserService } from '../../../../modules/profile/services/user.service';
import { StoreService } from '../../../../../../Backend/Shared/store.service';
import { FileSystemService } from '../../../../../../Backend/Shared/file-system.service';
import { UtilityService } from '../../../../../../Backend/Shared/utitlity.service';
import { LoggerService } from '../../../../../../Backend/Shared/logger.service';

@Component({
  selector: 'app-user-menu',
  templateUrl: './user-menu.component.html',
  styleUrls: ['./user-menu.component.scss'],
  standalone: true,
  imports: [CommonModule, NgIcon],
  viewProviders: [provideIcons({ lucideUser, lucideLogOut })],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly userService = inject(UserService);
  private readonly store = inject(StoreService);
  private readonly fs = inject(FileSystemService);
  private readonly util = inject(UtilityService);
  private readonly logger = inject(LoggerService);

  readonly open = signal(false);
  readonly displayName = signal('');
  readonly image = signal('');
  private userId = 0;

  @ViewChild('root') rootRef?: ElementRef<HTMLElement>;

  constructor() {
    effect(() => { this.image.set(this.userService.userImage()); });
    effect(() => { this.displayName.set(this.userService.userName()); });
  }

  async ngOnInit(): Promise<void> {
    try {
      const authData: any = await this.store.get('authData');
      if (!authData) { return; }
      const uid = Number(authData.uid);
      if (!Number.isFinite(uid) || uid <= 0) { return; }
      this.userId = uid;
      this.userService.userName.set(authData.userName);
      this.displayName.set(authData.userName);
      const res: any = await this.userService.getUserImage(uid);
      if (Array.isArray(res) && res[0]?.imagePath) {
        const path = this.util.getFilePath(this.fs.userImagesDir + '\\' + res[0].imagePath);
        this.userService.userImage.set(path);
        this.image.set(path);
      }
    } catch (err) {
      this.logger.LogError(err as string, 'UserMenuComponent#ngOnInit');
    }
  }

  toggle(evt: Event): void {
    evt.stopPropagation();
    this.open.update(v => !v);
  }

  close(): void {
    this.open.set(false);
  }

  @HostListener('document:click', ['$event'])
  onDocClick(evt: MouseEvent): void {
    if (!this.open()) { return; }
    const target = evt.target as Node;
    if (this.rootRef?.nativeElement.contains(target)) { return; }
    this.close();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.open()) { this.close(); }
  }

  goToProfile(): void {
    this.close();
    this.router.navigate(['/profile']);
  }

  async logout(): Promise<void> {
    this.close();
    await this.auth.logout();
  }

  get initial(): string {
    const name = this.displayName();
    return (name && name.length) ? name.charAt(0).toUpperCase() : '?';
  }
}
