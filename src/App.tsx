import { Toaster as Sonner } from "@/components/ui/sonner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminPage from "./pages/Admin";
import Ultimas from "./pages/Ultimas";
import Artigo from "./pages/Artigo";
import Layout from "./components/Layout";

const App = () => (
  <>
    <Sonner richColors />
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Index />} />
          <Route path="/ultimas" element={<Ultimas />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/artigos/:slug" element={<Artigo />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </>
);

export default App;