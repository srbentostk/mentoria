
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
    <div className="relative min-h-screen w-full overflow-x-hidden grid-card">
      <AnimeBackground />
      
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-transparent bg-clip-text bg-wood-gradient tracking-tight">
            Mentoria Especializada
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-lg md:text-xl mb-8">
            As inscrições para formação estão encerradas, entre na lista de espera
          </p>
        </div>

        {/* Main Content - Form on left, image on right */}
        <div className="grid md:grid-cols-2 gap-8 items-center max-w-5xl mx-auto mb-16 rounded-xl overflow-hidden">
          <div className="w-full space-y-2">
            <ContactForm />
            
            {/* Benefits section */}
            <div className="text-left mt-6 pl-4">
              <h3 className="font-bold text-anime-wood mb-3 text-xl">Ao entrar na lista, você:</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-anime-wood">●</div>
                  <span>Recebe o aviso antes de todo mundo</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-anime-wood">●</div>
                  <span>Pode ter acesso a bônus exclusivos da próxima turma</span>
                </li>
                <li className="flex items-start">
                  <div className="mr-2 mt-1 text-anime-wood">●</div>
                  <span>Não corre o risco de ficar de fora de novo</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Image on right */}
          <div className="w-full h-full flex justify-center items-center">
            <div className="relative w-full max-w-md">
              <img 
                src="/lovable-uploads/0835c64e-81de-4568-981a-a0e3f4c2379b.png" 
                alt="Mentor especializado em estilo anime" 
                className="rounded-xl shadow-2xl"
              />
              <div className="absolute -bottom-4 -right-4 bg-anime-wood text-white py-2 px-4 rounded-lg font-bold transform rotate-3">
                Especialista
              </div>
            </div>
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
      <div className="absolute top-40 -left-32 w-64 h-64 bg-anime-wood rounded-full opacity-10 blur-3xl animate-float"></div>
      <div className="absolute bottom-40 -right-32 w-80 h-80 bg-anime-blue rounded-full opacity-10 blur-3xl animate-float" style={{ animationDelay: '-3s' }}></div>
    </div>
  );
};

export default Index;
