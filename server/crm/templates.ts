/**
 * ─────────────────────────────────────────────────────────────────────────────
 * CRM Message Templates
 * Chekkit-style placeholder system using ((variable)) syntax.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface MessageTemplate {
  id: string;
  name: string;
  category: "general" | "flight_deals" | "review" | "follow_up" | "booking" | "welcome";
  body: string;
}

/**
 * Resolve ((placeholder)) variables in a template body.
 * Supported: ((first_name)), ((last_name)), ((name)), ((review_invitation)), ((portal_link)), ((custom_link))
 */
export function resolvePlaceholders(
  body: string,
  data: {
    firstName?: string | null;
    lastName?: string | null;
    destination?: string | null;
    vacationType?: string | null;
    reviewLink?: string;
    portalLink?: string;
    customLink?: string;
  }
): string {
  const firstName = data.firstName || "there";
  const lastName = data.lastName || "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const reviewLink = data.reviewLink || "https://g.page/r/coachmindandbody/review";
  const destination = data.destination || "your trip";
  const vacationType = data.vacationType || "vacation";

  return body
    .replace(/\(\(first_name\)\)/gi, firstName)
    .replace(/\(\(last_name\)\)/gi, lastName)
    .replace(/\(\(name\)\)/gi, fullName)
    .replace(/\(\(destination\)\)/gi, destination)
    .replace(/\(\(vacation_type\)\)/gi, vacationType)
    .replace(/\(\(review_invitation\)\)/gi, reviewLink)
    .replace(/\(\(portal_link\)\)/gi, data.portalLink || "")
    .replace(/\(\(custom_link\)\)/gi, data.customLink || "")
    .replace(/\{firstName\}/gi, firstName)
    .replace(/\{lastName\}/gi, lastName)
    .replace(/\{name\}/gi, fullName)
    .replace(/\{destination\}/gi, destination)
    .replace(/\{vacationType\}/gi, vacationType);
}

/** Built-in template library */
export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "welcome_new_lead",
    name: "New Lead Welcome",
    category: "welcome",
    body: "Hi ((first_name))! 👋 Thanks for reaching out to Mind and Body! I'm Carter, your personal travel agent. I'd love to help you plan an amazing vacation. What destination are you dreaming of? ✈️🌴",
  },
  {
    id: "review_request",
    name: "Review Request",
    category: "review",
    body: "Hi ((first_name))! We hope your trip was everything you dreamed of! 🌟 We'd be so grateful if you could leave us a quick review — it means the world to small businesses like ours: ((review_invitation))",
  },
  {
    id: "flight_deal_friday",
    name: "Flight Deal Friday",
    category: "flight_deals",
    body: "((first_name)), it's Flight Deal Friday with Mind and Body! ✈️ Check out this week's best deals from SLC & PVU. Reply STOP to unsubscribe.",
  },
  {
    id: "follow_up_quote",
    name: "Quote Follow-Up",
    category: "follow_up",
    body: "Hi ((first_name))! Just wanted to follow up on the vacation quote I sent over. Do you have any questions? I'm here to help make your dream trip a reality! 😊",
  },
  {
    id: "booking_confirmation",
    name: "Booking Confirmation",
    category: "booking",
    body: "Great news ((first_name))! 🎉 Your trip is officially booked! I'll send over all the details and your digital itinerary shortly. Get excited — adventure awaits!",
  },
  {
    id: "portal_link",
    name: "Send Client Portal Link",
    category: "general",
    body: "Hi ((first_name))! Here's your secure client portal where you can view all your trip documents, itinerary, and more: ((portal_link)) 🗺️",
  },
];
