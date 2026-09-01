import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CanActivateFn } from '@angular/router';

import { authGuard } from './auth.guard';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: jasmine.createSpy('navigate') } }
      ]
    });
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});
