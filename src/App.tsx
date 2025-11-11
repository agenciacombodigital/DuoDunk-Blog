import { Toaster as Sonner } from "@/components/ui/sonner";
import { Routes, Route, useLocation } from "react-router-dom";
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
import NBAScoreboardV2 from "./components/NBAScoreboardV2";
import Times from "./pages/Times";
import Time from "./pages/Time";
import Classificacao from './pages/Classificacao';
import Privacidade from './pages/Privacidade';
import Cookies from './pages/Cookies';
import ScrollToTop from './components/ScrollToTop';
import Calendario from './pages/Calendario';
import Estatisticas from './pages/Estatisticas'; // Importando a nova página

const AppContent = () => {
  const location = useLocation();
  // Verifica se a rota é de administrador para aplicar estilos e esconder Header/Footer
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className={`min-h-screen flex flex-col ${isAdminRoute ? 'bg-black' : 'bg-white'}`}>
      <ScrollToTop /> {/* Adicionando o ScrollToTop aqui */}
      {!isAdminRoute && (
        <>
          <Header />
          <NBAScoreboardV2 />
        </>
      )}
      <main className="flex-grow">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/ultimas" element={<Ultimas />} />
          <Route path="/artigos/:slug" element={<Artigo />} />
          <Route path="/times" element={<Times />} />
          <Route path="/times/:teamSlug" element={<Time />} />
          <Route path="/classificacao" element={<Classificacao />} />
          <Route path="/calendario" element={<Calendario />} />
          <Route path="/estatisticas" element={<Estatisticas />} /> {/* Nova Rota */}
          <Route path="/privacidade" element={<Privacidade />} />
          <Route path="/cookies" element={<Cookies />} />
          
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
    <AppContent />
  </>
);

export default App;