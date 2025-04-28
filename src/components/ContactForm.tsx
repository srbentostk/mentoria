
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const ContactForm = () => {
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate email
    if (!email.includes('@') || !email.includes('.')) {
      toast.error('Por favor, insira um e-mail válido');
      setIsSubmitting(false);
      return;
    }

    // Validate WhatsApp (basic validation for Brazil)
    if (whatsapp.replace(/\D/g, '').length < 10) {
      toast.error('Por favor, insira um número de WhatsApp válido');
      setIsSubmitting(false);
      return;
    }

    // Simulate form submission
    setTimeout(() => {
      toast.success('Você entrou na lista de espera!');
      setEmail('');
      setWhatsapp('');
      setIsSubmitting(false);
    }, 1500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full">
      <div className="space-y-2">
        <Input
          type="email"
          placeholder="Seu melhor e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
        />
      </div>
      <div className="space-y-2">
        <Input
          type="tel"
          placeholder="Seu WhatsApp"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          required
          className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-12"
        />
      </div>
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-6 text-lg font-bold transition-all duration-300 bg-anime-button hover:opacity-90 hover:scale-105 animate-pulse-slow anime-glow"
      >
        {isSubmitting ? 'Processando...' : 'Entrar na lista'}
      </Button>
    </form>
  );
};

export default ContactForm;
