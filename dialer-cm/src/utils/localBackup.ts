import { Contact } from '../types';

/**
 * Parse Google Contacts CSV or vCard (.vcf) into Contact objects for local device storage.
 */
export function parseContactsFile(fileName: string, content: string): Contact[] {
  const lower = fileName.toLowerCase();
  if (lower.endsWith('.vcf')) {
    return parseVCard(content);
  }
  if (lower.endsWith('.csv')) {
    return parseCsv(content);
  }
  // Fallback heuristic
  if (content.includes('BEGIN:VCARD')) {
    return parseVCard(content);
  }
  return parseCsv(content);
}

function parseVCard(content: string): Contact[] {
  const cards = content.split(/BEGIN:VCARD/i).slice(1);
  const results: Contact[] = [];

  for (const rawCard of cards) {
    const lines = rawCard.split(/\r?\n/);
    let name = '';
    let phone = '';
    let email = '';
    let company = '';
    let notes = '';

    for (const line of lines) {
      const idx = line.indexOf(':');
      if (idx === -1) continue;
      const key = line.slice(0, idx).toUpperCase();
      const val = line.slice(idx + 1).trim();

      if (key.startsWith('FN') && !name) name = val;
      else if (key.startsWith('TEL') && !phone) phone = val;
      else if (key.startsWith('EMAIL') && !email) email = val;
      else if (key.startsWith('ORG') && !company) company = val.replace(/;/g, ' ').trim();
      else if (key.startsWith('NOTE') && !notes) notes = val.replace(/\\n/g, '\n');
    }

    if (name || phone) {
      results.push({
        id: `local-imp-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: name || phone,
        phone: phone || '',
        email: email || '',
        company: company || '',
        notes: notes || '',
        source: 'local',
        createdAt: new Date().toISOString(),
      });
    }
  }

  return results;
}

function splitCsvRow(row: string): string[] {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (ch === '"') {
      if (inQuotes && row[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

function parseCsv(content: string): Contact[] {
  const rows = content.split(/\r?\n/).filter((r) => r.trim().length > 0);
  if (rows.length < 2) return [];

  const headers = splitCsvRow(rows[0]).map((h) => h.toLowerCase());
  const findCol = (keywords: string[]) =>
    headers.findIndex((h) => keywords.some((k) => h.includes(k)));

  const nameIdx = findCol(['name', 'first name', 'given name']);
  const lastIdx = findCol(['last name', 'family name']);
  const phoneIdx = findCol(['phone 1 - value', 'phone', 'mobile', 'tel']);
  const emailIdx = findCol(['e-mail 1 - value', 'email', 'e-mail']);
  const orgIdx = findCol(['organization 1 - name', 'company', 'organization']);
  const notesIdx = findCol(['notes', 'note']);

  const results: Contact[] = [];

  for (let i = 1; i < rows.length; i++) {
    const cols = splitCsvRow(rows[i]);
    const firstName = nameIdx >= 0 ? cols[nameIdx] || '' : '';
    const lastName = lastIdx >= 0 && lastIdx !== nameIdx ? cols[lastIdx] || '' : '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    const phone = phoneIdx >= 0 ? cols[phoneIdx] || '' : '';
    const email = emailIdx >= 0 ? cols[emailIdx] || '' : '';
    const company = orgIdx >= 0 ? cols[orgIdx] || '' : '';
    const notes = notesIdx >= 0 ? cols[notesIdx] || '' : '';

    if (!fullName && !phone) continue;

    results.push({
      id: `local-csv-${Date.now()}-${i}`,
      name: fullName || phone,
      phone,
      email,
      company,
      notes,
      source: 'local',
      createdAt: new Date().toISOString(),
    });
  }

  return results;
}

export function downloadJsonFile(filename: string, data: unknown): void {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
