'use client'

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, SlidersHorizontal } from "lucide-react";
import { listComics, ComicWithAvgTickets } from "./actions/list-comics.action";
import { ComicCard } from "./components/comic-card";
import { AddComicDialog } from "./components/add-comic-dialog";
import { useState, useEffect, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { formatComicClass } from "@/lib/formatters";

// Define the correct order: S (most powerful) first, then A, B, C
const CLASS_ORDER = ['S', 'A', 'B', 'C'] as const;

export default function ComicsPage() {
  const [comics, setComics] = useState<ComicWithAvgTickets[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClass, setSelectedClass] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'avgTickets' | 'avgBarRevenue' | 'name'>('avgTickets');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  useEffect(() => {
    const fetchComics = async () => {
      const fetchedComics = await listComics();
      setComics(fetchedComics);
    };
    fetchComics();
  }, []);

  // Get unique cities from comics
  const uniqueCities = useMemo(() => {
    const cities = comics
      .map(comic => comic.city)
      .filter((city): city is string => city !== null)
      .sort();
    return Array.from(new Set(cities));
  }, [comics]);

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
      const comicClass = comic.class || 'Sem Classe';
      if (!acc[comicClass]) {
        acc[comicClass] = [];
      }
      acc[comicClass].push(comic);
      return acc;
    }, {} as Record<string, ComicWithAvgTickets[]>);

    // Sort comics within each class
    Object.keys(grouped).forEach(classKey => {
      grouped[classKey].sort((a, b) => {
        if (sortBy === 'avgTickets') {
          return b.avgTicketsSold - a.avgTicketsSold;
        }
        if (sortBy === 'avgBarRevenue') {
          return b.avgBarRevenue - a.avgBarRevenue;
        }
        return a.name.localeCompare(b.name);
      });
    });

    // Return classes in order: S, A, B, C, Sem Classe
    const orderedClasses = ['S', 'A', 'B', 'C', 'Sem Classe'];
    return orderedClasses.reduce((acc, classKey) => {
      if (grouped[classKey]?.length > 0) {
        acc[classKey] = grouped[classKey];
      }
      return acc;
    }, {} as Record<string, ComicWithAvgTickets[]>);
  }, [filteredComics, sortBy]);

  const handleComicUpdate = async () => {
    const updatedComics = await listComics();
    setComics(updatedComics);
  };

  // Count active filters
  const activeFilterCount = [
    selectedClass && selectedClass !== 'all',
    selectedCity && selectedCity !== 'all',
    sortBy !== 'avgTickets'
  ].filter(Boolean).length;

  return (
    <div className="container py-4 md:py-8 px-4 md:px-8">
      {/* Header - Mobile optimized */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Comics</h1>
        <AddComicDialog onComicAdded={handleComicUpdate}>
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Adicionar Comic
          </Button>
        </AddComicDialog>
      </div>

      {/* Search and Filters - Mobile optimized */}
      <div className="space-y-4 mb-6">
        {/* Search bar - always visible */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden md:flex gap-4 flex-wrap">
          <Select value={selectedCity || undefined} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-[180px]">
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
          <Select value={selectedClass || undefined} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Classes</SelectItem>
              {CLASS_ORDER.map((classType) => (
                <SelectItem key={classType} value={classType}>
                  {formatComicClass(classType)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: 'avgTickets' | 'avgBarRevenue' | 'name') => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Ordenar por" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="avgTickets">Média de Ingressos</SelectItem>
              <SelectItem value="avgBarRevenue">Média de Receita Bar</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Mobile filters - collapsible */}
        <div className="md:hidden">
          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                <div className="flex items-center gap-2">
                  <SlidersHorizontal className="h-4 w-4" />
                  Filtros
                </div>
                {activeFilterCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFilterCount}
                  </Badge>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-4 space-y-3">
              <Select value={selectedCity || undefined} onValueChange={setSelectedCity}>
                <SelectTrigger className="w-full">
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
              <Select value={selectedClass || undefined} onValueChange={setSelectedClass}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filtrar por classe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as Classes</SelectItem>
                  {CLASS_ORDER.map((classType) => (
                    <SelectItem key={classType} value={classType}>
                      {formatComicClass(classType)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={(value: 'avgTickets' | 'avgBarRevenue' | 'name') => setSortBy(value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Ordenar por" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="avgTickets">Média de Ingressos</SelectItem>
                  <SelectItem value="avgBarRevenue">Média de Receita Bar</SelectItem>
                  <SelectItem value="name">Nome</SelectItem>
                </SelectContent>
              </Select>
            </CollapsibleContent>
          </Collapsible>
        </div>
      </div>

      {/* Comics Grid */}
      <div className="space-y-8">
        {Object.entries(comicsByClass).map(([classKey, classComics]) => (
          <div key={classKey} className="space-y-4">
            <div className="flex items-center gap-4">
              <h2 className="text-xl md:text-2xl font-semibold whitespace-nowrap">
                {classKey === 'Sem Classe' ? classKey : formatComicClass(classKey)}
              </h2>
              <Badge 
                variant="outline" 
                className={
                  classKey === 'S' ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50 text-yellow-600' :
                  classKey === 'A' ? 'bg-purple-500/10 border-purple-500/50 text-purple-600' :
                  classKey === 'B' ? 'bg-blue-500/10 border-blue-500/50 text-blue-600' :
                  classKey === 'C' ? 'bg-green-500/10 border-green-500/50 text-green-600' :
                  ''
                }
              >
                {classComics.length}
              </Badge>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {classComics.map((comic) => (
                <ComicCard 
                  key={comic.id} 
                  comic={comic}
                  avgTicketsSold={comic.avgTicketsSold}
                  avgBarRevenue={comic.avgBarRevenue}
                  onComicUpdated={handleComicUpdate}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
