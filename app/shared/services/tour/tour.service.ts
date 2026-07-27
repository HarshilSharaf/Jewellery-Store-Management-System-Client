import { Injectable } from '@angular/core';
import { driver, type DriveStep } from 'driver.js';

/**
 * Thin Angular wrapper around driver.js (MIT, zero-dependency). Renders its own
 * highlight + popover, so no design-system UI package is needed. Tours are
 * anchored to `[data-tour="..."]` attributes in the templates; steps whose
 * anchor is not currently in the DOM are skipped (e.g. the dashboard setup
 * checklist disappears once every step is complete), so a tour never stalls on
 * a missing element.
 */
@Injectable({ providedIn: 'root' })
export class TourService {

  /** Orientation tour for the dashboard / main app surfaces. */
  runDashboardTour(): void {
    const candidates: Array<{ sel?: string; step: DriveStep }> = [
      {
        step: {
          popover: {
            title: $localize`:@@tour.welcome.title:Welcome to your shop`,
            description: $localize`:@@tour.welcome.desc:A quick tour of where things are. You can replay this anytime from Settings.`,
          },
        },
      },
      {
        sel: '[data-tour="checklist"]',
        step: {
          element: '[data-tour="checklist"]',
          popover: {
            title: $localize`:@@tour.checklist.title:Your setup checklist`,
            description: $localize`:@@tour.checklist.desc:Finish these steps to get going. It disappears once everything is done.`,
          },
        },
      },
      {
        sel: '[data-tour="rate"]',
        step: {
          element: '[data-tour="rate"]',
          popover: {
            title: $localize`:@@tour.rate.title:Lock the daily rate`,
            description: $localize`:@@tour.rate.desc:Set today's gold rate here each morning — every bill uses it.`,
          },
        },
      },
      {
        sel: '[data-tour="invoices"]',
        step: {
          element: '[data-tour="invoices"]',
          popover: {
            title: $localize`:@@tour.invoices.title:Recent sales`,
            description: $localize`:@@tour.invoices.desc:Your latest invoices show up here. Click any row to open it.`,
          },
        },
      },
      {
        sel: '[data-tour="kpis"]',
        step: {
          element: '[data-tour="kpis"]',
          popover: {
            title: $localize`:@@tour.kpis.title:Key numbers`,
            description: $localize`:@@tour.kpis.desc:Customers, stock and pending payments at a glance.`,
          },
        },
      },
    ];

    const steps = candidates
      .filter((c) => !c.sel || document.querySelector(c.sel))
      .map((c) => c.step);

    // Nothing to show (unlikely — the intro step is always present).
    if (!steps.length) { return; }

    const d = driver({
      showProgress: true,
      allowClose: true,
      overlayOpacity: 0.55,
      nextBtnText: $localize`:@@tour.next:Next`,
      prevBtnText: $localize`:@@tour.prev:Back`,
      doneBtnText: $localize`:@@tour.done:Done`,
      steps,
    });
    d.drive();
  }
}
