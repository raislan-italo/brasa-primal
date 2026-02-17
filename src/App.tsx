import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthScreen from "./views/pages/AuthScreen";
import Home from "./views/pages/Home";
import AdminDashboard from "./views/pages/AdminDashboard";
import AreaClient from "./views/pages/AreaClient";
import PrivateRoute from "./routes/PrivateRoute";
import AdminScanner from "./views/pages/AdminScanner";
import AdminRoute from "./routes/AdminRoute";
import AdminAuthScreen from "./views/pages/adminAuthScreen";
import BotaoInstalarApp from "./views/components/ui/BotaoInstalarApp";

export default function App() {
  return (
    <BrowserRouter>
      <BotaoInstalarApp />
      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<AuthScreen />} />

        {/* Rotas Protegidas */}
        <Route path="/admin/login" element={<AdminAuthScreen />} />

        <Route
          path="/cliente"
          element={
            <PrivateRoute>
              <AreaClient />
            </PrivateRoute>
          }
        />

        {/* Rotas de Administração */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/scanner"
          element={
            <AdminRoute>
              <AdminScanner />
            </AdminRoute>
          }
        />

        <Route
          path="/admin/entrega/:id"
          element={
            <AdminRoute>
              <AdminScanner />
            </AdminRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
