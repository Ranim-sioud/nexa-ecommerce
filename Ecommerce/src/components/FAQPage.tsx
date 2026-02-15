import React, { useEffect, useRef, useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { 
    ArrowLeft, Users, Mail, Phone,
    Package, BookOpen, CreditCard, Rocket, ChevronDown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {Layout} from './HomePage';

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
export default function FAQPage() {
    const [openFAQ, setOpenFAQ] = useState(null);
    const navigate = useNavigate();
    const [activeCategory, setActiveCategory] = useState("Démarrage");

    const toggleFAQ = (categoryIndex, questionIndex) => {
        const key = `${categoryIndex}-${questionIndex}`;
        setOpenFAQ(openFAQ === key ? null : key);
    };

    const currentCategory = faqsData.find(cat => cat.category === activeCategory);

    return (
        <Layout forceNavbarBackground={true}>
        <div className="py-32 pt-40 pb-20 min-h-screen bg-theme-section">
            <div className="container mx-auto px-6">
                <div className="flex items-center justify-between mb-12">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="flex items-center text-theme-muted hover:text-theme-primary transition-colors group"
                    >
                        <ArrowLeft className="mr-3 h-6 w-6 group-hover:-translate-x-1 transition-transform" /> 
                        <span className="font-medium">Retour à l'accueil</span>
                    </button>
                    
                    <Badge className="bg-theme-primary/10 text-theme-primary">
                        FAQ Complète
                    </Badge>
                </div>

                <div className="text-center mb-16">
                    <h1 className="text-5xl md:text-6xl font-black text-theme-primary mb-6">
                        Foire Aux <span className="text-gradient">Questions</span>
                    </h1>
                    <p className="text-xl text-theme-muted max-w-2xl mx-auto">
                        Tout ce que vous devez savoir pour réussir avec Nexa
                    </p>
                </div>

                <div className="max-w-6xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                        <div className="lg:col-span-1">
                            <Card className="p-6 bg-theme-card border border-theme sticky top-32">
                                <h3 className="text-lg font-black text-theme-primary mb-6 flex items-center gap-2">
                                    <BookOpen className="h-5 w-5 text-theme-accent" />
                                    Catégories
                                </h3>
                                <div className="space-y-2">
                                    {faqsData.map((category, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setActiveCategory(category.category)}
                                            className={`w-full text-left px-4 py-3 rounded-xl transition-all duration-300 flex items-center gap-3 ${
                                                activeCategory === category.category
                                                ? 'bg-theme-accent text-white shadow-lg shadow-primary/30'
                                                : 'text-theme-muted hover:bg-theme-muted hover:text-theme-primary'
                                            }`}
                                        >
                                            <category.icon className="h-4 w-4 flex-shrink-0" />
                                            <span className="font-medium">{category.category}</span>
                                        </button>
                                    ))}
                                </div>
                            </Card>
                        </div>

                        <div className="lg:col-span-3">
                            <Card className="p-8 bg-theme-card border border-theme">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-12 h-12 rounded-xl bg-theme-primary/20 flex items-center justify-center">
                                        <currentCategory.icon className="h-6 w-6 text-theme-accent" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-theme-primary">{currentCategory.category}</h3>
                                        <p className="text-theme-muted">{currentCategory.questions.length} questions</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {currentCategory.questions.map((faq, questionIndex) => (
                                        <div 
                                            key={questionIndex}
                                            className={`border border-theme rounded-xl transition-all duration-300 ${
                                                openFAQ === `${faqsData.indexOf(currentCategory)}-${questionIndex}`
                                                ? 'bg-theme-muted/30 border-theme-primary/50'
                                                : 'bg-transparent hover:bg-theme-muted/10'
                                            }`}
                                        >
                                            <button
                                                onClick={() => toggleFAQ(faqsData.indexOf(currentCategory), questionIndex)}
                                                className="w-full text-left p-6 flex justify-between items-center gap-4"
                                            >
                                                <span className="font-bold text-theme-primary text-lg flex-1">
                                                    {faq.q}
                                                </span>
                                                <div className={`transform transition-transform duration-300 flex-shrink-0 ${
                                                    openFAQ === `${faqsData.indexOf(currentCategory)}-${questionIndex}` ? 'rotate-180' : ''
                                                }`}>
                                                    <ChevronDown className="text-theme-primary h-5 w-5" />
                                                </div>
                                            </button>
                                            
                                            {openFAQ === `${faqsData.indexOf(currentCategory)}-${questionIndex}` && (
                                                <div className="px-6 pb-6">
                                                    <div className="pt-4 border-t border-theme">
                                                        <p className="text-theme-muted leading-relaxed text-lg">
                                                            {faq.a}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Card>
                        </div>
                    </div>

                    <Card className="p-12 mt-6 bg-theme-card border border-theme text-center">
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-3xl font-black text-theme-primary mb-4">
                                Vous n'avez pas trouvé de réponse ?
                            </h3>
                            <p className="text-theme-muted text-xl mb-8">
                                Notre équipe d'experts est disponible pour répondre à toutes vos questions
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                                <Button className="border border-theme-accent text-theme-accent bg-blue-50 px-8 py-4 rounded-xl font-bold hover:bg-theme-accent/20 transition-all text-lg">
                                    <Phone className="h-5 w-5 mr-3" />
                                    (+216) 25 008 208
                                </Button>
                                <Button className="bg-theme-card text-theme-primary border border-theme px-8 py-4 rounded-xl font-bold hover:bg-theme-muted transition-all text-lg">
                                    <Mail className="h-5 w-5 mr-3" />
                                    support@ecomness.com
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
       </Layout>
    );
};