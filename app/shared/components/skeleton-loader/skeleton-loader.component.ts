import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrl: './skeleton-loader.component.scss',
  standalone: true,
  imports: [NgxSkeletonLoaderModule],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class SkeletonLoaderComponent {
  _count = 1;
  _shapeOfLoader:'circle' | 'line' | 'custom-content' | '' = '';
  _theme = {};
  _animation: false | 'progress' | 'progress-dark' | 'pulse' | 'pulse-dark' = 'pulse';

  @Input() set count(countOfLoader: number) {
    this._count = countOfLoader;
  }

  @Input() set shapeOfLoader(shape: 'circle' | 'line' | 'custom-content' | '') {
    this._shapeOfLoader = shape;
  }

  @Input() set theme(themeOfLoader: object) {
    this._theme = { ...themeOfLoader };
  }

  @Input() set animation(animationType: false | 'progress' | 'progress-dark' | 'pulse' | 'pulse-dark') {
    this._animation = animationType ?? 'pulse';
  }
}
