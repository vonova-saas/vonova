import axios from 'axios';
import { Env } from '../config/env.config';
import { BadRequestException } from './appError';

// Auth service communication utilities
export const authServiceClient = {
  // Validate role change with auth service
  validateRoleChange: async (params: {
    userId: string;
    newRole: string;
    adminUserId: string;
  }) => {
    try {
      const response = await axios.post(
        `${Env.AUTH_SERVICE_URL}/auth/validate-role-change`,
        params,
        {
          headers: {
            'Content-Type': 'application/json',
            // Add service-to-service authentication if needed
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Auth service communication error:', error);
      throw new BadRequestException('Failed to validate role change with auth service');
    }
  },

  // Get user permissions from auth service
  getUserPermissions: async (userId: string) => {
    try {
      const response = await axios.get(
        `${Env.AUTH_SERVICE_URL}/user/${userId}/permissions`
      );
      return response.data.permissions;
    } catch (error) {
      console.error('Failed to get user permissions:', error);
      return [];
    }
  },

  // Verify JWT token with auth service
  verifyToken: async (token: string) => {
    try {
      const response = await axios.post(
        `${Env.AUTH_SERVICE_URL}/auth/verify-token`,
        { token }
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