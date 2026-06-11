function copyWithExecCommand(value: string): void {
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.left = "-9999px";
  textarea.style.top = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);

  try {
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, value.length);

    const ok = document.execCommand("copy");
    if (!ok) {
      throw new Error("Copy command was rejected");
    }
  } finally {
    document.body.removeChild(textarea);
  }
}

async function copyWithClipboardApi(value: string): Promise<boolean> {
  try {
    const nav = globalThis.navigator;
    if (!nav) return false;

    const clipboard = nav.clipboard;
    if (!clipboard || typeof clipboard.writeText !== "function") {
      return false;
    }

    await clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * Copies text to the clipboard.
 * Uses the Clipboard API when available (secure context), otherwise
 * falls back to a temporary textarea + `document.execCommand("copy")`.
 */
export async function copyTextToClipboard(text: string): Promise<void> {
  if (typeof window === "undefined" || typeof document === "undefined") {
    throw new Error("Clipboard is not available");
  }

  const value = text.trim();
  if (!value) {
    throw new Error("Nothing to copy");
  }

  if (await copyWithClipboardApi(value)) {
    return;
  }

  copyWithExecCommand(value);
}
