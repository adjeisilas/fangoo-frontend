export interface Review {
  id: string;
  orderId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  customer: { firstName: string; lastName: string };
}

export interface SupplierReviews {
  reviews: Review[];
  averageRating: number | null;
  totalReviews: number;
}

export const useReviews = () => {
  const api = useApi();

  const createReview = (payload: {
    orderId: string;
    rating: number;
    comment?: string;
  }) => api.post<Review>('/reviews', payload);

  const getSupplierReviews = (supplierId: string) =>
    api.get<SupplierReviews>(`/reviews/suppliers/${supplierId}`);

  const getReviewForOrder = (orderId: string) =>
    api.get<Review | null>(`/reviews/orders/${orderId}`);

  return { createReview, getSupplierReviews, getReviewForOrder };
};
