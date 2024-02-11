import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss'
})
export class SkeletonLoaderComponent {
  _count = 1;
  _shapeOfLoader:'circle' | 'line' | 'custom-content' | '' = '';
  _theme = {};
  _animation = 'pulse';

  @Input() set count(countOfLoader: number) {
    this._count = countOfLoader;
  }

  @Input() set shapeOfLoader(shape: 'circle' | 'line' | 'custom-content' | '') {
    this._shapeOfLoader = shape;
  }

  @Input() set theme(themeOfLoader: object) {
    this._theme = { ...themeOfLoader };
  }

  @Input() set animation(animationType: string) {
    this._animation = animationType ?? this._animation;
  }
}
