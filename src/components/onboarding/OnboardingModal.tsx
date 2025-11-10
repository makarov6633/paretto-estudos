"use client";

import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useOnboarding } from "./useOnboarding";
import { X, BookOpen, Sparkles, Target, Crown, Check } from "lucide-react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const CATEGORIES = [
  "Psicologia",
  "Finanças",
  "Neurociência",
  "Filosofia",
  "História",
  "Economia",
  "Autoajuda",
  "Ciência",
  "Tecnologia",
  "Literatura",
];

const READING_TIMES = [
  { value: "short", label: "Curto (10-15 min)", icon: "⚡" },
  { value: "medium", label: "Médio (20-30 min)", icon: "📚" },
  { value: "long", label: "Longo (30+ min)", icon: "🎯" },
];

export function OnboardingModal() {
  const { data: session } = useSession();
  const {
    hasCompletedOnboarding,
    currentStep,
    selectedCategories,
    preferredReadingTime,
    setCompleted,
    setStep,
    setCategories,
    setReadingTime,
  } = useOnboarding();

  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (session?.user && !hasCompletedOnboarding) {
      setTimeout(() => setIsOpen(true), 1000);
    }
  }, [session, hasCompletedOnboarding]);

  const toggleCategory = (category: string) => {
    if (selectedCategories.includes(category)) {
      setCategories(selectedCategories.filter((c) => c !== category));
    } else {
      setCategories([...selectedCategories, category]);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    setCompleted(true);
    setIsOpen(false);
  };

  const handleComplete = async () => {
    try {
      await fetch("/api/user/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          categories: selectedCategories,
          readingTime: preferredReadingTime,
        }),
      });
    } catch (error) {
      console.error("Failed to save preferences:", error);
    }

    setCompleted(true);
    setIsOpen(false);
  };

  if (!isOpen || !session?.user) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleSkip}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Progress Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[0, 1, 2, 3].map((step) => (
              <div
                key={step}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  step <= currentStep ? "bg-primary" : "bg-secondary/20"
                }`}
              />
            ))}
          </div>

          {/* Step 0: Welcome */}
          {currentStep === 0 && (
            <div className="text-center">
              <div className="mb-6">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-primary" />
                <h1 className="text-3xl font-bold mb-3">
                  Bem-vindo ao Paretto Estudos!
                </h1>
                <p className="text-muted-foreground text-lg">
                  Vamos personalizar sua experiência de aprendizado em apenas alguns passos
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 my-8">
                <div className="p-4 bg-accent/50 rounded-lg">
                  <BookOpen className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">20/95</h3>
                  <p className="text-sm text-muted-foreground">
                    95% do conteúdo em 20% do tamanho
                  </p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Personalizado</h3>
                  <p className="text-sm text-muted-foreground">
                    Recomendações feitas para você
                  </p>
                </div>
                <div className="p-4 bg-accent/50 rounded-lg">
                  <Crown className="w-8 h-8 mx-auto mb-2 text-primary" />
                  <h3 className="font-semibold mb-1">Premium</h3>
                  <p className="text-sm text-muted-foreground">
                    Ilimitado ou 5 grátis/mês
                  </p>
                </div>
              </div>

              <Button onClick={handleNext} size="lg" className="mt-4">
                Vamos começar
              </Button>
            </div>
          )}

          {/* Step 1: Choose Categories */}
          {currentStep === 1 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Quais assuntos te interessam?
              </h2>
              <p className="text-muted-foreground mb-6">
                Selecione pelo menos 3 categorias para receber recomendações personalizadas
              </p>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`p-4 rounded-lg border-2 transition-all text-left ${
                      selectedCategories.includes(category)
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category}</span>
                      {selectedCategories.includes(category) && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(0)}
                >
                  Voltar
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={selectedCategories.length < 3}
                  className="flex-1"
                >
                  Continuar ({selectedCategories.length}/3)
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Reading Time Preference */}
          {currentStep === 2 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Quanto tempo você tem para ler?
              </h2>
              <p className="text-muted-foreground mb-6">
                Ajudaremos você a encontrar resumos que cabem na sua rotina
              </p>

              <div className="space-y-3 mb-6">
                {READING_TIMES.map((time) => (
                  <button
                    key={time.value}
                    onClick={() => setReadingTime(time.value)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      preferredReadingTime === time.value
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{time.icon}</span>
                      <div className="flex-1">
                        <p className="font-medium">{time.label}</p>
                      </div>
                      {preferredReadingTime === time.value && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                >
                  Voltar
                </Button>
                <Button onClick={handleNext} className="flex-1">
                  Continuar
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Plans Explanation */}
          {currentStep === 3 && (
            <div>
              <h2 className="text-2xl font-bold mb-3">
                Escolha seu plano
              </h2>
              <p className="text-muted-foreground mb-6">
                Experimente gratuitamente ou desbloqueie acesso ilimitado
              </p>

              <div className="grid md:grid-cols-2 gap-4 mb-6">
                {/* Free Plan */}
                <div className="p-6 rounded-lg border-2 border-border">
                  <Badge variant="outline" className="mb-3">
                    Grátis
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">Plano Gratuito</h3>
                  <p className="text-3xl font-bold mb-4">
                    R$ 0<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>5 resumos por mês</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>Acesso completo aos resumos</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>Ferramentas de estudo</span>
                    </li>
                  </ul>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleComplete}
                  >
                    Começar Grátis
                  </Button>
                </div>

                {/* Premium Plan */}
                <div className="p-6 rounded-lg border-2 border-primary bg-primary/5 relative">
                  <Badge className="mb-3">
                    Recomendado
                  </Badge>
                  <h3 className="text-xl font-bold mb-2">Plano Premium</h3>
                  <p className="text-3xl font-bold mb-4">
                    R$ 15<span className="text-sm font-normal text-muted-foreground">/mês</span>
                  </p>
                  <ul className="space-y-2 mb-4 text-sm">
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span className="font-medium">Resumos ilimitados</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>Todos os recursos do plano grátis</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>Recomendações personalizadas</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <span>Suporte prioritário</span>
                    </li>
                  </ul>
                  <Button className="w-full" onClick={handleComplete}>
                    Ir para Premium
                  </Button>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                >
                  Voltar
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
