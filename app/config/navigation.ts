export interface NavItem {
  label: string;
  to: string;
  icon: string;
  /** Rendered but not yet backed by an endpoint — routed nowhere until it is. */
  planned?: boolean;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export interface WorkspaceConfig {
  /** Short word that tells the user which side of the marketplace they are on. */
  kind: 'Admin' | 'Supplier';
  tagline: string;
  home: string;
  groups: NavGroup[];
}

/**
 * Admin controls and monitors the marketplace; the supplier runs a business inside
 * it. Same shell and design system, deliberately different information architecture.
 */
export const adminWorkspace: WorkspaceConfig = {
  kind: 'Admin',
  tagline: 'Marketplace control',
  home: '/admin',
  groups: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', to: '/admin', icon: 'gauge' }],
    },
    {
      label: 'Marketplace',
      items: [
        { label: 'Requests', to: '/admin/requests', icon: 'spark' },
        { label: 'Orders', to: '/admin/orders', icon: 'truck' },
        { label: 'Fuel products', to: '/admin/catalogue', icon: 'droplet' },
      ],
    },
    {
      label: 'Participants',
      items: [
        { label: 'Suppliers', to: '/admin/suppliers', icon: 'building' },
        { label: 'Buyers', to: '/admin/users', icon: 'user' },
      ],
    },
    {
      label: 'Money',
      items: [{ label: 'Payments', to: '/admin/payments', icon: 'wallet' }],
    },
  ],
};

export const supplierWorkspace: WorkspaceConfig = {
  kind: 'Supplier',
  tagline: 'Sell and fulfil',
  home: '/supplier',
  groups: [
    {
      label: 'Overview',
      items: [{ label: 'Dashboard', to: '/supplier', icon: 'gauge' }],
    },
    {
      label: 'Win business',
      items: [
        { label: 'Marketplace requests', to: '/supplier/requests', icon: 'spark' },
        { label: 'My offers', to: '/supplier/offers', icon: 'wallet' },
        { label: 'My listings', to: '/supplier/fuel-listings', icon: 'droplet' },
      ],
    },
    {
      label: 'Fulfil',
      items: [
        { label: 'Orders', to: '/supplier/orders', icon: 'truck' },
        { label: 'Delivery coverage', to: '/supplier/delivery-areas', icon: 'mapPin' },
      ],
    },
    {
      label: 'Business',
      items: [{ label: 'Company profile', to: '/supplier/profile', icon: 'building' }],
    },
  ],
};
