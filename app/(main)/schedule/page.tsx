"use client";

import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState, useEffect, useMemo } from "react";
import { listComics, ComicWithAvgTickets } from "../comics/actions/list-comics.action";
import { getShows } from "../calendar/actions/get-dias.action";
import { applySchedule } from "./actions/apply-schedule.action";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from "@/components/ui/alert-dialog";
import { 
  DragDropContext, 
  Droppable, 
  Draggable, 
  DropResult 
} from "@hello-pangea/dnd";
import { 
  Calendar as CalendarIcon, 
  Users, 
  Search, 
  RotateCcw, 
  CheckCircle, 
  X,
  Clock
} from "lucide-react";
import { SelectComic } from "@/db/schema";
import { formatComicClass } from "@/lib/formatters";

interface ScheduledShow {
  id: string;
  date: Date;
  startTime?: string;
  showName?: string;
  comics: SelectComic[];
  isNew?: boolean;
}

export default function SchedulePage() {
  const [comics, setComics] = useState<ComicWithAvgTickets[]>([]);
  const [existingShows, setExistingShows] = useState<Awaited<ReturnType<typeof getShows>>>([]);
  const [scheduledShows, setScheduledShows] = useState<ScheduledShow[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const [fetchedComics, fetchedShows] = await Promise.all([
        listComics(),
        getShows()
      ]);
      setComics(fetchedComics);
      setExistingShows(fetchedShows);
    };
    fetchData();
  }, []);

  // Filter comics based on search and filters
  const filteredComics = useMemo(() => {
    return comics.filter(comic => {
      const matchesSearch = comic.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesClass = selectedClass === 'all' || !selectedClass || comic.class === selectedClass;
      const matchesCity = selectedCity === 'all' || !selectedCity || comic.city === selectedCity;
      return matchesSearch && matchesClass && matchesCity;
    });
  }, [comics, searchQuery, selectedClass, selectedCity]);

  // Group comics by class
  const comicsByClass = useMemo(() => {
    const grouped = filteredComics.reduce((acc, comic) => {
      const comicClass = comic.class || 'Unclassified';
      if (!acc[comicClass]) {
        acc[comicClass] = [];
      }
      acc[comicClass].push(comic);
      return acc;
    }, {} as Record<string, ComicWithAvgTickets[]>);

    // Sort comics within each class by name
    Object.keys(grouped).forEach(classKey => {
      grouped[classKey].sort((a, b) => a.name.localeCompare(b.name));
    });

    // Return classes in order: S, A, B, C, Unclassified
    const orderedClasses = ['S', 'A', 'B', 'C', 'Unclassified'];
    return orderedClasses.reduce((acc, classKey) => {
      if (grouped[classKey]?.length > 0) {
        acc[classKey] = grouped[classKey];
      }
      return acc;
    }, {} as Record<string, ComicWithAvgTickets[]>);
  }, [filteredComics]);

  // Get unique cities from comics
  const uniqueCities = useMemo(() => {
    const cities = comics
      .map(comic => comic.city)
      .filter((city): city is string => city !== null)
      .sort();
    return Array.from(new Set(cities));
  }, [comics]);

  // Create a map of dates to scheduled shows for easier lookup
  const scheduledShowsByDate = useMemo(() => {
    return scheduledShows.reduce((acc, show) => {
      const dateStr = show.date.toISOString().split('T')[0];
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(show);
      return acc;
    }, {} as Record<string, ScheduledShow[]>);
  }, [scheduledShows]);

  // Create a map of dates to existing shows for easier lookup
  const existingShowsByDate = useMemo(() => {
    return existingShows.reduce((acc, { show, comics }) => {
      const [year, month, day] = show.date.split('T')[0].split('-').map(Number);
      const date = new Date(year, month - 1, day);
      const dateStr = date.toISOString().split('T')[0];
      
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      
      acc[dateStr].push({
        id: show.id.toString(),
        date,
        startTime: show.startTime || undefined,
        showName: show.showName || undefined,
        comics: comics || [],
        isNew: false,
      });
      
      return acc;
    }, {} as Record<string, ScheduledShow[]>);
  }, [existingShows]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // If dropping on a calendar date
    if (destination.droppableId.startsWith('date-')) {
      const targetDate = new Date(destination.droppableId.replace('date-', ''));
      
      // Get the class from the source droppable ID
      const classKey = source.droppableId.replace('class-', '');
      const classComics = comicsByClass[classKey] || [];
      
      // Find the comic by its index in the class
      const comic = classComics[source.index];
      if (!comic) return;

      // Check if there's already a show on this date
      const dateStr = targetDate.toISOString().split('T')[0];
      const existingShowsOnDate = scheduledShowsByDate[dateStr] || [];
      const existingShowsOnDateFromDB = existingShowsByDate[dateStr] || [];

      if (existingShowsOnDate.length > 0) {
        // Add comic to existing show
        setScheduledShows(prev => prev.map(show => {
          if (show.date.toISOString().split('T')[0] === dateStr) {
            return {
              ...show,
              comics: [...show.comics, comic]
            };
          }
          return show;
        }));
      } else if (existingShowsOnDateFromDB.length > 0) {
        // Create new scheduled show from existing DB show
        const existingShow = existingShowsOnDateFromDB[0];
        const newScheduledShow: ScheduledShow = {
          ...existingShow,
          comics: [...existingShow.comics, comic]
        };
        setScheduledShows(prev => [...prev, newScheduledShow]);
      } else {
        // Create completely new show
        const newScheduledShow: ScheduledShow = {
          id: `new-${Date.now()}`,
          date: targetDate,
          comics: [comic],
          isNew: true
        };
        setScheduledShows(prev => [...prev, newScheduledShow]);
      }
    }
  };

  const removeComicFromShow = (showId: string, comicId: string) => {
    setScheduledShows(prev => prev.map(show => {
      if (show.id === showId) {
        return {
          ...show,
          comics: show.comics.filter(comic => comic.id !== comicId)
        };
      }
      return show;
    }));
  };

  const removeShow = (showId: string) => {
    setScheduledShows(prev => prev.filter(show => show.id !== showId));
  };

  const resetSchedule = async () => {
    setIsResetting(true);
    setScheduledShows([]);
    setIsResetting(false);
    setShowResetDialog(false);
  };

  const applyScheduleToCalendar = async () => {
    setIsApplying(true);
    
    try {
      const showsToApply = scheduledShows.map(show => ({
        id: show.id,
        date: show.date.toISOString().split('T')[0],
        startTime: show.startTime,
        showName: show.showName,
        comics: show.comics.map(comic => ({
          id: comic.id,
          position: null
        })),
        isNew: show.isNew || false
      }));

      const result = await applySchedule(showsToApply);
      
      if (result.success) {
        // Refresh existing shows
        const updatedShows = await getShows();
        setExistingShows(updatedShows);
        setScheduledShows([]);
        setShowApplyDialog(false);
      } else {
        console.error('Failed to apply schedule:', result.error);
      }
    } catch (error) {
      console.error('Error applying schedule:', error);
    } finally {
      setIsApplying(false);
    }
  };

  const getClassColor = (comicClass: string | null) => {
    switch (comicClass) {
      case 'S': return 'bg-purple-500';
      case 'A': return 'bg-red-500';
      case 'B': return 'bg-orange-500';
      case 'C': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="container max-w-[2000px] py-10">
        <div className="flex flex-col items-center gap-6 mb-8">
          <div className="flex items-center justify-center gap-3">
            <CalendarIcon className="h-8 w-8" />
            <h1 className="text-6xl font-bold">Agenda</h1>
          </div>
          <p className="text-lg text-muted-foreground text-center max-w-2xl">
            Arraste e solte os comics para agendar shows. Use os filtros para encontrar os comics certos,
            depois aplique sua agenda ao calendário quando estiver pronto.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Comics Panel */}
          <div className="lg:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <Users className="h-5 w-5" />
                  <h2 className="text-xl font-semibold">Comics</h2>
                </div>

                {/* Search and Filters */}
                <div className="space-y-3 mb-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar comics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>

                  <Select value={selectedClass || undefined} onValueChange={setSelectedClass}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por classe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Classes</SelectItem>
                      <SelectItem value="S">{formatComicClass('S')}</SelectItem>
                      <SelectItem value="A">{formatComicClass('A')}</SelectItem>
                      <SelectItem value="B">{formatComicClass('B')}</SelectItem>
                      <SelectItem value="C">{formatComicClass('C')}</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={selectedCity || undefined} onValueChange={setSelectedCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Filtrar por cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Cidades</SelectItem>
                      {uniqueCities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Comics List */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto">
                  {Object.entries(comicsByClass).map(([classKey, classComics]) => (
                    <div key={classKey} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={getClassColor(classKey)}>
                          {classKey === 'Unclassified' ? 'Sem Classe' : formatComicClass(classKey)}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          ({classComics.length})
                        </span>
                      </div>
                      
                      <Droppable
                        droppableId={`class-${classKey}`}
                        isDropDisabled
                        renderClone={(provided, snapshot, rubric) => {
                          const comic = classComics[rubric.source.index];
                          if (!comic) return null;
                          return (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              {...provided.dragHandleProps}
                              className="flex items-center justify-center"
                            >
                              <Avatar className="h-10 w-10 shadow-lg">
                                <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                                <AvatarFallback className="text-xs">
                                  {comic.name.split(" ").map((n) => n[0]).join("")}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                          );
                        }}
                      >
                        {(provided) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="space-y-2"
                          >
                            {classComics.map((comic, index) => (
                              <Draggable
                                key={comic.id}
                                draggableId={comic.id}
                                index={index}
                              >
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={`p-3 border rounded-lg cursor-grab active:cursor-grabbing transition-colors ${
                                      snapshot.isDragging ? 'bg-accent shadow-lg' : 'bg-background hover:bg-accent/50'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar
                                        className="h-8 w-8 cursor-grab active:cursor-grabbing"
                                        {...provided.dragHandleProps}
                                      >
                                        <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                                        <AvatarFallback className="text-xs">
                                          {comic.name.split(' ').map((n) => n[0]).join('')}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <div className="font-medium text-sm truncate">
                                          {comic.name}
                                        </div>
                                        {comic.city && (
                                          <div className="text-xs text-muted-foreground">
                                            {comic.city}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))}
                            {provided.placeholder}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button 
                onClick={() => setShowApplyDialog(true)}
                disabled={scheduledShows.length === 0}
                className="w-full"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                Aplicar ao Calendário
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowResetDialog(true)}
                disabled={scheduledShows.length === 0}
                className="w-full"
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                Limpar Agenda
              </Button>
            </div>
          </div>

          {/* Calendar */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="pt-6">
                <Calendar
                  mode="single"
                  className="w-full"
                  components={{
                    DayContent: ({ date }) => {
                      const dateStr = date.toISOString().split('T')[0];
                      const scheduledShowsOnDate = scheduledShowsByDate[dateStr] || [];
                      const existingShowsOnDate = existingShowsByDate[dateStr] || [];
                      const allShowsOnDate = [...scheduledShowsOnDate, ...existingShowsOnDate];
                      
                      return (
                        <Droppable droppableId={`date-${dateStr}`}>
                          {(provided, snapshot) => (
                            <div 
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              className={`w-full h-full min-h-[120px] p-2 overflow-y-auto ${
                                snapshot.isDraggingOver ? 'bg-accent/50 ring-2 ring-primary ring-inset' : ''
                              }`}
                            >
                              <div className="text-right mb-2 font-medium">
                                {date.getDate()}
                              </div>
                              
                              {allShowsOnDate.length > 0 && (
                                <div className="space-y-2">
                                  {allShowsOnDate.map((show, index) => (
                                    <div 
                                      key={show.id} 
                                      className="border border-border rounded-md p-2 bg-background"
                                    >
                                      <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                          {show.startTime && (
                                            <Clock className="h-3 w-3 text-muted-foreground" />
                                          )}
                                          <span className="text-xs font-medium">
                                            {show.showName || `Show ${index + 1}`}
                                          </span>
                                        </div>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => removeShow(show.id)}
                                        >
                                          <X className="h-3 w-3" />
                                        </Button>
                                      </div>
                                      
                                      <div className="space-y-1">
                                        {show.comics.map((comic) => (
                                          <div 
                                            key={comic.id}
                                            className="flex items-center gap-2 p-1 rounded bg-muted/50"
                                          >
                                            <Avatar className="h-6 w-6">
                                              <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                                              <AvatarFallback className="text-[10px]">
                                                {comic.name.split(' ').map((n) => n[0]).join('')}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs truncate flex-1">
                                              {comic.name}
                                            </span>
                                            <Badge 
                                              variant="outline" 
                                              className={`h-4 px-1 text-[10px] ${getClassColor(comic.class)}`}
                                            >
                                              {formatComicClass(comic.class)}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              className="h-4 w-4 p-0"
                                              onClick={() => removeComicFromShow(show.id, comic.id)}
                                            >
                                              <X className="h-2 w-2" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              {/* No placeholder to keep day size fixed while dragging */}
                            </div>
                          )}
                        </Droppable>
                      );
                    },
                  }}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Apply Schedule Dialog */}
        <Dialog open={showApplyDialog} onOpenChange={setShowApplyDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aplicar Agenda ao Calendário</DialogTitle>
              <DialogDescription>
                Isso irá aplicar os shows agendados ao calendário. 
                Esta ação não pode ser desfeita.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowApplyDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={applyScheduleToCalendar} disabled={isApplying}>
                {isApplying ? 'Aplicando...' : 'Aplicar Agenda'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reset Schedule Dialog */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Limpar Agenda</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá limpar todos os shows agendados. Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={resetSchedule} disabled={isResetting}>
                {isResetting ? 'Limpando...' : 'Limpar Agenda'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DragDropContext>
  );
} 
