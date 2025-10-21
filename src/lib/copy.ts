
  export async function copyToClipboard(text?: string) {
    if (!text) return;

    let isCopied = false;

    // 优先使用现代化的 clipboard API
    if (navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(text);
        console.log("Invite code copied to clipboard");
        isCopied = true;
      } catch (err) {
        console.error("Modern clipboard API failed, falling back to execCommand", err);
      }
    }

    // 如果现代化 API 失败，尝试使用 document.execCommand('copy')
    if (!isCopied) {
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        console.log("Text copied using execCommand and textarea");
        document.body.removeChild(textArea);
        isCopied = true;
      } catch (err) {
        console.warn("execCommand with textarea failed: ", err);
      }
    }

    // 如果 execCommand 失败，尝试使用 selection 和 range
    if (!isCopied) {
      try {
        const selection = window.getSelection();
        if (!selection) {
          throw new Error("Failed to get selection");
        }
        const range = document.createRange();
        const tempDiv = document.createElement('div');
        tempDiv.textContent = text;
        document.body.appendChild(tempDiv);
        range.selectNodeContents(tempDiv);
        selection.removeAllRanges();
        selection.addRange(range);
        document.execCommand('copy');
        console.log("Text copied using execCommand and selection");
        isCopied = true;
        selection.removeAllRanges();
        document.body.removeChild(tempDiv);
      } catch (err) {
        console.warn("execCommand with selection failed: ", err);
      }
    }
  }