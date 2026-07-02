import React from "react";
import ConversationList from "../components/ConversationList";
import NewMessageFab from "../components/NewMessageFab";

export default function InboxChatsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 min-w-0 overflow-hidden">
      <ConversationList />
      <div className="flex flex-1 min-w-0 overflow-hidden">{children}</div>
      <NewMessageFab />
    </div>
  );
}
