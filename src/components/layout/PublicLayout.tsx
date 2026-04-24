import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

const PublicLayout = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <Outlet />
    </main>
    <Footer />
    {/* Floating support CTA — only on public pages */}
    <WhatsAppButton />
  </div>
);

export default PublicLayout;
