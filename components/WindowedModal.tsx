"use client";

interface WindowedModalProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  className?: string;
  closable?: boolean;
}

export function WindowedModal({
  title,
  onClose,
  children,
  className = "",
  closable = true,
}: WindowedModalProps) {
  return (
    <div
      className={`overflow-hidden border-4 border-[#4a4a4a] bg-[var(--bg-darker)] shadow-[0_0_0_2px_var(--window-blue-dark)] ${className}`}
      style={{
        imageRendering: "pixelated",
        boxShadow: "8px 8px 0 rgba(0,0,0,0.4)",
      }}
    >
      {/* Blue title bar */}
      <div
        className="flex items-center justify-between px-3 py-2"
        style={{
          backgroundColor: "var(--window-blue)",
          borderBottom: "3px solid var(--window-blue-dark)",
        }}
      >
        <span
          className="font-pixel text-[10px] font-bold"
          style={{ color: "#fff", textShadow: "1px 1px 0 var(--window-blue-dark)" }}
        >
          {title}
        </span>
        <div className="flex items-center gap-1">
          {/* Minimize */}
          <button
            type="button"
            className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#4a7ab8] transition hover:bg-[#5a8ac8]"
            aria-label="Minimize"
          >
            <span className="mb-1.5 block h-0.5 w-2 bg-[#1a3050]" />
          </button>
          {/* Maximize */}
          <button
            type="button"
            className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#4a7ab8] transition hover:bg-[#5a8ac8]"
            aria-label="Maximize"
          >
            <span
              className="block h-2 w-2 border-2 border-[#1a3050]"
              style={{ borderWidth: 1.5 }}
            />
          </button>
          {/* Close */}
          {closable && (
            <button
              type="button"
              onClick={onClose}
              className="flex h-5 w-6 items-center justify-center border-2 border-[#2d4a72] bg-[#c44] transition hover:bg-[#e55]"
              aria-label="Close"
            >
              <span className="text-[10px] font-bold text-white">×</span>
            </button>
          )}
        </div>
      </div>
      {/* Content */}
      <div className="p-6">{children}</div>
    </div>
  );
}
