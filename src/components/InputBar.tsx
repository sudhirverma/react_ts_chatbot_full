import React, { useState, useEffect, useRef } from "react";

export default function InputBar({
  onSend,
  disabled,
  value: controlledValue,
  onChange,
}: {
  onSend: (v: string) => void;
  disabled?: boolean;
  value?: string;
  onChange?: (v: string) => void;
}) {
  const [internal, setInternal] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // If parent controls value
  useEffect(() => {
    if (typeof controlledValue === "string") setInternal(controlledValue);
  }, [controlledValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = internal.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInternal("");
    if (onChange) onChange("");
  };

  const handleChange = (v: string) => {
    setInternal(v);
    if (onChange) onChange(v);
  };

  // Auto-resize textarea height
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 200) + "px"; // max height 200px before scroll
    }
  }, [internal]);

  return (
    <form
      className="input-bar"
      onSubmit={handleSubmit}
      style={{ alignItems: "flex-end" }}
    >
      <textarea
        ref={textareaRef}
        aria-label="Message input"
        placeholder="Type your message — e.g. 'Show account balance'"
        value={internal}
        onChange={(e) => handleChange(e.target.value)}
        disabled={disabled}
        style={{
          flex: 1,
          padding: "10px 12px",
          borderRadius: 8,
          border: "1px solid rgba(255,255,255,0.06)",
          background: "transparent",
          color: "inherit",
          resize: "none",
          overflowY: "auto",
          minHeight: "44px",
          maxHeight: "200px",
          fontFamily:
            "Inter, ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial",
          fontSize: 14,
          lineHeight: "1.5",
        }}
      />
      <button
        type="submit"
        disabled={disabled || !internal.trim()}
        style={{
          padding: "10px 14px",
          borderRadius: 8,
          border: "none",
          background: "var(--accent)",
          color: "#fff",
          cursor: "pointer",
          marginLeft: 8,
          height: "44px",
          alignSelf: "flex-end",
        }}
      >
        Send
      </button>
    </form>
  );
}
