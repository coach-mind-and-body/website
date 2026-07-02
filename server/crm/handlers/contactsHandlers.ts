// @ts-nocheck
import { getDb } from "../../db";
import { users, leads } from "../../../drizzle/schema";

export async function handleGetContacts() {
  const db = await getDb();
  if (!db) return { error: "Database unavailable" };

  // Fetch all users
  const allUsers = await db.query.users.findMany();

  const contacts: any[] = [];
  const phoneSet = new Set<string>();
  const emailSet = new Set<string>();

  allUsers.forEach(u => {
    let contactType = "User";
    if (u.isPremium) {
      contactType = "Premium Member";
    } else {
      contactType = "Customer";
    }

    contacts.push({
      id: `user-${u.id}`,
      dbId: u.id,
      name: u.name || "Unknown",
      email: u.email,
      phone: u.phone,
      type: contactType,
      tags: []
    });
    if (u.phone) phoneSet.add(u.phone);
    if (u.email) emailSet.add(u.email);
  });

  // Fetch leads (discovery call signups)
  const allLeads = await db.query.leads.findMany();
  allLeads.forEach(l => {
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

  return contacts;
}
