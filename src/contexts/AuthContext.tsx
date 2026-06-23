import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getGameService } from "@/services";
import type { User } from "@/services/types";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  signup: (u: string, p: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const svc = getGameService();
    setUser(svc.getCurrentUser());
    setLoading(false);
    return svc.onAuthChange(setUser);
  }, []);

  const svc = getGameService();
  const value: AuthContextValue = {
    user,
    loading,
    login: async (u, p) => {
      await svc.login(u, p);
    },
    signup: async (u, p) => {
      await svc.signup(u, p);
    },
    logout: async () => {
      await svc.logout();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
