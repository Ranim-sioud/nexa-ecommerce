import { useEffect, useState, useRef, lazy, Suspense } from "react";
import axios from "axios";
import {
  Calendar, CalendarRangeIcon, Check, LayoutGrid, X, Clock, TrendingUp
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

// Composants réutilisables depuis DashboardF
const TopProduits = lazy(() => import("../dashboard/TopProduits"));
const TauxRetour = lazy(() => import("../dashboard/TauxRetour"));
const ProfitsMonthly = lazy(() => import("../dashboard/ProfitsMonthly"));
const ProfitsDaily = lazy(() => import("../dashboard/ProfitsDaily"));

// Composants spécifiques à Dashboard
import { StatsCardsPrimary } from "./StatsCardsPrimary";
import { StatsCardsSecondary } from "./StatsCardsSecondary";
import { ChartStats } from "./ChartStats";
import { CommandesParSource } from "./CommandesParSource";
import { DashboardData } from "../types/dashboard";
import api from "../api";

// Fonction utilitaire partagée
const getSourceColor = (source: string): string => {
  switch (source) {
    case "site_web": return "#93C5FD";
    case "Facebook": return "#A7C8FD";
    case "Converty": return "#f6fd74d6";
    case "WooCommerce": return "#D8B4FE";
    case "Tik Tok Pro": return "#A3A3A3";
    case "Shopify": return "#A7F3D0";
    case "Téléphone": return "#3b82f6";
    case "Instagram": return "#F9A8D4";
    case "WhatsApp": return "#86EFAC";
    default: return "#E5E7EB";
  }
};

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });
  const [selectedDateDisplay, setSelectedDateDisplay] = useState(
    today.toLocaleDateString("fr-FR")
  );

  const formatDateDisplay = (start: string, end: string): string => {
    const s = new Date(start).toLocaleDateString("fr-FR");
    const e = new Date(end).toLocaleDateString("fr-FR");
    return start === end ? s : `${s} - ${e}`;
  };

  const formatTitleDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const load = async (): Promise<void> => {
    try {
      setLoading(true);

      const res = await api.get<DashboardData>("/dashboard", {
        params: {
          dateDebut: dateRange.start,
          dateFin: dateRange.end,
        }
      });
      
      setDashboardData(res.data);
      setSelectedDateDisplay(formatDateDisplay(dateRange.start, dateRange.end));
    } catch (err: any) {
      console.error("Erreur chargement dashboard", err);
      if (err.response?.status === 401) {
        localStorage.removeItem("accessToken");
        window.location.href = '/auth/login';
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCalendar]);

  if (loading) return <div className="py-10 text-center text-sm sm:text-base">Chargement du tableau de bord…</div>;
  if (!dashboardData || !dashboardData.cards) return <div className="py-10 text-center text-sm sm:text-base">Aucune donnée disponible</div>;

  const { cards, dailyData, monthlyData, topProduits, commandesParSource } = dashboardData;

  return (
    <div className="space-y-4 sm:space-y-6 p-3 sm:p-6 bg-gray-50/50 min-h-screen">
      {/* Header - Version mobile : titre au-dessus, calendrier en-dessous */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Titre */}
        <div className="flex items-center sm:justify-start w-full sm:w-auto">
          <div className="p-2 rounded-lg">
            <LayoutGrid className="h-6 w-6 sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-center sm:text-left">
            Tableau de bord
          </h1>
        </div>
    
        {/* Calendrier - Position différente sur mobile vs desktop */}
        <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-2 relative w-full sm:w-auto" ref={calendarRef}>
          {/* Affichage mobile : calendrier en pleine largeur */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowCalendar(!showCalendar)}
              className="justify-start flex-1 sm:flex-none text-sm sm:text-base w-full sm:w-auto"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span className="truncate">{selectedDateDisplay}</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                load();
                setShowCalendar(false);
              }}
              className="font-semibold text-sm sm:text-base flex-shrink-0"
            >
              <Check className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Apply</span>
            </Button>
          </div>
    
          {/* Calendrier déroulant */}
          {showCalendar && (
            <div className="absolute top-12 sm:top-12 right-0 z-50 w-full sm:w-96 bg-white shadow-2xl rounded-xl border border-gray-100 overflow-hidden">
              <div className="pt-4 pl-4 flex items-center justify-between">
                <h3 className="font-bold text-lg">Sélection de période</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowCalendar(false)}
                  className="h-8 w-8 p-0 hover:bg-white/20 text-black rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
    
              <div className="pt-0 p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Début
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) =>
                          setDateRange(prev => ({ ...prev, start: e.target.value }))
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-teal-500 focus:ring-2 focus:ring-teal-200 transition-all duration-300 bg-white shadow-sm group-hover:border-gray-300"
                      />
                    </div>
                  </div>
    
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                      Fin
                    </label>
                    <div className="relative group">
                      <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) =>
                          setDateRange(prev => ({ ...prev, end: e.target.value }))
                        }
                        className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-300 bg-white shadow-sm group-hover:border-gray-300"
                      />
                    </div>
                  </div>
                </div>
    
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Périodes rapides</p>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Aujourd'hui", days: 0, icon: Clock, color: "teal" },
                      { label: "7 jours", days: 6, icon: CalendarRangeIcon, color: "blue" },
                      { label: "30 jours", days: 29, icon: TrendingUp, color: "purple" },
                      { label: "3 mois", days: 89, icon: Calendar, color: "orange" },
                    ].map((period, index) => {
                      const Icon = period.icon;
                      return (
                        <Button
                          key={index}
                          variant="outline"
                          className={`flex items-center gap-2 py-3 text-sm transition-all duration-200 hover:scale-105 hover:shadow-md border-2
                            ${period.color === 'teal' ? 'hover:border-teal-300 hover:bg-teal-50' : ''}
                            ${period.color === 'blue' ? 'hover:border-blue-300 hover:bg-blue-50' : ''}
                            ${period.color === 'purple' ? 'hover:border-purple-300 hover:bg-purple-50' : ''}
                            ${period.color === 'orange' ? 'hover:border-orange-300 hover:bg-orange-50' : ''}
                          `}
                          onClick={() => {
                            const end = new Date();
                            const start = new Date();
                            start.setDate(end.getDate() - period.days);
                            const newRange = {
                              start: start.toISOString().split("T")[0],
                              end: end.toISOString().split("T")[0]
                            };
                            setDateRange(newRange);
                            setSelectedDateDisplay(formatDateDisplay(newRange.start, newRange.end));
                          }}
                        >
                          <Icon className={`h-4 w-4 text-${period.color}-500`} />
                          {period.label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
    
                <div className="bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl border border-blue-100">
                  <div className="bg-white/20 rounded-lg p-2 backdrop-blur-sm">
                    <p className="text-xs text-gray-600 mb-2">Période actuelle</p>
                    <div className="grid grid-cols-1 gap-2 text-center">
                      <p className="text-sm font-semibold">{formatDateDisplay(dateRange.start, dateRange.end)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Primary Stats */}
      <StatsCardsPrimary cards={cards} />

      {/* Secondary Stats */}
      <StatsCardsSecondary cards={cards} />

      {/* Small Charts */}
      <ChartStats cards={cards} />

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Top Produits */}
        <Suspense fallback={
          <Card className="h-[400px] sm:h-[500px]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-md font-semibold">
                <CalendarRangeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                <span className="text-pink-600 text-sm sm:text-md">
                  {dateRange.start === dateRange.end 
                    ? formatTitleDate(dateRange.start) 
                    : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`
                  }
                </span>
              </CardTitle>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Mes produits les plus vendus</h3>
            </CardHeader>
            <CardContent className="flex items-center justify-center h-full">
              <div className="text-center text-sm sm:text-base">Chargement...</div>
            </CardContent>
          </Card>
        }>
          <TopProduits 
            produits={topProduits} 
            dateRange={dateRange}
            formatTitleDate={formatTitleDate}
          />
        </Suspense>

        {/* Taux de Retour */}
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-sm sm:text-md font-semibold">
                <CalendarRangeIcon className="w-4 h-4 sm:w-5 sm:h-5 text-pink-600" />
                <span className="text-pink-600 text-sm sm:text-md">
                  {dateRange.start === dateRange.end 
                    ? formatTitleDate(dateRange.start) 
                    : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`
                  }
                </span>
              </CardTitle>
              <h3 className="text-lg sm:text-xl md:text-2xl font-bold">Taux de retour</h3>
            </CardHeader>
            <CardContent className="h-48 sm:h-64 flex items-center justify-center">
              <div className="text-center text-sm sm:text-base">Chargement...</div>
            </CardContent>
          </Card>
        }>
          <TauxRetour 
            cards={cards} 
            dateRange={dateRange}
            formatTitleDate={formatTitleDate}
          />
        </Suspense>

        {/* Commandes par source */}
        <CommandesParSource 
          commandesParSource={commandesParSource}
          dateRange={dateRange}
          formatTitleDate={formatTitleDate}
          getSourceColor={getSourceColor}
        />
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex text-pink-600 text-sm sm:text-md gap-1">
                <CalendarRangeIcon className="w-4 h-4 sm:w-5 sm:h-5"/> 6 DERNIERS MOIS
              </CardTitle>
              <h3 className="text-base sm:text-lg font-bold">Profits mensuels et commandes</h3>
            </CardHeader>
            <CardContent className="h-48 sm:h-64 flex items-center justify-center">
              <div className="text-center text-sm sm:text-base">Chargement...</div>
            </CardContent>
          </Card>
        }>
          <ProfitsMonthly data={monthlyData} />
        </Suspense>

        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex text-pink-600 text-sm sm:text-md gap-1">
                <CalendarRangeIcon className="w-4 h-4 sm:w-5 sm:h-5"/> 10 DERNIERS JOURS
              </CardTitle>
              <h3 className="text-base sm:text-lg font-semibold">Profits quotidiens et commandes</h3>
            </CardHeader>
            <CardContent className="h-48 sm:h-64 flex items-center justify-center">
              <div className="text-center text-sm sm:text-base">Chargement...</div>
            </CardContent>
          </Card>
        }>
          <ProfitsDaily data={dailyData} />
        </Suspense>
      </div>
    </div>
  );
}