import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { AppToastService } from './app-toast.service';

describe('AppToastService', () => {
  let service: AppToastService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppToastService] });
    service = TestBed.inject(AppToastService);
  });

  it('show() appends a toast item and returns its id', () => {
    const id = service.show({ title: 'Saved', variant: 'success', timer: 0 });
    expect(service.items().length).toBe(1);
    expect(service.items()[0].id).toBe(id);
    expect(service.items()[0].variant).toBe('success');
  });

  it('auto-dismisses after timer elapses', fakeAsync(() => {
    service.show({ title: 'Saved', variant: 'success', timer: 1000 });
    expect(service.items().length).toBe(1);
    tick(1000);
    expect(service.items().length).toBe(0);
  }));

  it('caps visible toasts at 3 (oldest evicted)', () => {
    service.show({ title: 'A', timer: 0 });
    service.show({ title: 'B', timer: 0 });
    service.show({ title: 'C', timer: 0 });
    service.show({ title: 'D', timer: 0 });
    const titles = service.items().map((t) => t.title);
    expect(service.items().length).toBe(3);
    expect(titles).toEqual(['B', 'C', 'D']);
  });

  it('dismiss(id) removes the specific toast', () => {
    const idA = service.show({ title: 'A', timer: 0 });
    service.show({ title: 'B', timer: 0 });
    service.dismiss(idA);
    const titles = service.items().map((t) => t.title);
    expect(titles).toEqual(['B']);
  });

  it('success/error/warning/info helpers set the variant', () => {
    service.success('OK', undefined, { timer: 0 });
    service.error('Bad', undefined, { timer: 0 });
    service.warning('Warn', undefined, { timer: 0 });
    const variants = service.items().map((t) => t.variant);
    expect(variants).toEqual(['success', 'error', 'warning']);
  });
});
