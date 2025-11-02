import React, { useState } from "react";

export default function InputBar({
  onSend,
  disabled
}: {
  onSend: (v: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue("");
  };

  return (
    <form className="input-bar" onSubmit={handleSubmit}>
      <input
        aria-label="Message input"
        placeholder="Type your message — e.g. 'Show account balance for CUST002'"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        autoFocus
      />
      <button type="submit" disabled={disabled || !value.trim()}>
        Send
      </button>
    </form>
  );
}
