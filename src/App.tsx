import React, { useEffect, useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import { useChat } from "./hooks/useChat";
import CustomerSelect from "./components/CustomerSelect";
import customersData from "./data/customers.json";
import {
  getSelectedCustomerId,
  setSelectedCustomerId,
} from "./utils/customerStorage";
import type { Customer } from "./types/customer";

export default function App(): JSX.Element {
  // Load customers from local JSON
  const customers = (customersData as any).customers as Customer[];

  // Get saved customer selection (if any)
  const [selectedCustomerId, setSelectedCustomerIdState] = useState<string | null>(() => {
    const stored = getSelectedCustomerId();
    return stored ?? (customers.length > 0 ? customers[0].customer_id : null);
  });

  // Persist selected customer id in localStorage
  useEffect(() => {
    if (selectedCustomerId) setSelectedCustomerId(selectedCustomerId);
  }, [selectedCustomerId]);

  // Derive selected customer object
  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customer_id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  // useChat manages the conversation
  const { messages, loading, error, send, clear } = useChat();

  // When customer changes, optionally reset the chat session if desired
  useEffect(() => {
    // You could clear messages automatically when switching customers if you want:
    // clear();
  }, [selectedCustomerId]);

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Sidebar">
        <h1 className="title">
          {selectedCustomer
            ? selectedCustomer.name
            : import.meta.env.VITE_APP_TITLE ?? "React Chat UI"}
        </h1>

        {/* Dropdown for customer selection */}
        <div style={{ marginTop: 12 }}>
          <CustomerSelect
            customers={customers}
            value={selectedCustomerId}
            onChange={(id) => setSelectedCustomerIdState(id)}
          />
        </div>

        {/* Display selected customer info */}
        {selectedCustomer && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Selected</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>
              {selectedCustomer.name}
            </div>
            <div style={{ fontSize: 13, marginTop: 6 }}>
              <div>
                ID:{" "}
                <code style={{ color: "var(--muted)" }}>
                  {selectedCustomer.customer_id}
                </code>
              </div>
            </div>
          </div>
        )}

        <div className="controls" style={{ marginTop: 12 }}>
          <button onClick={clear}>New Conversation</button>
        </div>

        <footer className="footer muted" style={{ marginTop: "auto" }}>
          Session stored in localStorage — Selected:{" "}
          <strong>{selectedCustomer?.customer_id ?? "—"}</strong>
        </footer>
      </aside>

      <main className="main">
        <ChatWindow messages={messages} />
        {error && (
          <div className="error" role="alert" style={{ marginTop: 8 }}>
            {error}
          </div>
        )}

        {/* Input bar sends chat requests with correct auth token */}
        <InputBar
          onSend={(prompt) => {
            // Always use current customer's token & id
            const token = selectedCustomer?.auth_token_b64;
            const cid = selectedCustomer?.customer_id;
            send(prompt, token, cid);
          }}
          disabled={loading}
        />
      </main>
    </div>
  );
}
