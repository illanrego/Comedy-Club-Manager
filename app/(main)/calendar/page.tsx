"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { useState, useEffect } from "react";
import { formatDate } from "@/lib/utils";
import { CalendarDialog } from "./components/calendar-dialog";
import { ViewShowDialog } from "./components/view-dia-dialog";
import { CalendarPreviewDialog } from "./components/calendar-preview-dialog";
import { GoogleCalendarImportDialog } from "./components/google-calendar-import-dialog";
import { getShows } from "./actions/get-dias.action";
import { deleteShow } from "./actions/delete-dia.action";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { SelectComic } from "@/db/schema";
import { Beer, Ticket, DollarSign, TrendingUp, Users } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ShowWithDateObject {
  id: number;
  date: Date;
  startTime?: string | null;
  showName?: string | null;
  ticketsSold?: number | null;
  ticketsRevenue?: number | null;
  barRevenue?: number | null;
  showQuality?: string | null;
  isFiftyFifty?: boolean | null;
  freeTickets?: number | null;
  source?: 'manual' | 'google_calendar' | null;
}

type MetricType = 'tickets' | 'ticketRevenue' | 'barRevenue' | 'totalRevenue' | 'profit' | 'comics';

export default function CalendarPage() {
  const [shows, setShows] = useState<Awaited<ReturnType<typeof getShows>>>([]);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedShow, setSelectedShow] = useState<ShowWithDateObject>();
  const [isEditing, setIsEditing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('tickets');

  useEffect(() => {
    getShows().then(setShows);
  }, []);

  // Create a map of dates to shows for easier lookup
  const eventDates = shows.reduce((acc, { show }) => {
    // Create date preserving the local date values
    const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!acc[dateStr]) {
      acc[dateStr] = [];
    }
    
    acc[dateStr].push({
      ...show,
      date,
      ticketsSold: show.ticketsSold,
      ticketsRevenue: Number(show.ticketsRevenue),
      barRevenue: Number(show.barRevenue),
    });
    
    return acc;
  }, {} as Record<string, ShowWithDateObject[]>);

  // Filter shows for the current month that have already happened (up to today)
  const currentMonthShowsPast = shows.filter(({ show }) => {
    const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
    const showDate = new Date(year, month - 1, day);
    const currentMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const nextMonthDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today
    
    // Check if show is in current month AND has already happened
    return showDate >= currentMonthDate && showDate < nextMonthDate && showDate <= today;
  });

  // Function to get metric value based on selected metric
  const getMetricValue = (show: ShowWithDateObject) => {
    switch (selectedMetric) {
      case 'tickets':
        return show.ticketsSold || 0;
      case 'ticketRevenue':
        const ticketRevenue = show.ticketsRevenue || 0;
        // For 50/50 splits, only count 50% of ticket revenue
        return show.isFiftyFifty ? ticketRevenue * 0.5 : ticketRevenue;
      case 'barRevenue':
        return show.barRevenue || 0;
      case 'totalRevenue':
        const ticketRevenueTotal = show.ticketsRevenue || 0;
        const barRevenue = show.barRevenue || 0;
        // For 50/50 splits, only count 50% of ticket revenue
        const adjustedTicketRevenue = show.isFiftyFifty ? ticketRevenueTotal * 0.5 : ticketRevenueTotal;
        return adjustedTicketRevenue + barRevenue;
      case 'profit':
        const ticketRevenueProfit = show.ticketsRevenue || 0;
        const barRevenueProfit = show.barRevenue || 0;
        // For 50/50 splits, only count 50% of ticket revenue
        const adjustedTicketRevenueProfit = show.isFiftyFifty ? ticketRevenueProfit * 0.5 : ticketRevenueProfit;
        // Profit = 60% of bar revenue + real ticket revenue
        return (barRevenueProfit * 0.6) + adjustedTicketRevenueProfit;
      default:
        return 0;
    }
  };

  // Function to get metric icon
  const getMetricIcon = () => {
    switch (selectedMetric) {
      case 'tickets':
        return Ticket;
      case 'ticketRevenue':
        return DollarSign;
      case 'barRevenue':
        return Beer;
      case 'totalRevenue':
        return TrendingUp;
      case 'profit':
        return TrendingUp;
      case 'comics':
        return Users;
      default:
        return Ticket;
    }
  };

  const MetricIcon = getMetricIcon();

  // Create a map of dates to comics for easier lookup
  const eventComics = shows.reduce((acc, { show, comics }) => {
    const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!acc[dateStr]) {
      acc[dateStr] = {};
    }
    
    acc[dateStr][show.id] = comics || [];
    return acc;
  }, {} as Record<string, Record<number, (SelectComic & { comicShow?: { comicId: string; showId: number; position?: string | null } })[]>>);

  // Function to get comics count for a show
  const getComicsCount = (show: ShowWithDateObject) => {
    const dateStr = show.date.toISOString().split('T')[0];
    const comicsForShow = eventComics[dateStr]?.[show.id] || [];
    return comicsForShow.length;
  };

  // Function to get ranges based on selected metric
  const getMetricRanges = () => {
    switch (selectedMetric) {
      case 'tickets':
        return [
          { label: '0-10', min: 0, max: 10 },
          { label: '11-20', min: 11, max: 20 },
          { label: '21-30', min: 21, max: 30 },
          { label: '31-40', min: 31, max: 40 },
          { label: '41+', min: 41, max: Infinity }
        ];
      case 'ticketRevenue':
      case 'barRevenue':
        return [
          { label: 'R$ 0-200', min: 0, max: 200 },
          { label: 'R$ 201-400', min: 201, max: 400 },
          { label: 'R$ 401-600', min: 401, max: 600 },
          { label: 'R$ 601-800', min: 601, max: 800 },
          { label: 'R$ 801+', min: 801, max: Infinity }
        ];
      case 'totalRevenue':
        return [
          { label: 'R$ 0-400', min: 0, max: 400 },
          { label: 'R$ 401-800', min: 401, max: 800 },
          { label: 'R$ 801-1200', min: 801, max: 1200 },
          { label: 'R$ 1201-1600', min: 1201, max: 1600 },
          { label: 'R$ 1601+', min: 1601, max: Infinity }
        ];
      case 'profit':
        return [
          { label: 'R$ 0-250', min: 0, max: 250 },
          { label: 'R$ 251-500', min: 251, max: 500 },
          { label: 'R$ 501-750', min: 501, max: 750 },
          { label: 'R$ 751-1000', min: 751, max: 1000 },
          { label: 'R$ 1001-1250', min: 1001, max: 1250 },
          { label: 'R$ 1251+', min: 1251, max: Infinity }
        ];
      case 'comics':
        return [
          { label: '0-5', min: 0, max: 5 },
          { label: '6-10', min: 6, max: 10 },
          { label: '11-15', min: 11, max: 15 },
          { label: '16-20', min: 16, max: 20 },
          { label: '21+', min: 21, max: Infinity }
        ];
      default:
        return [];
    }
  };

  // Calculate shows count for each range based on selected metric
  const metricRangeCounts = currentMonthShowsPast.reduce((acc, { show }) => {
    // Create a proper ShowWithDateObject from the database show
    const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
    const showDate = new Date(year, month - 1, day);
    const showWithDate: ShowWithDateObject = {
      ...show,
      date: showDate,
      ticketsRevenue: Number(show.ticketsRevenue),
      barRevenue: Number(show.barRevenue),
    };
    
    let value;
    if (selectedMetric === 'comics') {
      value = getComicsCount(showWithDate);
    } else {
      value = getMetricValue(showWithDate);
    }
    
    const ranges = getMetricRanges();
    
    for (const range of ranges) {
      if (value >= range.min && value <= range.max) {
        acc[range.label] = (acc[range.label] || 0) + 1;
        break;
      }
    }
    
    return acc;
  }, {} as Record<string, number>);

  // Function to get background color based on metric value
  const getMetricColor = (value: number) => {
    switch (selectedMetric) {
      case 'tickets':
        if (value >= 41) {
          return "rgba(43, 255, 0, 0.83)"; // Bright fluorescent green
        } else if (value >= 31) {
          return "rgba(11, 128, 40, 0.67)"; // Dark green
        } else if (value >= 21) {
          return "rgba(255, 153, 0, 0.84)"; // Sunny yellow
        } else if (value >= 11) {
          return "rgba(255, 0, 0, 0.25)"; // Red
        } else {
          return "rgba(240, 0, 0, 0.75)"; // Orange
        }
      case 'ticketRevenue':
      case 'barRevenue':
        if (value >= 801) {
          return "rgba(43, 255, 0, 0.83)"; // Bright fluorescent green
        } else if (value >= 601) {
          return "rgba(11, 128, 40, 0.67)"; // Dark green
        } else if (value >= 401) {
          return "rgba(255, 153, 0, 0.84)"; // Sunny yellow
        } else if (value >= 201) {
          return "rgba(255, 0, 0, 0.25)"; // Red
        } else {
          return "rgba(240, 0, 0, 0.75)"; // Orange
        }
      case 'totalRevenue':
        if (value >= 1601) {
          return "rgba(43, 255, 0, 0.83)"; // Bright fluorescent green
        } else if (value >= 1201) {
          return "rgba(11, 128, 40, 0.67)"; // Dark green
        } else if (value >= 801) {
          return "rgba(255, 153, 0, 0.84)"; // Sunny yellow
        } else if (value >= 401) {
          return "rgba(255, 0, 0, 0.25)"; // Red
        } else {
          return "rgba(240, 0, 0, 0.75)"; // Orange
        }
      case 'profit':
        if (value >= 1251) {
          return "rgba(0, 255, 149, 0.83)"; // Bright green
        } else if (value >= 1001) {
          return "rgba(43, 255, 0, 0.83)"; // Bright fluorescent green
        } else if (value >= 751) {
          return "rgba(11, 128, 40, 0.67)"; // Dark green
        } else if (value >= 501) {
          return "rgba(255, 153, 0, 0.84)"; // Sunny yellow
        } else if (value >= 251) {
          return "rgba(255, 0, 0, 0.25)"; // Red
        } else {
          return "rgba(240, 0, 0, 0.75)"; // Orange
        }
      case 'comics':
        if (value >= 21) {
          return "rgba(43, 255, 0, 0.83)"; // Bright fluorescent green
        } else if (value >= 16) {
          return "rgba(11, 128, 40, 0.67)"; // Dark green
        } else if (value >= 11) {
          return "rgba(255, 153, 0, 0.84)"; // Sunny yellow
        } else if (value >= 6) {
          return "rgba(255, 0, 0, 0.25)"; // Red
        } else {
          return "rgba(240, 0, 0, 0.75)"; // Orange
        }
      default:
        return "rgba(255, 0, 0, 0.25)"; // Default red
    }
  };

  // Function to get metric display name
  const getMetricDisplayName = () => {
    switch (selectedMetric) {
      case 'tickets':
        return 'Vendas de Ingressos';
      case 'ticketRevenue':
        return 'Receita de Ingressos';
      case 'barRevenue':
        return 'Receita do Bar';
      case 'totalRevenue':
        return 'Receita Total';
      case 'profit':
        return 'Lucro';
      case 'comics':
        return 'Comics';
      default:
        return 'Vendas de Ingressos';
    }
  };

  // Function to get number of beer icons
  const getBeerIcons = (barRevenue: number | null) => {
    if (!barRevenue) return 0;
    return Math.floor(barRevenue / 200);
  };

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsEditing(false);
    setSelectedShow(undefined);
    
    // When selecting a date with multiple shows, don't auto-select any show
    // The user will need to click on a specific show
  };

  const handleShowSelect = (show: ShowWithDateObject) => {
    setSelectedShow(show);
    setIsEditing(false);
  };

  const handleDialogClose = () => {
    setSelectedDate(undefined);
    setSelectedShow(undefined);
    setIsEditing(false);
    getShows().then(setShows);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleDelete = async () => {
    if (!selectedShow) return;
    
    const result = await deleteShow(selectedShow.id);
    if (result.success) {
      handleDialogClose();
    }
  };

  const refreshShows = async () => {
    const updatedShows = await getShows()
    setShows(updatedShows)
  }

  // Calculate total sum for the selected metric in current month
  const totalMetricSum = currentMonthShowsPast.reduce((total, { show }) => {
    // Create a proper ShowWithDateObject from the database show
    const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
    const showDate = new Date(year, month - 1, day);
    const showWithDate: ShowWithDateObject = {
      ...show,
      date: showDate,
      ticketsRevenue: Number(show.ticketsRevenue) || 0,
      barRevenue: Number(show.barRevenue) || 0,
    };
    
    if (selectedMetric === 'comics') {
      return total + getComicsCount(showWithDate);
    } else {
      return total + getMetricValue(showWithDate);
    }
  }, 0);

  // Function to format the total sum display
  const formatTotalSum = (sum: number) => {
    switch (selectedMetric) {
      case 'tickets':
        return `${sum} ingressos`;
      case 'ticketRevenue':
      case 'barRevenue':
      case 'totalRevenue':
        return `R$ ${sum.toFixed(2)}`;
      case 'profit':
        return `R$ ${sum.toFixed(2)}`;
      case 'comics':
        return `${sum} comics`;
      default:
        return `${sum}`;
    }
  };

  return (
    <div className="container max-w-[2000px] py-10">
        <div className="flex flex-col items-center gap-6 mb-8">
        <div className="flex items-center justify-center">
          <h1 className="text-6xl font-bold">Calendário</h1>
        </div>
        <div className="flex flex-col items-center gap-4">
          <GoogleCalendarImportDialog onImported={refreshShows} />
          <span className="text-3xl font-medium">{getMetricDisplayName()}</span>
          <span className="text-lg text-muted-foreground">
            {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          </span>
          <span className="text-2xl font-bold text-primary">
            {formatTotalSum(totalMetricSum)}
          </span>
          
          {/* Metric selector tabs */}
          <div className="flex flex-col items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">Visualizar por:</span>
            <Tabs value={selectedMetric} onValueChange={(value) => setSelectedMetric(value as MetricType)} className="w-full max-w-sm sm:max-w-md">
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="tickets" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Ticket className="h-3 w-3 sm:h-4 sm:w-4" />
                  Ingressos
                </TabsTrigger>
                <TabsTrigger value="ticketRevenue" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <DollarSign className="h-3 w-3 sm:h-4 sm:w-4" />
                  Receita
                </TabsTrigger>
                <TabsTrigger value="barRevenue" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Beer className="h-3 w-3 sm:h-4 sm:w-4" />
                  Bar
                </TabsTrigger>
                <TabsTrigger value="totalRevenue" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  Total
                </TabsTrigger>
                <TabsTrigger value="profit" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />
                  Lucro
                </TabsTrigger>
                <TabsTrigger value="comics" className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm">
                  <Users className="h-3 w-3 sm:h-4 sm:w-4" />
                  Comics
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          
          <div className="flex items-center gap-6 flex-wrap justify-center">
            {getMetricRanges().map((range) => (
              <div key={range.label} className="flex items-center gap-2">
                <div 
                  className="w-12 h-12 rounded-md flex items-center justify-center text-xl font-medium" 
                  style={{ backgroundColor: getMetricColor(range.min) }}
                >
                  {metricRangeCounts[range.label] || 0}
                </div>
                <span>{range.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      <div className="w-full">
        <Card className="w-full overflow-x-auto">
          <CardContent className="pt-6 w-full">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              onMonthChange={setCurrentMonth}
              modifiers={{
                event: (date) => {
                  const dateStr = date.toISOString().split('T')[0];
                  return !!eventDates[dateStr]?.length;
                },
              }}
              modifiersStyles={{
                event: {
                  fontWeight: "bold",
                  color: "hsl(var(--primary))",
                  borderRadius: "4px",
                  // Background color is now set in the DayContent component
                },
              }}
              className="w-full"
              components={{
                DayContent: ({ date }) => {
                  const dateStr = date.toISOString().split('T')[0];
                  const showsOnDate = eventDates[dateStr] || [];
                  const hasEvent = showsOnDate.length > 0;
                  
                  return (
                    <div 
                      className="w-full h-full min-h-[120px] p-2"
                    >
                      <div className={`text-right mb-2 ${hasEvent ? "font-bold" : ""}`}>
                        {date.getDate()}
                      </div>
                      {hasEvent && (
                        <div className="space-y-2">
                          {showsOnDate.map((show) => (
                            <div 
                              key={show.id} 
                              className="border border-border rounded-md p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                              style={{ 
                                backgroundColor: selectedMetric === 'comics' 
                                  ? 'transparent' 
                                  : (() => {
                                      const today = new Date();
                                      today.setHours(23, 59, 59, 999);
                                      const showDate = new Date(show.date);
                                      
                                      // If the show is in the future, make it transparent
                                      if (showDate > today) {
                                        return 'transparent';
                                      }
                                      
                                      // Otherwise use the normal color logic
                                      return getMetricColor(getMetricValue(show));
                                    })()
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDate(date);
                                handleShowSelect(show);
                              }}
                            >
                              <HoverCard>
                                <HoverCardTrigger asChild>
                                  <div>
                                    <div className="flex items-center justify-between flex-col">
                                      {show.showName && (
                                        <div className="flex flex-col w-full px-1">
                                          {selectedMetric === 'comics' ? (
                                            // Show comics avatars for comics metric
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                              {eventComics[dateStr]?.[show.id]?.slice(0, 4).map((comic) => (
                                                <div key={comic.id} className="w-18 h-24 rounded-sm overflow-hidden border border-white">
                                                  <img 
                                                    src={comic.picUrl || undefined} 
                                                    alt={comic.name}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                      const target = e.target as HTMLImageElement;
                                                      target.style.display = 'none';
                                                      target.nextElementSibling?.classList.remove('hidden');
                                                    }}
                                                  />
                                                  <div className="w-full h-full bg-muted flex items-center justify-center text-[10px] font-medium hidden">
                                                    {comic.name.split(' ').map((n) => n[0]).join('')}
                                                  </div>
                                                </div>
                                              ))}
                                              {eventComics[dateStr]?.[show.id]?.length > 4 && (
                                                <div className="text-[12px] font-medium text-white">
                                                  +{eventComics[dateStr][show.id].length - 4}
                                                </div>
                                              )}
                                            </div>
                                          ) : (
                                            // Show regular metric display for other metrics
                                            <>
                                              <div className="text-[16px] truncate mb-1 font-medium text-white">
                                                {show.showName}
                                              </div>
                                              {(getMetricValue(show) > 0 || selectedMetric === 'totalRevenue') && (
                                                <div className="flex items-center justify-center gap-2 text-base font-medium mt-1 text-white">
                                                  <MetricIcon className="h-4 w-4" />
                                                  {selectedMetric === 'tickets' 
                                                    ? getMetricValue(show)
                                                    : `R$ ${getMetricValue(show).toFixed(2)}`
                                                  }
                                                </div>
                                              )}
                                            </>
                                          )}
                                          {show.barRevenue && getBeerIcons(show.barRevenue) > 0 && selectedMetric !== 'comics' && (
                                            <div className="flex items-center justify-center gap-1 mt-1">
                                              {Array.from({ length: getBeerIcons(show.barRevenue) }).map((_, i) => (
                                                <Beer 
                                                  key={i} 
                                                  className="h-4 w-4 text-white"
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                    {eventComics[dateStr]?.[show.id] && selectedMetric !== 'comics' && (
                                      <div className="grid grid-cols-3 gap-1 justify-items-center mt-1">
                                        {eventComics[dateStr][show.id].slice(0, 6).map((comic) => (
                                          <Avatar key={comic.id} className="w-10 h-10 border border-border">
                                            <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                                            <AvatarFallback className="text-xs">
                                              {comic.name.split(' ').map((n) => n[0]).join('')}
                                            </AvatarFallback>
                                          </Avatar>
                                        ))}
                                        {eventComics[dateStr][show.id].length > 6 && (
                                          <div className="col-span-3 mt-1 text-center">
                                            <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-[11px] font-medium">
                                              +{eventComics[dateStr][show.id].length - 6}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </HoverCardTrigger>
                                <HoverCardContent className="w-64 p-2" side="right">
                                  <div className="space-y-2">
                                    <div className="font-medium">{formatDate(date.toISOString())}</div>
                                    {show.showName && (
                                      <div className="text-sm font-medium">{show.showName}</div>
                                    )}
                                    {show.startTime && (
                                      <div className="text-sm text-muted-foreground">
                                        Start time: {show.startTime}
                                      </div>
                                    )}
                                    {(getMetricValue(show) > 0 || selectedMetric === 'totalRevenue') && (
                                      <div className="text-sm text-muted-foreground">
                                        {selectedMetric === 'tickets' 
                                          ? `${getMetricValue(show)} tickets sold`
                                          : selectedMetric === 'totalRevenue'
                                          ? `R$ ${getMetricValue(show).toFixed(2)} total revenue${show.isFiftyFifty ? ' (50/50 split applied)' : ''}`
                                          : `R$ ${getMetricValue(show).toFixed(2)} ${selectedMetric === 'ticketRevenue' ? 'ticket revenue' : 'bar revenue'}`
                                        }
                                        {show.freeTickets && selectedMetric === 'tickets' ? ` + ${show.freeTickets} free tickets` : ''}
                                      </div>
                                    )}
                                    {eventComics[dateStr]?.[show.id] && (
                                      <div className="text-sm text-muted-foreground">
                                        {getComicsCount(show)} comics
                                      </div>
                                    )}
                                    {eventComics[dateStr]?.[show.id] && (
                                      <div className="space-y-1">
                                        {eventComics[dateStr][show.id].map((comic) => (
                                          <div key={comic.id} className="flex items-center gap-2">
                                            <Avatar className="w-6 h-6">
                                              <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                                              <AvatarFallback className="text-[10px]">
                                                {comic.name.split(' ').map((n) => n[0]).join('')}
                                              </AvatarFallback>
                                            </Avatar>
                                            <div className="text-sm">{comic.name}</div>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </HoverCardContent>
                              </HoverCard>
                            </div>
                          ))}
                          
                          {/* Add new show button */}
                          <div 
                            className="mt-2 text-center cursor-pointer text-[12px] text-muted-foreground hover:text-foreground transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedDate(date);
                              setSelectedShow(undefined);
                              setIsEditing(true);
                            }}
                          >
                            + Adicionar show
                          </div>
                        </div>
                      )}
                    </div>
                  );
                },
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Show the appropriate dialog based on whether we're creating, viewing, or editing */}
      {selectedDate && (
        selectedShow && !isEditing ? (
          <ViewShowDialog
            selectedDate={selectedDate}
            show={selectedShow}
            comics={selectedShow ? eventComics[selectedDate.toISOString().split('T')[0]]?.[selectedShow.id] || [] : []}
            onClose={handleDialogClose}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        ) : (
          <CalendarDialog
            selectedDate={selectedDate}
            show={selectedShow}
            comics={selectedShow ? eventComics[selectedDate.toISOString().split('T')[0]]?.[selectedShow.id] || [] : []}
            onClose={handleDialogClose}
          />
        )
      )}

      {isPreviewOpen && (
        <CalendarPreviewDialog
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          eventDates={eventDates}
          eventComics={eventComics}
        />
      )}
    </div>
  );
}
