import { Component, Input, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideCloudUpload } from '@ng-icons/lucide';
import { AppToastService } from '../../../../shared/services/AppToast/app-toast.service';


@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss'],
  standalone: true,
  imports: [NgIcon],
  viewProviders: [provideIcons({ lucideCloudUpload })],
})
export class ImageUploadComponent {
  private readonly toast = inject(AppToastService);

  @Input() activeColor: string = 'green';
  @Input()  baseColor: string = '#ccc';
  overlayColor: string = 'rgba(255,255,255,0.5)';

  dragging: boolean = false;
  loaded: boolean = false;
  imageLoaded: boolean = false;
  imageSrc: string = '';

  customerPhoto: any = null;

  handleDragEnter() {
      this.dragging = true;
  }

  handleDragLeave() {
      this.dragging = false;
  }

  handleDrop(e:any) {
      e.preventDefault();
      this.dragging = false;
      this.handleInputChange(e);
  }

  handleImageLoad() {
      this.imageLoaded = true;
  }

  handleInputChange(e:any) {
      const nextPhoto = e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];
      if (!nextPhoto) {
          return;
      }

      const imagePattern = /^image\//;
      if (!imagePattern.test(nextPhoto.type)) {
          this.toast.error('Please choose an image file (jpg, png, gif, webp, etc.).', 'Unsupported file type');
          return;
      }

      this.customerPhoto = nextPhoto;
      this.loaded = false;

      const reader = new FileReader();
      reader.onload = this._handleReaderLoaded.bind(this);
      reader.readAsDataURL(this.customerPhoto);
  }

  _handleReaderLoaded(e:any) {
      const reader = e.target;
      this.imageSrc = reader.result;
      this.loaded = true;
  }
}
