"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Upload, FileUp, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface UploadTCXDialogProps {
  trigger?: React.ReactNode;
}

type UploadState = "idle" | "selected" | "uploading" | "success" | "error";

export function UploadTCXDialog({ trigger }: UploadTCXDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<UploadState>("idle");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const resetState = () => {
    setState("idle");
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsDragging(false);
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.toLowerCase().endsWith(".tcx")) {
      setErrorMessage("Alleen TCX bestanden worden ondersteund");
      setState("error");
      return;
    }

    setSelectedFile(file);
    setState("selected");
    setErrorMessage(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setState("uploading");
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/activities/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload mislukt");
      }

      setState("success");
      setSuccessMessage(data.message);
      
      // Refresh the page after a short delay
      setTimeout(() => {
        setOpen(false);
        resetState();
        router.refresh();
      }, 1500);
    } catch (error) {
      setState("error");
      setErrorMessage(error instanceof Error ? error.message : "Er is een fout opgetreden");
    }
  };

  const handleClose = () => {
    setOpen(false);
    // Reset state after animation
    setTimeout(resetState, 300);
  };

  return (
    <Drawer open={open} onOpenChange={setOpen}>
      <DrawerTrigger asChild>
        {trigger || (
          <Button variant="outline">
            <Upload className="mr-2 h-4 w-4" />
            TCX uploaden
          </Button>
        )}
      </DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-md">
          <DrawerHeader>
            <DrawerTitle>Activiteit importeren</DrawerTitle>
            <DrawerDescription>
              Upload een TCX bestand van Garmin Connect om je activiteit te importeren.
            </DrawerDescription>
          </DrawerHeader>

          <div className="px-4 pb-4">
            {/* Success state */}
            {state === "success" && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="rounded-full bg-emerald-100 p-3 dark:bg-emerald-900/30">
                  <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="mt-4 font-medium text-emerald-600 dark:text-emerald-400">
                  {successMessage || "Upload succesvol!"}
                </p>
              </div>
            )}

            {/* Upload area */}
            {state !== "success" && (
              <>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={cn(
                    "relative cursor-pointer rounded-xl border-2 border-dashed p-8 transition-all",
                    isDragging
                      ? "border-primary bg-primary/5"
                      : "border-muted-foreground/25 hover:border-muted-foreground/50 hover:bg-muted/50",
                    state === "error" && "border-destructive/50 bg-destructive/5"
                  )}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".tcx"
                    onChange={handleInputChange}
                    className="hidden"
                  />

                  <div className="flex flex-col items-center justify-center text-center">
                    {state === "uploading" ? (
                      <>
                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          Bezig met uploaden...
                        </p>
                      </>
                    ) : state === "error" ? (
                      <>
                        <AlertCircle className="h-10 w-10 text-destructive" />
                        <p className="mt-4 font-medium text-destructive">
                          {errorMessage}
                        </p>
                        <p className="mt-2 text-sm text-muted-foreground">
                          Klik om opnieuw te proberen
                        </p>
                      </>
                    ) : selectedFile ? (
                      <>
                        <FileUp className="h-10 w-10 text-primary" />
                        <p className="mt-4 font-medium">{selectedFile.name}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {(selectedFile.size / 1024).toFixed(1)} KB
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Klik om een ander bestand te selecteren
                        </p>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground" />
                        <p className="mt-4 text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">Klik om te selecteren</span>
                          {" "}of sleep een bestand hierheen
                        </p>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Ondersteund: TCX bestanden
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="mt-4 rounded-lg bg-muted/50 p-4 text-sm">
                  <p className="font-medium">Hoe exporteer je een TCX bestand?</p>
                  <ol className="mt-2 ml-4 list-decimal text-muted-foreground space-y-1">
                    <li>Ga naar <a href="https://connect.garmin.com" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2">Garmin Connect</a></li>
                    <li>Open de activiteit die je wilt exporteren</li>
                    <li>Klik op het tandwiel icoon (⚙️)</li>
                    <li>Kies &quot;Exporteer naar TCX&quot;</li>
                  </ol>
                </div>
              </>
            )}
          </div>

          <DrawerFooter>
            {state === "success" ? (
              <DrawerClose asChild>
                <Button variant="outline">Sluiten</Button>
              </DrawerClose>
            ) : (
              <>
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile || state === "uploading"}
                >
                  {state === "uploading" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Uploaden...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Importeren
                    </>
                  )}
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" onClick={handleClose}>
                    Annuleren
                  </Button>
                </DrawerClose>
              </>
            )}
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

