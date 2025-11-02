import { useEffect, useRef } from "react";
import Message from "./Message";
import type { Message as Msg } from "../types/chat";

export default function ChatWindow({ messages }: { messages: Msg[] }) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="chat-window" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <div className="empty">No messages yet — say hello 👋</div>
      ) : (
        messages.map((m) => <Message key={m.id} message={m} />)
      )}
      <div ref={endRef} />
    </div>
  );
}
