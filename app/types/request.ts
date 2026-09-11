import type { DeliveryArea } from './delivery-area.js';
import type { FuelType } from './fuel.js';
import type { Order } from './order.js';

export type RequestStatus = 'OPEN' | 'AWARDED' | 'CANCELLED' | 'EXPIRED';

export type OfferStatus =
  | 'PENDING'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'EXPIRED';

export interface RequestBuyer {
  id?: string;
  firstName: string;
  lastName: string;
  email?: string;
}

export interface OfferSupplier {
  id: string;
  companyName: string;
  city: string;
  userId: string;
}

/** Decimal columns serialize to strings over JSON. */
export interface Offer {
  id: string;
  requestId: string;
  supplierProfileId: string;
  pricePerLitre: string;
  availableQuantity: string;
  deliveryFee: string;
  deliveryDate: string;
  subtotal: string;
  totalAmount: string;
  notes: string | null;
  status: OfferStatus;
  createdAt: string;
  updatedAt: string;
  supplier: OfferSupplier;
}

/** A buyer's fuel requirement, with every bid it has attracted. */
export interface FuelRequest {
  id: string;
  buyerId: string;
  fuelTypeId: string;
  deliveryAreaId: string;
  deliveryAddress: string;
  quantityLitres: string;
  requiredBy: string;
  notes: string | null;
  status: RequestStatus;
  orderId: string | null;
  createdAt: string;
  updatedAt: string;
  fuelType: FuelType;
  deliveryArea: DeliveryArea;
  buyer: RequestBuyer;
  offers: Offer[];
}

/**
 * The supplier's marketplace feed. Rival bids are never sent — `offers` holds at
 * most this supplier's own bid, and `_count.offers` is the competition depth.
 */
export interface OpenRequest
  extends Omit<FuelRequest, 'offers' | 'buyer' | 'buyerId' | 'orderId'> {
  buyer: { firstName: string; lastName: string };
  offers: { id: string; status: OfferStatus; pricePerLitre: string }[];
  _count: { offers: number };
}

/** A supplier's own bid, carrying the brief it was made against. */
export interface MyOffer extends Omit<Offer, 'supplier'> {
  request: FuelRequest & { buyer: { firstName: string; lastName: string } };
}

export interface CreateRequestInput {
  fuelTypeId: string;
  deliveryAreaId: string;
  deliveryAddress: string;
  quantityLitres: number;
  requiredBy: string;
  notes?: string;
}

export interface CreateOfferInput {
  pricePerLitre: number;
  availableQuantity: number;
  deliveryFee?: number;
  deliveryDate: string;
  notes?: string;
}

export interface AwardResult {
  order: Order;
  offerId: string;
}
