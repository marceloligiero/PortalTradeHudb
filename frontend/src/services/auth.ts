import api from '../lib/axios';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  user: {
    id: number;
    email: string;
    full_name: string;
    role: string;
    is_active: boolean;
  };
}

export const authApi = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    console.log('Sending login request:', { username: data.email, password: '***' });
    try {
      const response = await api.post('/auth/login', {
        username: data.email,
        password: data.password,
      });
      console.log('Login success:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      throw error;
    }
  },

  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};
