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
    <div className="action-bar-container">
      {feedback && (
        <div
          className={`action-bar-feedback ${
            feedback.type === "success"
              ? "action-bar-feedback-success"
              : "action-bar-feedback-error"
          }`}
        >
          {feedback.message}
        </div>
      )}
      <div className="action-bar-buttons">
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
