import { NextResponse } from "next/server";
import { handleGetContacts } from "../../../../server/crm/handlers/contactsHandlers";

export async function GET() {
  try {
    const result = await handleGetContacts();
    
    if (!Array.isArray(result) && 'error' in result) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[Contacts API]", error);
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}
