import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { get, post } from "./api"; // Assurez-vous que ce chemin est correct
import {
    FileText,
    MessageCircle,
    Send,
    Users,
    RefreshCcw,
    Loader,
    X,
    Info,
    ClipboardCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Separator } from "../../components/ui/separator";
import { ScrollArea } from "../../components/ui/scroll-area";
import { Avatar, AvatarFallback } from "../../components/ui/avatar";
import ReactQuill from "react-quill";
import 'react-quill/dist/quill.snow.css';
import api from "../../components/api";

// ====================== Utils ======================
const formatDateTime = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    // Format jj/mm/aaaa hh:mm
    return date.toLocaleString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};
const formatTime = (isoDate) => {
    if (!isoDate) return "";
    const date = new Date(isoDate);
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
};

const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
        case "ouvert":
            // Vert clair raffiné
            return <Badge className="bg-teal-50 text-teal-400 font-semibold text-xs py-0.5 px-2">Ouvert</Badge>;
        case "fermé":
            return <Badge className="bg-red-100 text-red-400 font-semibold text-xs py-0.5 px-2">Fermé</Badge>;
        case "en_cours":
            return <Badge className="bg-yellow-100 text-yellow-700">En cours</Badge>;
        default:
            return <Badge variant="secondary">{status}</Badge>;
    }
};

// ====================== Composants de UI spécifiques ======================

const TicketInfoRow = ({ label, children }) => (
    <div className="flex items-center text-sm py-1">
        <span className="text-gray-500 w-1/2 pr-2">{label}</span>
        <div className="text-gray-800 font-medium text-right w-1/2 flex justify-end items-center">{children}</div>
    </div>
);

const UserDisplay = ({ user }) => (
    <div className="flex flex-col items-center justify-center gap-1 text-xs">
        <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[10px] bg-gray-200 text-gray-700 font-semibold">
                {user?.nom?.[0]?.toUpperCase() || "?"}
            </AvatarFallback>
        </Avatar>
        <span className="text-gray-700 text-xs">{user?.nom || "Non assigné"}</span>
    </div>
);

