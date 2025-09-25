import axios from 'axios';
import { Env } from '../config/env.config';

// Auth service communication utilities
export const authServiceClient = {
  // Verify JWT token with auth service
  verifyToken: async (token: string) => {
    try {
      const response = await axios.post(
        `${Env.API_GATEWAY_SERVICE_URL}/app/auth/verify-and-permissions`,
        { token },
        { headers: { 'x-internal-key': Env.INTERNAL_API_SECRET_KEY } }
      );
      return response.data.data;
    } catch (error) {
      console.error('Token verification failed:', error);
      return null;
    }
  }
};

// JWT token utilities for user service
export const extractUserFromToken = (token: string) => {
  try {
    // Decode JWT without verification (auth service handles verification)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to extract user from token:', error);
    return null;
  }
};