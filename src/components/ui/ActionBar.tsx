export interface ActionButton {
  label: string;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger";
  disabled?: boolean;
  icon?: string;
}

interface ActionBarProps {
  actions: ActionButton[];
  feedback?: { type: "success" | "error"; message: string } | null;
}

export function ActionBar({ actions, feedback }: ActionBarProps) {
  return (
    <div style={{ marginTop: "1.5rem" }}>
      {feedback && (
        <div
          style={{
            marginBottom: "1rem",
            padding: "0.75rem",
            borderRadius: "4px",
            backgroundColor: feedback.type === "success" ? "#d4edda" : "#f8d7da",
            color: feedback.type === "success" ? "#155724" : "#721c24",
            border: `1px solid ${feedback.type === "success" ? "#c3e6cb" : "#f5c6cb"}`,
          }}
        >
          {feedback.message}
        </div>
      )}
      <div
        style={{
          display: "flex",
          gap: "0.75rem",
          alignItems: "center",
          flexWrap: "wrap",
        }}
      >
        {actions.map((action) => {
          const variantClass = action.variant
            ? `action-btn-${action.variant}`
            : "action-btn-primary";
          return (
            <button
              key={action.label}
              type="button"
              className={`action-btn ${variantClass}`}
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span>{action.icon}</span>}
              {action.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
