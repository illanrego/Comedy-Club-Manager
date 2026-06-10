import { notFound } from "next/navigation";
import { getComicWithShows } from "../actions/get-comic.action";
import { ArrowLeft, Calendar, MapPin, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { SelectShow } from "@/db/schema";
import { formatComicClass } from "@/lib/formatters";

interface ComicPageProps {
  params: {
    id: string;
  };
}

interface ShowWithComicShow extends SelectShow {
  comicShow: {
    comicId: string;
    showId: number;
    position?: string | null;
  };
}

export default async function ComicPage({ params }: ComicPageProps) {
  const comic = await getComicWithShows(params.id);

  if (!comic) {
    notFound();
  }

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

  return (
    <div className="container py-8">
      <div className="mb-6">
        <Link href="/comics">
          <Button variant="ghost" size="sm" className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back to Comics
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left column - Image */}
        <div className="md:col-span-1">
          {comic.picUrl ? (
            <img
              src={comic.picUrl}
              alt={comic.name}
              className="w-full aspect-square object-cover rounded-lg shadow-md"
            />
          ) : (
            <div className="w-full aspect-square bg-muted rounded-lg flex items-center justify-center shadow-md">
              <Users className="h-24 w-24 text-muted-foreground" />
            </div>
          )}
        </div>

        {/* Right column - Info */}
        <div className="md:col-span-2">
          <div className="space-y-6">
            <div>
              <h1 className="text-4xl font-bold">{comic.name}</h1>
              <div className="flex flex-wrap gap-3 mt-3">
                {comic.class && (
                  <Badge variant="secondary" className="text-sm">
                    {formatComicClass(comic.class)}
                  </Badge>
                )}
                {comic.city && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {comic.city}
                  </div>
                )}
                {comic.socialMedia && (
                  <div className="flex items-center text-muted-foreground">
                    <Users className="h-4 w-4 mr-1" />
                    {comic.socialMedia.toLocaleString()} seguidores
                  </div>
                )}
                {comic.time && (
                  <div className="flex items-center text-muted-foreground">
                    <Calendar className="h-4 w-4 mr-1" />
                    {comic.time} minutos
                  </div>
                )}
              </div>
            </div>

            {/* Shows Section */}
            <div className="mt-8">
              <h2 className="text-2xl font-bold mb-4">Histórico de Shows</h2>
              {comic.shows && comic.shows.length > 0 ? (
                <div className="space-y-4">
                  {comic.shows.map((show: ShowWithComicShow) => (
                    <Card key={show.id}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {formatDate(show.date)}
                            {show.startTime && ` - ${show.startTime}`}
                          </CardTitle>
                          {show.comicShow?.position && (
                            <Badge className={`${getPositionColor(show.comicShow.position)}`}>
                              {show.comicShow.position}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-muted-foreground">
                          {show.showName && <p>Show: {show.showName}</p>}
                          {show.ticketsSold && <p>Ingressos Vendidos: {show.ticketsSold}</p>}
                          {show.ticketsRevenue && <p>Receita de Ingressos: R$ {Number(show.ticketsRevenue).toFixed(2)}</p>}
                          {show.barRevenue && <p>Receita de Bar: R$ {Number(show.barRevenue).toFixed(2)}</p>}
                          {show.showQuality && <p>Qualidade do Show: {show.showQuality}</p>}
                          {show.isFiftyFifty !== undefined && <p>Divisão 50/50: {show.isFiftyFifty ? 'Sim' : 'Não'}</p>}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Sem shows</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
