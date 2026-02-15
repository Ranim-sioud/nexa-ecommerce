import React, { useEffect, useState } from 'react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun } from 'lucide-react';
import { Navbar } from './NavbarHome';

export function Layout({ 
  children, 
  onNavigate, 
  currentView 
}) {
    const [darkMode, setDarkMode] = useState(false);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            setDarkMode(true);
            document.documentElement.classList.add('dark');
        } else {
            setDarkMode(false);
            document.documentElement.classList.remove('dark');
        }
    }, []);

    const toggleDarkMode = () => {
        const newDarkMode = !darkMode;
        setDarkMode(newDarkMode);
        
        if (newDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    };

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode 
                ? 'bg-gray-900 text-gray-100' 
                : 'bg-gray-50 text-gray-900'
        } font-sans overflow-x-hidden`}>
            <script src="https://cdn.tailwindcss.com"></script>
            <script dangerouslySetInnerHTML={{__html: `
                tailwind.config = {
                    darkMode: 'class',
                    theme: {
                        extend: {
                            colors: {
                                primary: {
                                    50: '#f5f3ff',
                                    100: '#ede9fe',
                                    500: '#8b5cf6',
                                    600: '#7c3aed',
                                    700: '#6d28d9',
                                    900: '#4c1d95',
                                },
                                secondary: {
                                    50: '#f0fdfa',
                                    500: '#06b6d4',
                                    600: '#0891b2',
                                }
                            }
                        }
                    }
                }
            `}} />
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                body { font-family: 'Inter', sans-serif; }
                
                /* NOUVELLE PALETTE - THÈME BORDEAUX & INDIGO */
                .text-theme-primary { color: hsl(336 80% 45%); } /* Bordeaux/rouge profond */
                .bg-theme-primary { background: hsl(336 80% 45%); }
                .border-theme-primary { border-color: hsl(336 80% 45%); }
                .dark .text-theme-primary { color: hsl(336 80% 55%); }
                
                .text-theme-secondary { color: hsl(255 85% 60%); } /* Indigo/bleu violet */
                .bg-theme-secondary { background: hsl(255 85% 60%); }
                .border-theme-secondary { border-color: hsl(255 85% 60%); }
                .dark .text-theme-secondary { color: hsl(255 85% 70%); }
                
                .text-theme-white { color: hsl(240 5% 15%); }
                .dark .text-theme-white { color: hsl(0 0% 98%); }
                
                
                .text-theme-muted { color: hsl(0 0% 45%); }
                .bg-theme-muted-45 { background: hsl(0 0% 45%); }
                .border-theme-muted { border-color: hsl(0 0% 45%); }
                .dark .text-theme-muted { color: hsl(0 0% 70%); }
                
                .text-theme-light { color: hsl(0 0% 60%); }
                .bg-theme-light { background: hsl(0 0% 60%); }
                .border-theme-light { border-color: hsl(0 0% 60%); }
                .dark .text-theme-light { color: hsl(0 0% 40%); }
                
                .bg-theme-card { background: hsl(0 0% 100%); }
                .dark .bg-theme-card { background: hsl(217 33% 17%); }
                
                .bg-theme-section { background: white; }
                .dark .bg-theme-section { background: hsl(220 33% 15%); }
                
                .bg-theme-muted { background: hsl(0 0% 96%); }
                .dark .bg-theme-muted { background: hsl(215 25% 27%); }
                
                .border-theme { border-color: hsl(0 0% 87%); }
                .dark .border-theme { border-color: hsl(0 0% 25%); }

                .btn-inscrit {
                    color: hsl(240 5% 15%);
                    border: 1px solid hsl(0 0% 87%);
                    background: rgba(255, 255, 255, 0.85);
                }
                .dark .btn-inscrit {
                      color: hsla(0, 0%, 100%, 1.00);
                      border: 1px solid hsla(0, 0%, 100%, 1.00);
                      background: rgba(30, 41, 59, 0.9);
                }

                .border-theme-light { border-color: hsl(0 0% 93%); }
                .dark .border-theme-light { border-color: hsl(0 0% 20%); }
            
                /* Glass panels */
                .glass-panel {
                    background: rgba(255, 255, 255, 0.85);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 8px 32px rgba(190, 49, 68, 0.08);
                }
                
                .dark .glass-panel {
                    background: rgba(30, 41, 59, 0.85);
                    border: 1px solid rgba(255, 255, 255, 0.08);
                    box-shadow: 0 8px 32px rgba(190, 49, 68, 0.15);
                }
            
                .glass-input {
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(0, 0, 0, 0.12);
                    color: inherit;
                }
                
                .dark .glass-input {
                    background: rgba(30, 41, 59, 0.9);
                    border: 1px solid rgba(255, 255, 255, 0.12);
                }
            
                /* Dégradés Bordeaux & Indigo */
                .text-gradient {
                    background: linear-gradient(135deg, hsl(336 80% 45%) 0%, hsl(255 85% 60%) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
            
                .bg-gradient-primary {
                    background: linear-gradient(135deg, hsl(336 80% 45%) 0%, hsl(255 85% 60%) 100%);
                }
            
                .shadow-glow { 
                    box-shadow: 0 0 40px -10px rgba(190, 49, 68, 0.4); 
                }
            
                .shadow-theme { 
                    box-shadow: 0 4px 20px rgba(190, 49, 68, 0.1); 
                }
                .dark .shadow-theme { 
                    box-shadow: 0 4px 20px rgba(190, 49, 68, 0.2); 
                }
            
                /* Nouvelles couleurs pour badges et icônes */
                .bg-blue-500 { background: hsl(217 91% 60%); }
                .text-blue-500 { color: hsl(217 91% 60%); }
                .dark .bg-blue-500 { background: hsl(217 91% 50%); }
                .dark .text-blue-500 { color: hsl(217 91% 70%); }
            
                .bg-purple-500 { background: hsl(269 97% 65%); }
                .text-purple-500 { color: hsl(269 97% 65%); }
                .dark .bg-purple-500 { background: hsl(269 97% 55%); }
                .dark .text-purple-500 { color: hsl(269 97% 75%); }
            
                .bg-orange-500 { background: hsl(25 95% 53%); }
                .text-orange-500 { color: hsl(25 95% 53%); }
                .dark .bg-orange-500 { background: hsl(25 95% 43%); }
                .dark .text-orange-500 { color: hsl(25 95% 63%); }
            
                .bg-pink-500 { background: hsl(330 81% 60%); }
                .text-pink-500 { color: hsl(330 81% 60%); }
                .dark .bg-pink-500 { background: hsl(330 81% 50%); }
                .dark .text-pink-500 { color: hsl(330 81% 70%); }
            
                .bg-cyan-500 { background: hsl(187 85% 53%); }
                .text-cyan-500 { color: hsl(187 85% 53%); }
                .dark .bg-cyan-500 { background: hsl(187 85% 43%); }
                .dark .text-cyan-500 { color: hsl(187 85% 63%); }
            
                /* Couleurs de fond pour icônes */
                .bg-blue-100 { background: hsl(217 91% 95%); }
                .bg-purple-100 { background: hsl(269 97% 95%); }
                .bg-orange-100 { background: hsl(25 95% 95%); }
                .bg-pink-100 { background: hsl(330 81% 95%); }
                .bg-cyan-100 { background: hsl(187 85% 95%); }
                .bg-bordeaux-100 { background: hsl(336 80% 95%); }
                .bg-indigo-100 { background: hsl(255 85% 95%); }
                
                .dark .bg-blue-100 { background: hsl(217 30% 20%); }
                .dark .bg-purple-100 { background: hsl(269 30% 20%); }
                .dark .bg-orange-100 { background: hsl(25 30% 20%); }
                .dark .bg-pink-100 { background: hsl(330 30% 20%); }
                .dark .bg-cyan-100 { background: hsl(187 30% 20%); }
                .dark .bg-bordeaux-100 { background: hsl(336 30% 20%); }
                .dark .bg-indigo-100 { background: hsl(255 30% 20%); }
            
                .scroll-container::-webkit-scrollbar { display: none; }
                .scroll-container { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            <Navbar onNavigate={onNavigate} toggleDarkMode={toggleDarkMode} darkMode={darkMode} />
            {/* Bouton Dark/Light Mode */}
            

            {children}
        </div>
    );
};
