import React from 'react';
import { Navigate } from 'react-router-dom';
import authService from '../services/authService';

const ProtectedRoute = ({ children }) =>
  authService.isAuthenticated() ? children : <Navigate to="/login" replace />;

export default ProtectedRoute;