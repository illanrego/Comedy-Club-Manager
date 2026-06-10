"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SelectComic } from "@/db/schema";
import { formatDate } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { deleteShow } from "../actions/delete-dia.action";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Calendar, Clock, DollarSign, Ticket, Users, Star, BarChart, SplitSquareVertical, Coffee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface ViewShowDialogProps {
  selectedDate?: Date;
  show: {
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
  };
  comics?: (SelectComic & { comicShow?: { comicId: string; showId: number; position?: string | null } })[];
  onClose?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ViewShowDialog({
  selectedDate,
  show,
  comics = [],
  onClose,
  onEdit,
  onDelete,
}: ViewShowDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteShow(show.id);
      if (result.success) {
        router.refresh();
        onDelete?.();
        onClose?.();
      } else {
        console.error("Failed to delete show:", result.error);
      }
    } catch (error) {
      console.error("Failed to delete show:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "—";
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getPositionColor = (position: string | null | undefined) => {
    if (!position) return "";
    
    switch (position) {
      case "Headliner":
        return "bg-purple-100 text-purple-800";
      case "Opening Act":
        return "bg-blue-100 text-blue-800";
      case "Middle":
        return "bg-green-100 text-green-800";
      case "MC":
        return "bg-amber-100 text-amber-800";
      case "Casting":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Calculate average consumption per person
  const calculateAverageConsumption = () => {
    const ticketsSold = show.ticketsSold ?? 0;
    const freeTickets = show.freeTickets ?? 0;
    const barRevenue = show.barRevenue ?? 0;
    
    // Avoid division by zero
    const totalAttendance = ticketsSold + freeTickets;
    if (totalAttendance === 0) return 0;
    
    // Calculate average bar revenue per person
    return barRevenue / totalAttendance;
  };

  return (
    <Dialog open={!!selectedDate} onOpenChange={() => onClose?.()}>
      <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden">
        <div className="bg-primary/10 p-6">
          <DialogHeader className="mb-2">
            <DialogTitle className="text-2xl font-bold mt-2">
              {show.showName || "Untitled Show"}
            </DialogTitle>
            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(selectedDate?.toISOString() || '')}</span>
              {show.source === 'google_calendar' && (
                <Badge variant="secondary" className="ml-2">
                  Importado do Google
                </Badge>
              )}
            </div>
            {show.startTime && (
              <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{show.startTime}</span>
              </div>
            )}
          </DialogHeader>
        </div>
        
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* 50/50 Split Option */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <SplitSquareVertical className="h-5 w-5 text-primary" />
                  <Label htmlFor="fifty-fifty" className="font-medium">50/50 Revenue Split</Label>
                </div>
                <Switch 
                  id="fifty-fifty" 
                  checked={!!show.isFiftyFifty} 
                  disabled={true} // Read-only in view mode
                />
              </div>
              {show.isFiftyFifty && (
                <p className="text-sm text-muted-foreground mt-2">
                  This show has a 50/50 revenue split. Only 50% of ticket revenue is counted in the total.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Comics Section */}
          {comics.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-primary font-medium">
                  <Users className="h-5 w-5" />
                  <h3>Lineup</h3>
                </div>
                <div className="space-y-3">
                  {comics.map((comic) => (
                    <div key={comic.id} className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 transition-colors">
                      <Avatar className="h-10 w-10 border">
                        <AvatarImage src={comic.picUrl || undefined} alt={comic.name} />
                        <AvatarFallback className="text-xs bg-primary/10">
                          {comic.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-medium">{comic.name}</div>
                        {comic.city && <div className="text-xs text-muted-foreground">{comic.city}</div>}
                      </div>
                      {comic.comicShow?.position && (
                        <Badge className={`${getPositionColor(comic.comicShow.position)}`}>
                          {comic.comicShow.position}
                        </Badge>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Performance Metrics */}
          {(show.ticketsSold !== null || show.ticketsRevenue !== null || show.barRevenue !== null) && (
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-3 text-primary font-medium">
                  <BarChart className="h-5 w-5" />
                  <h3>Performance</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {/* Tickets Sold */}
                  {show.ticketsSold !== null && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Ticket className="h-3 w-3" /> Tickets Sold
                      </div>
                      <div className="text-xl font-semibold">
                        {show.ticketsSold ?? 0}
                      </div>
                    </div>
                  )}

                  {/* Free Tickets */}
                  {(show.freeTickets ?? 0) > 0 && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Users className="h-3 w-3" /> Free Tickets
                      </div>
                      <div className="text-xl font-semibold">
                        {show.freeTickets}
                      </div>
                    </div>
                  )}

                  {/* Tickets Revenue */}
                  {show.ticketsRevenue !== null && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <DollarSign className="h-3 w-3" /> Tickets Revenue
                      </div>
                      <div className="text-xl font-semibold">
                        {formatCurrency(show.ticketsRevenue)}
                      </div>
                    </div>
                  )}

                  {/* Bar Revenue */}
                  {show.barRevenue !== null && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <BarChart className="h-3 w-3" /> Bar Revenue
                      </div>
                      <div className="text-xl font-semibold">
                        {formatCurrency(show.barRevenue)}
                      </div>
                    </div>
                  )}

                  {/* Show Quality */}
                  {show.showQuality && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Star className="h-3 w-3" /> Observations
                      </div>
                      <div className="text-xl font-semibold">
                        {show.showQuality}
                      </div>
                    </div>
                  )}

                  {/* Average Consumption Per Person */}
                  {(show.ticketsSold !== null || show.freeTickets !== null) && show.barRevenue !== null && (
                    <div className="flex flex-col p-3 rounded-md bg-muted/30">
                      <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                        <Coffee className="h-3 w-3" /> Avg. Consumption/Person
                      </div>
                      <div className="text-xl font-semibold">
                        {formatCurrency(calculateAverageConsumption())}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Based on {show.ticketsSold ?? 0} paid + {show.freeTickets ?? 0} free tickets
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        <Separator />
        
        <DialogFooter className="p-4 flex justify-between">
          <div className="flex gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isDeleting}>
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the show
                    and all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button size="sm" onClick={onEdit}>
              Edit
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Keep the old component for backward compatibility
export function ViewDiaDialog(props: ViewShowDialogProps) {
  return <ViewShowDialog {...props} />;
} 
