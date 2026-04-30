import { useCallback, useRef, useState } from "react";
import { UploadCloud, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  onFileSelected: (file: File) => void;
  isAnalyzing: boolean;
  selectedFile: File | null;
  onClear: () => void;
}

export function UploadDropzone({ onFileSelected, isAnalyzing, selectedFile, onClear }: Props) {
  const [drag, setDrag] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files || files.length === 0) return;
      onFileSelected(files[0]);
    },
    [onFileSelected],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => { e.preventDefault(); setDrag(false); handleFiles(e.dataTransfer.files); }}
      className={cn(
        "glass-card relative flex flex-col items-center justify-center px-6 py-10 sm:py-14 text-center transition-all",
        drag && "ring-2 ring-primary shadow-[var(--shadow-glow)]",
      )}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/png,image/jpeg,image/webp"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {!selectedFile ? (
        <>
          <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow text-primary-foreground shadow-[var(--shadow-glow)]">
            <UploadCloud className="h-7 w-7" />
          </div>
          <h2 className="font-display text-xl font-semibold">Upload your blood test report</h2>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            Drag & drop a PDF or image here, or click to browse. Your file is processed for analysis only and never stored.
          </p>
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-5 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-glow"
          >
            Choose file
          </button>
          <p className="mt-3 text-xs text-muted-foreground">Supports PDF, PNG, JPG · Max ~10 MB</p>
        </>
      ) : (
        <div className="flex w-full max-w-md items-center gap-3 rounded-xl border border-border bg-secondary/40 p-4">
          <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-medium">{selectedFile.name}</p>
            <p className="text-xs text-muted-foreground">
              {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || "file"}
            </p>
          </div>
          {isAnalyzing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <button onClick={onClear} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label="Remove">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
