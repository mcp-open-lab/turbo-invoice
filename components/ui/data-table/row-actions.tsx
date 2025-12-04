"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Check, X, Edit2, MoreVertical, ExternalLink } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface RowActionsProps {
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  isPending?: boolean;
  canSave?: boolean;
  detailsHref?: string;
  className?: string;
  size?: "sm" | "default";
}

export function RowActions({
  isEditing,
  onEdit,
  onSave,
  onCancel,
  isPending = false,
  canSave = true,
  detailsHref,
  className,
  size = "default",
}: RowActionsProps) {
  const buttonSize = size === "sm" ? "h-6 w-6" : "h-7 w-7";
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  if (isEditing) {
    return (
      <div className={cn("flex gap-1", className)}>
        <Button
          size="icon"
          variant="ghost"
          className={buttonSize}
          onClick={onSave}
          disabled={isPending || !canSave}
        >
          <Check className={iconSize} />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className={buttonSize}
          onClick={onCancel}
          disabled={isPending}
        >
          <X className={iconSize} />
        </Button>
      </div>
    );
  }

  if (detailsHref) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className={cn(buttonSize, className)}>
            <MoreVertical className={cn(iconSize, "text-muted-foreground")} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={onEdit}>
            <Edit2 className="h-4 w-4 mr-2" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={detailsHref}>
              <ExternalLink className="h-4 w-4 mr-2" />
              View Details
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <Button
      size="icon"
      variant="ghost"
      className={cn(buttonSize, className)}
      onClick={onEdit}
    >
      <Edit2 className={cn(iconSize, "text-muted-foreground")} />
    </Button>
  );
}

