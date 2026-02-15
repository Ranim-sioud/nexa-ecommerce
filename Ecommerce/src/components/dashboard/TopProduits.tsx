import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { CalendarRangeIcon } from "lucide-react";
import { TopProduitItem } from "../types/dashboard";

interface Props {
  produits: TopProduitItem[];
  dateRange: {
    start: string;
    end: string;
  };
  formatTitleDate: (dateString: string) => string;
}

export default function TopProduits({ produits, dateRange, formatTitleDate }: Props) {
  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="flex-shrink-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-md font-semibold">
          <CalendarRangeIcon className="w-5 h-5 text-pink-600" />
          <span className="text-pink-600">
            {dateRange.start === dateRange.end ? formatTitleDate(dateRange.start) : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`}
          </span>
        </CardTitle>
        <h3 className="text-2xl font-bold">Mes produits les plus vendus</h3>
        <p className="text-sm text-muted-foreground">
          Voici les 50 produits que vous avez le plus vendus sur la période sélectionnée
        </p>
      </CardHeader>
      <CardContent className="flex-1 min-h-0 p-0 overflow-hidden">
        {produits.length > 0 ? (
          <div 
            className="h-full overflow-y-auto px-4 pb-2 custom-scrollbar"
            style={{ 
              maxHeight: '300px',
              scrollbarWidth: 'thin' as const,
              scrollbarColor: '#fff #e5e7eb'
            }}
          >
            <div className="space-y-2">
              {produits.map((p, index) => (
                <div
                  key={p.id || index}
                  className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-12 w-12 flex-shrink-0 rounded-lg overflow-hidden border border-gray-200 bg-white flex items-center justify-center">
                      {(() => {
                        const medias = p.medias || [];
                    
                        // Trouver une image
                        const image = medias.find(m =>
                          /\.(jpg|jpeg|png|gif|webp)$/i.test(m.url)
                        );
                    
                        // Trouver une vidéo
                        const video = medias.find(m =>
                          /\.(mp4|mov|webm)$/i.test(m.url)
                        );
                    
                        // IMAGE EN PREMIER
                        if (image) {
                          return (
                            <img
                              src={image.url}
                              alt={p.nom}
                              className="w-full h-full object-contain"
                            />
                          );
                        }
                    
                        // SINON VIDÉO
                        if (video) {
                          return (
                            <video
                              src={video.url}
                              muted
                              className="w-full h-full object-contain"
                            />
                          );
                        }
                    
                        // SINON LES INITIALES DU PRODUIT
                        return (
                          <div className="w-full h-full flex items-center justify-center bg-gray-100">
                            <span className="text-xs text-gray-500 font-medium">
                              {p.nom
                                .split(" ")
                                .map(word => word[0])
                                .join("")
                                .toUpperCase()
                                .substring(0, 2)}
                            </span>
                          </div>
                        );
                      })()}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-gray-500">#{index + 1}</p>
                      <p className="text-base font-medium text-gray-800 truncate">{p.nom}</p>
                    </div>
                  </div>
                  
                  <div className="flex-shrink-0 ml-2">
                    <span className="text-xl font-bold text-gray-900">{p.ventes || p.quantite}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground px-4">
            Aucune donnée n'est actuellement disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}