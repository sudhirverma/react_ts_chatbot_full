// src/App.tsx
import { useEffect, useMemo, useState } from "react";
import ChatWindow from "./components/ChatWindow";
import InputBar from "./components/InputBar";
import { useChat } from "./hooks/useChat";
import CustomerSelect from "./components/CustomerSelect";
import PromptSelect from "./components/PromptSelect";
import customersData from "./data/customers.json";
import promptsData from "./data/prompts.json";
import {
  getSelectedCustomerId,
  setSelectedCustomerId,
} from "./utils/customerStorage";
import type { Customer } from "./types/customer";
import type { PromptItem } from "./components/PromptSelect";

export default function App(): any {
  const customers = (customersData as any).customers as Customer[];

  const [selectedCustomerId, setSelectedCustomerIdState] = useState<string | null>(
    () => {
      const stored = getSelectedCustomerId();
      return stored ?? (customers.length > 0 ? customers[0].customer_id : null);
    }
  );

  useEffect(() => {
    if (selectedCustomerId) setSelectedCustomerId(selectedCustomerId);
  }, [selectedCustomerId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.customer_id === selectedCustomerId) ?? null,
    [customers, selectedCustomerId]
  );

  // prompts
  const prompts = (promptsData as any).prompts as PromptItem[];
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === selectedPromptId) ?? null,
    [prompts, selectedPromptId]
  );

  // control input box content with this state
  const [inputValue, setInputValue] = useState<string>("");

  // when a prompt is selected, put its text into the input box
  useEffect(() => {
    if (selectedPrompt) {
      setInputValue(selectedPrompt.prompt);
    }
  }, [selectedPrompt]);

  const { messages, loading, error, send, clear } = useChat();

  // send should use current customer token & id
  const handleSend = (promptText: string) => {
    const token = selectedCustomer?.auth_token_b64;
    const cid = selectedCustomer?.customer_id;
    send(promptText, token, cid);
    // clear selected prompt after sending (optional)
    setSelectedPromptId(null);
    setInputValue("");
  };

  return (
    <div className="app">
      <aside className="sidebar" aria-label="Sidebar">
        <h1 className="title">
          {selectedCustomer
            ? selectedCustomer.name
            : import.meta.env.VITE_APP_TITLE ?? "React Chat UI"}
        </h1>

        <div style={{ marginTop: 12 }}>
          <CustomerSelect
            customers={customers}
            value={selectedCustomerId}
            onChange={(id) => setSelectedCustomerIdState(id)}
          />
        </div>

        {/* Prompt selector */}
        <div style={{ marginTop: 12 }}>
          <PromptSelect
            prompts={prompts}
            value={selectedPromptId}
            onChange={(id) => setSelectedPromptId(id)}
          />
        </div>

        {/* Info about selected prompt */}
        {selectedPrompt && (
          <div
            style={{
              marginTop: 12,
              padding: 12,
              borderRadius: 8,
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <div style={{ fontSize: 13, color: "var(--muted)" }}>Selected Prompt</div>
            <div style={{ fontWeight: 600, marginTop: 6 }}>{selectedPrompt.label}</div>
            <div style={{ fontSize: 13, marginTop: 6, whiteSpace: "pre-wrap" }}>
              {selectedPrompt.prompt}
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

        {/* Input bar is now controlled: show selected prompt text in the input */}
        <InputBar
          onSend={handleSend}
          disabled={loading}
          value={inputValue}
          onChange={(v) => setInputValue(v)}
        />
      </main>
    </div>
  );
}
