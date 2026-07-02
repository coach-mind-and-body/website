// @ts-nocheck
import { getDb } from "../../db";
import { vacationQuotes, trips } from "../../../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export async function handleGetPipeline() {
  const db = await getDb();
  if (!db) return { error: "Database unavailable" };

  // Fetch all quotes (New Lead, Quoted)
  const quotes = await db.select().from(vacationQuotes).orderBy(desc(vacationQuotes.createdAt));

  // Fetch all trips (Booked, Completed)
  const allTrips = await db.select().from(trips).orderBy(desc(trips.createdAt));

  const pipeline = {
    newLead: quotes.filter(q => q.status === "new" || q.status === "contacted").map(q => ({
      id: `quote-${q.id}`,
      dbId: q.id,
      type: "quote",
      name: q.name,
      destination: q.destination,
      value: q.budget || "TBD",
      status: "newLead"
    })),
    quoted: quotes.filter(q => q.status === "quoted").map(q => ({
      id: `quote-${q.id}`,
      dbId: q.id,
      type: "quote",
      name: q.name,
      destination: q.destination,
      value: q.totalRevenue ? `$${q.totalRevenue}` : "TBD",
      status: "quoted"
    })),
    booked: allTrips.filter(t => t.status === "upcoming" || t.status === "active").map(t => ({
      id: `trip-${t.id}`,
      dbId: t.id,
      type: "trip",
      name: t.clientName,
      destination: t.destination,
      value: t.revenueAmount ? `$${t.revenueAmount}` : "TBD",
      status: "booked"
    })),
    completed: allTrips.filter(t => t.status === "completed").map(t => ({
      id: `trip-${t.id}`,
      dbId: t.id,
      type: "trip",
      name: t.clientName,
      destination: t.destination,
      value: t.revenueAmount ? `$${t.revenueAmount}` : "TBD",
      status: "completed"
    }))
  };

  return pipeline;
}

export async function handleMovePipelineItem(itemId: string, sourceColumn: string, destColumn: string) {
  if (!itemId || !destColumn) return { error: "Missing parameters" };

  const db = await getDb();
  if (!db) return { error: "Database unavailable" };

  const isQuote = itemId.startsWith("quote-");
  const isTrip = itemId.startsWith("trip-");
  const dbId = parseInt(itemId.split("-")[1], 10);

  if (isQuote) {
    if (destColumn === "newLead") {
      await db.update(vacationQuotes).set({ status: "contacted" }).where(eq(vacationQuotes.id, dbId));
    } else if (destColumn === "quoted") {
      await db.update(vacationQuotes).set({ status: "quoted" }).where(eq(vacationQuotes.id, dbId));
    } else if (destColumn === "booked" || destColumn === "closed" || destColumn === "completed") {
      // Convert quote to trip
      const quoteArr = await db.select().from(vacationQuotes).where(eq(vacationQuotes.id, dbId)).limit(1);
      const quote = quoteArr[0];
      if (quote) {
        await db.insert(trips).values({
          quoteId: quote.id,
          clientUserId: quote.clientUserId,
          clientName: quote.name,
          clientEmail: quote.email,
          destination: quote.destination || "Unknown Destination",
          status: (destColumn === "closed" || destColumn === "completed") ? "completed" : "upcoming",
          revenueAmount: quote.totalRevenue || null
        });
        // Update quote status so it doesn't show up in Quote columns
        await db.update(vacationQuotes).set({ status: "booked" }).where(eq(vacationQuotes.id, dbId));
      }
    }
  } else if (isTrip) {
    if (destColumn === "booked") {
      await db.update(trips).set({ status: "upcoming" }).where(eq(trips.id, dbId));
    } else if (destColumn === "closed" || destColumn === "completed") {
      await db.update(trips).set({ status: "completed" }).where(eq(trips.id, dbId));
    } else if (destColumn === "newLead" || destColumn === "quoted") {
      // Technically downgrading a trip back to a quote. 
      // For simplicity, we just mark the trip cancelled and revert the quote status.
      const tripArr = await db.select().from(trips).where(eq(trips.id, dbId)).limit(1);
      const trip = tripArr[0];
      if (trip && trip.quoteId) {
        await db.update(trips).set({ status: "cancelled" }).where(eq(trips.id, dbId));
        await db.update(vacationQuotes)
          .set({ status: destColumn === "newLead" ? "contacted" : "quoted" })
          .where(eq(vacationQuotes.id, trip.quoteId));
      }
    }
  }

  return { success: true };
}
