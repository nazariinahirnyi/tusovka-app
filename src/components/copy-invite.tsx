"use client";

import { useState } from "react";

export function CopyInvite({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const field = document.createElement("textarea");
      field.value = url;
      document.body.appendChild(field);
      field.select();
      document.execCommand("copy");
      field.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <input
        readOnly
        value={url}
        aria-label="Посилання-запрошення"
        className="w-full rounded-2xl border border-line bg-cream px-4 py-2.5 text-sm"
      />
      <button
        type="button"
        onClick={copy}
        className="shrink-0 rounded-full bg-pine px-4 py-2.5 text-sm font-medium text-cream"
      >
        {copied ? "Скопійовано" : "Копіювати запрошення"}
      </button>
    </div>
  );
}
