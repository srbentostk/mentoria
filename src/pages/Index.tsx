
import { useEffect } from "react";
import ContactForm from "@/components/ContactForm";
import VideoSection from "@/components/VideoSection";
import MentoriaSection from "@/components/MentoriaSection";
import AnimeBackground from "@/components/AnimeBackground";
import { toast } from "sonner";

const Index = () => {
  useEffect(() => {
    // Welcome message
    const timer = setTimeout(() => {
      toast("Bem-vindo à nossa mentoria!", {
        description: "Entre na lista de espera para mais informações.",
      });
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden anime-bg">
      <AnimeBackground />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col items-center justify-center text-center mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-white via-anime-pink to-anime-violet animate-pulse-slow">
            Mentoria Especializada
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl">
            Descubra como potencializar seus resultados com inteligência artificial e automações personalizadas para o seu negócio
          </p>
        </div>

        {/* Video and Form Section */}
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-16 anime-card p-8 rounded-xl shadow-xl">
          <div className="w-full h-full">
            <VideoSection />
          </div>
          <div className="w-full space-y-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">
                Entre para nossa lista de espera
              </h2>
              <p className="text-white/70">
                Preencha o formulário abaixo para receber informações exclusivas sobre a mentoria
              </p>
            </div>
            <ContactForm />
          </div>
        </div>

        {/* Mentoria Section */}
        <div className="max-w-5xl mx-auto">
          <MentoriaSection />
        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-white/10">
          <div className="text-center text-white/50 text-sm">
            © 2025 Mentoria Especializada. Todos os direitos reservados.
          </div>
        </div>
      </div>
      
      {/* Decorative elements */}
      <div className="absolute top-40 -left-32 w-64 h-64 bg-anime-purple rounded-full opacity-10 blur-3xl animate-float"></div>
      <div className="absolute bottom-40 -right-32 w-80 h-80 bg-anime-blue rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
    </div>
  );
};

export default Index;
