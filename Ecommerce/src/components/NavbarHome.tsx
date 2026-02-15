import { Button } from "./ui/button";
import { Menu, Moon, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";

export function Navbar ({ onNavigate, toggleDarkMode, darkMode }) {
    const [isOpen, setIsOpen] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const navigate = useNavigate();

     useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10); // Déclenche plus tôt
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (href) => {
        onNavigate('landing');
        setIsOpen(false);
        if (href.startsWith('#')) {
            setTimeout(() => {
                const element = document.querySelector(href);
                if (element) element.scrollIntoView({ behavior: 'smooth' });
            }, 100);
        }
    };

    const navItems = [
        { label: "Accueil", href: "#hero" },
        { label: "Processus", href: "#process" },
        { label: "Catalogue", href: "#catalogue" },
        { label: "Packs", href: "#pricing" },
        { label: "Parrainage", href: "#parrainage" },
        { label: "Promotion", href: "#promotion" },
        { label: "Publicité", href: "#publicite" },
    ];

    return (
        <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
            isScrolled 
                ? darkMode
                    ? 'bg-gray-900 backdrop-blur-2xl shadow-2xl border-b border-gray-700/50' // Dark mode: transparent + flou
                    : 'bg-white shadow-2xl border-b border-gray-200' // Light mode: opaque
                : 'bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-theme'
        }`}>
            <div className="container mx-auto px-6 h-20 flex items-center justify-between relative z-10">
                {/* Logo */}
                <div onClick={() => navigate('/')} className="cursor-pointer flex items-center gap-3 group">
                    <img 
                        src={logo} 
                        alt="Nexa Logo" 
                        className="w-16 h-16 object-contain group-hover:scale-110 transition-transform"
                    />
                    {/* <div className="w-10 h-10 bg-gradient-primary rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:scale-110 transition-transform">N</div> */}
                    <span className="text-2xl font-black text-theme-white tracking-tight">Nexa</span>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-6 lg:gap-8">
                    {navItems.map((item) => (
                        <button 
                            key={item.label}
                            onClick={() => handleNavClick(item.href)}
                            className="text-sm font-bold text-theme-white hover:text-theme-secondary transition-colors uppercase tracking-wider relative group"
                        >
                            {item.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-theme-secondary transition-all group-hover:w-full"></span>
                        </button>
                    ))}
                    
                    <div className="h-6 w-px bg-theme mx-2"></div>

                    <button 
                        onClick={() => navigate('/login')}
                        className="text-sm font-bold text-theme-white hover:text-theme-secondary transition-colors"
                    >
                        Connexion
                    </button>
                    <Button 
                        onClick={() => navigate('/auth/signup')}
                        className="btn-inscrit hover:bg-theme-secondary h-10 px-6 rounded-full text-sm shadow-theme border border-theme"
                        size="sm"
                    >
                        Inscription
                    </Button>
                    <button 
                        onClick={toggleDarkMode}
                        className={` p-3 rounded-full transition-all duration-300 ${
                            darkMode 
                                ? 'bg-theme-secondary text-white hover:bg-yellow-300 shadow-lg' 
                                : 'border border-theme-secondary text-theme-secondary hover:bg-gray-700 shadow-lg'
                        } hover:scale-110 border border-gray-300 dark:border-gray-600`}
                        aria-label="Toggle dark mode"
                    >
                        {darkMode ? <Sun size={20} /> : <Moon size={20} />}
                    </button>
                </nav>

                {/* Mobile Menu Button */}
                <button className="md:hidden text-theme-white p-2" onClick={() => setIsOpen(!isOpen)}>
                    {isOpen ? <X className="h-8 w-8" /> : <Menu className="h-8 w-8" />}
                </button>
            </div>

            {/* Mobile Menu */}
            {isOpen && (
                <div className="md:hidden absolute top-24 left-0 right-0 bg-white dark:bg-gray-900 border-b border-theme p-6 animate-in slide-in-from-top-5 shadow-2xl flex flex-col gap-4 min-h-screen">
                    {navItems.map((item) => (
                        <button key={item.label} onClick={() => handleNavClick(item.href)} className="text-left text-lg font-semibold text-theme-muted hover:text-theme-secondary p-4 border-b border-theme">
                            {item.label}
                        </button>
                    ))}
                    <div className="flex flex-col gap-4 mt-4">
                        <Button size="lg" onClick={() => { onNavigate('login'); setIsOpen(false); }} className="bg-theme-card text-theme-white w-full border border-theme">
                            Connexion
                        </Button>
                        <Button size="lg" onClick={() => { onNavigate('signup'); setIsOpen(false); }} className="bg-gradient-primary text-white w-full">
                            Inscription Gratuite
                        </Button>
                    </div>
                </div>
            )}
        </header>
    );
};