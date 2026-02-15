import React, { lazy, Suspense, useEffect, useState, useRef, useCallback } from "react";
import {
  TrendingUp, Clock, X, Calendar, CalendarRangeIcon, Check, 
  LayoutGrid
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { format } from "date-fns";

// Composants locaux (non lazy)
import StatsCharts from "./StatsCharts";
import StatsSimple from "./StatsSimple";
import TopProduits from "./TopProduits";
import { DashboardData } from "../types/dashboard";
import api from "../api";

const MemoizedStatsCharts = React.memo(StatsCharts);
const MemoizedStatsSimple = React.memo(StatsSimple);
const MemoizedTopProduits = React.memo(TopProduits);
// Composants lazy pour les graphiques
const TauxRetour = lazy(() => import("./TauxRetour"));
const ProfitsMonthly = lazy(() => import("./ProfitsMonthly"));
const ProfitsDaily = lazy(() => import("./ProfitsDaily"));


export default function DashboardF() {
  const [loading, setLoading] = useState<boolean>(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [showCalendar, setShowCalendar] = useState<boolean>(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedDateDisplay, setSelectedDateDisplay] = useState<string>("");

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  const [dateRange, setDateRange] = useState({ start: todayStr, end: todayStr });

  // Format de la date
  const formatDateDisplay = (start: string, end: string): string => {
    try {
      const s = new Date(start + 'T00:00:00');
      const e = new Date(end + 'T00:00:00');
      
      if (start === end) {
        return format(s, "MMM dd, yyyy");
      }
      return `${format(s, "MMM dd, yyyy")} – ${format(e, "MMM dd, yyyy")}`;
    } catch (e) {
      console.error("Date invalide:", e);
      return "Période invalide";
    }
  };

  const formatTitleDate = useCallback((dateString: string): string => {
    try {
      return new Date(dateString + 'T00:00:00').toLocaleDateString("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  }, []);

  const load = async (): Promise<void> => {
  try {
    setLoading(true);
    const res = await api.get<DashboardData>("/dashboardF", {
      params: { dateDebut: dateRange.start, dateFin: dateRange.end }
    });
    
    const d = res.data;
    console.log("Données chargées:", d);
    console.log("MonthlyData:", d.monthlyData);
    console.log("DailyData:", d.dailyData);
    console.log("Premier élément dailyData:", d.dailyData[0]);
    console.log("Premier élément monthlyData:", d.monthlyData[0]);
    
    setDashboardData(d);
    setSelectedDateDisplay(formatDateDisplay(dateRange.start, dateRange.end));
  } catch (err: any) {
    console.error("Erreur chargement dashboard fournisseur", err);
    if (err.response?.status === 401) {
      window.location.href = "/auth/login";
    }
  } finally {
    setLoading(false);
  }
};

  useEffect(() => { 
    load(); 
  }, []);

  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setShowCalendar(false);
      }
    }
    if (showCalendar) {
      document.addEventListener("mousedown", onOutside);
    }
    return () => document.removeEventListener("mousedown", onOutside);
  }, [showCalendar]);

  if (loading) return <div className="py-10 text-center">Chargement…</div>;
  if (!dashboardData || !dashboardData.cards) return <div className="py-10 text-center">Aucune donnée</div>;

  const { cards, dailyData, monthlyData, topProduits } = dashboardData;

  return (
    <div className="space-y-6 p-6 bg-gray-50/50 min-h-screen">
      {/* Header - Version responsive */}
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
              <span className="truncate">{selectedDateDisplay || formatDateDisplay(dateRange.start, dateRange.end)}</span>
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

      {/* Ligne 1: Stats avec graphiques */}
      <MemoizedStatsCharts cards={cards} dailyData={dailyData} />

      {/* Ligne 2: Stats simples */}
      <MemoizedStatsSimple cards={cards} topProduits={topProduits} />

      {/* Section inférieure */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MemoizedTopProduits 
          produits={topProduits} 
          dateRange={dateRange}
          formatTitleDate={formatTitleDate}
        />
        
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-md font-semibold">
                <CalendarRangeIcon className="w-5 h-5 text-pink-600" />
                <span className="text-pink-600">
                  {dateRange.start === dateRange.end ? formatTitleDate(dateRange.start) : `${formatTitleDate(dateRange.start)} - ${formatTitleDate(dateRange.end)}`}
                </span>
              </CardTitle>
              <h3 className="text-2xl font-bold">Taux de retour</h3>
              <p className="text-sm text-muted-foreground">
                Ce graphique circulaire montre le pourcentage de commandes livrées par rapport aux commandes retournées
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">Chargement du graphique...</div>
              </div>
            </CardContent>
          </Card>
        }>
          <TauxRetour 
            cards={cards} 
            dateRange={dateRange}
            formatTitleDate={formatTitleDate}
          />
        </Suspense>
      </div>

      {/* Graphiques de profits */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex text-pink-600 text-md gap-1">
                <CalendarRangeIcon className="w-5 h-5"/> 6 DERNIERS MOIS
              </CardTitle>
              <h3 className="text-lg font-bold">Profits mensuels et commandes</h3>
              <p className="text-sm text-muted-foreground">
                Profits et commandes sur les 6 derniers mois
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">Chargement du graphique...</div>
              </div>
            </CardContent>
          </Card>
        }>
          <ProfitsMonthly data={monthlyData} />
        </Suspense>

        <Suspense fallback={
          <Card>
            <CardHeader>
              <CardTitle className="flex text-pink-600 text-md gap-1">
                <CalendarRangeIcon className="w-5 h-5"/> 10 DERNIERS JOURS
              </CardTitle>
              <h3 className="text-lg font-semibold">Profits quotidiens et commandes</h3>
              <p className="text-sm text-muted-foreground">
                Profits et commandes sur les 10 derniers jours
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center">
                <div className="text-center">Chargement du graphique...</div>
              </div>
            </CardContent>
          </Card>
        }>
          <ProfitsDaily data={dailyData} />
        </Suspense>
      </div>
    </div>
  );
}