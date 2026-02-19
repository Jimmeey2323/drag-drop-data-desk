import { useState, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, FileText, FileSpreadsheet, ImageIcon } from "lucide-react";

interface DropZoneProps {
  type: "csv" | "pdf" | "image";
  files: File[];
  onFilesAdded: (files: File[]) => void;
  onFileRemove: (index: number) => void;
  processing: boolean;
}

const DropZone = ({ type, files, onFilesAdded, onFileRemove, processing }: DropZoneProps) => {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isCsv = type === "csv";
  const isPdf = type === "pdf";
  const isImage = type === "image";
  const accept = isCsv ? ".csv" : isPdf ? ".pdf" : "image/*";
  const label = isCsv ? "CSV Files" : isPdf ? "PDF Files" : "Image Files";
  const Icon = isCsv ? FileSpreadsheet : isPdf ? FileText : ImageIcon;
  const colorVar = isCsv ? "--csv-color" : isPdf ? "--pdf-color" : "--img-color";
  const dropZoneClass = isCsv ? "drop-zone-csv" : isPdf ? "drop-zone-pdf" : "drop-zone-img";

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(true);
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files).filter((f) =>
        isCsv ? f.name.endsWith(".csv") : isPdf ? f.name.endsWith(".pdf") : f.type.startsWith("image/")
      );
      if (droppedFiles.length) onFilesAdded(droppedFiles);
    },
    [isCsv, onFilesAdded]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFilesAdded(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-4 flex-1 min-w-0">
      <div className="flex items-center gap-2.5">
        <div
          className={`w-2.5 h-2.5 rounded-full`}
          style={{ background: `hsl(var(${colorVar}))` }}
        />
        <h2 className="text-lg font-semibold tracking-tight">{label}</h2>
        {files.length > 0 && (
          <span className="text-xs font-mono text-muted-foreground ml-auto">
            {files.length} file{files.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div
        className={`${dropZoneClass} ${dragging ? "dragging" : ""} relative flex flex-col items-center justify-center p-8 min-h-[220px] cursor-pointer`}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple
          className="hidden"
          onChange={handleChange}
        />
        <motion.div
          animate={{ y: dragging ? -4 : 0 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Upload
            className="w-10 h-10 mb-3 opacity-60"
            style={{ color: `hsl(var(${colorVar}))` }}
          />
        </motion.div>
        <p className="text-sm text-muted-foreground text-center">
          Drop <span className="font-semibold text-foreground">{isImage ? "image" : `.${type}`}</span> files here or{" "}
          <span className="font-semibold" style={{ color: `hsl(var(${colorVar}))` }}>
            browse
          </span>
        </p>
      </div>

      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="flex flex-col gap-1.5 overflow-hidden"
          >
            {files.map((file, i) => (
              <motion.div
                key={file.name + i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-secondary/50 group"
              >
                <Icon className="w-4 h-4 shrink-0" style={{ color: `hsl(var(${colorVar}))` }} />
                <span className="text-xs font-mono truncate flex-1">{file.name}</span>
                <span className="text-[10px] text-muted-foreground font-mono">
                  {(file.size / 1024).toFixed(0)}KB
                </span>
                {!processing && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onFileRemove(i);
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                  >
                    <X className="w-3 h-3 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DropZone;
