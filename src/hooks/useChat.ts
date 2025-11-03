// src/hooks/useChat.ts
import { useCallback, useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import type { Message as Msg } from "../types/chat";
import { getSessionId } from "../utils/session";
import { sendPrompt } from "../services/api";

const STORAGE_KEY_PREFIX = "chat_messages_";

export function useChat() {
  const sessionId = getSessionId();
  const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`;

  const [messages, setMessages] = useState<Msg[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Msg[]) : [];
    } catch (e) {
      console.error("Failed to parse messages from localStorage", e);
      return [];
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (e) {
      console.error("Failed to save messages", e);
    }
  }, [messages, storageKey]);

  const clear = useCallback(() => {
    setMessages([]);
    setError(null);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to clear storage", e);
    }
  }, [storageKey]);

  /**
   * send(prompt, authTokenB64?, customerId?)
   *
   * Behavior:
   * - append user message
   * - append temporary assistant message (isTemp: true)
   * - call backend via sendPrompt(...)
   * - replace the temporary message with the actual assistant message (or error msg)
   */
  const send = useCallback(
    async (prompt: string, authTokenB64?: string, customerId?: string) => {
      setError(null);

      // 1) user message
      const userMsg: Msg = {
        id: `${Date.now()}-u`,
        role: "user",
        text: prompt,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);

      // 2) temp assistant placeholder
      const tempId = `temp-${uuidv4()}`;
      const tempMsg: Msg = {
        id: tempId,
        role: "assistant",
        text: "Thinking...",
        timestamp: new Date().toISOString(),
        // mark temp so Message component can render skeleton
        // (add `isTemp?: boolean` to your Message type if not present)
        ...(true ? { isTemp: true } : {}),
      } as unknown as Msg;
      setMessages((m) => [...m, tempMsg]);

      setLoading(true);

      try {
        // delegate to your service (sendPrompt should handle the actual fetch/proxy/CORS)
        const res = await sendPrompt(prompt, sessionId, {
          customerId,
          authTokenB64,
        });

        // sendPrompt may return either a message object or plain text; adapt safely:
        // If it's an object with fields like { text, action_result, message }, pick a display text
        let assistantText = "";
        if (!res) {
          assistantText = "No response from server.";
        } else if (typeof res === "string") {
          assistantText = res;
        } else if (typeof res === "object") {
          // prefer friendly fields if present
          assistantText =
            (res.message as string) ||
            (res.text as string) ||
            (res.action_result?.message as string) ||
            JSON.stringify(res);
        } else {
          assistantText = String(res);
        }

        const assistantMsg: Msg = {
          id: `${Date.now()}-a`,
          role: "assistant",
          text: assistantText,
          timestamp: new Date().toISOString(),
        };

        // Replace temp message with assistant message (in-place)
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? assistantMsg : m))
        );
      } catch (err: any) {
        console.error("send error:", err);
        const errText = err?.message ?? "Unknown error";
        setError(errText);

        const errMsg: Msg = {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: `Error: ${errText}`,
          timestamp: new Date().toISOString(),
          // optionally flag error in the message object (if your types allow)
          ...(true ? ({ error: true } as any) : {}),
        };

        // Replace temp with error message
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? errMsg : m))
        );
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  return { messages, loading, error, send, clear, setMessages };
}

export default useChat;
