type CoachEvent = {
  type: "message" | "typing";
  conversationId: number;
  who?: "client" | "coach";
};

type Sub = {
  write: (chunk: string) => void;
};

const rooms = new Map<number, Set<Sub>>();

export function publishCoachEvent(event: CoachEvent) {
  const subs = rooms.get(event.conversationId);
  if (!subs?.size) return;
  const payload = `data: ${JSON.stringify(event)}\n\n`;
  for (const sub of [...subs]) {
    try {
      sub.write(payload);
    } catch {
      subs.delete(sub);
    }
  }
}

export function subscribeCoachEvents(conversationId: number, write: (chunk: string) => void): () => void {
  let set = rooms.get(conversationId);
  if (!set) {
    set = new Set();
    rooms.set(conversationId, set);
  }
  const sub: Sub = { write };
  set.add(sub);
  return () => {
    set!.delete(sub);
    if (set!.size === 0) rooms.delete(conversationId);
  };
}
