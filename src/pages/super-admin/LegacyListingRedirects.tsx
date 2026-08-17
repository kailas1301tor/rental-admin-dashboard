import { Navigate, useParams } from 'react-router-dom';

export function LegacyProductRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/listings?kind=product" replace />;
  return <Navigate to={`/listings/products/${id}`} replace />;
}

export function LegacyServiceRedirect() {
  const { id } = useParams<{ id: string }>();
  if (!id) return <Navigate to="/listings?kind=service" replace />;
  return <Navigate to={`/listings/services/${id}`} replace />;
}
