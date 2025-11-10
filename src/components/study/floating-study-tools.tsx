"use client";

import { useState, useEffect } from "react";
import { CheckSquare, Brain, StickyNote, X, Sparkles, ChevronRight } from "lucide-react";
import { ChecklistTab } from "./checklist-tab";
import { QuizTab } from "./quiz-tab";
import { NotesTab } from "./notes-tab";

type StudyTool = 'checklist' | 'quiz' | 'notes' | null;

type FloatingStudyToolsProps = {
  itemId: string;
  theme: {
    bg: string;
    text: string;
    secondary: string;
  };
};

export function FloatingStudyTools({ itemId, theme }: FloatingStudyToolsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTool, setActiveTool] = useState<StudyTool>(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Auto-hide on scroll down, show on scroll up (desktop only)
  useEffect(() => {
    if (isMobile) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsVisible(currentScrollY < lastScrollY || currentScrollY < 100);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY, isMobile]);

  const tools = [
    {
      id: 'checklist' as const,
      icon: CheckSquare,
      label: 'Checklist',
      description: 'Acompanhe seu progresso',
      gradient: 'from-emerald-500 to-teal-600',
      color: '#10b981',
      lightColor: '#d1fae5',
    },
    {
      id: 'quiz' as const,
      icon: Brain,
      label: 'Quiz',
      description: 'Teste seus conhecimentos',
      gradient: 'from-violet-500 to-purple-600',
      color: '#8b5cf6',
      lightColor: '#ede9fe',
    },
    {
      id: 'notes' as const,
      icon: StickyNote,
      label: 'Notas',
      description: 'Anote suas reflexões',
      gradient: 'from-amber-500 to-orange-600',
      color: '#f59e0b',
      lightColor: '#fef3c7',
    },
  ];

  const openTool = (tool: StudyTool) => {
    setActiveTool(tool);
    setIsOpen(false);
    // Prevent body scroll on mobile when sidebar is open
    if (isMobile) {
      document.body.style.overflow = 'hidden';
    }
  };

  const closeTool = () => {
    setActiveTool(null);
    // Restore body scroll
    document.body.style.overflow = '';
  };

  const toggleMenu = () => {
    if (activeTool) {
      closeTool();
    } else {
      setIsOpen(!isOpen);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <div 
        className={`fixed z-50 transition-all duration-500 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-24 opacity-0'
        } ${
          isMobile ? 'bottom-5 right-5' : 'bottom-8 right-8'
        }`}
      >
        {/* Speed Dial Menu */}
        <div className={`absolute flex flex-col transition-all duration-300 ${
          isMobile ? 'bottom-16 right-0 gap-2.5' : 'bottom-20 right-0 gap-3'
        } ${
          isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
        }`}>
          {tools.map((tool, index) => (
            <button
              key={tool.id}
              onClick={() => openTool(tool.id)}
              className="group flex items-center gap-3 animate-in fade-in slide-in-from-bottom-3"
              style={{
                animationDelay: `${index * 50}ms`,
                animationDuration: '300ms',
                animationFillMode: 'backwards',
              }}
            >
              {/* Label Card (Desktop only) */}
              {!isMobile && (
                <div
                  className="px-4 py-3 rounded-xl shadow-xl backdrop-blur-md transition-all duration-300 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 pointer-events-none min-w-[180px]"
                  style={{
                    background: `linear-gradient(135deg, ${theme.bg}f5 0%, ${theme.bg}e5 100%)`,
                    border: `1px solid ${theme.secondary}22`,
                  }}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold" style={{ color: theme.text }}>
                        {tool.label}
                      </p>
                      <p className="text-xs opacity-70" style={{ color: theme.secondary }}>
                        {tool.description}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50" />
                  </div>
                </div>
              )}
              
              {/* Icon Button with Gradient - Touch optimized for mobile */}
              <div
                className={`relative flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 bg-gradient-to-br ${tool.gradient} ${
                  isMobile ? 'w-12 h-12 rounded-xl' : 'w-14 h-14 rounded-2xl'
                }`}
                style={{
                  boxShadow: `0 8px 32px -4px ${tool.color}60, 0 0 0 1px ${tool.color}20`,
                  minWidth: '48px',
                  minHeight: '48px',
                }}
              >
                {/* Shine effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <tool.icon className={`text-white relative z-10 ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} />
                
                {/* Mobile label below icon */}
                {isMobile && (
                  <span 
                    className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap px-2 py-0.5 rounded-md backdrop-blur-sm"
                    style={{
                      backgroundColor: `${theme.bg}dd`,
                      color: theme.text,
                      border: `1px solid ${theme.secondary}22`,
                    }}
                  >
                    {tool.label}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Main FAB - Touch optimized */}
        <button
          onClick={toggleMenu}
          className={`relative overflow-hidden group transition-all duration-500 ease-out active:scale-90 ${
            isMobile 
              ? 'w-14 h-14 rounded-xl shadow-xl hover:shadow-2xl' 
              : 'w-16 h-16 rounded-2xl shadow-2xl hover:scale-105 active:scale-95'
          }`}
          style={{
            background: isOpen || activeTool 
              ? `linear-gradient(135deg, ${theme.secondary} 0%, ${theme.secondary}dd 100%)`
              : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
            boxShadow: isMobile 
              ? '0 8px 32px -4px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)'
              : '0 12px 48px -8px rgba(59, 130, 246, 0.5), 0 0 0 1px rgba(59, 130, 246, 0.1)',
            transform: isOpen ? 'rotate(45deg)' : activeTool ? 'rotate(180deg)' : 'rotate(0deg)',
            minWidth: '48px',
            minHeight: '48px',
          }}
          aria-label={isOpen ? 'Fechar menu' : 'Abrir ferramentas de estudo'}
        >
          {/* Animated gradient background */}
          <div 
            className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          />
          
          {/* Ripple effect on touch/hover */}
          <div className="absolute inset-0 rounded-2xl bg-white/0 group-active:bg-white/20 transition-colors duration-150" />
          
          {/* Icon */}
          {activeTool ? (
            <X className={`text-white relative z-10 transition-transform duration-300 ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} strokeWidth={2.5} />
          ) : (
            <Sparkles className={`text-white relative z-10 transition-transform duration-300 ${isMobile ? 'w-6 h-6' : 'w-7 h-7'}`} strokeWidth={2.5} />
          )}
          
          {/* Pulse animation when closed (reduced on mobile) */}
          {!isOpen && !activeTool && !isMobile && (
            <div className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-blue-400" style={{ animationDuration: '3s' }} />
          )}
        </button>
      </div>

      {/* Tool Modal/Sidebar */}
      {activeTool && (
        <>
          {/* Backdrop with blur */}
          <div
            className="fixed inset-0 z-40 backdrop-blur-sm animate-in fade-in duration-300"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
            onClick={closeTool}
          />

          {/* Sidebar - Full width on mobile */}
          <div
            className={`fixed top-0 right-0 bottom-0 z-50 shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500 ease-out ${
              isMobile ? 'w-full' : 'w-full sm:w-[520px]'
            }`}
            style={{
              backgroundColor: theme.bg,
              color: theme.text,
            }}
          >
            {/* Decorative gradient header */}
            <div 
              className={`bg-gradient-to-r ${
                tools.find(t => t.id === activeTool)?.gradient || 'from-blue-500 to-blue-600'
              } ${isMobile ? 'h-1' : 'h-1.5'}`}
            />

            {/* Header - Mobile optimized */}
            <div
              className="sticky top-0 z-10 backdrop-blur-xl"
              style={{
                background: `linear-gradient(180deg, ${theme.bg}ff 0%, ${theme.bg}f5 100%)`,
                borderBottom: `1px solid ${theme.secondary}15`,
              }}
            >
              <div className={isMobile ? 'px-5 py-4' : 'px-8 py-6'}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {/* Tool icon with gradient */}
                    <div
                      className={`flex items-center justify-center bg-gradient-to-br shadow-lg ${
                        tools.find(t => t.id === activeTool)?.gradient || 'from-blue-500 to-blue-600'
                      } ${isMobile ? 'w-10 h-10 rounded-lg' : 'w-12 h-12 rounded-xl'}`}
                    >
                      {activeTool === 'checklist' && <CheckSquare className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} />}
                      {activeTool === 'quiz' && <Brain className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} />}
                      {activeTool === 'notes' && <StickyNote className={`text-white ${isMobile ? 'w-5 h-5' : 'w-6 h-6'}`} strokeWidth={2.5} />}
                    </div>
                    
                    <div>
                      <h2 className={`font-bold tracking-tight ${isMobile ? 'text-lg' : 'text-2xl'}`} style={{ color: theme.text }}>
                        {tools.find(t => t.id === activeTool)?.label}
                      </h2>
                      <p className={`mt-0.5 opacity-70 ${isMobile ? 'text-xs' : 'text-sm'}`} style={{ color: theme.secondary }}>
                        {tools.find(t => t.id === activeTool)?.description}
                      </p>
                    </div>
                  </div>
                  
                  {/* Close button - Touch optimized */}
                  <button
                    onClick={closeTool}
                    className={`rounded-xl hover:bg-black/5 dark:hover:bg-white/5 flex items-center justify-center transition-all duration-200 active:scale-90 ${
                      isMobile ? 'w-10 h-10 min-w-[44px] min-h-[44px]' : 'w-10 h-10'
                    }`}
                    aria-label="Fechar"
                  >
                    <X className="w-5 h-5" strokeWidth={2} />
                  </button>
                </div>
              </div>
            </div>

            {/* Content with custom scrollbar - Mobile optimized padding */}
            <div 
              className={`overflow-y-auto ${isMobile ? 'px-5 py-5' : 'px-8 py-6'}`}
              style={{ 
                height: isMobile ? 'calc(100vh - 100px)' : 'calc(100vh - 120px)',
                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
              }}
            >
              {activeTool === 'checklist' && <ChecklistTab itemId={itemId} />}
              {activeTool === 'quiz' && <QuizTab itemId={itemId} />}
              {activeTool === 'notes' && <NotesTab itemId={itemId} />}
            </div>
          </div>

          {/* Custom scrollbar styles */}
          <style jsx global>{`
            .overflow-y-auto::-webkit-scrollbar {
              width: ${isMobile ? '4px' : '6px'};
            }
            .overflow-y-auto::-webkit-scrollbar-track {
              background: transparent;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb {
              background: ${theme.secondary}40;
              border-radius: 3px;
            }
            .overflow-y-auto::-webkit-scrollbar-thumb:hover {
              background: ${theme.secondary}60;
            }
          `}</style>
        </>
      )}
    </>
  );
}
