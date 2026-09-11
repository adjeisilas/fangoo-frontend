import type { DeliveryArea } from './delivery-area.js';
import type { FuelType } from './fuel.js';

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAID'
  | 'AWAITING_CONFIRMATION'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

/** Decimal columns serialize to strings over JSON. */
export interface OrderItem {
  id: string;
  fuelTypeId: string;
  pricePerLitre: string;
  quantity: string;
  lineTotal: string;
  fuelType: FuelType;
}

export interface CreateOrderInput {
  supplierId: string;
  deliveryAreaId: string;
  deliveryAddress: string;
  items: { fuelTypeId: string; quantity: number }[];
}

/** Whether the order came from the catalogue or from an awarded RFQ offer. */
export type OrderSource = 'CATALOGUE' | 'REQUEST';

export interface Order {
  id: string;
  customerId: string;
  supplierProfileId: string;
  deliveryAddress: string;
  deliveryFee: string;
  subtotal: string;
  totalAmount: string;
  status: OrderStatus;
  source: OrderSource;
  cancellationReason: string | null;
  rejectionReason: string | null;
  paidAt: string | null;
  confirmedAt: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  supplier: { id: string; companyName: string; userId: string };
  deliveryArea: DeliveryArea;
}

/**
 * Shape returned by `GET /orders/admin/all` — the marketplace-wide view, which
 * additionally resolves who bought and how the payment settled.
 */
export interface AdminOrder extends Order {
  customer: { id: string; firstName: string; lastName: string; email: string };
  payment: { status: string; paidAt: string | null } | null;
}
