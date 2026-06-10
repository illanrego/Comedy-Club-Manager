'use server'

import { db } from "@/db";
import { showsTable, comicsTable, comicsShowsTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getShows() {
  // First, get all shows with all fields
  const shows = await db.select({
    id: showsTable.id,
    date: showsTable.date,
    startTime: showsTable.startTime,
    showName: showsTable.showName,
    ticketsSold: showsTable.ticketsSold,
    ticketsRevenue: showsTable.ticketsRevenue,
    barRevenue: showsTable.barRevenue,
    showQuality: showsTable.showQuality,
    isFiftyFifty: showsTable.isFiftyFifty,
    freeTickets: showsTable.freeTickets,
    source: showsTable.source,
  }).from(showsTable);
  
  // Then for each show, get the associated comics
  const result = await Promise.all(
    shows.map(async (show) => {
      const comicRelations = await db
        .select({
          comic: comicsTable,
          comicShow: comicsShowsTable,
        })
        .from(comicsShowsTable)
        .innerJoin(comicsTable, eq(comicsShowsTable.comicId, comicsTable.id))
        .where(eq(comicsShowsTable.showId, show.id));
      
      const comics = comicRelations.map(relation => ({
        ...relation.comic,
        comicShow: relation.comicShow,
      }));
      
      return {
        show,
        comics: comics || [],
      };
    })
  );

  return result;
}

// Keep the old function for backward compatibility
export async function getDias() {
  return getShows();
} 
