import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { Loader2 } from "lucide-react";

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  const EMAIL_ADMIN = "raislanitalo62@gmail.com";

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      // Verifica se está logado E se o e-mail é o do admin
      if (session?.user && session.user.email === EMAIL_ADMIN) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user && session.user.email === EMAIL_ADMIN) {
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-red-500 animate-spin" />
      </div>
    );
  }

  // Se não for o admin, joga para a tela de login do admin
  return isAuthenticated ? children : <Navigate to="/admin/login" />;
}