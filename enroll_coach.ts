import "dotenv/config";
import { getDb } from "./server/db";
import { users, enrollments, coachingSessions } from "./drizzle/schema";
import { eq, inArray } from "drizzle-orm";

async function main() {
  const db = await getDb();
  if (!db) { console.log("no db"); return; }
  
  const emailsToEnroll = [
    "coach@mindandbodyresetcoach.com",
    "carter@inseitzmarketing.com",
    "carterseitz35@gmail.com"
  ];

  const userList = await db.select().from(users).where(inArray(users.email, emailsToEnroll));

  for (const user of userList) {
    console.log("Enrolling user:", user.email, "ID:", user.id);
    
    const existing = await db.select().from(enrollments).where(eq(enrollments.userId, user.id));

    // delete old sessions first to avoid foreign key issues
    for (const e of existing) {
      await db.delete(coachingSessions).where(eq(coachingSessions.enrollmentId, e.id));
    }

    // delete old enrollment
    await db.delete(enrollments).where(eq(enrollments.userId, user.id));

    const [newE] = await db.insert(enrollments).values({
      userId: user.id,
      program: "reclaim",
      paymentType: "full",
      depositPaid: true,
      balancePaid: true,
      status: "active",
      enrolledAt: new Date(),
    }).$returningId();

    const sessionValues = [1,2,3,4,5,6].map(i => ({
      enrollmentId: newE.id,
      userId: user.id,
      sessionNumber: i,
      status: "not_scheduled" as const
    }));
    await db.insert(coachingSessions).values(sessionValues);
  }

  console.log("Enrolled all successfully.");
  process.exit(0);
}

main().catch(console.error);
