import { ApplicationConfig, APP_INITIALIZER, ErrorHandler, importProvidersFrom } from '@angular/core';
import { provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxUiLoaderModule, NgxUiLoaderHttpModule, NgxUiLoaderRouterModule } from 'ngx-ui-loader';

import { routes } from './app-routing.config';
import { DatabaseService } from '../../Backend/Shared/database.service';
import { StoreService } from '../../Backend/Shared/store.service';
import { GlobalErrorHandlerService } from './shared/services/global-error-handler.service';
import { JwtInterceptor } from './helpers/Http-Interceptor/jwt.interceptor';

export function initializeStoreService(storeService: StoreService) {
  return (): Promise<void> => storeService.initializeStore();
}

export function initializeDBConnectionService(dbService: DatabaseService, storeService: StoreService) {
  return (): Promise<void> =>
    storeService.initializeStore().then(() => dbService.initializeDbConnection());
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimations(),
    provideHttpClient(),

    importProvidersFrom(
      NgxUiLoaderModule,
      NgxUiLoaderHttpModule,
      NgxUiLoaderRouterModule
    ),

    StoreService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeStoreService,
      deps: [StoreService],
      multi: true
    },
    DatabaseService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeDBConnectionService,
      deps: [DatabaseService, StoreService],
      multi: true
    },

    {
      provide: HTTP_INTERCEPTORS,
      useClass: JwtInterceptor,
      multi: true
    },

    { provide: ErrorHandler, useClass: GlobalErrorHandlerService }
  ]
};
