import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthScreen from "./app/login/page";
import HomeVitrine from "./app/page";
import AdminDashboard from "./app/admin/page";
import ClientDashboard from "./app/cliente/page";
import PrivateRoute from "./routes/PrivateRoute";
import AdminScanner from "./app/admin/AdminScanner"; 

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<AuthScreen />} />

        {/* Rotas Protegidas */}
        <Route path="/" element={<HomeVitrine />} />
        <Route path="/cliente" element={<PrivateRoute><ClientDashboard /></PrivateRoute>} />

        {/* Rotas de Administração */}
        <Route path="/admin" element={<AdminDashboard />} />
        
        {/* /admin/scanner para abrir a câmera no seu celular */}
        <Route path="/admin/scanner" element={<AdminScanner />} />
        
        {/* Caso queira que o QR Code do cliente abra direto a baixa ao ser lido: */}
        <Route path="/admin/entrega/:id" element={<AdminScanner />} />
      </Routes>
    </BrowserRouter>
  );
}