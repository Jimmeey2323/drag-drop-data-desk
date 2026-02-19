import Papa from "papaparse";

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

function getTag(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const yyyy = now.getFullYear();
  return `${mm}/${dd}/${yyyy} AM`;
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
  // Remove +, spaces, dashes, parens, dots, then strip decimal
  let cleaned = raw.replace(/[+\s\-().]/g, "");
  // If it has a decimal (e.g. from Excel), strip it
  if (cleaned.includes(".")) {
    cleaned = cleaned.split(".")[0];
  }
  // Remove any remaining non-digit
  cleaned = cleaned.replace(/\D/g, "");
  return cleaned;
}

export function processCSVFiles(files: File[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const allRows: ProcessedRow[] = [];
    let completed = 0;
    const tag = getTag();

    files.forEach((file) => {
      Papa.parse<RawRow>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const headers = result.meta.fields || [];
          const userIdCol = findCol(headers, ["userId", "user id", "user_id", "id"]);
          const firstNameCol = findCol(headers, ["firstName", "first name", "first_name", "firstname"]);
          const lastNameCol = findCol(headers, ["lastName", "last name", "last_name", "lastname"]);
          const emailCol = findCol(headers, ["email", "e-mail", "email address"]);
          const phoneCol = findCol(headers, ["phone", "phone number", "phonenumber", "phone_number", "mobile"]);

          for (const row of result.data) {
            const phoneVal = phoneCol ? (row[phoneCol] || "").trim() : "";
            if (!phoneVal) continue; // skip rows with empty phone

            allRows.push({
              userId: userIdCol ? (row[userIdCol] || "").trim() : "",
              firstName: firstNameCol ? (row[firstNameCol] || "").trim() : "",
              lastName: lastNameCol ? (row[lastNameCol] || "").trim() : "",
              email: emailCol ? (row[emailCol] || "").trim() : "",
              phone: formatPhone(phoneVal),
              tags: tag,
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
