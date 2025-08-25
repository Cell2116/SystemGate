import create from "zustand";
import axios from "axios";

interface UserLogin {
  id: number;
  name: string;
  username: string;
  department: string;
  role: string;
}

interface LoginCredential{
  username: string;
  password: string;
}

interface LoginResponse{
  success: boolean;
  message: string;
  user?: UserLogin;
  token?: string;
}

interface LoginStore{
  user: UserLogin | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  token: string | null;

  login:(credentials: LoginCredential) => Promise <LoginResponse>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
  setUser: (user: UserLogin | null) => void;
}

// Configure axios base URL
const API_BASE_URL = "http://192.168.4.62:3000";
axios.defaults.baseURL = API_BASE_URL;

export const useLoginStore = create <LoginStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  loading: false,
  error: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null, 

  // Login function
  login: async (credentials) => {
    set({ loading: true, error: null });

    try{
      const response = await axios.post("/auth/login", credentials);
      const { success, message, user, token } = response.data;

      if(success && user && token){
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('isLoggedIn', 'true'); // Add this for compatibility

        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        set({
          user,
          token,
          isAuthenticated: true,
          loading: false,
          error: null
        });
        //console.log(`Login Successful for user: ${user.name}`);
        return { success: true, message: "Login Successful", user, token };
      }
      else{
        set({
          loading: false,
          error: message || "Login Failed"
        });
        return { success: false, message: message || "Login Failed" };
      }
    }
    catch(error: any){
      const errorMessage = error?.response?.data?.message || error?.message || "Login Failed";
      set({
        loading: false,
        error: errorMessage
      });
      console.error("❌ Login Error: ", error);
      return { success: false, message: errorMessage };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn'); // Add this for compatibility
    localStorage.removeItem('userRole'); // Add this for compatibility
    delete axios.defaults.headers.common['Authorization'];
    
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null
    });
    
    //console.log("User logged out");
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) {
      set({ isAuthenticated: false, user: null, token: null });
      return false;
    }

    try {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Verify token with backend
      const response = await axios.get('/auth/me');
      if (response.data.success) {
        const user = JSON.parse(userStr);
        set({
          user,
          token,
          isAuthenticated: true,
          error: null
        });
        return true;
      } else {
        throw new Error('Token verification failed');
      }
    } catch (error) {
      console.error("❌ Auth check failed:", error);
      get().logout();
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  setUser: (user) => {
    set({ user });
    if(user){
      localStorage.setItem('user', JSON.stringify(user));
    }
  }
}));

// Initialize auth check
if(typeof window !== 'undefined'){
  useLoginStore.getState().checkAuth();
}