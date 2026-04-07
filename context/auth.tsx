import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { setAuthToken } from "@/lib/api";

// context/auth.tsx
type AuthContextType = {
  role: string | null;
  userId: string | null;
  userData: any; // replace with proper type later
  token: string | null;
  setAuth: (data: {
    role: string;
    userId: string;
    userData: any;
    token: string;
  }) => void;
  clearAuth: () => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  userId: null,
  userData: null,
  token: null,
  setAuth: () => {},
  clearAuth: () => {},
  isReady: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const setAuth = async ({
    role,
    userId,
    userData,
    token,
  }: {
    role: string;
    userId: string;
    userData: any;
    token: string;
  }) => {
    setRole(role);
    setUserId(userId);
    setUserData(userData);
    setToken(token);
    setAuthToken(token);
    await AsyncStorage.setItem("role", role);
    await AsyncStorage.setItem("userId", userId);
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
    await AsyncStorage.setItem("token", token);
  };

  const clearAuth = async () => {
    setRole(null);
    setUserId(null);
    setUserData(null);
    setToken(null);
    setAuthToken(null);
    await AsyncStorage.clear();
  };

  useEffect(() => {
    const loadStored = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUserData = await AsyncStorage.getItem("userData");
      const storedToken = await AsyncStorage.getItem("token");

      if (storedRole && storedUserId && storedUserData) {
        setRole(storedRole);
        setUserId(storedUserId);
        setUserData(JSON.parse(storedUserData));
      }
      if (storedToken) {
        setToken(storedToken);
        setAuthToken(storedToken);
      }
      setIsReady(true);
    };
    loadStored();
  }, []);

  return (
    <AuthContext.Provider
      value={{ role, userId, userData, token, setAuth, clearAuth, isReady }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