const InitialTicketMessage = ({ ticket, initialMessage }) => {
    const formatInitialMessage = (html) => {
        if (!html) return "Aucune description disponible";
        
        try {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = html;
            const text = tempDiv.textContent || tempDiv.innerText || "";
            const cleaned = text.replace(/\s+/g, ' ').trim();
            return cleaned || "Aucune description disponible";
        } catch (error) {
            return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
        }
    };

    const isStockConfirmation = ticket.type_id == '17';
    
    return (
        <div className="flex flex-col items-center my-2">
            <div className="bg-white p-4 w-fit max-w-lg rounded-lg shadow-sm border border-gray-200 text-left">
                <div className="flex flex-col items-center mb-4">
                    <FileText className="h-5 w-5 text-gray-600 mb-1" />
                    <p className="text-sm text-gray-500">
                        Ticket ouvert le <span className="font-medium text-gray-700">{formatDateTime(ticket.created_at).split(' ')[0]}</span>
                        <br />
                        par <span className="font-medium text-gray-700">{ticket.creator?.nom}</span>
                    </p>
                </div>
                
                <h3 className="text-lg font-bold text-gray-800 mb-3">{ticket.title}</h3>
                
                <div className="text-center">
                    {isStockConfirmation ? (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg text-left">
                            <p className="text-xs text-gray-600 mb-1">
                                <span className="font-medium text-gray-800">Product code:</span> {ticket.product_code || 'Non spécifié'} 
                            </p>
                            <p className="text-xs text-gray-600">
                                <span className="font-medium text-gray-800">Product name:</span> {ticket.product_name || formatInitialMessage(initialMessage?.body)}
                            </p>
                        </div>
                    ) : (
                        <div className="mt-2 p-3 bg-gray-50 border border-gray-100 rounded-lg text-left">
                            <p className="text-sm text-gray-700">
                                <span className="font-medium text-gray-800">Description :</span><br />
                                {formatInitialMessage(initialMessage?.body)}
                            </p>
                            
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};


const MessageBubble = ({ message, isSelf }) => (
    <div className={`flex items-end gap-3 my-4 ${isSelf ? "justify-end" : "justify-start"}`}>
        {/* Avatar de l'ASSIGNÉ (Gauche) */}
        {!isSelf && (
            <Avatar className="w-8 h-8 self-start">
                <AvatarFallback className="bg-gray-200 text-gray-800 text-sm font-semibold">
                    {message.sender?.nom?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
            </Avatar>
        )}
        
        <div className="flex flex-col max-w-lg">
            {/* Nom et heure */}
            <div className={`flex mb-1 ${isSelf ? 'justify-end' : 'justify-start'}`}>
                <p className="text-xs font-semibold text-gray-700 mr-2">
                    {message.sender?.nom}
                </p>
                <span className="text-xs text-gray-400">
                    {formatTime(message.created_at)}
                </span>
            </div>

            {/* Bulle de Message */}
            <div
                className={`p-3 text-sm shadow-md mb-1 ${
                    isSelf
                        ? "bg-[#D9F4EC] text-gray-900 rounded-xl rounded-br-sm" // Bulle Utilisateur (Vert clair)
                        : "bg-white text-gray-800 border border-gray-100 rounded-xl rounded-tl-sm" // Bulle Assigné (Blanc)
                }`}
                style={{ minWidth: '150px' }}
            >
                <p dangerouslySetInnerHTML={{ __html:message.body}} />
            </div>
        </div>
        
        {/* Avatar de l'UTILISATEUR (Droite) - Pour un look type chat */}
        {isSelf && (
            <Avatar className="w-8 h-8 self-start">
                <AvatarFallback className="bg-teal-100 text-gray-800 text-sm font-semibold">
                    {message.sender?.nom?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
            </Avatar>
        )}
    </div>
);

// ====================== Composant Principal ======================
export default function TicketDetails() {
    const { id } = useParams();
    const [ticket, setTicket] = useState(null);
    const [reply, setReply] = useState("");
    const [isSending, setIsSending] = useState(false);
    const [showParticipants, setShowParticipants] = useState(false);
    const [userRole, setUserRole] = useState("");
    const messagesEndRef = useRef(null);

    const loadTicket = async () => {
        try {
            const res = await api.get(`/tickets/${id}`);
            setTicket(res.data.tickets); 
            
            console.log('=== DEBUG TICKET ===');
            console.log('Type ID:', res.data.tickets.type_id);
            console.log('TicketsMessages total:', res.data.tickets.TicketsMessages?.length);
            console.log('Créateur ID:', res.data.tickets.creator?.id);
            console.log('Tous les messages (avec dates):');
            res.data.tickets.TicketsMessages?.forEach((msg, index) => {
                console.log(`Message ${index}:`, {
                    id: msg.id,
                    body: msg.body,
                    sender_id: msg.sender_id,
                    sender_nom: msg.sender?.nom,
                    created_at: msg.created_at,
                    date: new Date(msg.created_at).toLocaleString()
                });
            });
            console.log('====================');
            
            const userString = localStorage.getItem("user");
            if (userString) {
                const user = JSON.parse(userString);
                setUserRole(user.role);
            }
        } catch (err) {
            console.error("Erreur lors du chargement du ticket (500):", err);
        }
    };

    useEffect(() => {
        loadTicket();
    }, [id]);

    useEffect(() => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 50);
    }, [ticket?.TicketsMessages]);


    const sendReply = async () => {
        if (!reply.trim()) return;
        setIsSending(true);
        const cleanedReply = reply.replace(/<[^>]*>?/gm, '').trim();
        // Pour afficher correctement dans l'UI immédiate
        const formattedReplyForUI = reply.trim() === "" ? "" : reply;
        const newTempMessage = {
            id: Date.now(),
            body: formattedReplyForUI,
            created_at: new Date().toISOString(),
            sender: ticket.creator, 
        };

        // Mise à jour immédiate de l'UI pour un effet instantané
        setTicket(prev => ({
            ...prev,
            TicketsMessages: [...prev.TicketsMessages, newTempMessage]
        }));
        setReply("");

        try {
            await api.post(`/tickets/${id}/messages`, { body: cleanedReply });
            // Rechargement pour obtenir la vraie ID et l'horodatage du serveur (optionnel, mais propre)
            loadTicket(); 
        } catch(e) {
            console.error("Erreur lors de l'envoi du message:", e);
            alert("Erreur lors de l'envoi du message. Veuillez réessayer.");
            // Logique de rollback ou de marqueur d'erreur ici si nécessaire
        } finally {
            setIsSending(false);
        }
    };

    const changeStatus = async (newStatus) => {
        try {
            await api.post(`/tickets/tickets/${id}/status`, { status: newStatus });
            await loadTicket();
        } catch (err) {
            console.error("Erreur lors du changement de statut:", err);
        }
    };

    if (!ticket) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader className="animate-spin mr-2" /> Chargement...
            </div>
        );
    }
    const getInitialDescriptionMessage = () => {
    if (!ticket.TicketsMessages || ticket.TicketsMessages.length === 0) {
        return null;
    }

    // 1. Trier tous les messages par date de création (plus ancien en premier)
    const sortedMessages = [...ticket.TicketsMessages].sort(
        (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    console.log('Messages triés par date (plus ancien en premier):', sortedMessages);

    // 2. Chercher d'abord un message du créateur lors de la création du ticket
    const creatorMessages = sortedMessages.filter(
        message => message.sender_id === ticket.creator?.id
    );

    console.log('Messages du créateur:', creatorMessages);

    // 3. Prendre le PLUS ANCIEN message du créateur
    if (creatorMessages.length > 0) {
        // Ils sont déjà triés par date croissante, donc le premier est le plus ancien
        const oldestCreatorMessage = creatorMessages[0];
        
        // Vérifier si ce message est "ancien" (créé peu après le ticket)
        const ticketDate = new Date(ticket.created_at).getTime(); // Convertir en timestamp
        const messageDate = new Date(oldestCreatorMessage.created_at).getTime(); // Convertir en timestamp
        const timeDiff = Math.abs(messageDate - ticketDate);
        
        // Si le message a été créé dans les 5 minutes suivant la création du ticket,
        // on considère que c'est la description initiale
        if (timeDiff < 5 * 60 * 1000) { // 5 minutes en millisecondes
            console.log('Message de description initiale trouvé:', oldestCreatorMessage);
            return oldestCreatorMessage;
        }
    }

    // 4. Sinon, prendre le message le plus ancien TOUT COURT
    console.log('Aucun message du créateur trouvé, prendre le plus ancien:', sortedMessages[0]);
    return sortedMessages[0];
};
    
   const initialDescriptionMessage = getInitialDescriptionMessage();
    
    console.log('Message de description à afficher:', initialDescriptionMessage);

    // Filtrer les messages de la conversation (exclure le message de description)
    const conversationMessages = ticket.TicketsMessages?.filter(
        message => message.id !== initialDescriptionMessage?.id
    );

    console.log('Messages de conversation:', conversationMessages?.length);
    const participants = [
        ticket.creator,
        ticket.assignee,
        ...(ticket.specialists || []),
    ].filter(Boolean);

    return (
        <div className="p-4 md:p-8 bg-[#f7f8f9] min-h-screen"> 
                <h1 className="text-2xl font-bold text-gray-800 mb-4 flex items-center">
                    <ClipboardCheck size={28} className="mr-3 text-gray-800" />
                     Détails du Ticket de Support
                </h1>
                
                <div className="p-4 mb-8 bg-white border border-gray-200 rounded-lg shadow-sm">
                    <div className="flex items-start">
                        <div className="p-2 mr-3">
                            <Info size={20} className="w-5 h-5  text-teal-400 flex-shrink-0 mt-0.5" />
                        </div>
                        <p className="text-sm text-gray-700">
                            Ici, vous pouvez trouver l'historique et les détails du ticket de support et vous pouvez également répondre et envoyer des messages au responsable administratif assigné pour vous aider.
                        </p>
                    </div>
                </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* ----- Colonne de Gauche : Détails ----- */}
                <div className="lg:col-span-1 bg-white p-6 rounded-lg border border-gray-200 shadow-sm sticky top-0">
                    <CardTitle className="flex items-center text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">
                        <FileText size={18} className="mr-3 text-pink-500" /> 
                        <span className="font-normal">Ticket</span> : <span className="ml-1 font-semibold text-pink-500">{ticket.code}</span>
                    </CardTitle>
                    <div className="space-y-1 mt-2">
                        <TicketInfoRow label="Code :">{ticket.code}</TicketInfoRow>
                        <TicketInfoRow label="Date de création :">{formatDateTime(ticket.created_at).split(' ')[0]}</TicketInfoRow>
                        <TicketInfoRow label="Dernière mise à jour :">{formatDateTime(ticket.updated_at).split(' ')[0]}</TicketInfoRow>
                        <TicketInfoRow label="Titre du ticket :">{ticket.title}</TicketInfoRow>
                        <TicketInfoRow label="Type :">{ticket.type?.name}</TicketInfoRow>
                        <TicketInfoRow label="Statut :">{getStatusBadge(ticket.status)}</TicketInfoRow>

                        {/* ✅ Boutons statut visible seulement pour admin/spécialiste */}
                        {(userRole === "admin" || userRole === "specialiste") && (
                          <div className="flex items-center gap-2 mt-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus("ouvert")}
                              className="h-7 px-3 text-xs border-teal-400 text-teal-400 hover:bg-teal-50"
                            >
                              Ouvrir
                            </Button>                        

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus("en_cours")}
                              className="h-7 px-3 text-xs border-yellow-700 text-yellow-700 hover:bg-yellow-100"
                            >
                              En cours
                            </Button>                        

                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => changeStatus("fermé")}
                              className="h-7 px-3 text-xs border border-red-400 text-red-500 hover:bg-red-100"
                            >
                              Fermer
                            </Button>
                          </div>
                        )}
                        <Separator className="my-3"/>
                        <TicketInfoRow label="Créateur :">
                            <div className="text-gray-800 font-medium">{ticket.creator?.nom}</div> 
                        </TicketInfoRow>
                        <TicketInfoRow label="Assigné à :">
                            <div>{ticket.assignee?.nom}</div> 
                        </TicketInfoRow>
                    </div>
                </div>

                {/* ----- Colonne de Droite : Conversation ----- */}
                <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 shadow-sm relative flex flex-col h-[800px]">
                    
                    {/* Header de Conversation */}
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-20">
                        <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                            <MessageCircle size={18} className="mr-3 text-teal-400" />
                            Conversation <span className="ml-1 font-semibold text-teal-400">{ticket.code}</span>
                        </h2>
                        <div className="flex items-center">
                            <Button variant="ghost" size="sm" className="text-gray-600 hover:bg-gray-100 font-normal" onClick={() => setShowParticipants(!showParticipants)}>
                                <Users size={16} className="text-gray-500" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={loadTicket} className="text-gray-600 hover:bg-gray-100 font-normal" >
                                <RefreshCcw size={16} className="text-gray-500" />
                            </Button>
                        </div>
                    </div>

                    {/* Popover Participants (conservé pour la fonctionnalité) */}
                    <AnimatePresence>
                        {showParticipants && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="absolute right-4 top-16 bg-white border shadow-xl rounded-lg p-3 w-64 z-50"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="text-sm font-semibold text-gray-700">Participants</h3>
                                    <Button variant="ghost" size="icon" className="text-gray-500 w-6 h-6" onClick={() => setShowParticipants(false)}>
                                        <X size={14} />
                                    </Button>
                                </div>
                                <Separator className="mb-2" />
                                <div className="space-y-2 max-h-60 overflow-y-auto">
                                    {participants.map((p, idx) => (
                                        <div key={idx} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-md">
                                            <Avatar className="w-6 h-6">
                                                <AvatarFallback className="bg-gray-200 text-gray-700 text-xs">
                                                    {p.nom?.[0]?.toUpperCase() || "?"}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-sm text-gray-700">{p.nom}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Zone de messages scrollable */}
                    <ScrollArea className="flex-grow h-full px-6 py-4 flex flex-col"> 
                        <div className="flex flex-col">
                        {initialDescriptionMessage && <InitialTicketMessage ticket={ticket} initialMessage={initialDescriptionMessage} />}

                        {/* On commence l'affichage des messages à partir du 2ème s'il y en a plus d'un */}
                        {conversationMessages?.map((m) => (
                            <MessageBubble
                                key={m.id}
                                message={m}
                                isSelf={m.sender?.nom === ticket.creator?.nom} 
                            />
                        ))}
                        </div>
                        <div ref={messagesEndRef} />
                    </ScrollArea>

                    {/* Zone de saisie */}
                    <div className="border-t border-gray-200 bg-white p-4 sticky bottom-0 z-10 rounded-b-xl shadow-inner">
                        {/* Conteneur principal de l'éditeur */}
                        <div className="border border-gray-300 rounded-lg overflow-hidden">
                            <ReactQuill
                                theme="snow" // Utilise le thème 'snow' pour le style
                                value={reply}
                                onChange={setReply}
                                placeholder="Tapez un message et joignez une capture d'écran si nécessaire...."
                                modules={{
                                    toolbar: {
                                        container: [
                                            // Ligne 1 : Les boutons EXACTEMENT dans l'ordre de la capture
                                            [{ 'list': 'bullet' }, { 'list': 'ordered' }], // Listes
                                            ['bold', 'italic'],                              // Gras, Italique
                                            ['blockquote', 'code-block'],                    // (Remplaçant les icônes de style complexe)
                                            [{ 'header': 1 }, { 'header': 2 }],              // H1, H2
                                            ['image'],                                       // Image/Capture
                                            [{ 'color': [] }, { 'background': [] }],         // Couleur A et surlignage S
                                            [{ 'align': '' }, { 'align': 'center' }, { 'align': 'right' }, { 'align': 'justify' }], // Alignement
                                            ['clean'],                                       // Retirer le formatage
                                        ],
                                    }
                                }}
                                // Style pour faire correspondre l'apparence de la capture
                                className="h-36 mb-12 custom-quill-editor" 
                            />
                        </div>
                        {/* Bouton d'envoi dans le coin inférieur droit, style sombre et centré */}
                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={sendReply}
                                disabled={isSending || !reply.trim()}
                                // Style gris/sombre de la capture
                                className="bg-gray-500 text-white hover:bg-gray-700 rounded-lg px-6 py-2 h-auto text-sm font-semibold transition-colors shadow-md" 
                            >
                                {isSending ? (
                                    <Loader size={16} className="animate-spin mr-2" />
                                ) : (
                                    <Send size={16} className="mr-2 transform rotate-45 -mt-0.5" />
                                )}
                                Envoyer
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}