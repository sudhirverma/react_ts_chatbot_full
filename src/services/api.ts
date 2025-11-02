// import type { Message } from "../types/chat";

// const CHAT_API = (import.meta.env.VITE_CHAT_API as string) || "http://localhost:5003/chat";

// /**
//  * sendPrompt
//  * - Sends `{ prompt, session_id }` to the configured chat endpoint.
//  * - Expects JSON response with either { text: string } or { message: { text: string } }.
//  * - Adjust parsing to fit your backend response shape.
//  */
// export async function sendPrompt(prompt: string, sessionId: string, customerId?: string): Promise<Message> {
//   const payload = { prompt, session_id: sessionId, customer_id: customerId };

//   const res = await fetch(CHAT_API, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(payload)
//   });

//   if (!res.ok) {
//     const body = await res.text();
//     throw new Error(`Chat API error: ${res.status} ${body}`);
//   }

//   const json = await res.json();

//   // Flexible parsing
//   const assistantText =
//     typeof json === "string"
//       ? json
//       : json.text ?? json.message?.text ?? JSON.stringify(json);

//   return {
//     id: String(Date.now()),
//     role: "assistant",
//     text: String(assistantText),
//     timestamp: new Date().toISOString()
//   };
// }


import type { Message } from "../types/chat";

const CHAT_API = (import.meta.env.VITE_CHAT_API as string) || "http://localhost:5003/chat";

/**
 * sendPrompt
 * - Sends `{ prompt, session_id, customer_id? }` to the configured chat endpoint.
 * - If `authTokenB64` is provided, it will be sent in the Authorization header as:
 *     Authorization: Basic <authTokenB64>
 *
 * NOTE: authTokenB64 should already be base64 encoded if that's what your backend expects.
 */
export async function sendPrompt(
  prompt: string,
  sessionId: string,
  options?: { customerId?: string; authTokenB64?: string }
): Promise<Message> {
  const { customerId, authTokenB64 } = options ?? {};
  const payload: Record<string, any> = { prompt, session_id: sessionId };
  if (customerId) payload.customer_id = customerId;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authTokenB64) {
    // include the header exactly like: Authorization: Basic VGVzdEAy
    headers["Authorization"] = `Basic ${authTokenB64}`;
  }

  const res = await fetch(CHAT_API, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Chat API error: ${res.status} ${body}`);
  }

  const json = await res.json();

  const assistantText =
    typeof json === "string" ? json : json.text ?? json.message?.text ?? JSON.stringify(json);

  return {
    id: String(Date.now()),
    role: "assistant",
    text: String(assistantText),
    timestamp: new Date().toISOString(),
  };
}
