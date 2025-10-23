import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/Admin";
import Ultimas from "./pages/Ultimas";
import Artigo from "./pages/Artigo";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AdminLogin from "./pages/AdminLogin";
import ProtectedRoute from "./components/ProtectedRoute";
import EditArticle from "./pages/EditArticle";
import AdminManual from "./pages/AdminManual";
import AdminRodadaNBA from "./pages/AdminRodadaNBA";
import NBAScoreboard from "./components/NBAScoreboard";
import TeamsPage from "./pages/Teams";
import Time from "./pages/Time";

const AppContent = () => {
  const location = useLocation();
  // Verifica se a rota é de administrador para aplicar estilos e esconder Header/Footer
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen flex flex-col ${isAdminRoute ? 'bg-black' : 'bg-white'}`}>
      {!isAdminRoute && (
        <>
          <Header />
          <NBAScoreboard />
        </>
      )}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ultimas" element={<Ultimas />} />
          <Route path="/artigos/:slug" element={<Artigo />} />
          <Route path="/times" element={<TeamsPage />} />
          <Route path="/times/:teamSlug" element={<Time />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute>
                <AdminPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/editar/:slug" 
            element={
              <ProtectedRoute>
                <EditArticle />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/manual" 
            element={
              <ProtectedRoute>
                <AdminManual />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/rodada-nba" 
            element={
              <ProtectedRoute>
                <AdminRodadaNBA />
              </ProtectedRoute>
            } 
          />

          {/* Not Found Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => (
  <>
    <Sonner richColors />
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  </>
);

export default App;