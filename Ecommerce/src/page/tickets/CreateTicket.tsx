import { useEffect, useState } from "react";
import { FileText, Loader, Send } from 'lucide-react';
import api from "../../components/api";

export default function CreateTicket() {
    const [types, setTypes] = useState<any[]>([]);
    const [title, setTitle] = useState("");
    const [typeId, setTypeId] = useState<number | "">("");
    const [message, setMessage] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        (async () => {
            try {
                const res = await api.get("/tickets/types");
                setTypes(res.data.types);
            } catch (err: any) {
                console.error("Erreur chargement types", err);
                if (err.response?.status === 401) {
                    alert("Veuillez vous connecter");
                    window.location.href = "/login";
                }
            }
        })();
    }, []);

    const handleSubmit = async () => {
        if (!title || !typeId || !message) return alert("Le titre, le type et la description sont requis.");
        
        setIsSubmitting(true);
        try {
            await api.post("/tickets", { title, type_id: typeId, initial_message: message });
            alert("Ticket créé avec succès !");
            // Redirection vers la liste des tickets
            window.location.href = "/ticket"; 
        } catch (err) {
            console.error(err);
            alert("Erreur lors de la création du ticket.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto bg-white shadow-2xl rounded-xl p-8">
                
                {/* En-tête du formulaire */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-4 border border-gray-200">
                        <FileText size={40} className="text-teal-500" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Détails du Ticket de Support</h1>
                    <p className="text-gray-600 mt-2">
                        Veuillez fournir une description claire et concise du problème que vous rencontrez afin que nous puissions vous aider le plus rapidement possible.
                    </p>
                </div>

                <div className="space-y-6">
                    {/* Titre et Type */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Titre du ticket de support <span className="text-red-500">*</span></label>
                            <input 
                                className="p-3 border border-gray-300 w-full rounded-lg focus:ring-teal-400 focus:border-teal-400" 
                                placeholder="Titre du ticket de support" 
                                value={title} 
                                onChange={(e)=>setTitle(e.target.value)} 
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Type <span className="text-red-500">*</span></label>
                            <select 
                                className="p-3 border border-gray-300 w-full rounded-lg bg-white focus:ring-teal-400 focus:border-teal-400 appearance-none" 
                                value={typeId} 
                                onChange={(e)=>setTypeId(Number(e.target.value) || "")}
                            >
                                <option value="">Sélectionnez un type</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Description du ticket de support <span className="text-red-500">*</span></label>
                        
                        {/* Barre d'édition (simulée) */}
                        <div className="flex items-center space-x-3 p-3 bg-gray-100 border border-gray-300 rounded-t-lg">
                            <span className="text-sm font-semibold text-gray-500">B</span>
                            <span className="text-sm font-semibold italic text-gray-500">I</span>
                            {/* ... autres icônes ... */}
                        </div>

                        <textarea 
                            rows={8} 
                            className="p-3 w-full border border-gray-300 border-t-0 rounded-b-lg focus:ring-teal-400 focus:border-teal-400 resize-y" 
                            placeholder="Description du ticket de support..." 
                            value={message} 
                            onChange={(e)=>setMessage(e.target.value)} 
                        />
                    </div>
                </div>

                {/* Bouton Soumettre */}
                <div className="flex justify-center mt-8">
                    <button 
                        onClick={handleSubmit} 
                        disabled={isSubmitting}
                        className="bg-gray-800 text-white px-8 py-3 rounded-xl font-bold text-lg shadow-lg hover:bg-teal-600 transition flex items-center disabled:opacity-50"
                    >
                        {isSubmitting ? (
                            <Loader size={20} className="animate-spin mr-2" />
                        ) : (
                            <Send size={20} className="mr-3" />
                        )}
                        Ouvrir Ticket
                    </button>
                </div>
            </div>
        </div>
    );
}