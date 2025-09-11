interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
}

class ProductionAuth {
  private baseUrl: string = 'http://localhost:3001';
  private token: string | null = null;

  constructor() {
    // Try to load token from localStorage on initialization
    this.token = localStorage.getItem('auth_token');
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user_data', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: 'Network error during login'
      };
    }
  }

  async register(userData: LoginCredentials & { name: string }): Promise<AuthResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      return await response.json();
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: 'Network error during registration'
      };
    }
  }

  async verifyToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();
      return data.success || false;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  }

  async refreshToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const response = await fetch(`${this.baseUrl}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      });

      const data = await response.json();

      if (data.success && data.token) {
        this.token = data.token;
        localStorage.setItem('auth_token', data.token);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Token refresh error:', error);
      return false;
    }
  }

  getCurrentUser(): User | null {
    const userData = localStorage.getItem('user_data');
    if (userData) {
      try {
        return JSON.parse(userData);
      } catch {
        return null;
      }
    }
    return null;
  }

  getToken(): string | null {
    return this.token;
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

export const productionAuth = new ProductionAuth();
export default productionAuth;
