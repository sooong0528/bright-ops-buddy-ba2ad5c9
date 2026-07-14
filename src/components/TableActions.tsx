import { Fragment } from "react";
import { ChevronDown, Ellipsis } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface TableAction {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}

export function TableActions({
  actions,
  maxVisible = 2,
  moreTrigger = "text",
}: {
  actions: TableAction[];
  maxVisible?: number;
  moreTrigger?: "text" | "icon";
}) {
  const visibleActions = actions.slice(0, maxVisible);
  const moreActions = actions.slice(maxVisible);

  return (
    <div className="inline-flex items-center text-sm" onClick={(event) => event.stopPropagation()}>
      {visibleActions.map((action, index) => (
        <Fragment key={action.label}>
          {index > 0 && <span className="mx-2 h-3.5 w-px bg-border" aria-hidden="true" />}
          <button
            type="button"
            disabled={action.disabled}
            onClick={action.onClick}
            className="whitespace-nowrap text-primary transition-colors hover:text-primary-glow focus-visible:outline-none focus-visible:text-primary-glow disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            {action.label}
          </button>
        </Fragment>
      ))}

      {moreActions.length > 0 && (
        <>
          {visibleActions.length > 0 && <span className="mx-2 h-3.5 w-px bg-border" aria-hidden="true" />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {moreTrigger === "icon" ? (
                <button
                  type="button"
                  aria-label="更多操作"
                  className="inline-flex h-7 w-7 items-center justify-center text-primary transition-colors hover:text-primary-glow focus-visible:outline-none focus-visible:text-primary-glow"
                >
                  <Ellipsis className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="button"
                  className="inline-flex items-center gap-0.5 whitespace-nowrap text-primary transition-colors hover:text-primary-glow focus-visible:outline-none focus-visible:text-primary-glow"
                >
                  <span>更多</span>
                  <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-28">
              {moreActions.map((action) => (
                <DropdownMenuItem
                  key={action.label}
                  disabled={action.disabled}
                  onClick={action.onClick}
                  className={action.danger ? "text-destructive focus:text-destructive" : undefined}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      )}
    </div>
  );
}
