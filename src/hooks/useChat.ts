// import { useCallback, useEffect, useState } from "react";
// import type { Message } from "../types/chat";
// import { getSessionId } from "../utils/session";
// import { sendPrompt } from "../services/api";

// const STORAGE_KEY_PREFIX = "chat_messages_";

// export function useChat() {
//   const sessionId = getSessionId();
//   const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`;

//   const [messages, setMessages] = useState<Message[]>(() => {
//     try {
//       const raw = localStorage.getItem(storageKey);
//       return raw ? (JSON.parse(raw) as Message[]) : [];
//     } catch (e) {
//       console.error("Failed to parse messages from localStorage", e);
//       return [];
//     }
//   });

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   // persist messages to localStorage
//   useEffect(() => {
//     try {
//       localStorage.setItem(storageKey, JSON.stringify(messages));
//     } catch (e) {
//       console.error("Failed to save messages", e);
//     }
//   }, [messages, storageKey]);

//   const send = useCallback(
//     async (prompt: string) => {
//       setError(null);
//       const userMsg: Message = {
//         id: String(Date.now()) + "-u",
//         role: "user",
//         text: prompt,
//         timestamp: new Date().toISOString()
//       };
//       setMessages((m) => [...m, userMsg]);
//       setLoading(true);
//       try {
//         const assistantMsg = await sendPrompt(prompt, sessionId);
//         setMessages((m) => [...m, assistantMsg]);
//       } catch (err: any) {
//         console.error(err);
//         setError(err?.message ?? "Unknown error");
//       } finally {
//         setLoading(false);
//       }
//     },
//     [sessionId]
//   );

//   const clear = useCallback(() => {
//     setMessages([]);
//     try {
//       localStorage.removeItem(storageKey);
//     } catch (e) {
//       console.error("Failed to clear storage", e);
//     }
//   }, [storageKey]);

//   return { messages, loading, error, send, clear };
// }


import { useCallback, useEffect, useState } from "react";
import type { Message } from "../types/chat";
import { getSessionId } from "../utils/session";
import { sendPrompt } from "../services/api";

const STORAGE_KEY_PREFIX = "chat_messages_";

export function useChat() {
  const sessionId = getSessionId();
  const storageKey = `${STORAGE_KEY_PREFIX}${sessionId}`;

  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? (JSON.parse(raw) as Message[]) : [];
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

  /**
   * send(prompt, authTokenB64?, customerId?)
   * - authTokenB64: optional base64 token to be added to Authorization header
   * - customerId: optional customer id to include in payload
   */
  const send = useCallback(
    async (prompt: string, authTokenB64?: string, customerId?: string) => {
      setError(null);
      const userMsg: Message = {
        id: String(Date.now()) + "-u",
        role: "user",
        text: prompt,
        timestamp: new Date().toISOString(),
      };
      setMessages((m) => [...m, userMsg]);
      setLoading(true);
      try {
        const assistantMsg = await sendPrompt(prompt, sessionId, {
          customerId,
          authTokenB64,
        });
        setMessages((m) => [...m, assistantMsg]);
      } catch (err: any) {
        console.error(err);
        setError(err?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [sessionId]
  );

  const clear = useCallback(() => {
    setMessages([]);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      console.error("Failed to clear storage", e);
    }
  }, [storageKey]);

  return { messages, loading, error, send, clear };
}
