import React, { useEffect, useState } from 'react';
import { SectionLoader } from './ui/Loader';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
    ArrowLeft, Award, Clock, PlayCircle, ChevronDown, ChevronUp,
    BookOpen, Target, Users, FileText, CheckCircle, Rocket, Globe, Code, MessageCircle,
    Layers
} from 'lucide-react';
import { Layout } from './HomePage';
import { useNavigate, useParams } from 'react-router-dom';

const Card = ({ className = '', children, onClick }) => (
    <div onClick={onClick} className={`glass-panel rounded-2xl transition-all duration-500 hover:shadow-theme ${className}`}>
        {children}
    </div>
);

// Les données packagesData avec la structure mixée
const packagesData = [
    {
        id: "origin", 
        name: "Origin", 
        price: "0.00 DT", 
        isFree: true,
        features: ["Accès base formation", "Support communauté", "Ressources gratuites"],
        trainingSummary: "Introduction au e-commerce et bases fondamentales.",
        trainings: [] // Vide pour le pack gratuit
    },
    {
        id: "elevation", 
        name: "Elevation", 
        price: "490.00 DT",
        isPopular: false,
        features: [
            "Marketing Digital - Niveau 1 (Fondamentaux)",
            "Anglais - Niveau 1 (Débutant)", 
            "Développement Web - Niveau 1 (Fondations)",
            "Support prioritaire",
            "Groupe privé"
        ],
        trainingSummary: "Pack Découverte : Les fondamentaux du marketing digital, de l'anglais et du développement web",
        totalDuration: "60 heures (3 formations x 20h)",
        trainings: [
            {
                id: "marketing-level1",
                domain: "Marketing Digital",
                domainIcon: "Globe",
                level: 1,
                title: "Niveau 1 : Fondamentaux du Marketing Digital",
                duration: "20 heures",
                objective: "Maîtriser les bases du marketing digital et créer une identité numérique professionnelle",
                instructor: "Professeur Malek Ben Abdallah",
                modules: [
                    {
                        title: "Introduction au marketing digital",
                        duration: "4h",
                        topics: ["Concepts clés du marketing digital", "Différence marketing traditionnel vs digital"],
                        type: "Fondamentaux"
                    },
                    {
                        title: "Identité numérique et personal branding",
                        duration: "4h",
                        topics: ["Construction d'identité digitale", "Définition du public cible"],
                        type: "Pratique"
                    },
                    {
                        title: "Réseaux sociaux – bases",
                        duration: "6h",
                        topics: ["Facebook, Instagram, TikTok, LinkedIn", "Types de contenus et algorithmes"],
                        type: "Pratique"
                    },
                    {
                        title: "Création de contenu",
                        duration: "4h",
                        topics: ["Rédaction de contenu", "Design simple avec Canva"],
                        type: "Atelier"
                    },
                    {
                        title: "Marketing mobile",
                        duration: "2h",
                        topics: ["WhatsApp Business"],
                        type: "Application"
                    }
                ],
                projects: ["Création d'une page professionnelle", "Calendrier de contenu simple"],
                resources: ["Slides PDF", "Template Canva", "Guide WhatsApp Business"]
            },
            {
                id: "english-level1",
                domain: "Anglais",
                domainIcon: "MessageCircle",
                level: 1,
                title: "Niveau 1 : Anglais de Communication – Débutant",
                duration: "20 heures",
                objective: "Acquérir les bases de la communication en anglais pour les situations quotidiennes",
                modules: [
                    {
                        title: "Introduction & Bases",
                        duration: "4h",
                        topics: ["Alphabet & prononciation", "Salutations et formules de politesse", "Verbe To Be", "Pronoms personnels"],
                        type: "Grammaire"
                    },
                    {
                        title: "Communication quotidienne",
                        duration: "4h",
                        topics: ["Présent simple", "Questions simples", "Nombres, dates, heures", "Prépositions"],
                        type: "Pratique"
                    },
                    {
                        title: "Situations pratiques",
                        duration: "4h",
                        topics: ["Restaurant, hôtel, transport", "Shopping et services", "Dialogues guidés"],
                        type: "Mise en situation"
                    },
                    {
                        title: "Compréhension orale",
                        duration: "4h",
                        topics: ["Audio simple", "Mini conversations", "Prononciation"],
                        type: "Oral"
                    },
                    {
                        title: "Révision & Évaluation",
                        duration: "4h",
                        topics: ["Révision générale", "Test oral et écrit"],
                        type: "Évaluation"
                    }
                ],
                methodology: ["Approche communicative", "Jeux de rôle", "Supports audio"],
                certification: "Certificat niveau A1-A2"
            },
            {
                id: "web-level1",
                domain: "Développement Web",
                domainIcon: "Code",
                level: 1,
                title: "Niveau 1 : Fondations & Pensée Computationnelle",
                duration: "20 heures",
                objective: "Comprendre les bases du web et construire un site vitrine interactif sans framework",
                philosophy: "La seule façon d'aller vite, c'est d'aller bien. - Robert C. Martin",
                modules: [
                    {
                        title: "Pensée Algorithmique",
                        duration: "8h",
                        topics: [
                            "Décomposer un problème en étapes",
                            "Variables, types et structures de données",
                            "Système de validation de commande",
                            "Vérifier stock, codes promo, frais de livraison"
                        ],
                        type: "Fondamentaux",
                        workshop: "Système de validation de commande"
                    },
                    {
                        title: "Le Web comme Plateforme",
                        duration: "6h",
                        topics: [
                            "Modèle Requête/Réponse HTTP",
                            "HTML Sémantique",
                            "Flexbox pour mise en page",
                            "Grid pour galeries produits"
                        ],
                        type: "Technique",
                        workshop: "Page catalogue produits responsive"
                    },
                    {
                        title: "Données & État",
                        duration: "6h",
                        topics: [
                            "Tableaux & Objets",
                            "JSON comme format d'échange",
                            "LocalStorage API",
                            "Programmation asynchrone (Promises)"
                        ],
                        type: "Données",
                        workshop: "Panier persistant avec LocalStorage"
                    }
                ],
                livrable: "Site e-commerce statique avec panier",
                technologies: ["HTML5", "CSS3", "JavaScript Vanilla"],
                deployment: "GitHub Pages"
            }
        ]
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
        totalDuration: "90 heures (3 formations x 30h)",
        trainings: [
            {
                id: "marketing-level2",
                domain: "Marketing Digital",
                domainIcon: "Globe",
                level: 2,
                title: "Niveau 2 : Stratégie de Contenu & Publicité",
                duration: "20 heures",
                objective: "Développer une stratégie de contenu efficace et lancer ses premières campagnes publicitaires",
                instructor: "Professeur Malek Ben Abdallah",
                modules: [
                    {
                        title: "Stratégie de contenu",
                        duration: "4h",
                        topics: ["Storytelling", "Calendrier éditorial"],
                        type: "Stratégie"
                    },
                    {
                        title: "Publicité sponsorisée",
                        duration: "6h",
                        topics: ["Facebook & Instagram Ads", "Objectifs, budget et ciblage"],
                        type: "Pratique"
                    },
                    {
                        title: "Marketing vidéo",
                        duration: "4h",
                        topics: ["Reels", "Shorts", "Live"],
                        type: "Création"
                    },
                    {
                        title: "Pages web et landing pages",
                        duration: "4h",
                        topics: ["Introduction à WordPress"],
                        type: "Technique"
                    },
                    {
                        title: "Email marketing",
                        duration: "2h",
                        topics: ["Newsletters", "Séquences automatiques"],
                        type: "Stratégie"
                    }
                ],
                projects: ["Campagne Facebook Ads test", "Landing page simple", "Calendrier éditorial mensuel"],
                resources: ["Template campagne Ads", "Guide WordPress", "Modèles d'emails"]
            },
            {
                id: "english-level2",
                domain: "Anglais",
                domainIcon: "MessageCircle",
                level: 2,
                title: "Niveau 2 : Anglais Intermédiaire",
                duration: "20 heures",
                objective: "Renforcer ses compétences grammaticales et développer l'aisance à l'oral",
                modules: [
                    {
                        title: "Consolidation grammaticale",
                        duration: "4h",
                        topics: ["Present Simple vs Continuous", "Past Simple & Continuous", "Future forms", "Exercices"],
                        type: "Grammaire"
                    },
                    {
                        title: "Expression & Interaction",
                        duration: "4h",
                        topics: ["Donner son opinion", "Accord/désaccord", "Modaux", "Jeux de rôle"],
                        type: "Communication"
                    },
                    {
                        title: "Communication avancée",
                        duration: "4h",
                        topics: ["Conditionnels", "Connecteurs logiques", "Present Perfect"],
                        type: "Grammaire"
                    },
                    {
                        title: "Compréhension écrite",
                        duration: "4h",
                        topics: ["Analyse d'articles", "Résumés", "Discussions dirigées"],
                        type: "Lecture"
                    },
                    {
                        title: "Débats & Simulation",
                        duration: "4h",
                        topics: ["Discussions thématiques", "Présentations", "Test"],
                        type: "Pratique"
                    }
                ],
                methodology: ["Études de cas", "Présentations orales", "Débats"],
                certification: "Certificat niveau B1"
            },
            {
                id: "web-level2",
                domain: "Développement Web",
                domainIcon: "Code",
                level: 2,
                title: "Niveau 2 : Full-Stack Fundamentals",
                duration: "50 heures",
                objective: "Maîtriser le développement full-stack avec la stack MERN et les bases de données",
                philosophy: "Les bons programmeurs écrivent du code que les humains comprennent. - Martin Fowler",
                modules: [
                    {
                        title: "Ingénierie Backend - Node.js & Express",
                        duration: "20h",
                        topics: [
                            "REST API (CRUD complet)",
                            "Architecture en couches",
                            "Middleware pattern",
                            "Validation avec Joi"
                        ],
                        type: "Backend",
                        workshop: "API REST Produits"
                    },
                    {
                        title: "Bases de Données",
                        duration: "8h",
                        topics: [
                            "Modélisation de données",
                            "ACID vs BASE",
                            "Migrations",
                            "Requêtes complexes"
                        ],
                        type: "Base de données",
                        database: ["PostgreSQL", "MongoDB"],
                        workshop: "Schéma e-commerce complet"
                    },
                    {
                        title: "React Fondamentaux",
                        duration: "12h",
                        topics: [
                            "Composants réutilisables",
                            "Flux de données unidirectionnel",
                            "Hooks (useState, useEffect)",
                            "Gestion d'état local"
                        ],
                        type: "Frontend",
                        workshop: "Interface catalogue React"
                    },
                    {
                        title: "Connexion Frontend-Backend",
                        duration: "10h",
                        topics: [
                            "Fetch API / Axios",
                            "Gestion d'erreurs",
                            "Loading states",
                            "Authentification JWT"
                        ],
                        type: "Intégration",
                        workshop: "E-commerce MVP complet"
                    }
                ],
                livrable: "E-commerce MVP (API + Frontend)",
                technologies: ["Node.js", "Express", "React", "PostgreSQL/MongoDB"],
                deployment: "Render / Heroku"
            }
        ]
    },
    {
        id: "legacy", 
        name: "Legacy", 
        price: "1330.00 DT",
        features: [
            "Marketing Digital - Niveau 3 (Analyse & Optimisation)",
            "Anglais - Niveau 3 (Affaires - Marketing)",
            "Développement Web - Niveau 3 (Architecture & Production)",
            "CI/CD & Production",
            "Coaching individuel"
        ],
        trainingSummary: "Pack Expert : Marketing avancé, anglais des affaires et architecture logicielle professionnelle",
        totalDuration: "120 heures (3 formations x 40h)",
        trainings: [
            {
                id: "marketing-level3",
                domain: "Marketing Digital",
                domainIcon: "Globe",
                level: 3,
                title: "Niveau 3 : Analyse & Optimisation Avancée",
                duration: "20 heures",
                objective: "Maîtriser l'analyse des performances et optimiser sa stratégie digitale",
                instructor: "Professeur Malek Ben Abdallah",
                modules: [
                    {
                        title: "Analyse et performance",
                        duration: "5h",
                        topics: ["Meta Business Suite", "Indicateurs de performance (KPI)"],
                        type: "Analyse"
                    },
                    {
                        title: "Marketing sectoriel",
                        duration: "5h",
                        topics: ["Médias", "Tourisme", "Projets locaux"],
                        type: "Spécialisation"
                    },
                    {
                        title: "Gestion de communauté",
                        duration: "4h",
                        topics: ["Gestion des commentaires", "Gestion de crise", "E-réputation"],
                        type: "Community Management"
                    },
                    {
                        title: "Freelancing",
                        duration: "3h",
                        topics: ["Offres de services", "Tarification", "Prospection"],
                        type: "Professionnel"
                    },
                    {
                        title: "Projet final",
                        duration: "3h",
                        topics: ["Élaboration stratégie digitale", "Présentation"],
                        type: "Évaluation"
                    }
                ],
                projects: ["Stratégie digitale complète", "Dashboard de KPIs", "Plan d'action 90 jours"],
                resources: ["Template analyse", "Grille tarifaire", "Exemples de stratégies"]
            },
            {
                id: "english-level3",
                domain: "Anglais",
                domainIcon: "MessageCircle",
                level: 3,
                title: "Niveau 3 : Anglais d'Affaires – Marketing",
                duration: "20 heures",
                objective: "Maîtriser le vocabulaire marketing et présenter des projets en anglais professionnel",
                modules: [
                    {
                        title: "Fondamentaux du Marketing",
                        duration: "4h",
                        topics: ["Market, Target audience, Brand", "Marketing Mix (4P)", "Vocabulaire stratégique"],
                        type: "Vocabulaire"
                    },
                    {
                        title: "Étude de marché",
                        duration: "3h",
                        topics: ["Market research", "Surveys", "Analyser besoins clients", "Présenter résultats"],
                        type: "Analyse"
                    },
                    {
                        title: "Communication Marketing",
                        duration: "4h",
                        topics: ["Email marketing", "Publicité & slogans", "Social media vocabulary"],
                        type: "Rédaction"
                    },
                    {
                        title: "Présentation produit",
                        duration: "3h",
                        topics: ["Décrire un produit", "Argumentation", "Techniques de vente"],
                        type: "Persuasion"
                    },
                    {
                        title: "Projet Final",
                        duration: "6h",
                        topics: ["Création mini plan marketing", "Présentation orale", "Évaluation"],
                        type: "Projet"
                    }
                ],
                methodology: ["Simulations professionnelles", "Études de cas marketing", "Travaux en groupe"],
                projects: ["Mini plan marketing en anglais", "Pitch commercial", "Campagne email"],
                certification: "Certificat niveau B2 + spécialisation Marketing"
            },
            {
                id: "web-level3",
                domain: "Développement Web",
                domainIcon: "Code",
                level: 3,
                title: "Niveau 3 : Architecture & Production",
                duration: "80 heures",
                objective: "Développer une application production-grade avec tests, architecture propre et CI/CD",
                philosophy: "La simplicité est la sophistication suprême. - Leonardo da Vinci",
                modules: [
                    {
                        title: "Architecture Logicielle",
                        duration: "20h",
                        topics: [
                            "SOLID Principles",
                            "Design Patterns",
                            "Clean Architecture",
                            "Domain-Driven Design"
                        ],
                        type: "Architecture",
                        workshop: "Refactoring vers Clean Architecture"
                    },
                    {
                        title: "TypeScript & Type Safety",
                        duration: "15h",
                        topics: [
                            "Types avancés",
                            "Generics",
                            "Utility Types",
                            "Type Guards"
                        ],
                        type: "Type Safety",
                        workshop: "Migration TypeScript progressive"
                    },
                    {
                        title: "Tests & Qualité",
                        duration: "15h",
                        topics: [
                            "TDD (Test-Driven Development)",
                            "Unit tests (Jest)",
                            "Integration tests",
                            "E2E tests (Cypress)"
                        ],
                        type: "Testing",
                        workshop: "Tests complets"
                    },
                    {
                        title: "Docker & CI/CD",
                        duration: "15h",
                        topics: [
                            "Containerization",
                            "Docker Compose",
                            "GitHub Actions",
                            "Déploiement automatisé"
                        ],
                        type: "DevOps",
                        workshop: "Pipeline CI/CD complet"
                    },
                    {
                        title: "Intégration Claude AI",
                        duration: "10h",
                        topics: [
                            "Pair programming avec Claude",
                            "Code review assisté",
                            "Génération de tests",
                            "Debugging patterns"
                        ],
                        type: "AI-Assisted",
                        workshop: "Développement assisté par IA"
                    },
                    {
                        title: "Projet Final",
                        duration: "5h",
                        topics: [
                            "Architecture complète",
                            "Tests & Documentation",
                            "Déploiement production",
                            "Présentation"
                        ],
                        type: "Projet"
                    }
                ],
                livrable: "Plateforme e-commerce complète avec CI/CD",
                technologies: ["TypeScript", "Docker", "Jest", "GitHub Actions", "Claude AI"],
                deployment: "Production-grade avec monitoring"
            }
        ]
    }
];

