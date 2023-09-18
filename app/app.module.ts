import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ErrorHandler, NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { JwtInterceptor } from './helpers/Http-Interceptor/jwt.interceptor';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { SharedModule } from './shared/shared.module';
import { NgxUiLoaderModule, NgxUiLoaderHttpModule, NgxUiLoaderRouterModule } from 'ngx-ui-loader';
import { DatabaseService } from '../../Backend/Shared/database.service';
import { StoreService } from '../../Backend/Shared/store.service';
import { GlobalErrorHandlerService } from './shared/services/global-error-handler.service';

// define a factory function that returns another function to initialize the database connection
// the initialization of the database connection is dependent on the store initialization
export function initializeDBConnectionService(dbService: DatabaseService, storeService: StoreService) {
  return (): Promise<any> => {
    // return a promise that will be resolved once the store is initialized and the database connection is established
    return storeService.initializeStore().then(() => dbService.initializeDbConnection());
  };
}

// define a factory function that returns another function to initialize the store
export function initializeStoreService(storeService: StoreService) {
  return (): Promise<any> => {    
    // return a promise that will be resolved once the store is initialized
    return storeService.initializeStore();
  };
}

@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    CommonModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    HttpClientModule,
    SharedModule,
    NgxUiLoaderModule.forRoot({
      hasProgressBar:false,
      text: 'Loading...',
      fgsType:'square-jelly-box'}), // import NgxUiLoaderModule
    NgxUiLoaderHttpModule.forRoot({
      showForeground:true,
      // exclude: ["http://localhost:5000/auth/check-login"]
    }),
  ],
  providers: [
    StoreService,
    // configure an APP_INITIALIZER provider for the store initialization
    {
      provide: APP_INITIALIZER,
      useFactory: initializeStoreService,
      deps: [StoreService],
      multi: true
    },
    DatabaseService,
    // configure an APP_INITIALIZER provider for the database connection initialization
    // the dependencies are listed in the same order they appear in the function definition
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
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
