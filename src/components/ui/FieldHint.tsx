import { useEffect, useRef, useState } from "react";

interface FieldHintProps {
  hint: string;
}

// Parse hint text and convert markdown-style links [text](url) to anchor elements
function parseHintText(hint: string): (string | React.ReactElement)[] {
  const parts: (string | React.ReactElement)[] = [];
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  let lastIndex = 0;
  let key = 0;

  let match = linkRegex.exec(hint);
  while (match !== null) {
    // Add text before the link
    if (match.index > lastIndex) {
      parts.push(hint.substring(lastIndex, match.index));
    }

    // Add the link
    const linkText = match[1];
    const linkUrl = match[2];
    parts.push(
      <a
        key={`link-${key++}`}
        href={linkUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="field-hint-link"
        onClick={(e) => e.stopPropagation()}
      >
        {linkText}
      </a>,
    );

    lastIndex = match.index + match[0].length;
    match = linkRegex.exec(hint);
  }

  // Add remaining text after the last link
  if (lastIndex < hint.length) {
    parts.push(hint.substring(lastIndex));
  }

  return parts.length > 0 ? parts : [hint];
}

export function FieldHint({ hint }: FieldHintProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState<"left" | "right">("right");
  const iconRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        iconRef.current &&
        popoverRef.current &&
        !iconRef.current.contains(event.target as Node) &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Auto-position popover to avoid viewport edges
  useEffect(() => {
    if (!isOpen || !iconRef.current || !popoverRef.current) return;

    const iconRect = iconRef.current.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;

    // If popover would overflow on the right, position it to the left
    if (iconRect.right + popoverRect.width > viewportWidth - 20) {
      setPosition("left");
    } else {
      setPosition("right");
    }
  }, [isOpen]);

  const handleToggle = () => {
    setIsOpen(!isOpen);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="field-hint-container">
      <button
        ref={iconRef}
        type="button"
        className="field-hint-icon"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-label="Show hint"
        aria-expanded={isOpen}
        title="Show hint"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 18 18"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <circle cx="9" cy="9" r="8" stroke="currentColor" strokeWidth="1.5" />
          <path d="M9 8V13M9 5.5V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </button>

      {isOpen && (
        <div
          ref={popoverRef}
          className={`field-hint-popover field-hint-popover-${position}`}
          role="tooltip"
        >
          {parseHintText(hint)}
        </div>
      )}
    </div>
  );
}
