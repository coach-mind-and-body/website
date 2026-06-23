import "dotenv/config";
import { getDb } from "./server/db";
import { programModules } from "./drizzle/schema";

async function main() {
  const db = await getDb();
  if (!db) { console.log("no db"); return; }
  
  await db.update(programModules).set({
    pdfUrl: "/FGS_Coaching_Program_Worksheets.pdf"
  });
  
  console.log("Attached PDF to all modules.");
  process.exit(0);
}

main().catch(console.error);
