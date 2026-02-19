import Papa from "papaparse";
import { TagRule } from "@/components/TagConfigModal";

interface RawRow {
  [key: string]: string;
}

interface ProcessedRow {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tags: string;
}

function findCol(headers: string[], candidates: string[]): string | undefined {
  const lower = headers.map((h) => h.trim().toLowerCase());
  for (const c of candidates) {
    const idx = lower.indexOf(c.toLowerCase());
    if (idx !== -1) return headers[idx];
  }
  return undefined;
}

function formatPhone(raw: string): string {
  if (!raw) return "";
  let cleaned = raw.replace(/[+\s\-().]/g, "");
  if (cleaned.includes(".")) {
    cleaned = cleaned.split(".")[0];
  }
  cleaned = cleaned.replace(/\D/g, "");
  return cleaned;
}

function computeTags(row: RawRow, rules: TagRule[]): string {
  const tags: string[] = [];

  for (const rule of rules) {
    if (!rule.tag.trim()) continue;

    if (rule.type === "static") {
      tags.push(rule.tag.trim());
    } else if (rule.type === "non_empty" && rule.column) {
      const val = (row[rule.column] || "").trim();
      if (val !== "") {
        tags.push(rule.tag.trim());
      }
    } else if (rule.type === "value_match" && rule.column && rule.value) {
      const val = (row[rule.column] || "").trim().toLowerCase();
      if (val.includes(rule.value.trim().toLowerCase())) {
        tags.push(rule.tag.trim());
      }
    }
  }

  return tags.join(", ");
}

export function extractColumnsFromCSVFiles(files: File[]): Promise<string[]> {
  return new Promise((resolve, reject) => {
    // Read columns from the first file
    if (!files.length) { resolve([]); return; }
    Papa.parse<RawRow>(files[0], {
      header: true,
      preview: 1,
      complete: (result) => {
        resolve(result.meta.fields || []);
      },
      error: (err) => reject(err),
    });
  });
}

export function processCSVFiles(files: File[], tagRules: TagRule[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const allRows: ProcessedRow[] = [];
    let completed = 0;

    files.forEach((file) => {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const headers = result.meta.fields || [];
          const firstNameCol = findCol(headers, ["firstName", "first name", "first_name", "firstname"]);
          const lastNameCol = findCol(headers, ["lastName", "last name", "last_name", "lastname"]);
          const emailCol = findCol(headers, ["email", "e-mail", "email address"]);
          const phoneCol = findCol(headers, ["phone", "phone number", "phonenumber", "phone_number", "mobile"]);

          for (const row of result.data) {
            const phoneVal = phoneCol ? (row[phoneCol] || "").trim() : "";
            if (!phoneVal) continue;

            const formattedPhone = formatPhone(phoneVal);
            const tags = computeTags(row, tagRules);

            allRows.push({
              userId: formattedPhone,
              firstName: firstNameCol ? (row[firstNameCol] || "").trim() : "",
              lastName: lastNameCol ? (row[lastNameCol] || "").trim() : "",
              email: emailCol ? (row[emailCol] || "").trim() : "",
              phone: formattedPhone,
              tags,
            });
          }

          completed++;
          if (completed === files.length) {
            if (allRows.length === 0) {
              reject(new Error("No valid rows found after processing."));
              return;
            }
            const csv = Papa.unparse(allRows, {
              columns: ["userId", "firstName", "lastName", "email", "phone", "tags"],
            });
            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "Momence Customers - YM Segment.csv";
            a.click();
            URL.revokeObjectURL(url);
            resolve();
          }
        },
        error: (err) => reject(err),
      });
    });
  });
}
