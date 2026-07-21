export interface RailItem {
  label: string;
  icon: string;
  route: string;
}

export function primaryNavItems(): RailItem[] {
  return [
    { label: $localize`:@@rail.today:Today`,     icon: 'lucideLayoutDashboard', route: '/dashboard' },
    { label: $localize`:@@rail.sell:Sell`,       icon: 'lucideShoppingCart',    route: '/orders' },
    { label: $localize`:@@rail.stock:Stock`,     icon: 'lucidePackage',         route: '/inventory' },
    { label: $localize`:@@rail.people:People`,   icon: 'lucideUsers',           route: '/customers' },
    { label: $localize`:@@rail.schemes:Schemes`, icon: 'lucidePiggyBank',       route: '/saving-schemes' },
    { label: $localize`:@@rail.karigar:Karigar`, icon: 'lucideHammer',          route: '/karigar' },
    { label: $localize`:@@rail.repair:Repair`,   icon: 'lucideWrench',          route: '/repair' },
    { label: $localize`:@@rail.catalog:Catalog`, icon: 'lucideTags',            route: '/categories' },
    { label: $localize`:@@rail.reports:Reports`, icon: 'lucideChartLine',       route: '/reports' },
  ];
}

export function settingsNavItem(): RailItem {
  return { label: $localize`:@@rail.settings:Settings`, icon: 'lucideSettings', route: '/settings' };
}
