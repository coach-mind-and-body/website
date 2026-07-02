import { getDb } from "../../db";
import { users, userTags, tags, clientLeads, vacationQuotes } from "../../../drizzle/schema";

export async function handleGetContacts() {
  const db = await getDb();
  if (!db) return { error: "Database unavailable" };

  // Fetch all users with their tags
  const allUsers = await db.query.users.findMany();
  const allUserTags = await db.query.userTags.findMany();
  const allTags = await db.query.tags.findMany();

  const tagMap = new Map<number, typeof allTags[0]>();
  allTags.forEach(t => tagMap.set(t.id, t));

  const userTagMap = new Map<number, any[]>();
  allUserTags.forEach(ut => {
    if (!userTagMap.has(ut.userId)) userTagMap.set(ut.userId, []);
    const tag = tagMap.get(ut.tagId);
    if (tag) {
      userTagMap.get(ut.userId)!.push(tag);
    }
  });

  const contacts: any[] = [];
  const phoneSet = new Set<string>();
  const emailSet = new Set<string>();

  allUsers.forEach(u => {
    let contactType = "User";
    if (u.isPremium) {
      contactType = "Premium Member";
    } else if (u.openId?.startsWith("client_")) {
      contactType = "Quote Lead";
    } else {
      contactType = "Free Flight Deals";
    }

    contacts.push({
      id: `user-${u.id}`,
      dbId: u.id,
      name: u.name || "Unknown",
      email: u.email,
      phone: u.phone,
      type: contactType,
      tags: userTagMap.get(u.id) || []
    });
    if (u.phone) phoneSet.add(u.phone);
    if (u.email) emailSet.add(u.email);
  });

  // Fetch client leads
  const leads = await db.query.clientLeads.findMany();
  leads.forEach(l => {
    // Avoid duplicates if they are already a user
    if ((l.phone && phoneSet.has(l.phone)) || (l.email && emailSet.has(l.email))) return;
    contacts.push({
      id: `lead-${l.id}`,
      dbId: l.id,
      name: l.name || "Unknown",
      email: l.email,
      phone: l.phone,
      type: "Lead",
      tags: []
    });
    if (l.phone) phoneSet.add(l.phone);
    if (l.email) emailSet.add(l.email);
  });

  // Fetch vacation quotes
  const quotes = await db.query.vacationQuotes.findMany();
  quotes.forEach(q => {
    if ((q.phone && phoneSet.has(q.phone)) || (q.email && emailSet.has(q.email))) return;
    contacts.push({
      id: `quote-${q.id}`,
      dbId: q.id,
      name: q.name || "Unknown",
      email: q.email,
      phone: q.phone,
      type: "Quote",
      tags: []
    });
  });

  return contacts;
}
