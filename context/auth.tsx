import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

// context/auth.tsx
type AuthContextType = {
  role: string | null;
  userId: string | null;
  userData: any; // replace with proper type later
  setAuth: (data: { role: string; userId: string; userData: any }) => void;
  clearAuth: () => void;
  isReady: boolean;
};

const AuthContext = createContext<AuthContextType>({
  role: null,
  userId: null,
  userData: null,
  setAuth: () => {},
  clearAuth: () => {},
  isReady: false,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [isReady, setIsReady] = useState(false);

  const setAuth = async ({
    role,
    userId,
    userData,
  }: {
    role: string;
    userId: string;
    userData: any;
  }) => {
    setRole(role);
    setUserId(userId);
    setUserData(userData);
    await AsyncStorage.setItem("role", role);
    await AsyncStorage.setItem("userId", userId);
    await AsyncStorage.setItem("userData", JSON.stringify(userData));
  };

  const clearAuth = async () => {
    setRole(null);
    setUserId(null);
    setUserData(null);
    await AsyncStorage.clear();
  };

  useEffect(() => {
    const loadStored = async () => {
      const storedRole = await AsyncStorage.getItem("role");
      const storedUserId = await AsyncStorage.getItem("userId");
      const storedUserData = await AsyncStorage.getItem("userData");

      if (storedRole && storedUserId && storedUserData) {
        setRole(storedRole);
        setUserId(storedUserId);
        setUserData(JSON.parse(storedUserData));
      }
      setIsReady(true);
    };
    loadStored();
  }, []);

  return (
    <AuthContext.Provider
      value={{ role, userId, userData, setAuth, clearAuth, isReady }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
