// src/components/Message.tsx
import React, { useState } from "react";
import type { Message as Msg } from "../types/chat";

const tryParseJson = (text: string) => {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

/**
 * Extract a human-friendly message from common places inside the structured response.
 * Returns the best plain text string found, otherwise null.
 */
const extractHumanMessage = (data: any): string | null => {
  if (!data) return null;

  // 1) top-level "message" field (very common)
  if (typeof data.message === "string" && data.message.trim()) {
    return data.message;
  }

  // 2) action_result.message
  if (data.action_result && typeof data.action_result.message === "string" && data.action_result.message.trim()) {
    return data.action_result.message;
  }

  // 3) sometimes action_result contains fields we can combine into a summary
  if (data.action === "get_balance" && data.action_result) {
    const r = data.action_result;
    if (r.balance) {
      return `The current balance is ${r.balance} ${r.currency ?? ""}.`;
    }
  }

  if (data.action === "get_customer_info" && data.action_result) {
    const r = data.action_result;
    const parts = [];
    if (r.name) parts.push(`Name: ${r.name}`);
    if (r.account_id) parts.push(`Account: ${r.account_id}`);
    if (typeof r.balance !== "undefined") parts.push(`Balance: ${r.balance} ${r.currency ?? ""}`);
    if (parts.length) return parts.join(" • ");
  }

  // 4) llm_output sometimes contains a JSON string with the user-facing message
  if (data.llm_output) {
    // If it's a string, try to parse it as JSON and search again
    if (typeof data.llm_output === "string") {
      const parsed = tryParseJson(data.llm_output);
      if (parsed) {
        const fromNested = extractHumanMessage(parsed);
        if (fromNested) return fromNested;
      }
    } else if (typeof data.llm_output === "object") {
      const fromNested = extractHumanMessage(data.llm_output);
      if (fromNested) return fromNested;
    }
  }

  // 5) Some responses embed JSON inside strings (escaped). Try to find and parse
  for (const k of Object.keys(data)) {
    const val = data[k];
    if (typeof val === "string") {
      const parsed = tryParseJson(val);
      if (parsed) {
        const fromParsed = extractHumanMessage(parsed);
        if (fromParsed) return fromParsed;
      }
    }
  }

  return null;
};

const Message: React.FC<{ message: Msg }> = ({ message }) => {
  const isUser = message.role === "user";
  const [showRaw, setShowRaw] = useState(false);

  // If the message.text is raw JSON string, parse it
  const parsed = typeof message.text === "string" ? tryParseJson(message.text) : null;

  // If parsed JSON exists, attempt to grab a human-friendly sentence
  const humanText = parsed ? extractHumanMessage(parsed) : null;

  // Helper to pretty-print the parsed JSON (if any)
  const prettyJson = (obj: any) => {
    try {
      return JSON.stringify(obj, null, 2);
    } catch {
      return String(obj);
    }
  };

  // Render special, structured summaries (balance/customer) if desired
  const renderStructured = (data: any) => {
    if (!data || typeof data !== "object") return null;
    const { action, action_result } = data;

    if (action === "get_balance" && action_result) {
      const { balance, currency, customer_id, status } = action_result;
      return (
        <>
          <p>
            💬 <strong>Balance check for {customer_id ?? "—"}</strong>
          </p>
          <p>
            The current balance is <strong>{balance} {currency ?? ""}</strong> (status: {status ?? "—"}).
          </p>
        </>
      );
    }

    if (action === "get_customer_info" && action_result) {
      const { name, account_id, balance, currency, masked_ssn, email } = action_result;
      return (
        <>
          <p>
            👤 <strong>Customer information</strong>
          </p>
          <ul style={{ paddingLeft: 18, marginTop: 6 }}>
            <li>Name: {name ?? "N/A"}</li>
            <li>Account: {account_id ?? "N/A"}</li>
            <li>Balance: {typeof balance !== "undefined" ? `${balance} ${currency ?? ""}` : "N/A"}</li>
            <li>Email: {email ?? "N/A"}</li>
            <li>Masked SSN: {masked_ssn ?? "N/A"}</li>
          </ul>
        </>
      );
    }

    // No special structured render
    return null;
  };

  return (
    <div className={`message ${isUser ? "user" : "assistant"}`} aria-label={message.role}>
      <div className="bubble">
        {/* 1) If we extracted a clear human message, show it */}
        {humanText ? (
          <>
            <p style={{ whiteSpace: "pre-wrap" }}>{humanText}</p>

            {/* Optionally render structured summary below if available */}
            {parsed && renderStructured(parsed)}

            <button
              style={{
                marginTop: 8,
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--muted)",
                cursor: "pointer",
              }}
              onClick={() => setShowRaw((s) => !s)}
            >
              {showRaw ? "Hide Raw" : "Show Raw"}
            </button>

            {showRaw && parsed && (
              <pre
                style={{
                  marginTop: 8,
                  background: "rgba(255,255,255,0.03)",
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 12,
                  overflowX: "auto",
                }}
              >
                {prettyJson(parsed)}
              </pre>
            )}
          </>
        ) : parsed ? (
          // 2) parsed JSON exists but we couldn't find a human message -> show structured summary if possible
          <>
            {renderStructured(parsed) ?? (
              <>
                <pre
                  style={{
                    whiteSpace: "pre-wrap",
                    fontSize: 13,
                    opacity: 0.95,
                  }}
                >
                  {prettyJson(parsed)}
                </pre>
              </>
            )}

            <button
              style={{
                marginTop: 8,
                padding: "6px 10px",
                fontSize: 12,
                borderRadius: 6,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.04)",
                color: "var(--muted)",
                cursor: "pointer",
              }}
              onClick={() => setShowRaw((s) => !s)}
            >
              {showRaw ? "Hide Raw" : "Show Raw"}
            </button>

            {showRaw && (
              <pre
                style={{
                  marginTop: 8,
                  background: "rgba(255,255,255,0.03)",
                  padding: 8,
                  borderRadius: 8,
                  fontSize: 12,
                  overflowX: "auto",
                }}
              >
                {prettyJson(parsed)}
              </pre>
            )}
          </>
        ) : (
          // 3) not JSON at all: show plain text
          <p style={{ whiteSpace: "pre-wrap" }}>{message.text}</p>
        )}

        <time style={{ display: "block", marginTop: 8 }}>{new Date(message.timestamp).toLocaleString()}</time>
      </div>
    </div>
  );
};

export default Message;
