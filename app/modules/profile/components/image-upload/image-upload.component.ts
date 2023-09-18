import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-image-upload',
  templateUrl: './image-upload.component.html',
  styleUrls: ['./image-upload.component.scss']
})
export class ImageUploadComponent implements OnInit {

  @Input() activeColor: string = 'green';
  @Input()  baseColor: string = '#ccc';
  overlayColor: string = 'rgba(255,255,255,0.5)';
  
  dragging: boolean = false;
  loaded: boolean = false;
  imageLoaded: boolean = false;
  imageSrc: string = '';

  userPhoto:any
  constructor() { }

  ngOnInit(): void {
  }
  
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
      this.userPhoto= e.dataTransfer ? e.dataTransfer.files[0] : e.target.files[0];

      var pattern = /image-*/;
      var reader = new FileReader();

      if (!this.userPhoto.type.match(pattern)) {
          alert('invalid format');
          return;
      }

      this.loaded = false;

      reader.onload = this._handleReaderLoaded.bind(this);
      reader.readAsDataURL(this.userPhoto);
  }
  
  _handleReaderLoaded(e:any) {
      var reader = e.target;
      this.imageSrc = reader.result;
      this.loaded = true;
  }
}