// Fonction pour obtenir l'icône appropriée
const getDomainIcon = (iconName) => {
    switch(iconName) {
        case 'Globe': return <Globe className="h-5 w-5" />;
        case 'MessageCircle': return <MessageCircle className="h-5 w-5" />;
        case 'Code': return <Code className="h-5 w-5" />;
        default: return <BookOpen className="h-5 w-5" />;
    }
};

export default function PackDetailsPage() {
    const { packId } = useParams();
    const navigate = useNavigate();
    const [pack, setPack] = useState(null);
    const [activeTraining, setActiveTraining] = useState(0);
    const [expandedModules, setExpandedModules] = useState({});

    useEffect(() => {
        const selectedPack = packagesData.find(p => p.id === packId);
        if (selectedPack) {
            setPack(selectedPack);
        } else {
            navigate('/');
        }
    }, [packId, navigate]);

    const toggleModule = (trainingIndex, moduleIndex) => {
        const key = `${trainingIndex}-${moduleIndex}`;
        setExpandedModules(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    if (!pack) {
        return (
            <Layout forceNavbarBackground={true}>
                <div className="py-32 pt-40 pb-20 container mx-auto px-6 min-h-screen bg-theme-white flex items-center justify-center">
                    <div className="text-center">
                        <SectionLoader />
                        <p className="text-theme-muted">Préparation des détails du pack</p>
                    </div>
                </div>
            </Layout>
        );
    }

    // Si c'est le pack gratuit ou un pack sans formations
    if (!pack.trainings || pack.trainings.length === 0) {
        return (
            <Layout forceNavbarBackground={true}>
                <div className="py-32 pt-40 pb-20 container mx-auto px-6 animate-in fade-in duration-500 min-h-screen bg-theme-white">
                    <button 
                        onClick={() => navigate(-1)}
                        className="flex items-center text-theme-primary hover:text-theme-accent mb-12 transition-colors group"
                    >
                        <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Retour aux packs
                    </button>
                    <div className="max-w-4xl mx-auto text-center">
                        <h1 className="text-4xl font-black text-theme-primary mb-4">{pack.name}</h1>
                        <div className="text-3xl font-black text-theme-accent mb-8">{pack.price}</div>
                        <p className="text-xl text-theme-muted mb-8">{pack.trainingSummary}</p>
                        <Button onClick={() => navigate('/auth/signup')} className="btn-cta px-8 py-4 text-lg">
                            Commencer gratuitement
                        </Button>
                    </div>
                </div>
            </Layout>
        );
    }

    const currentTraining = pack.trainings[activeTraining];

    return (
        <Layout forceNavbarBackground={true}>
            <div className="py-32 pt-40 pb-20 container mx-auto px-6 animate-in fade-in duration-500 min-h-screen bg-theme-white">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center text-theme-primary hover:text-theme-accent mb-8 transition-colors group"
                >
                    <ArrowLeft className="mr-2 h-5 w-5 group-hover:-translate-x-1 transition-transform" /> Retour aux packs
                </button>

                {/* En-tête du pack */}
                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-4">
                        <h1 className="text-4xl md:text-5xl font-black text-theme-primary">{pack.name}</h1>
                        {pack.isPopular && (
                            <Badge className="bg-theme-accent text-white px-6 py-2 text-sm animate-pulse">
                                🔥 POPULAIRE
                            </Badge>
                        )}
                    </div>
                    <p className="text-xl text-theme-muted max-w-3xl mb-6">{pack.trainingSummary}</p>
                    
                    {/* Statistiques du pack - NOUVEAU */}
                    <div className="flex flex-wrap gap-4 mb-4">
                        <div className="flex items-center text-theme-primary/80 bg-gray-50 px-4 py-2 rounded-full">
                            <Clock className="h-5 w-5 mr-2 text-pink-600" />
                            <span className="font-semibold">{pack.totalDuration}</span>
                        </div>
                        {pack.totalModules && (
                            <div className="flex items-center text-theme-primary/80 bg-gray-50 px-4 py-2 rounded-full">
                                <Layers className="h-5 w-5 mr-2 text-pink-600" />
                                <span className="font-semibold">{pack.totalModules} modules</span>
                            </div>
                        )}
                        {pack.totalProjects && (
                            <div className="flex items-center text-theme-primary/80 bg-gray-50 px-4 py-2 rounded-full">
                                <Rocket className="h-5 w-5 mr-2 text-pink-600" />
                                <span className="font-semibold">{pack.totalProjects} projets</span>
                            </div>
                        )}
                    </div>

                    {/* Indicateur de progression dans les formations - NOUVEAU */}
                    <div className="flex items-center gap-2 text-sm text-theme-muted">
                        <span className="font-medium">Formation {activeTraining + 1}/{pack.trainings.length}:</span>
                        <div className="flex gap-1">
                            {pack.trainings.map((_, idx) => (
                                <div 
                                    key={idx} 
                                    className={`h-2 w-8 rounded-full transition-all ${
                                        idx === activeTraining ? 'bg-pink-600' : 'bg-gray-200'
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Barre de navigation des formations */}
                {pack.trainings.length > 1 && (
                    <div className="flex flex-wrap gap-2 mb-12 border-b border-gray-200 pb-4">
                        {pack.trainings.map((training, index) => (
                            <button
                                key={training.id}
                                onClick={() => setActiveTraining(index)}
                                className={`px-6 py-3 rounded-lg font-semibold transition-all relative flex items-center gap-2 ${
                                    activeTraining === index
                                        ? 'text-theme-accent after:absolute after:bottom-[-17px] after:left-0 after:w-full after:h-1 after:bg-theme-accent bg-theme-accent/5'
                                        : 'text-gray-400 hover:text-theme-primary'
                                }`}
                            >
                                <span className="text-pink-600">
                                    {getDomainIcon(training.domainIcon)}
                                </span>
                                {training.domain}
                            </button>
                        ))}
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    {/* Sidebar avec infos de la formation actuelle */}
                    <div className="lg:col-span-1">
                        <Card onClick={()=>{}} className="p-8 border border-theme-primary/10 sticky top-32 bg-theme-white shadow-lg">
                            <div className="mb-5">
                                <div className="flex items-center gap-2 mb-3">
                                    <Badge className="bg-pink-100 text-pink-600">
                                        {currentTraining.domain}
                                    </Badge>
                                    <Badge className="bg-gray-100 text-gray-600">
                                        Niveau {currentTraining.level}
                                    </Badge>
                                </div>
                                <h2 className="text-xl font-bold text-theme-primary mb-2">{currentTraining.title}</h2>
                                <div className="text-3xl font-black text-theme-accent mb-4">{pack.price}</div>
                                <p className="text-theme-muted text-sm mb-6">{currentTraining.objective}</p>
                            </div>
                            
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center text-theme-primary/80">
                                    <Clock className="h-5 w-5 mr-3 text-pink-600" /> 
                                    <span>Durée: {currentTraining.duration}</span>
                                </div>
                                {currentTraining.instructor && (
                                    <div className="flex items-center text-theme-primary/80">
                                        <Users className="h-5 w-5 mr-3 text-pink-600" /> 
                                        <span>Formateur: {currentTraining.instructor}</span>
                                    </div>
                                )}
                                {currentTraining.certification && (
                                    <div className="flex items-center text-theme-primary/80">
                                        <Award className="h-5 w-5 mr-3 text-pink-600" /> 
                                        <span>Certification: {currentTraining.certification}</span>
                                    </div>
                                )}
                            </div>

                            {/* Projets pratiques */}
                            {currentTraining.projects && currentTraining.projects.length > 0 && (
                                <div className="mb-8 p-4 bg-blue-50 rounded-xl">
                                    <h3 className="font-bold text-theme-primary mb-3 flex items-center">
                                        <Rocket className="h-5 w-5 mr-2 text-theme-accent" />
                                        Projets pratiques
                                    </h3>
                                    <ul className="space-y-2">
                                        {currentTraining.projects.map((project, idx) => (
                                            <li key={idx} className="flex items-start text-sm text-theme-muted">
                                                <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                                                {project}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            <Button onClick={() => navigate('/auth/signup')} className="btn-cta w-full shadow-lg shadow-theme-accent">
                                S'inscrire maintenant
                            </Button>
                        </Card>
                    </div>

                    {/* Contenu principal - Modules de la formation */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="mb-6">
                            <Badge className="border border-gray-300 bg-transparent text-pink-600 rounded-full mb-4">
                                Programme Détaillé - {currentTraining.domain}
                            </Badge>
                            <h2 className="text-3xl font-bold text-theme-primary mb-4">{currentTraining.title}</h2>
                            {currentTraining.philosophy && (
                                <p className="text-sm text-theme-accent italic mb-4">"{currentTraining.philosophy}"</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            {currentTraining.modules.map((module, moduleIdx) => (
                                <Card key={moduleIdx} onClick={()=>{}} className="border border-gray-200 hover:border-theme-accent/30 transition-all">
                                    <div 
                                        className="p-6 cursor-pointer"
                                        onClick={() => toggleModule(activeTraining, moduleIdx)}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center flex-1">
                                                <div className="h-12 w-12 rounded-full bg-theme-muted flex items-center justify-center mr-4 flex-shrink-0">
                                                    <BookOpen className="h-6 w-6 text-theme-accent" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 flex-wrap">
                                                        <h3 className="text-lg font-bold text-theme-primary">
                                                            {module.title}
                                                        </h3>
                                                        <Badge className="bg-blue-100 text-theme-accent text-xs">
                                                            {module.duration}
                                                        </Badge>
                                                        
                                                    </div>
                                                    <p className="text-xs text-theme-muted mt-1">
                                                        {module.type} • {module.topics.length} sujets
                                                    </p>
                                                </div>
                                            </div>
                                            {expandedModules[`${activeTraining}-${moduleIdx}`] ? (
                                                <ChevronUp className="h-5 w-5 text-theme-muted" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-theme-muted" />
                                            )}
                                        </div>

                                        {expandedModules[`${activeTraining}-${moduleIdx}`] && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                <ul className="space-y-2">
                                                    {module.topics.map((topic, topicIdx) => (
                                                        <li key={topicIdx} className="flex items-start text-sm text-theme-muted">
                                                            <span className="w-1 h-1 rounded-full bg-pink-600 mt-2 mr-2 flex-shrink-0"></span>
                                                            {topic}
                                                        </li>
                                                    ))}
                                                </ul>
                                                {module.workshop && (
                                                    <div className="mt-2 p-3 bg-green-50 rounded-lg">
                                                        <p className="text-sm font-semibold text-green-700 flex items-center">
                                                            <Target className="h-4 w-4 mr-2" />
                                                            Atelier pratique: {module.workshop}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </Card>
                            ))}
                        </div>

                        {/* Ressources et livrables */}
                        {(currentTraining.resources || currentTraining.livrable || currentTraining.technologies || currentTraining.methodology) && (
                            <Card onClick={()=>{}} className="p-6 bg-gradient-to-br from-gray-50 to-white border border-theme-accent/20">
                                <h3 className="font-bold text-theme-primary text-lg mb-4 flex items-center">
                                    <FileText className="h-5 w-5 mr-2 text-theme-accent" />
                                    Ressources & Livrables
                                </h3>
                                
                                {currentTraining.livrable && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-theme-primary">Livrable:</p>
                                        <p className="text-theme-muted text-sm">{currentTraining.livrable}</p>
                                    </div>
                                )}

                                {currentTraining.technologies && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-theme-primary">Technologies:</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {currentTraining.technologies.map((tech, idx) => (
                                                <Badge key={idx} className="bg-gray-200 text-gray-700">
                                                    {tech}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentTraining.methodology && (
                                    <div className="mb-4">
                                        <p className="text-sm font-semibold text-theme-primary">Méthodologie:</p>
                                        <ul className="mt-2 space-y-1">
                                            {currentTraining.methodology.map((method, idx) => (
                                                <li key={idx} className="flex items-center text-sm text-theme-muted">
                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                                    {method}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                {currentTraining.resources && (
                                    <div>
                                        <p className="text-sm font-semibold text-theme-primary">Ressources incluses:</p>
                                        <ul className="mt-2 space-y-1">
                                            {currentTraining.resources.map((resource, idx) => (
                                                <li key={idx} className="flex items-center text-sm text-theme-muted">
                                                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                                                    {resource}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </Card>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}