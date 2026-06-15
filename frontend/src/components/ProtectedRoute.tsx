import React from 'react';
import { Navigate } from 'react-router-dom';
import { isLoggedIn, isAdmin } from '../utils/api';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export default function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  if (!isLoggedIn()) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
