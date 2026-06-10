import { Card, CardContent } from "@/components/ui/card";
import { SelectComic } from "@/db/schema";
import { Users, Pencil, Ticket, Beer, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { AddComicDialog } from "./add-comic-dialog";
import Link from "next/link";
import { deleteComic } from "../actions/delete-comic.action";
import { formatComicClass } from "@/lib/formatters";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ComicCardProps {
  comic: SelectComic;
  avgTicketsSold: number;
  avgBarRevenue: number;
  onComicUpdated?: () => void;
}

export function ComicCard({ comic, avgTicketsSold, avgBarRevenue, onComicUpdated }: ComicCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const formData = new FormData();
      formData.append('id', comic.id);
      await deleteComic(formData);
      onComicUpdated?.();
    } catch (error) {
      console.error('Failed to delete comic:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card 
      className="overflow-hidden relative group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link href={`/comics/${comic.id}`}>
        <CardContent className="p-6 flex gap-6">
          <div className="relative shrink-0">
            {comic.picUrl ? (
              <img
                src={comic.picUrl}
                alt={comic.name}
                className="w-24 h-24 object-cover rounded-lg"
              />
            ) : (
              <div className="w-24 h-24 rounded-lg bg-muted flex items-center justify-center">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-2xl font-bold tracking-tight mb-2">{comic.name}</h3>
            <div className="flex items-center gap-3 mb-3">
                            {comic.class && (
                                <div className="inline-block px-2 py-1 rounded-md bg-primary/10 text-primary text-sm font-medium">
                                  {formatComicClass(comic.class)}
                                </div>
                              )}
              {comic.city && (
                <span className="text-sm text-muted-foreground">
                  {comic.city}
                </span>
              )}
            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center">
                                <Users className="h-4 w-4 mr-1" />
                                {comic.socialMedia?.toLocaleString() || "Sem seguidores"}
                              </div>
                              <div className="flex items-center">
                                <Ticket className="h-4 w-4 mr-1" />
                                {Math.round(avgTicketsSold)} média
                              </div>
                              <div className="flex items-center">
                                <Beer className="h-4 w-4 mr-1" />
                                R${avgBarRevenue.toFixed(2)} média
                              </div>
                            </div>
          </div>
        </CardContent>
      </Link>
      
      <div className={`absolute top-2 right-2 transition-opacity duration-200 ${isHovered ? 'opacity-100' : 'opacity-0'} flex gap-1`}>
        <AddComicDialog 
          comic={comic} 
          onComicAdded={onComicUpdated}
          mode="edit"
        >
          <Button size="icon" variant="ghost">
            <Pencil className="h-4 w-4" />
          </Button>
        </AddComicDialog>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir Comic</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja excluir &quot;{comic.name}&quot;? Esta ação não pode ser desfeita e removerá todos os dados associados, incluindo histórico de shows.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  );
} 
