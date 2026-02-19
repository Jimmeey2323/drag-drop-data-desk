import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Zap, CheckCircle2 } from "lucide-react";
import DropZone from "@/components/DropZone";
import TagConfigModal, { TagRule } from "@/components/TagConfigModal";
import { processCSVFiles, extractColumnsFromCSVFiles } from "@/lib/csvProcessor";
import { mergePDFFiles } from "@/lib/pdfProcessor";
import { processAndDownloadImages, type OutputFormat } from "@/lib/imageProcessor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const Index = () => {
  const [csvFiles, setCsvFiles] = useState<File[]>([]);
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
  const [csvProcessing, setCsvProcessing] = useState(false);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [imgProcessing, setImgProcessing] = useState(false);
  const [csvDone, setCsvDone] = useState(false);
  const [pdfDone, setPdfDone] = useState(false);
  const [imgDone, setImgDone] = useState(false);
  const [imgFiles, setImgFiles] = useState<File[]>([]);
  const [imgFormat, setImgFormat] = useState<OutputFormat>("jpeg");
  const [tagModalOpen, setTagModalOpen] = useState(false);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);

  const handleOpenTagModal = async () => {
    if (!csvFiles.length) return;
    try {
      const cols = await extractColumnsFromCSVFiles(csvFiles);
      setCsvColumns(cols);
    } catch {
      setCsvColumns([]);
    }
    setTagModalOpen(true);
  };

  const handleTagConfirm = async (rules: TagRule[]) => {
    setTagModalOpen(false);
    setCsvProcessing(true);
    setCsvDone(false);
    try {
      await processCSVFiles(csvFiles, rules);
      setCsvDone(true);
      toast.success("CSV processed & downloaded!");
    } catch (e: any) {
      toast.error(e.message || "CSV processing failed");
    } finally {
      setCsvProcessing(false);
    }
  };

  const handleProcessPDF = async () => {
    if (!pdfFiles.length) return;
    setPdfProcessing(true);
    setPdfDone(false);
    try {
      await mergePDFFiles(pdfFiles);
      setPdfDone(true);
      toast.success("PDFs merged & downloaded!");
    } catch (e: any) {
      toast.error(e.message || "PDF merging failed");
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleProcessImages = async () => {
    if (!imgFiles.length) return;
    setImgProcessing(true);
    setImgDone(false);
    try {
      await processAndDownloadImages(imgFiles, imgFormat);
      setImgDone(true);
      toast.success("Images processed & downloaded!");
    } catch (e: any) {
      toast.error(e.message || "Image processing failed");
    } finally {
      setImgProcessing(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <h1 className="text-base font-semibold tracking-tight">FileForge</h1>
          <span className="text-xs text-muted-foreground font-mono ml-1">v1.0</span>
        </div>
      </header>

      <main className="flex-1 flex items-start justify-center px-6 py-12">
        <div className="w-full max-w-7xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10"
          >
            <h2 className="text-3xl font-bold tracking-tight mb-2">Process your files</h2>
            <p className="text-muted-foreground text-sm max-w-lg">
              Upload CSV files to clean & format data, merge PDFs, or compress & convert images.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* CSV Section */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50">
              <DropZone
                type="csv"
                files={csvFiles}
                onFilesAdded={(f) => { setCsvFiles((p) => [...p, ...f]); setCsvDone(false); }}
                onFileRemove={(i) => setCsvFiles((p) => p.filter((_, idx) => idx !== i))}
                processing={csvProcessing}
              />
              <button
                onClick={handleOpenTagModal}
                disabled={!csvFiles.length || csvProcessing}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[hsl(var(--csv-color))] text-primary-foreground hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {csvProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                ) : csvDone ? (
                  <><CheckCircle2 className="w-4 h-4" /> Done — Download Started</>
                ) : (
                  "Configure Tags & Process"
                )}
              </button>
            </div>

            {/* PDF Section */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50">
              <DropZone
                type="pdf"
                files={pdfFiles}
                onFilesAdded={(f) => { setPdfFiles((p) => [...p, ...f]); setPdfDone(false); }}
                onFileRemove={(i) => setPdfFiles((p) => p.filter((_, idx) => idx !== i))}
                processing={pdfProcessing}
              />
              <button
                onClick={handleProcessPDF}
                disabled={!pdfFiles.length || pdfProcessing}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[hsl(var(--pdf-color))] text-primary-foreground hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {pdfProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Merging...</>
                ) : pdfDone ? (
                  <><CheckCircle2 className="w-4 h-4" /> Done — Download Started</>
                ) : (
                  "Merge & Download PDF"
                )}
              </button>
            </div>

            {/* Image Section */}
            <div className="flex flex-col gap-4 p-6 rounded-2xl bg-card border border-border/50">
              <DropZone
                type="image"
                files={imgFiles}
                onFilesAdded={(f) => { setImgFiles((p) => [...p, ...f]); setImgDone(false); }}
                onFileRemove={(i) => setImgFiles((p) => p.filter((_, idx) => idx !== i))}
                processing={imgProcessing}
              />
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground whitespace-nowrap">Convert to:</span>
                <Select value={imgFormat} onValueChange={(v) => setImgFormat(v as OutputFormat)}>
                  <SelectTrigger className="h-9 text-xs flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jpeg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                    <SelectItem value="webp">WebP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <button
                onClick={handleProcessImages}
                disabled={!imgFiles.length || imgProcessing}
                className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-[hsl(var(--img-color))] text-primary-foreground hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                {imgProcessing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Compressing...</>
                ) : imgDone ? (
                  <><CheckCircle2 className="w-4 h-4" /> Done — Download Started</>
                ) : (
                  "Compress & Download"
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </main>

      <TagConfigModal
        open={tagModalOpen}
        onClose={() => setTagModalOpen(false)}
        onConfirm={handleTagConfirm}
        availableColumns={csvColumns}
      />
    </div>
  );
};

export default Index;
