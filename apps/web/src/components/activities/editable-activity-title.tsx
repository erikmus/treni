"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableActivityTitleProps {
  activityId: string;
  initialTitle: string | null;
  fallbackTitle: string;
}

export function EditableActivityTitle({ 
  activityId, 
  initialTitle, 
  fallbackTitle 
}: EditableActivityTitleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(initialTitle || "");
  const [displayTitle, setDisplayTitle] = useState(initialTitle || fallbackTitle);
  const [isSaving, setIsSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    setTitle(initialTitle || "");
    setIsEditing(true);
  };

  const handleCancel = () => {
    setTitle(initialTitle || "");
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (isSaving) return;
    
    const newTitle = title.trim();
    
    // If title hasn't changed, just close
    if (newTitle === (initialTitle || "")) {
      setIsEditing(false);
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch(`/api/activities/${activityId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newTitle }),
      });

      if (response.ok) {
        setDisplayTitle(newTitle || fallbackTitle);
        setIsEditing(false);
      } else {
        console.error("Failed to save title");
      }
    } catch (error) {
      console.error("Error saving title:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={fallbackTitle}
          className={cn(
            "text-2xl font-bold bg-transparent border-b-2 border-primary outline-none",
            "placeholder:text-muted-foreground/50",
            "min-w-[200px] max-w-[400px]"
          )}
          disabled={isSaving}
        />
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="p-1.5 rounded-md hover:bg-accent text-emerald-600 hover:text-emerald-700 transition-colors"
          title="Opslaan"
        >
          <Check className="h-5 w-5" />
        </button>
        <button
          onClick={handleCancel}
          disabled={isSaving}
          className="p-1.5 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Annuleren"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <h1 className="text-2xl font-bold">{displayTitle}</h1>
      <button
        onClick={handleStartEdit}
        className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-accent text-muted-foreground hover:text-foreground transition-all"
        title="Naam wijzigen"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  );
}

