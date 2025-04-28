
import { Check } from "lucide-react";

type BenefitItemProps = {
  number: string;
  title: string;
  description: string;
};

const BenefitItem = ({ number, title, description }: BenefitItemProps) => {
  return (
    <div className="flex space-x-4 items-start p-4 rounded-lg transition-all duration-300 hover:bg-white/5">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-anime-button flex items-center justify-center text-white font-bold">
        {number}
      </div>
      <div className="space-y-1">
        <h3 className="font-bold text-lg text-white">{title}</h3>
        <p className="text-white/80">{description}</p>
      </div>
    </div>
  );
};

const MentoriaSection = () => {
  const benefits = [
    {
      number: "1",
      title: "Plano personalizado",
      description: "Desenvolvo contigo um plano para te ajudar com os seus problemas específicos."
    },
    {
      number: "2",
      title: "Automações para seu negócio",
      description: "Desenvolvo algumas automações para ajudar no seu negócio e otimizar processos."
    },
    {
      number: "3",
      title: "Aproveite a IA ao máximo",
      description: "Te ensino a tirar o melhor proveito possível da Inteligência Artificial."
    },
    {
      number: "4",
      title: "Suporte detalhado",
      description: "Explico detalhadamente para você, basta entrar na lista de interessados."
    }
  ];

  return (
    <div className="w-full py-12">
      <div className="max-w-4xl mx-auto">
        <div className="space-y-2 text-center mb-10">
          <h2 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-anime-pink to-anime-violet">
            Mentoria
          </h2>
          <p className="text-white/70 max-w-lg mx-auto">
            Impulsione seus resultados com uma mentoria personalizada
          </p>
        </div>

        <div className="grid gap-6 mt-8">
          {benefits.map((benefit) => (
            <BenefitItem 
              key={benefit.number}
              number={benefit.number}
              title={benefit.title}
              description={benefit.description}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MentoriaSection;
