import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Tag, Trash2 } from "lucide-react";

export interface TagRule {
  id: string;
  type: "static" | "value_match" | "non_empty";
  tag: string;
  column?: string;
  value?: string;
}

interface TagConfigModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (rules: TagRule[]) => void;
  availableColumns: string[];
}

const TagConfigModal = ({ open, onClose, onConfirm, availableColumns }: TagConfigModalProps) => {
  const [rules, setRules] = useState<TagRule[]>([
    { id: crypto.randomUUID(), type: "static", tag: "" },
  ]);

  const addRule = () => {
    setRules((prev) => [
      ...prev,
      { id: crypto.randomUUID(), type: "static", tag: "" },
    ]);
  };

  const removeRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  const updateRule = (id: string, updates: Partial<TagRule>) => {
    setRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, ...updates } : r))
    );
  };

  const handleConfirm = () => {
    const validRules = rules.filter((r) => r.tag.trim() !== "");
    onConfirm(validRules);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[hsl(var(--csv-color))]/10 flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-[hsl(var(--csv-color))]" />
              </div>
              <h3 className="text-sm font-semibold">Configure Tags</h3>
            </div>
            <button onClick={onClose} className="p-1 rounded-md hover:bg-muted transition-colors">
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-[60vh] overflow-y-auto space-y-3">
            {rules.map((rule, i) => (
              <motion.div
                key={rule.id}
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="p-3.5 rounded-xl bg-secondary/40 border border-border/30 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
                    Rule {i + 1}
                  </span>
                  {rules.length > 1 && (
                    <button
                      onClick={() => removeRule(rule.id)}
                      className="p-1 rounded hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3 text-destructive/70" />
                    </button>
                  )}
                </div>

                {/* Type selector */}
                <div className="flex gap-1.5">
                  {(
                    [
                      { value: "static", label: "Static Tag" },
                      { value: "value_match", label: "Value Match" },
                      { value: "non_empty", label: "Non-Empty Check" },
                    ] as const
                  ).map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => updateRule(rule.id, { type: opt.value })}
                      className={`px-2.5 py-1.5 rounded-md text-[11px] font-medium transition-all ${
                        rule.type === opt.value
                          ? "bg-[hsl(var(--csv-color))] text-primary-foreground"
                          : "bg-muted/50 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>

                {/* Tag name */}
                <input
                  type="text"
                  placeholder="Tag name (e.g. 01/15/2025 AM)"
                  value={rule.tag}
                  onChange={(e) => updateRule(rule.id, { tag: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-background border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--csv-color))]/50"
                />

                {/* Conditional fields */}
                {(rule.type === "value_match" || rule.type === "non_empty") && (
                  <div className="flex gap-2">
                    <select
                      value={rule.column || ""}
                      onChange={(e) => updateRule(rule.id, { column: e.target.value })}
                      className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-sm focus:outline-none focus:ring-1 focus:ring-[hsl(var(--csv-color))]/50 appearance-none"
                    >
                      <option value="">Select column</option>
                      {availableColumns.map((col) => (
                        <option key={col} value={col}>
                          {col}
                        </option>
                      ))}
                    </select>

                    {rule.type === "value_match" && (
                      <input
                        type="text"
                        placeholder="Contains..."
                        value={rule.value || ""}
                        onChange={(e) => updateRule(rule.id, { value: e.target.value })}
                        className="flex-1 px-3 py-2 rounded-lg bg-background border border-border/50 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-[hsl(var(--csv-color))]/50"
                      />
                    )}
                  </div>
                )}
              </motion.div>
            ))}

            <button
              onClick={addRule}
              className="w-full py-2 rounded-lg border border-dashed border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3" /> Add another rule
            </button>
          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-border/50 flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="px-5 py-2 rounded-lg text-xs font-semibold bg-[hsl(var(--csv-color))] text-primary-foreground hover:brightness-110 transition-all"
            >
              Apply & Process
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default TagConfigModal;
