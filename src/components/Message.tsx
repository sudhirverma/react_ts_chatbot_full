import React from "react";
import type { Message as Msg } from "../types/chat";

const Message: React.FC<{ message: Msg }> = ({ message }) => {
  const isUser = message.role === "user";
  return (
    <div className={`message ${isUser ? "user" : "assistant"}`} aria-label={message.role}>
      <div className="bubble">
        <p>{message.text}</p>
        <time>{new Date(message.timestamp).toLocaleString()}</time>
      </div>
    </div>
  );
};

export default Message;
