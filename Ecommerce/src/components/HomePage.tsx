import { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import {  CardContent } from './ui/card';
import { 
     X, Globe, Zap, Users, Mail, Phone, ShoppingCart, ChevronLeft, ChevronRight, 
    Package, Gift, Home, BookOpen, CheckCircle, CreditCard, 
    Share, TrendingUp, Rocket, Target,
    ShieldCheck, BarChart, Truck,
    ChevronDown,
    Diamond, Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Images et Assets
import logo from '../assets/logo.png';
import PackDetailsPage from './PackDetailsPage';
import FAQPage from './FAQPage';

// ====================================================================
// CONSTANTES DE COULEURS (Thème du 1er code)
// ====================================================================
const COLOR_PRIMARY = '#01131c'; // Un bleu très foncé, presque noir
const COLOR_ACCENT = '#002699'; // Jaune doré
const COLOR_WHITE = '#ffffff';
const COLOR_MUTED = '#94a3b8';

// ====================================================================
// COMPOSANT LAYOUT
// ====================================================================

const Card = ({ className = '', children, onClick }) => (
    <div onClick={onClick} className={`glass-panel rounded-2xl transition-all duration-500 hover:shadow-theme ${className}`}>
        {children}
    </div>
);

const Badge = ({ className = '', children }) => (
    <span className={`text-xs font-bold px-4 py-1.5 rounded-full tracking-wide uppercase border border-theme ${className}`}>
        {children}
    </span>
);
export function Layout({ 
    children, 
    forceNavbarBackground = false 
}) {
    return (
        <div className="min-h-screen font-sans overflow-x-hidden bg-white">
            
            {/* AJOUTER ICI la configuration Tailwind */}
            <script dangerouslySetInnerHTML={{__html: `
                tailwind.config = {
                    theme: {
                        extend: {
                            colors: {
                                theme: {
                                    primary: '#01131c',
                                    accent: '#002699',
                                    white: '#ffffff',
                                    muted: '#94a3b8',
                                },
                                primary: {
                                    50: '#f0f4f8',
                                    100: '#d9e2ec',
                                    500: '#01131c',
                                    600: '#000d14',
                                    700: '#00080f',
                                    900: '#000000',
                                },
                                secondary: {
                                    50: '#e6f0ff',
                                    100: '#cce0ff',
                                    500: '#002699',
                                    600: '#001a66',
                                    700: '#00134d',
                                }
                            }
                        }
                    }
                }
            `}} />
            <style dangerouslySetInnerHTML={{__html: `
                @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;600;700&display=swap');
                body { font-family: 'Roboto', sans-serif; }
                
                /* --- COULEURS ET VARIABLES --- */
                .text-theme-primary { color: ${COLOR_PRIMARY}; }
                .bg-theme-primary { background-color: ${COLOR_PRIMARY}; }
                .border-theme-primary { border-color: ${COLOR_PRIMARY}; }
                
                .text-theme-accent { color: ${COLOR_ACCENT}; }
                .bg-theme-accent { background-color: ${COLOR_ACCENT}; }
                .border-theme-accent { border-color: ${COLOR_ACCENT}; }
                
                .text-theme-white { color: ${COLOR_WHITE}; }
                .bg-theme-white { background-color: ${COLOR_WHITE}; }
                
                .text-theme-muted { color: hsl(0 0% 45%); }
                .bg-theme-muted { background: hsl(0 0% 96%); }
                .bg-theme-muted-45 { background: hsl(0 0% 45%); }
                .border-theme-muted { border-color: hsl(0 0% 45%); }
                
                .text-theme-light { color: hsl(0 0% 60%); }
                .bg-theme-light { background: hsl(0 0% 60%); }
                .border-theme-light { border-color: hsl(0 0% 60%); }
                
                .border-theme { border-color: #e2e8f0; }
                .bg-theme-card { background-color: hsl(0 0% 100%); }
                .bg-theme-section { background-color: oklch(.985 .002 247.839); }
                
                /* --- BOUTONS --- */
                .btn-cta-accent {
                    background-color: ${COLOR_ACCENT};
                    color: ${COLOR_PRIMARY};
                    font-weight: 700;
                    box-shadow: 0 4px 20px rgba(255, 212, 0, 0.4);
                    transition: all 0.3s;
                }
                .btn-cta-accent:hover { background-color: #ffc400; }

                .btn-cta {
                    background-color: ${COLOR_ACCENT};
                    color: white;
                    font-weight: 700;
                    box-shadow: 0 4px 20px ${COLOR_ACCENT};
                    transition: all 0.3s;
                }
                .btn-cta:hover {
                    background-color: ${COLOR_ACCENT};
                }
                
                .btn-cta-hero {
                    background-color: transparent;
                    color: #ffffff;
                    border: 2px solid white;
                    font-weight: 700;
                    transition: all 0.3s;
                }
                .btn-cta-hero:hover {
                    background-color: rgba(255, 255, 255, 0.1);
                    color: #ffffff;
                    border-color: white;
                    opacity: 1;
                }
                
                /* --- HERO SHAPE --- */
                #hero {
                    clip-path: polygon(0 0, 100% 0, 100% 85%, 50% 100%, 0 85%);
                    position: relative;
                    height: 600px;
                }

                /* --- BACKGROUND WRAPPERS --- */
                .hero-background-wrapper, .footer-background-wrapper {
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    z-index: 0;
                }

                .hero-background-wrapper::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: 
                        repeating-linear-gradient(90deg, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.05) 1px, transparent 1px, transparent 100px),
                        radial-gradient(#01131c 1px, transparent 1px),
                        linear-gradient(180deg, rgba(0, 31, 89, 1) 0%, rgba(0, 46, 110, 1) 100%);
                    background-size: 100% 100%, 4px 4px, 100% 100%;
                    opacity: 0.9;
                    mix-blend-mode: multiply;
                    z-index: 1;
                }

                .footer-background-wrapper::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background-image: linear-gradient(180deg, rgba(0, 31, 89, 1) 0%, rgba(0, 46, 110, 1) 100%);
                    background-size: 100% 100%;
                    opacity: 0.9;
                    mix-blend-mode: multiply;
                    z-index: 1;
                }

                /* --- GLASS EFFECTS --- */
                .glass-panel {
                    background: rgba(255, 255, 255, 0.95);
                    backdrop-filter: blur(12px);
                    border: 1px solid rgba(0, 0, 0, 0.08);
                    box-shadow: 0 8px 32px rgba(0, 29, 53, 0.08);
                }
                
                .glass-input {
                    background: rgba(255, 255, 255, 0.9);
                    border: 1px solid rgba(0, 0, 0, 0.12);
                    color: inherit;
                }
                
                /* --- GRADIENTS --- */
                .text-gradient {
                    background: linear-gradient(135deg, ${COLOR_PRIMARY} 0%, ${COLOR_ACCENT} 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }
                
                /* --- SCROLLBAR HIDE --- */
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}} />
            <Navbar forceScrolled={forceNavbarBackground}  />
            {children}
        </div>
    );
};

// ====================================================================
// NAVBAR (Du 1er code)
// ====================================================================
export function Navbar ({ forceScrolled = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scrollProgress, setScrollProgress] = useState(0);
    const [isScrolled, setIsScrolled] = useState(forceScrolled);
    const [activeLink, setActiveLink] = useState('Home');
    const [lastScrollY, setLastScrollY] = useState(0);
    const [shouldShowNavbar, setShouldShowNavbar] = useState(true);
    const [navbarHidden, setNavbarHidden] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
    const navigate = useNavigate();
    const location = window.location.pathname;

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (forceScrolled) {
            setIsScrolled(true);
            return;
        }
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
            const topBarHeight = 40;
            
            const progress = Math.min(currentScrollY / topBarHeight, 1);
            setScrollProgress(progress);
            
            setIsScrolled(currentScrollY > topBarHeight);
            
            const scrollThreshold = 300;
            
            if (currentScrollY < scrollThreshold) {
                setShouldShowNavbar(true);
                setNavbarHidden(false);
            } else if (currentScrollY > lastScrollY) {
                if (currentScrollY > scrollThreshold) {
                    setShouldShowNavbar(false);
                    setNavbarHidden(true);
                }
            } else if (currentScrollY < lastScrollY) {
                setShouldShowNavbar(true);
                setNavbarHidden(false);
            }
            
            setLastScrollY(currentScrollY);
        };
        
        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, [lastScrollY]);

    const handleNavClick = (label, href) => {
        setActiveLink(label);
        setIsOpen(false);
        
        if (href.startsWith('#')) {
            if (location === '/' || location === '/home' || location === '/landing') {
                const element = document.querySelector(href);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth' });
                }
            } else {
                navigate(`/${href}`);
                setTimeout(() => {
                    const element = document.querySelector(href);
                    if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                    }
                }, 100);
            }
        } else {
            navigate(href);
        }
    };

    const navItems = [
        { label: "Home", href: "#hero", page: "/" },
        { label: "Packs", href: "#pricing", page: "/#pricing" },
        { label: "Processus", href: "#process", page: "/#process" },
        { label: "Publicité", href: "#publicite", page: "/#publicite" }, 
        { label: "Témoignages", href: "#témoignages", page: "/#témoignages" },
        { label: "FAQ's", href: "#faq", page: "/#faq" },
    ];

    const topBarTranslateY = -scrollProgress * 100;
    const navbarTranslateY = -scrollProgress * 40;

    return (
        <>
            {/* Top Bar - CORRIGÉ : paddings responsives */}
            <div 
                className="hidden md:block fixed top-0 left-0 right-0 z-10 text-white bg-black/30 ease-out transition-transform duration-300"
                style={{
                    transform: navbarHidden ? 'translateY(-100%)' : `translateY(${topBarTranslateY}%)`
                }}
            >
                <div className="container pt-4 md:pt-6 pb-2 md:pb-3 mx-auto px-4 md:px-8 lg:px-16">
                    <div className="flex flex-col md:flex-row justify-between items-center py-2 text-xs md:text-sm">
                        <div className="flex items-center space-x-2 md:space-x-4 pl-0 md:pl-4 mb-2 md:mb-0">
                            <Facebook className="h-4 w-4 md:h-4 md:w-4 hover:text-theme-accent cursor-pointer" />
                            <Linkedin className="h-4 w-4 md:h-4 md:w-4 hover:text-theme-accent cursor-pointer" />
                            <Twitter className="h-4 w-4 md:h-4 md:w-4 hover:text-theme-accent cursor-pointer" />
                            <Youtube className="h-4 w-4 md:h-4 md:w-4 hover:text-theme-accent cursor-pointer" />
                            <Instagram className="h-4 w-4 md:h-4 md:w-4 hover:text-theme-accent cursor-pointer" />
                        </div>
                        
                        <div className="flex items-center space-x-6 pr-4">
                            <div className="flex items-center space-x-2">
                                <Phone className="h-4 w-4" />
                                <span className='text-gray-400'>Have questions? Call now (+216) 25 008 208</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Mail className="h-4 w-4" />
                                <span className='text-gray-400'>Need help? Contact us via email</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="container mx-auto px-4 md:px-8 lg:px-16">
                    <div className="h-px bg-gray-500"></div>
                </div>
            </div>

            {/* Main Navbar */}
            <header 
                className={`fixed left-0 right-0 z-50 text-white transition-all duration-500 ease-out ${
                    isScrolled ? 'bg-theme-primary shadow-2xl' : 'bg-transparent py-4 md:py-8 lg:py-12'
                } ${
                    navbarHidden ? '-translate-y-full' : 'translate-y-0'
                }`}
                style={{
                    transform: shouldShowNavbar ? 
                        (isScrolled || isMobile ? 'translateY(0px)' : `translateY(${navbarTranslateY}px)`) : 
                        'translateY(-100%)',
                    top: isScrolled ? '0' : isMobile ? '0px' : '40px',
                }}
            >
                
                <div className="container mx-auto px-4 md:px-8 lg:px-16 h-16 md:h-20 flex items-center justify-between">
                    
                    {/* Logo - CORRIGÉ : py responsif */}
                    <div onClick={() => navigate('/')} className="cursor-pointer py-4 md:py-8 lg:py-12 flex items-center gap-1 md:gap-2">
                        <img 
                            src={logo} 
                            alt="XTRA Logo" 
                            className="w-12 h-12 md:w-16 md:h-16 lg:w-20 lg:h-20 object-contain transition-all duration-500"
                            style={{
                                transform: isScrolled ? 'scale(0.9)' : 'scale(1)'
                            }}
                        />
                        <div className={`text-xl md:text-2xl lg:text-3xl text-white tracking-tight leading-none transition-all duration-500 ${isScrolled ? 'opacity-90' : 'opacity-100'}`}>
                            NEXA <br className="block md:hidden lg:block"/> 
                            <p className='text-[10px] md:text-xs lg:text-sm font-normal text-gray-400'>NETWORK</p> 
                        </div>
                    </div>

                    {/* Desktop Nav Links - CORRIGÉ : visible de md à l'infini */}
                    <div className="flex items-center gap-4 md:gap-6">
                        {/* Navigation - visible à partir de md (768px) */}
                        <nav className="hidden md:flex items-center gap-3 lg:gap-6">
                            {navItems.map((item, index) => {
                                const isActive = item.label === activeLink;
                                
                                return (
                                    <button 
                                        key={index}
                                        onClick={() => handleNavClick(item.label, item.href)}
                                        className={`text-md lg:text-lg font-semibold uppercase relative group transition-all duration-500 h-full flex items-center ${isActive ? 'text-white' : 'text-gray-400'} ${isScrolled ? 'hover:text-theme-accent' : 'hover:text-white'}`}
                                    >
                                        {item.label === 'Home' ? (
                                            <Home className="h-4 w-4 lg:h-5 lg:w-5" />
                                        ) : item.label}
                                        
                                        <span 
                                            className={`absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 transition-all duration-500 group-hover:w-full bg-white ${isActive ? 'w-full' : 'w-0'} `}
                                        ></span>
                                    </button>
                                )
                            })}
                        </nav>
                        
                        {/* Boutons - visibles à partir de md (768px) */}
                        <div className="hidden md:flex items-center space-x-2 lg:space-x-4 ml-2 lg:ml-8">
                            <button 
                                onClick={() => navigate('/login')}
                                className="text-xs lg:text-sm font-bold text-theme-white hover:text-theme-secondary transition-colors whitespace-nowrap"
                            >
                                Connexion
                            </button>
                            <Button 
                                onClick={() => navigate('/auth/signup')}
                                className="bg-transparent hover:bg-theme-secondary h-8 lg:h-10 px-3 lg:px-6 rounded-full text-xs lg:text-sm shadow-theme border-2 border-theme whitespace-nowrap"
                                size="sm"
                            >
                                Inscription
                            </Button>
                        </div>

                        {/* Menu Burger - visible seulement sur mobile (<768px) */}
                        <div className="flex md:hidden items-center">
                            <button 
                                onClick={() => setIsOpen(!isOpen)}
                                className="text-white focus:outline-none"
                            >
                                {isOpen ? (
                                    <X className="h-6 w-6" />
                                ) : (
                                    <svg className="h-6 w-6" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M4 6h16M4 12h16M4 18h16"></path>
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu - seulement pour <768px */}
                <div className={`md:hidden fixed top-0 left-0 w-full h-screen bg-theme-primary transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} p-6 z-50 overflow-y-auto`}>
                    <div className="flex justify-end mb-8">
                        <button onClick={() => setIsOpen(false)} className="text-white">
                            <X className="h-8 w-8" />
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-8">
                        <img 
                            src={logo} 
                            alt="Nexa Logo" 
                            className="w-16 h-16 object-contain"
                        />
                        <div className='text-2xl font-black text-white leading-none'>
                            Nexa 
                            <br/> 
                            <p className='text-sm font-normal text-gray-400'>NETWORK</p>
                        </div>
                    </div>
                    
                    <nav className="flex flex-col space-y-4">
                        {navItems.map((item, index) => (
                            <button 
                                key={index}
                                onClick={() => {
                                    handleNavClick(item.label, item.href);
                                    setIsOpen(false);
                                }}
                                className={`text-xl font-semibold uppercase text-left py-3 border-b border-gray-800 ${activeLink === item.label ? 'text-white' : 'text-gray-400'}`}
                            >
                                {item.label}
                            </button>
                        ))}
                        
                        <div className="flex flex-col space-y-4 pt-6 mt-6">
                            <button 
                                onClick={() => {
                                    navigate('/auth/login');
                                    setIsOpen(false);
                                }}
                                className="text-lg font-bold text-white hover:text-theme-accent transition-colors text-left py-3 border-b border-gray-800"
                            >
                                Connexion
                            </button>
                            <Button 
                                onClick={() => {
                                    navigate('/auth/signup');
                                    setIsOpen(false);
                                }}
                                className="bg-transparent hover:bg-theme-accent hover:text-theme-primary h-12 text-lg text-left rounded-full border-2 border-white text-white w-full mt-4"
                            >
                                Inscription
                            </Button>
                        </div>
                        
                        <div className="flex space-x-4 pt-8">
                            <Facebook className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                            <Linkedin className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                            <Twitter className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                            <Instagram className="h-5 w-5 text-gray-400 hover:text-white cursor-pointer" />
                        </div>
                    </nav>
                </div>
            </header>
        </>
    );
}

export function Hero({ navigate }) { 
    const [currentSlide, setCurrentSlide] = useState(0);

    const heroSlides = [
        {
            bgImage: `https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80`,
            title: (
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-2">
                    Le Chemin Vers <br />
                    <span>La Liberté Financière</span>
                </h1>
            ),
            subtitle: "Rejoignez la communauté Nexa, profitez au maximum de notre formation et commencez votre aventure de dropshipping avec un tableau de bord tout-en-un et nos produits gagnants sélectionnés à des prix de gros",
            buttonText: "Commencez Maintenant",
            buttonOnClick: () => navigate('/auth/signup'),
        },
        {
            bgImage: `https://xtratheme.com/elementor/corporate/wp-content/uploads/sites/4/2018/07/p9.jpg`, 
            title: (
                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-2">
                    Une Plateforme Qui Vous Épargne <br />
                    <span>Tous Les Ennuis</span>
                </h1>
            ),
            subtitle: "Vous apportez des commandes, nous nous occupons du reste. De l'emballage et des ramassages à la livraison, nous nous en chargeons.",
            buttonText: "Rejoignez Notre Plateforme",
            buttonOnClick: () => navigate('/auth/signup'),
        },
    ];

    const totalSlides = heroSlides.length;

    const handlePrev = () => {
        setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
    };

    const handleNext = () => {
        setCurrentSlide((prev) => (prev + 1) % totalSlides);
    };

    const currentSlideData = heroSlides[currentSlide];

    return (
        <section 
            id="hero" 
            className="bg-theme-primary relative overflow-hidden" 
            style={{ height: '120vh', minHeight: '600px'}}
        >
            {/* Background Wrapper avec l'image dynamique */}
            <div 
                className="hero-background-wrapper transition-opacity duration-1000"
                style={{ 
                    backgroundImage: `url(${currentSlideData.bgImage})`,
                }}
            ></div>
            
            {/* Contenu de la slide */}
            <div className="container mx-auto px-6 sm:px-6 text-center relative z-10 h-full flex flex-col justify-center transition-opacity duration-1000 ease-in-out">
                {/* Titre */}
                <div className="text-center mb-8 sm:mb-12 mt-12 transition-all duration-1000 ease-in-out transform" key={currentSlide + 'title'}>
                    {currentSlideData.title}
                </div>
                
                {/* Sous-titre */}
                <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-300 max-w-4xl mx-auto mb-12 sm:mb-16 leading-relaxed transition-all duration-1000 ease-in-out transform px-4" key={currentSlide + 'subtitle'}>
                    {currentSlideData.subtitle}
                </p>

                {/* Bouton - Responsive */}
                <Button 
                    onClick={currentSlideData.buttonOnClick} 
                    className="btn-cta-hero text-lg px-6 py-6 transition-all duration-300 mx-auto"
                >
                    {currentSlideData.buttonText}
                </Button>
            </div>
            
            {/* Chevrons de Navigation - Positionnés en absolu avec z-index élevé */}
            {/* Chevron Gauche */}
            <button 
                onClick={handlePrev} 
                className="absolute left-0 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 lg:p-4 bg-black/30 hover:bg-black/60 active:bg-black/70 transition-colors duration-300 rounded-r-full cursor-pointer text-white touch-manipulation"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </button>
            
            {/* Chevron Droit */}
            <button 
                onClick={handleNext} 
                className="absolute right-0 top-1/2 -translate-y-1/2 z-50 p-2 sm:p-3 lg:p-4 bg-black/30 hover:bg-black/60 active:bg-black/70 transition-colors duration-300 rounded-l-full cursor-pointer text-white touch-manipulation"
                aria-label="Next slide"
            >
                <ChevronRight className="h-5 w-5 sm:h-6 sm:w-6 lg:h-8 lg:w-8" />
            </button>
           
        </section>
    );
};

// ====================================================================
// DONNÉES DES SECTIONS (Du 2ème code)
// ====================================================================
const packagesData = [
    {
        id: "origin", 
        name: "Origin", 
        price: "0.00 DT", 
        isFree: true,
        features: ["Accès base formation", "Support communauté", "Ressources gratuites"],
        trainingSummary: "Introduction au e-commerce et bases fondamentales.",
        fullTrainingDetails: { 
            title: "Formation Découverte", 
            modules: ["Module 1: Introduction e-commerce", "Module 2: Les bases du marketing digital", "Module 3: Préparation mindset entrepreneur"], 
            duration: "60 heures (3 formations x 20h)", 
            level: "Débutant" 
        }
    },
    {
        id: "elevation", 
        name: "Elevation", 
        price: "490.00 DT",
        features: [
            "Marketing Digital - Niveau 1 (Fondamentaux)",
            "Anglais - Niveau 1 (Débutant)", 
            "Développement Web - Niveau 1 (Fondations)",
            "Support prioritaire",
            "Groupe privé"
        ],
        trainingSummary: "Pack Découverte : Les fondamentaux du marketing digital, de l'anglais et du développement web",
        fullTrainingDetails: { 
            title: "Formation Elevation Pro", 
            modules: ["Module 1: Setup boutique", "Module 2: Facebook Ads avancé", "Module 3: Création contenu", "Module 4: Service client"], 
            duration: "15 Heures", 
            level: "Intermédiaire" 
        }
    },
    {
        id: "prestige", 
        name: "Prestige", 
        price: "970.00 DT", 
        isPopular: true,
        features: [
            "Marketing Digital - Niveau 2 (Stratégie & Publicité)",
            "Anglais - Niveau 2 (Intermédiaire)",
            "Développement Web - Niveau 2 (Full-Stack)",
            "Coaching personnalisé",
            "Projets pratiques"
        ],
        trainingSummary: "Pack Pro : Stratégies avancées en marketing, anglais intermédiaire et développement full-stack",
        fullTrainingDetails: { 
            title: "Masterclass Prestige Elite", 
            modules: ["Module 1: Scaling profits", "Module 2: TikTok Ads", "Module 3: Email marketing", "Module 4: Retargeting avancé", "Module 5: Optimisation conversion"], 
            duration: "25 Heures", 
            level: "Avancé" 
        }
    },
    {
        id: "legacy", 
        name: "Legacy", 
        price: "1290.00 DT",
        features: [
            "Marketing Digital - Niveau 3 (Analyse & Optimisation)",
            "Anglais - Niveau 3 (Affaires - Marketing)",
            "Développement Web - Niveau 3 (Architecture & Production)",
            "CI/CD & Production",
            "Coaching individuel"
        ],
        trainingSummary: "Pack Expert : Marketing avancé, anglais des affaires et architecture logicielle professionnelle",
        fullTrainingDetails: { 
            title: "Programme Brand Excellence", 
            modules: ["Module 1: Création marque", "Module 2: Stratégie long terme", "Module 3: Partenariats", "Module 4: Management équipe", "Module 5: Expansion internationale"], 
            duration: "40 Heures", 
            level: "Expert" 
        }
    }
];

const faqsData = [
    {
        category: "Démarrage",
        icon: Rocket,
        questions: [
            { 
                q: "Comment commencer avec Nexa ?", 
                a: "Inscrivez-vous gratuitement, choisissez votre pack, suivez la formation et commencez à vendre. Notre équipe vous guide à chaque étape."
            },
            { 
                q: "Faut-il une expérience en e-commerce ?", 
                a: "Absolument pas ! Nos formations sont conçues pour les débutants. 85% de nos membres n'avaient aucune expérience préalable."
            },
            { 
                q: "Quel est le temps nécessaire pour voir les premiers résultats ?", 
                a: "La plupart de nos membres voient leurs premières ventes dans les 2 premières semaines. Avec notre méthode éprouvée, les résultats sont rapides."
            }
        ]
    },
    {
        category: "Paiements & Tarifs",
        icon: CreditCard,
        questions: [
            { 
                q: "Quels sont les modes de paiement acceptés ?", 
                a: "Paiement à la livraison (COD), virement bancaire, cartes électroniques. Nous travaillons à intégrer plus d'options."
            },
            { 
                q: "Y a-t-il des frais cachés ?", 
                a: "Non, transparence totale. Le prix affiché est le prix final. Seuls les frais de transaction standards (1-2%) s'appliquent sur les ventes."
            },
            { 
                q: "Puis-je payer en plusieurs fois ?", 
                a: "Oui, pour les packs premium, nous proposons des facilités de paiement. Contactez-nous pour étudier votre situation."
            }
        ]
    },
    {
        category: "Support & Communauté",
        icon: Users,
        questions: [
            { 
                q: "Quel support proposez-vous ?", 
                a: "Support 24/7 via WhatsApp, email, téléphone. Groupes privés, sessions de coaching hebdomadaires et réponses sous 2h maximum."
            },
            { 
                q: "Comment rejoindre la communauté ?", 
                a: "Dès votre inscription, accès immédiat à nos groupes privés avec des centaines d'entrepreneurs actifs."
            },
            { 
                q: "Proposez-vous du mentorat personnalisé ?", 
                a: "Oui, selon votre pack : coaching individuel, audit de boutique, et stratégies personnalisées basées sur vos performances."
            }
        ]
    },
    {
        category: "Livraison & Produits",
        icon: Package,
        questions: [
            { 
                q: "Délais de livraison ?", 
                a: "24-48h dans les grandes villes, 2-5 jours partout en Tunisie. Nous optimisons constamment notre réseau logistique."
            },
            { 
                q: "Quels types de produits ?", 
                a: "Hi-tech, mode, maison, beauté, auto. Catalogue constamment mis à jour avec des produits tendance et rentables."
            },
            { 
                q: "Qui gère les retours ?", 
                a: "Nous gérons tout ! Retours, SAV, réclamations. Vous vous concentrez sur les ventes, nous gérons le reste."
            }
        ]
    }
];

// ====================================================================
// COMPOSANTS DES SECTIONS (Du 2ème code adaptés)
// ====================================================================
const PubliciteSection = () => {
    return (
        <section id="publicite" className="py-20 ">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <Badge className="bg-theme-primary/10 text-pink-600 mb-4">
                      NOUVELLE GÉNÉRATION
                    </Badge>
                    <Zap className="w-3 h-3 mr-1 text-theme-accent inline" />
                    <h2 className="text-4xl md:text-5xl font-black text-theme-primary mt-4 mb-6">
                        Découvrez <span className="text-theme-accent">Nexa</span>
                    </h2>
                    <p className="text-xl text-theme-muted max-w-3xl mx-auto">
                        La plateforme e-commerce la plus avancée pour transformer votre passion en revenus stables
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
                    {[
                        {
                            icon: ShoppingCart,
                            title: "Ventes Automatisées", 
                            description: "Système de vente 24/7 même pendant votre sommeil",
                            color: "text-theme-accent ",
                            bgColor: "bg-blue-100"
                        },
                        {
                            icon: BarChart,
                            title: "Analyses Avancées",
                            description: "Tableaux de bord en temps réel pour optimiser vos performances", 
                            color: "text-pink-600",
                            bgColor: "bg-pink-100"
                        },
                        {
                            icon: Users,
                            title: "Support Expert",
                            description: "Équipe dédiée pour vous accompagner vers le succès",
                            color: "text-theme-accent", 
                            bgColor: "bg-blue-100"
                        },
                        {
                            icon: Rocket, 
                            title: "Croissance Rapide",
                            description: "Atteignez vos objectifs financiers plus rapidement",
                            color: "text-pink-600",
                            bgColor: "bg-pink-100"
                        }
                    ].map((feature, index) => (
                        <Card key={index} onClick={()=>{}} className="p-6 text-center hover:shadow-xl transition-all duration-300 group border border-theme-accent bg-theme-card">
                            <div className={`w-16 h-16 rounded-2xl ${feature.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                <feature.icon className={`h-8 w-8 ${feature.color}`} />
                            </div>
                            <h3 className="text-lg font-bold text-theme-primary mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-theme-muted text-sm">
                                {feature.description}
                            </p>
                        </Card>
                    ))}
                </div>

                <Card onClick={()=>{}} className="p-8 mb-20 max-w-6xl mx-auto bg-theme-card border border-theme">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { number: "100K+", label: "Revenus générés par nos utilisateurs" },
                            { number: "25+", label: "Fournisseurs" },
                            { number: "98%", label: "Taux de Satisfaction" },
                            { number: "24/7", label: "Support Disponible" }
                        ].map((stat, index) => (
                            <div key={index} className="p-4">
                                <div className="text-3xl md:text-4xl font-black text-theme-primary mb-2">
                                    {stat.number}
                                </div>
                                <div className="text-sm text-theme-muted font-medium">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </section>
    );
};

const PromotionSection = () => {
    const promotions = [
        {
            icon: Truck,
            title: "Livraison Express",
            description: "Délais de livraison optimisés partout en Tunisie",
            color: "text-theme-accent",
        },
        {
            icon: Gift,
            title: "Produits Exclusifs",
            description: "Accès à des produits uniques et tendances",
            color: "text-theme-accent",
        },
        {
            icon: ShieldCheck,
            title: "Paiement Sécurisé",
            description: "Transactions 100% sécurisées et garanties",
            color: "text-theme-accent",
        },
        {
            icon: TrendingUp,
            title: "Formation Continue",
            description: "Améliorez constamment vos compétences",
            color: "text-theme-accent",
        }
    ];

    return (
        <section id='process' className="py-20 bg-theme-section">
            <div className="container mx-auto px-6">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black text-theme-primary mb-6">Pourquoi choisir Nexa ?</h2>
                    <p className="text-theme-muted text-lg">Nous éliminons les obstacles pour vous.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 mb-8 gap-6">
                    {promotions.map((promo, index) => (
                        <Card key={index} onClick={()=>{}} className="p-6 text-center hover:shadow-lg transition-all duration-300 group border border-theme bg-theme-card">
                            <div className={`w-16 h-16 rounded-2xl border-2 border-theme-accent flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                                <promo.icon className={`h-8 w-8 ${promo.color}`} />
                            </div>
                            <h3 className="text-lg font-bold text-theme-primary mb-2">
                                {promo.title}
                            </h3>
                            <p className="text-theme-muted text-sm">
                                {promo.description}
                            </p>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {[
                        {t:"Paiement à la livraison",d:"Vos clients paient à la réception (COD).",i:ShieldCheck},
                        {t:"Support 24/7",d:"Une équipe dédiée à votre succès.",i:Users},
                        {t:"Livraison 24h",d:"Réseau de livraison ultra-rapide.",i:Rocket},
                        {t:"0 Risque",d:"Pas de stock à acheter d'avance.",i:Target}
                    ].map((item,i)=>(
                        <Card key={i} onClick={()=>{}} className="p-8 bg-theme-card hover:bg-theme-muted border border-theme">
                            <item.i className="h-10 w-10 text-theme-accent mb-6"/>
                            <h3 className="text-xl font-bold text-theme-primary mb-3">{item.t}</h3>
                            <p className="text-theme-muted text-sm">{item.d}</p>
                        </Card>
                    ))}
                </div>
            </div>
        </section>
    );
};

const FAQSection = () => {
    const [openFAQ, setOpenFAQ] = useState(null);
    const navigate = useNavigate()
    const toggleFAQ = (index) => {
        setOpenFAQ(openFAQ === index ? null : index);
    };

    const sampleQuestions = [
        ...faqsData[0].questions.slice(0, 1),
        ...faqsData[1].questions.slice(0, 1),
        ...faqsData[2].questions.slice(0, 1)
    ];

    return (
        <section id="faq" className="py-20">
            <div className="container mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-4xl md:text-5xl font-black text-theme-primary mb-6">
                        Questions <span className="text-theme-accent">Fréquentes</span>
                    </h2>
                    <p className="text-xl text-theme-muted max-w-2xl mx-auto">
                        Voici quelques-unes des questions les plus posées par nos membres
                    </p>
                </div>

                <div className="max-w-4xl mx-auto space-y-4 mb-12">
                    {sampleQuestions.map((faq, i) => (
                        <Card 
                            key={i} 
                            className="bg-theme-card border-theme hover:border-theme-primary/30 transition-all"
                            onClick={() => toggleFAQ(i)}
                        >
                            <div className="p-6 cursor-pointer">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-theme-primary text-lg">{faq.q}</h3>
                                    <ChevronDown className={`text-theme-primary transition-transform ${openFAQ === i ? 'rotate-180' : ''}`} />
                                </div>
                                {openFAQ === i && (
                                    <div className="mt-4 pt-4 border-t border-theme">
                                        <p className="text-theme-muted leading-relaxed">
                                            {faq.a}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>

                <div className="text-center">
                    <Button 
                        onClick={() => navigate('/faq')} 
                        className="border-2 border-theme-accent bg-blue-50 text-theme-accent hover:bg-theme-accent/20 transition-all px-8 py-4 text-lg"
                    >
                        <BookOpen className="h-5 w-5 mr-3" />
                        Voir Toutes les Questions
                    </Button>
                </div>
            </div>
        </section>
    );
};

// ====================================================================
// COMPOSANT PRINCIPAL
// ====================================================================
export default function HomePage() {
    const [currentView, setCurrentView] = useState('landing');
    const [selectedPack, setSelectedPack] = useState(null);
    const categoryContainerRef = useRef(null);
    const pricingContainerRef = useRef(null);
    const navigate = useNavigate();

    const scrollCategories = (direction) => {
        if (categoryContainerRef.current) {
            const amount = 350;
            categoryContainerRef.current.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' });
        }
    };

    const scrollPricing = (direction) => {
        if (pricingContainerRef.current) {
            const cardWidth = 350;
            const gap = 21;
            const scrollAmount = (cardWidth + gap) * (direction === 'left' ? -1 : 1);
            pricingContainerRef.current.scrollBy({ 
                left: scrollAmount, 
                behavior: 'smooth' 
            });
        }
    };

    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }, []);

    const testimonials = [
    {
      name: "Mohamed Amine",
      rating: 'Étudiant en Logistique',
      text: "Je n'ai jamais vu quelque chose comme ça avant, Ecomness rend tout beaucoup plus facile.",
      avatar: "MA"
    },
    {
      name: "Firas",
      rating: 'Retraité',
      text: "Grâce à Ecomness, je gagne maintenant de l'argent pendant mon temps libre.",
      avatar: "F"
    },
    {
      name: "Abd Eraouf",
      rating: 'Banquier',
      text: "Ecomness m'a permis d'avoir un second revenu.",
      avatar: "AE"
    },
  ];

    const usefulLinks = ["Purchase now", "Support", "Documentation", "Custom Services", "Marketplaces", "Codevz Website", "Portfolio Reviews"];
    const shortcuts = ["Acceuil", "Packs", "Processus", "Publicité",   "Témoignages"];
    
    const FooterLink = ({ link }) => (
        <li className="group flex items-start text-gray-300 hover:text-white transition-colors cursor-pointer text-md mb-2">
            <span className="footer-link-point w-3 h-3 mt-1 rounded-full 
                border border-gray-500 bg-transparent mr-3 flex-shrink-0 
                transition-all duration-200">
            </span> 
            {link}
        </li>
    );

    const renderContent = () => {
        switch(currentView) {
            case 'details': 
                return <PackDetailsPage/>;
            case 'faq-page':
                return <FAQPage/>;
            default: 
                return (
                    <main className="animate-in fade-in duration-500">
                        {/* HERO SECTION (Du 1er code) */}
                        <Hero navigate={navigate} />

                        <section className="py-32 bg-muted/5">
                          <div className="container mx-auto px-6">
                            <div className="max-w-8xl mx-auto text-center mb-20">
                              <h2 className="text-4xl font-black text-foreground mb-6">
                                Comment ça marche ?
                              </h2>
                              <p className="text-xl text-muted-foreground leading-relaxed mb-8 max-w-3xl mx-auto">
                                3 étapes simples vers votre liberté financière
                              </p>
                            </div>
                  
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-16 max-w-6xl mx-auto">
                              {[
                                  { icon: Globe, title: "1. Choisissez", desc: "Sélectionnez des produits gagnants dans notre catalogue." },
                                  { icon: Share, title: "2. Vendez", desc: "Faites la promotion sur vos réseaux sociaux." },
                                  { icon: CreditCard, title: "3. Encaissez", desc: "Nous livrons, vous recevez votre marge." }
                              ].map((stat, index) => (
                                <Card key={index} onClick={()=>{}} className="group text-center border-2 border-primary/20 hover:border-primary/40 rounded-3xl transition-all duration-500 hover:scale-105 hover:shadow-2xl bg-card/50 backdrop-blur-sm">
                                  <CardContent className="p-10">
                                    <div className="w-20 h-20  border-2 border-theme-accent rounded-2xl flex items-center justify-center mx-auto mb-8 group-hover:bg-primary/30 group-hover:rotate-6 transition-all duration-300">
                                      <stat.icon className="h-10 w-10 text-theme-accent" />
                                    </div>
                                    <div className="text-2xl font-black text-primary mb-2">{stat.title}</div> 
                                    <p className="text-sm text-muted-foreground">{stat.desc}</p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </section>

                        <section className="relative py-20 bg-theme-primary text-center overflow-hidden">
                            {/* 1. IMAGE DE FOND ET OVERLAY (Identique au Hero/Footer) */}
                            <div 
                                className="footer-background-wrapper"
                                // Vous pouvez utiliser le style inline ou une classe CSS pour l'URL de l'image
                                style={{
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                            </div>
                            <div 
                                className="absolute inset-0 z-0 opacity-20" 
                                style={{ 
                                    backgroundImage: 'radial-gradient(circle at center, #ffd400 0%, transparent 45%)',
                                    filter: 'blur(200px)'
                                }} 
                            ></div>
                        
                            {/* 4. CONTENU (Assurez-vous qu'il est au-dessus de tout avec z-10) */}
                            <div className="container mx-auto px-6 relative z-10">
                              <div className="max-w-6xl mx-auto text-center">
                                <div className="inline-flex items-center bg-primary/10 border-2 border-theme rounded-full px-4 py-1 mb-12 animate-pulse">
                                  <Diamond className="h-5 w-5 text-white mr-3 animate-spin" />
                                  <span className="font-medium text-white">Plateforme de Dropshipping</span>
                                </div>
                                <h2 className="text-5xl font-black text-white text-foreground mb-12">
                                  Pas D'expérience ?
                                  <span className="mt-4 block text-white">Pas De Problème.</span>
                                </h2>
                                <p className="text-xl text-white mb-12 leading-relaxed max-w-3xl mx-auto">
                                  Une formation en ligne à 100% réalisé par des experts en e-commerce et dropshipping, c'est tout ce dont vous avez besoin pour commencer à gagner de l'argent en ligne.
                                </p>
                              </div>
                            </div>
                        </section>

                        {/* PRICING */}
                        <section id="pricing" className="py-20 ">
                            <div className="container mx-auto px-6">
                                <div className="text-center justify-between items-end mb-16">
                                    <div className="text-center w-full">
                                        <h2 className="text-4xl md:text-5xl font-black text-theme-primary mb-2">Packs & Formations</h2>
                                        <p className="text-xl text-theme-muted">Choisissez votre niveau d'accompagnement</p>
                                    </div>
                                    <div className="hidden lg:flex gap-4 mt-8 justify-center">
                                        <button 
                                            onClick={() => scrollPricing('left')} 
                                            className="p-3 rounded-full bg-theme-card border border-theme hover:bg-theme-primary transition-colors text-theme-primary shadow-lg"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        <button 
                                            onClick={() => scrollPricing('right')} 
                                            className="p-3 rounded-full bg-theme-card border border-theme hover:bg-theme-primary transition-colors text-theme-primary shadow-lg"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <div 
                                        ref={pricingContainerRef}
                                        className="flex overflow-x-auto scrollbar-hide gap-8 p-4 snap-x"
                                        style={{ 
                                            scrollbarWidth: 'none',
                                            msOverflowStyle: 'none'
                                        }}
                                    >
                                        {packagesData.map((pack) => (
                                            <Card 
                                                key={pack.id} onClick={()=>{}} 
                                                className={`flex-shrink-0 w-96 p-8 flex flex-col relative ${pack.isPopular ? 'border-theme-accent shadow-[0_0_30px_-10px_rgba(255,212,0,0.3)] scale-105 z-10 bg-theme-card' : 'bg-theme-card'} ${pack.isFree ? 'border-green-500/30' : ''}`}
                                            >
                                                {pack.isPopular && (
                                                    <div className="absolute top-0 right-0 bg-theme-accent text-white font-bold text-sm px-4 py-1.5 rounded-xl">
                                                        POPULAIRE
                                                    </div>
                                                )}
                                                {pack.isFree && (
                                                    <div className="absolute top-0 right-0 bg-gray-500 text-white font-bold text-sm px-4 py-1.5 rounded-xl">
                                                        GRATUIT
                                                    </div>
                                                )}
                                                
                                                <div className="mb-8">
                                                    <h3 className="text-2xl font-bold text-theme-primary">{pack.name}</h3>
                                                    <div className="text-4xl font-black text-pink-600 mt-4">{pack.price}</div>
                                                    {pack.isFree && (
                                                        <div className="text-theme-muted text-base font-bold mt-2">Sans engagement</div>
                                                    )}
                                                </div>
                                                
                                                <ul className="space-y-4 mb-8 flex-1">
                                                    {pack.features.map((feat, i) => (
                                                        <li key={i} className="flex items-start gap-3 text-theme-muted text-sm">
                                                            <CheckCircle className="h-5 w-5 text-theme-accent flex-shrink-0" />
                                                            {feat}
                                                        </li>
                                                    ))}
                                                </ul>
                                                
                                                <div className="p-4 bg-theme-muted rounded-xl border border-theme mb-8">
                                                    <div className="flex items-center gap-2 text-pink-600 font-bold mb-2 text-sm">
                                                        <BookOpen className="h-4 w-4" /> Formation incluse:
                                                    </div>
                                                    <p className="text-sm text-theme-muted italic">{pack.trainingSummary}</p>
                                                </div>
                                                
                                                <Button 
                                                    onClick={() => navigate(`/pack/${pack.id}`)}  // Utilisez navigate avec React Router
                                                    className={`w-full text-base py-3 ${pack.isPopular ? 'bg-theme-accent text-white hover:bg-yellow-500' : pack.isFree ? 'bg-gray-500 text-white hover:bg-gray-600' : 'bg-theme-muted text-theme-black hover:bg-theme-card'}`}
                                                >
                                                    {pack.isFree ? 'Commencer gratuitement' : 'Voir détails & Choisir'}
                                                </Button>
                                            </Card>
                                        ))}
                                    </div>
                    
                                    <div className="flex justify-center gap-4 mt-6 lg:hidden">
                                        <button 
                                            onClick={() => scrollPricing('left')}
                                            className="p-3 rounded-full bg-theme-card border border-theme hover:bg-theme-primary transition-all text-theme-primary"
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </button>
                                        
                                        <button 
                                            onClick={() => scrollPricing('right')}
                                            className="p-3 rounded-full bg-theme-card border border-theme hover:bg-theme-primary transition-all text-theme-primary"
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </section>
                        {/* PROMOTION */}
                        <PromotionSection />
                        {/* PUBLICITE */}
                        <PubliciteSection />

                        <section id='témoignages' className="py-32 bg-theme-section">
                          <div className="container mx-auto px-6">
                            <div className="max-w-6xl mx-auto text-center mb-20">
                              <h2 className="text-5xl font-black text-foreground mb-6">
                                Ce Que Nos Clients Disent
                              </h2>
                              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                Des connaisseurs en e-commerce aux étudiants qui n'ont aucune connaissance, ils disent tous la même chose.
                              </p>
                            </div>
                
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                              {testimonials.map((testimonial, index) => (
                                <Card key={index} onClick={()=>{}} className={`group border border-primary/20 hover:border-primary/40 rounded-2xl transition-all duration-500 hover:scale-105 hover:shadow-xl bg-card/50 backdrop-blur-sm ${index % 3 === 1 ? 'lg:-mt-8' : index % 3 === 2 ? 'lg:mt-8' : ''}`}>
                                  <CardContent className="p-8 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-20 h-20 bg-theme-accent rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-700"></div>
                                    
                                    <div className="flex items-center mb-6 relative z-10">
                                      <div className="w-14 h-14 bg-primary/20 border border-theme-accent rounded-xl flex items-center justify-center mr-4">
                                        <span className="text-primary text-theme-accent font-bold">{testimonial.avatar}</span>
                                      </div>
                                      <div>
                                        <p className="font-bold text-foreground">{testimonial.name}</p>
                                        <div className="flex space-x-1 text-theme-accent">
                                          {testimonial.rating}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <p className="text-muted-foreground leading-relaxed group-hover:text-foreground transition-colors relative z-10">
                                      "{testimonial.text}"
                                    </p>
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </section>
                        {/* FAQ */}
                        <FAQSection />

                        {/* CTA FINAL */}
                        <section className="relative py-40 bg-theme-primary text-center overflow-hidden">
                            {/* 1. IMAGE DE FOND ET OVERLAY (Identique au Hero/Footer) */}
                            <div 
                                className="footer-background-wrapper"
                                // Vous pouvez utiliser le style inline ou une classe CSS pour l'URL de l'image
                                style={{
                                    backgroundImage: `url(https://xtratheme.com/elementor/corporate/wp-content/uploads/sites/4/2018/07/p9.jpg)`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            >
                                {/* L'élément::before dans 'footer-background-wrapper' gère déjà l'overlay de dégradé sombre (linear-gradient) */}
                            </div>
                            
                            {/* 2. OVERLAY PRIMAIRE (Le calque bleu semi-transparent qui assombrit le fond) */}
                            {/* Celui-ci est maintenu pour la couleur de base si l'image ne charge pas, mais il est redondant avec l'overlay CSS du wrapper */}
                            {/* Je le commente pour ne pas superposer deux opacités, mais vous pouvez le réactiver si vous préférez cet effet */}
                            {/* <div className="absolute inset-0 bg-theme-primary/70"></div> */}
                            
                            {/* 3. L'effet de flou jaune (radial-gradient), conservé pour l'ambiance */}
                            <div 
                                className="absolute inset-0 z-0 opacity-20" 
                                style={{ 
                                    backgroundImage: 'radial-gradient(circle at center, #ffd400 0%, transparent 45%)',
                                    filter: 'blur(200px)'
                                }} 
                            ></div>
                        
                            {/* 4. CONTENU (Assurez-vous qu'il est au-dessus de tout avec z-10) */}
                            <div className="container mx-auto px-6 relative z-10">
                              <h2 className="text-5xl lg:text-7xl font-black text-white mb-6">
                                Ne vous fiez pas seulement à nos paroles
                              </h2>
                              <h3 className="text-5xl lg:text-7xl font-black text-white mb-12">
                                Essayez par vous-même, c'est gratuit
                              </h3>
                              <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
                                Commencez à gagner de l'argent en ligne depuis le confort de votre domicile 
                                sans les tracas liés aux produits, fournisseurs, stocks, et ressources humaines 
                                des sociétés de livraison.
                              </p>
                              
                              {/* Le composant Button doit être disponible dans votre portée de composant React */}
                              <Button 
                                onClick={() => navigate('/auth/signup')}
                                className="bg-transparent hover:bg-theme-secondary h-10 px-6 rounded-full text-md shadow-theme border-2 border-theme"
                                size="sm"
                            >
                                Commencez: Gratuitement Maintenant
                            </Button>
                            </div>
                        </section>

                        <section className="py-20"> {/* Fond gris très clair comme sur l'image */}
                          <div className="container mx-auto px-6">
                            <div className="max-w-8xl mx-auto text-center">
                    
                              {/* 1. HEADER : Exactement comme la Capture 1 */}
                              <div className="mb-12">
                                <p className="text-gray-400 text-md mb-3 font-normal">
                                  Propulsé par les meilleurs du secteur pour offrir la meilleure expérience
                                </p>
                              </div>
                    
                              {/* 2. LOGOS SIMULÉS EN CSS : Pour éviter les boîtes grises */}
                              <div className="flex flex-wrap justify-center md:justify-between items-center gap-20 opacity-80">
                                <div className="group cursor-pointer hover:opacity-100 transition-opacity text-center">
                                  <span className="text-6xl text-gray-400" style={{ fontFamily: 'Brush Script MT, cursive' }}>
                                    massar
                                  </span>
                                </div>
                    
                                <div className="flex flex-col items-center group cursor-pointer hover:opacity-100 transition-opacity text-center">
                                  <span className="text-3xl text-gray-400 font-light" style={{ fontFamily: 'Segoe Script, cursive' }}>
                                    LIGHT SPEED
                                  </span>
                                  <span className="text-[0.5rem] text-gray-400 uppercase tracking-widest mt-[-5px]">
                                 Technology
                                  </span>
                                </div>
                    
                                <div className="group cursor-pointer hover:opacity-100 transition-opacity text-center relative">
                                  <span className="text-4xl font-bold text-gray-400 uppercase tracking-[0.15em]">
                                    IEEE
                                  </span>
                                  <div className="flex justify-center gap-0.5 mb-1 opacity-50">
                                     <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                     <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                     <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                     <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                                   </div>
                                </div>
                    
                                <div className="group cursor-pointer hover:opacity-100 transition-opacity text-center">
                                   <div className="text-center">
                                     <span className="text-4xl text-gray-400" style={{ fontFamily: 'Bradley Hand, cursive', transform: 'rotate(-5deg)', display:'block' }}>
                                      علّقني
                                    </span>
                                   </div>
                                </div>
                    
                                <div className="group cursor-pointer hover:opacity-100 transition-opacity">
                                   <div className="border-y border-gray-400 py-1 px-2">
                                      <span className="text-3xl font-serif text-gray-400 uppercase tracking-[0.3em] font-bold block leading-none">
                                        AIESEC
                                      </span>
                                   </div>
                                </div>
                    
                              </div>
                            </div>
                          </div>
                        </section>
                        
                        {/* FOOTER (Du 1er code) */}
                        <footer className="bg-theme-primary py-16 relative overflow-hidden">
                          <div
                            className="footer-background-wrapper"
                            style={{
                              backgroundImage: `url(https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-1.2.1&auto=format&fit=crop&w=1950&q=80)`,
                              backgroundSize: 'cover',
                              backgroundPosition: 'center',
                              backgroundRepeat: 'no-repeat'
                            }}
                          ></div>

                          <div className="container mx-auto px-8 relative z-10">
                            
                            {/* Heures de travail - IDEM desktop */}
                            <div className="px-8 pb-12 mb-12">
                              <h4 className="font-bold text-white text-sm mb-4">
                                Heures de travail :
                              </h4>
                              <div className="space-y-3 text-gray-400">
                                <div className="flex items-center space-x-4">
                                  <span className="text-sm">Lundi - Vendredi : 9h00 - 17h00</span>
                                  <span className="text-sm">Samedi : 9h00 - 13h00</span>
                                </div>
                              </div>
                            </div>

                            {/* Séparateur */}
                            <div className="container mx-auto px-8">
                              <div className="border-t border-gray-500"></div>
                            </div>

                            {/* Grille principale - IDEM desktop */}
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 py-16 mb-12 px-8">
                              
                              {/* Colonne de gauche - Logo et description */}
                              <div className="space-y-6 lg:col-span-5">
                                <div className="flex items-center gap-2 mb-8">
                                  <img 
                                    src={logo} 
                                    alt="XTRA Corporation Logo" 
                                    className="w-20 h-20 object-contain"
                                  />
                                  <div className='text-3xl font-black text-white leading-none'>
                                    Nexa 
                                    <br/> 
                                    <p className='text-sm font-normal text-gray-400'>NETWORK</p>
                                  </div>
                                </div>
                                
                                <p className="text-gray-300 text-lg leading-relaxed max-w-md">
                                  Nexa est une plateforme de dropshipping simple et rapide, conçue pour aider les vendeurs à gérer leurs produits, suivre leurs commandes et développer leur boutique en toute facilité.
                                </p>
                                
                                <Button 
                                  onClick={() => navigate('/auth/signup')}
                                  className="text-white border border-gray-500 hover:bg-white mt-2 px-6 text-lg"
                                  style={{ color: 'white', background: 'transparent' }}
                                >
                                  Commencer avec nexa
                                </Button>
                              </div>

                              {/* Colonne de droite - LA PARTIE QUI NE S'AFFICHAIT PAS - avec lg:col-span-7 */}
                              <div className="lg:col-span-7 flex flex-col md:flex-row justify-between gap-8 md:gap-4">
                                
                                {/* SHORTCUTS */}
                                <div className="space-y-4 md:w-1/3">
                                  <h4 className="font-bold text-white text-lg mb-4 uppercase whitespace-nowrap">
                                    SHORTCUTS
                                  </h4>
                                  <ul className="list-none p-0">
                                    {shortcuts.map((link, index) => (
                                      <li key={index} className="group flex items-start text-gray-300 hover:text-white transition-colors cursor-pointer text-md mb-2">
                                        <span className="footer-link-point w-3 h-3 mt-1 rounded-full border border-gray-500 bg-transparent mr-3 flex-shrink-0 transition-all duration-200"></span>
                                        {link}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                {/* CONTACT US */}
                                <div className="space-y-4 md:w-1/3">
                                  <h4 className="font-bold text-white text-lg mb-4 uppercase whitespace-nowrap">
                                    CONTACT US
                                  </h4>
                                  <ul className="list-none p-0">
                                    <li className="group flex items-start text-gray-300 hover:text-white transition-colors cursor-pointer text-md mb-2">
                                      <span className="footer-link-point w-3 h-3 mt-1 rounded-full border border-gray-500 bg-transparent mr-3 flex-shrink-0 transition-all duration-200"></span>
                                      <Phone className="h-5 w-5 mr-3" />
                                      (+216) 25 008 208
                                    </li>
                                    <li className="group flex items-start text-gray-300 hover:text-white transition-colors cursor-pointer text-md mb-2">
                                      <span className="footer-link-point w-3 h-3 mt-1 rounded-full border border-gray-500 bg-transparent mr-3 flex-shrink-0 transition-all duration-200"></span>
                                      <Mail className="h-5 w-5 mr-3" />
                                      support@ecomness.com
                                    </li>
                                  </ul>
                                </div>

                                {/* ADRESSE */}
                                <div className="space-y-4 md:w-1/3">
                                  <h4 className="font-bold text-white text-lg mb-4 uppercase whitespace-nowrap">
                                    ADRESSE
                                  </h4>
                                  <ul className="list-none p-0">
                                    <li className="flex items-start space-x-3 group text-gray-300 hover:text-white transition-colors">
                                      <span className="footer-link-point w-3 h-3 mt-1 rounded-full border border-gray-500 bg-transparent mr-3 flex-shrink-0 transition-all duration-200"></span>
                                      <div className="text-sm">
                                        P8M8+J66, Rue de Palestine <br/> Ezzahra 2034
                                      </div>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>

                            {/* Séparateur du bas */}
                            <div className="container mx-auto pt-8 px-8">
                              <div className="border-t border-gray-500"></div>
                            </div>

                            {/* Copyright et réseaux sociaux */}
                            <div className="pt-8 px-8 flex justify-between items-center flex-wrap gap-4">
                              <div className="text-md text-gray-300">
                                © Copyright 2025. All Rights Reserved - NEXA GROUP.
                              </div>
                              <div className="flex space-x-4">
                                <Facebook className="h-5 w-5 text-gray-300 hover:text-white transition-colors cursor-pointer" />
                                <Linkedin className="h-5 w-5 text-gray-300 hover:text-white transition-colors cursor-pointer" />
                                <Twitter className="h-5 w-5 text-gray-300 hover:text-white transition-colors cursor-pointer" />
                                <Instagram className="h-5 w-5 text-gray-300 hover:text-white transition-colors cursor-pointer" />
                              </div>
                            </div>
                          </div>
                        </footer>
                    </main>
                );
        }
    };

    return <Layout forceNavbarBackground={false}>{renderContent()}</Layout>;
}
