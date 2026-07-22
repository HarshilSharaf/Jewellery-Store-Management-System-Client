import { TestBed } from '@angular/core/testing';
import { AppDialogService } from './app-dialog.service';

describe('AppDialogService', () => {
  let service: AppDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [AppDialogService] });
    service = TestBed.inject(AppDialogService);
  });

  it('resolves with isConfirmed=true when confirmActive() is called', async () => {
    const promise = service.fire({ title: 'Save?' });
    expect(service.isOpen()).toBe(true);
    await service.confirmActive();
    const result = await promise;
    expect(result.isConfirmed).toBe(true);
    expect(result.isDismissed).toBe(false);
    expect(service.isOpen()).toBe(false);
  });

  it('resolves with isDismissed=true when dismissActive() is called', async () => {
    const promise = service.fire({ title: 'Save?', showCancelButton: true });
    service.dismissActive();
    const result = await promise;
    expect(result.isConfirmed).toBe(false);
    expect(result.isDismissed).toBe(true);
  });

  it('prompt() resolves with the input value when confirmed', async () => {
    const promise = service.prompt('Enter your name');
    service.setInputValue('Alice');
    await service.confirmActive();
    const value = await promise;
    expect(value).toBe('Alice');
  });

  it('prompt() resolves with null when dismissed', async () => {
    const promise = service.prompt('Enter your name');
    service.setInputValue('Alice');
    service.dismissActive();
    const value = await promise;
    expect(value).toBeNull();
  });

  it('danger() defaults variant to danger and returns boolean on confirm', async () => {
    const promise = service.danger('Delete customer?', 'Cannot be undone.');
    expect(service.active()?.options.variant).toBe('danger');
    expect(service.active()?.options.showCancelButton).toBe(true);
    await service.confirmActive();
    const confirmed = await promise;
    expect(confirmed).toBe(true);
  });

  it('inputValidator blocks confirm and surfaces error', async () => {
    const promise = service.fire({
      title: 'Amount',
      input: 'text',
      inputValidator: (v) => (v ? null : 'Required'),
    });
    service.setInputValue('');
    await service.confirmActive();
    expect(service.isOpen()).toBe(true);
    expect(service.active()?.inputError).toBe('Required');
    service.setInputValue('10');
    await service.confirmActive();
    const result = await promise;
    expect(result.isConfirmed).toBe(true);
    expect(result.value).toBe('10');
  });
});
