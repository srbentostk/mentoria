
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

const ContactForm = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [gdprConsent, setGdprConsent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    // Don't prevent default as we want the form to actually submit
    if (!gdprConsent) {
      e.preventDefault();
      toast.error('Por favor, concorde com os termos para continuar.');
      return;
    }
    
    if (!email.includes('@') || !email.includes('.')) {
      e.preventDefault();
      toast.error('Por favor, insira um e-mail válido');
      return;
    }
    
    if (firstName.trim() === '') {
      e.preventDefault();
      toast.error('Por favor, insira seu nome');
      return;
    }
    
    if (phone.trim() === '') {
      e.preventDefault();
      toast.error('Por favor, insira seu telefone');
      return;
    }

    setIsSubmitting(true);
    toast.success('Formulário enviado com sucesso!');
    // Form will be submitted normally via HTML form action
  };

  return (
    <form 
      klicksend-form-id='eYuR0by' 
      autoComplete='off'  
      method="post" 
      action="//handler.send.hotmart.com/subscription/eYuR0by"
      onSubmit={handleSubmit}
      className="space-y-4 w-full rounded-lg p-6 bg-wood-gradient"
    >
      <div className="space-y-2">
        <Input
          type="email"
          autoComplete="off"
          name="email"
          id="email"
          placeholder="Seu melhor e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="bg-white/20 border-white/20 text-white placeholder:text-white/70 h-12 rounded-md"
        />
      </div>
      <div className="space-y-2">
        <Input
          type="text"
          autoComplete="off"
          name="first_name"
          id="first_name"
          placeholder="Nome completo"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          className="bg-white/20 border-white/20 text-white placeholder:text-white/70 h-12 rounded-md"
        />
      </div>
      <div className="space-y-2">
        <Input
          type="tel"
          autoComplete="off"
          name="phone"
          id="phone"
          placeholder="WhatsApp com DDD"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="bg-white/20 border-white/20 text-white placeholder:text-white/70 h-12 rounded-md"
        />
      </div>

      <div className="text-white/90 text-xs mt-4 text-left">
        <p>Esses dados serão utilizados para entrarmos em contato com você e disponibilizarmos mais conteúdos e ofertas.</p>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox 
          id="gdpr" 
          name="gdpr" 
          required
          value="Concordo em receber os e-mails"
          onCheckedChange={(checked) => setGdprConsent(checked === true)}
          className="bg-white/20 border-white/20 data-[state=checked]:bg-white"
        />
        <label 
          htmlFor="gdpr" 
          className="text-sm text-white/90 font-medium leading-none cursor-pointer">
          Concordo em receber os e-mails
        </label>
      </div>

      <div style={{ position: "absolute", left: "-5000px" }} aria-hidden="true">
        <Input 
          type="text" 
          autoComplete="new-password" 
          name="b_eYuR0by" 
          tabIndex={-1} 
          value="" 
        />
      </div>
      
      <Button 
        type="submit" 
        disabled={isSubmitting}
        className="w-full py-6 text-lg font-bold tracking-wider transition-all duration-300 bg-violet-900 hover:bg-violet-800 hover:scale-105 text-white"
      >
        {isSubmitting ? 'Processando...' : 'QUERO ENTRAR NA LISTA VIP!'}
      </Button>

      <script dangerouslySetInnerHTML={{ __html: `
        var pageParams = new URLSearchParams(window.location.search);
        var form = document.querySelector('form[klicksend-form-id="eYuR0by"]');
        var formActionUrl = new URL(form.action);
        var formActionSearchParams = formActionUrl.searchParams.size > 0 ? formActionUrl.searchParams.toString() + '&' : '';
        var combinedParams = formActionSearchParams + pageParams.toString();

        form.action = formActionUrl.origin + formActionUrl.pathname + '?' + combinedParams;
      `}}/>
    </form>
  );
};

export default ContactForm;
