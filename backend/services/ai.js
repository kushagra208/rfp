// backend/services/ai.js
/**
 * Gemini-based AI service helper using Google Gen AI SDK.
 * Requires: npm install @google/genai
 *
 * Set GEMINI_API_KEY in env.
 */

const { GoogleGenAI } = require('@google/genai');

const ai = new GoogleGenAI({/* client reads GEMINI_API_KEY from env by default */});

/**
 * Helper to safely extract text from Gemini's generateContent result.
 */
function extractTextFromResponse(resp) {
  // The SDK surface may expose `.text` or nested candidates; handle both.
  if (!resp) return '';
  if (typeof resp.text === 'string' && resp.text.length) return resp.text;
  // fallback: candidates -> content -> parts -> text
  try {
    const cand = resp?.candidates?.[0]?.content?.parts?.[0]?.text;
    return cand || '';
  } catch (e) {
    return '';
  }
}

/**
 * Create RFP from natural language using Gemini.
 */
async function createRfpFromText(natural_text, titleFallback = '') {
  const prompt = `Convert the following procurement request into JSON with keys:
{
  "title": string,
  "items": [{"name": string, "quantity": integer, "specs": string}],
  "total_budget": number,
  "delivery_days": integer,
  "payment_terms": string,
  "warranty_months": integer,
  "notes": string
}
ONLY output valid JSON (no leading explanation). Input: ${natural_text}`;

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',           // choose model appropriate for your quota/need
      contents: prompt,
      // You can add temperature, maxOutputTokens, safety settings here if supported.
    });

    const raw = extractTextFromResponse(resp) || '{}';
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.title) parsed.title = titleFallback || 'Untitled RFP';
      return parsed;
    } catch (e) {
      // If model didn't return strict JSON, attempt to extract JSON substring
      const jsonMatch = raw.match(/\\{[\\s\\S]*\\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          if (!parsed.title) parsed.title = titleFallback || 'Untitled RFP';
          return parsed;
        } catch (_) {}
      }
      // final fallback: wrap text in notes
      return { title: titleFallback || 'Untitled RFP', notes: natural_text };
    }
  } catch (err) {
    console.error('Gemini createRfpFromText error:', err);
    return { title: titleFallback || 'Untitled RFP', notes: natural_text };
  }
}


// helpers for robust parsing & normalization
const DEFAULT_CURRENCY_CHARS = /[^0-9.\-]/g;

function parseNumber(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const s = value.trim();
    if (s.length === 0) return null;
    // remove commas and common currency symbols but keep dot/minus
    const cleaned = s.replace(/[,\s]+/g, '').replace(DEFAULT_CURRENCY_CHARS, '');
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function toPercentNumber(value) {
  const n = parseNumber(value);
  if (n === null) return null;
  const capped = Math.max(0, Math.min(100, Number(n)));
  return Math.round(capped * 100) / 100;
}

function tryExtractJson(text) {
  if (!text || typeof text !== 'string') return null;
  // try direct parse
  try {
    return JSON.parse(text);
  } catch (e) {
    // robust extraction: find a balanced JSON substring starting at the first '{' or '['
    const extractBalanced = (str) => {
      const startIdx = str.search(/[\{\[]/);
      if (startIdx === -1) return null;
      const openChar = str[startIdx];
      const closeChar = openChar === '{' ? '}' : ']';
      let depth = 0;
      let inString = false;
      let escape = false;
      for (let i = startIdx; i < str.length; i++) {
        const ch = str[i];
        if (escape) { escape = false; continue; }
        if (ch === '\\') { escape = true; continue; }
        if (ch === '"' || ch === "'") {
          inString = !inString;
          continue;
        }
        if (inString) continue;
        if (ch === openChar) depth++;
        else if (ch === closeChar) {
          depth--;
          if (depth === 0) {
            return str.slice(startIdx, i + 1);
          }
        }
      }
      return null;
    };

    let candidateRaw = extractBalanced(text);
    if (!candidateRaw) return null;

    const cleanup = (s) => {
      return s
        .replace(/[“”]/g, '"')
        .replace(/[‘’]/g, "'")
        .replace(/\r/g, '')
        // remove JS-style comments
        .replace(/\/\/.*(?=[\n\r])/g, '')
        .replace(/\/\*[\s\S]*?\*\//g, '')
        // remove trailing commas before } or ]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*\]/g, ']')
        // convert single-quoted keys/values to double quotes in simple cases
        .replace(/\'(?=(?:[^\\']*\\'[^\\']*\\')*[^\\']*$)/g, '"');
    };

    try { return JSON.parse(candidateRaw); } catch (e2) {
      const candidate = cleanup(candidateRaw);
      try { return JSON.parse(candidate); } catch (e3) { return null; }
    }
  }
}


function normalizeProposal(parsed) {
  if (!parsed || typeof parsed !== 'object') parsed = {};

  const out = {};
  out.vendor_name = (parsed.vendor_name || parsed.vendor || parsed.supplier || '').toString().trim() || null;

  const rawItems = Array.isArray(parsed.line_items)
    ? parsed.line_items
    : Array.isArray(parsed.items)
      ? parsed.items
      : (parsed.lines && Array.isArray(parsed.lines) ? parsed.lines : []);

  out.line_items = rawItems.map((it) => {
    const name = (it.name || it.item || it.description || '').toString().trim();
    const qty = parseNumber(it.qty ?? it.quantity ?? it.Qty ?? 0) ?? 0;
    const unit_price = parseNumber(it.unit_price ?? it.unitPrice ?? it.price ?? it.rate) ?? null;
    let total_price = parseNumber(it.total_price ?? it.total ?? it.extended) ?? null;
    if (total_price === null && unit_price !== null) total_price = unit_price * qty;
    const notes = (it.notes || it.specs || it.description || '').toString().trim();
    return { name, qty, unit_price, total_price, notes };
  });

  // total price: prefer provided, else sum line_items
  let total_price = parseNumber(parsed.total_price ?? parsed.total ?? parsed.price_total) ?? null;
  if (total_price === null) {
    const sum = out.line_items.reduce((s, li) => s + (parseNumber(li.total_price) || 0), 0);
    total_price = sum || null;
  }
  out.total_price = total_price;

  out.delivery_days = parseInt(parseNumber(parsed.delivery_days ?? parsed.delivery ?? parsed.lead_time) || 0) || null;
  out.warranty_months = parseInt(parseNumber(parsed.warranty_months ?? parsed.warranty ?? parsed.warranty_month) || 0) || null;
  out.payment_terms = (parsed.payment_terms || parsed.terms || parsed.payment || '').toString().trim() || null;

  // missing fields
  const missing = [];
  if (!out.vendor_name) missing.push('vendor_name');
  if (!out.line_items || out.line_items.length === 0) missing.push('line_items');
  if (!out.total_price) missing.push('total_price');
  if (!out.delivery_days) missing.push('delivery_days');
  if (!out.payment_terms) missing.push('payment_terms');

  out.missing_information = Array.isArray(parsed.missing_information) ? parsed.missing_information : (parsed.missing || missing);

  // attach raw input for debugging if present
  if (parsed.raw) out.raw = parsed.raw;

  return out;
}

/**
 * Robust parseProposal:
 * - If emailText is already an object (parsed JSON), normalize & return.
 * - If string, attempt to extract JSON directly.
 * - If extraction fails, call Gemini to extract structured JSON.
 * - Normalizes numeric fields and line items.
 */
async function parseProposal(emailTextOrObj, rfpId) {
  // If already an object, normalize
  if (emailTextOrObj && typeof emailTextOrObj === 'object' && !Array.isArray(emailTextOrObj)) {
    try {
      return normalizeProposal(emailTextOrObj);
    } catch (err) {
      console.error('normalizeProposal error on object input', err);
      return normalizeProposal({ raw: JSON.stringify(emailTextOrObj) });
    }
  }

  // If it's a string, try to parse JSON out of it first
  if (typeof emailTextOrObj === 'string') {
    const extracted = tryExtractJson(emailTextOrObj);
    if (extracted) {
      return normalizeProposal(extracted);
    }
  }

  // Fallback: call Gemini to extract JSON
  const prompt = `You are a parser. Given a vendor email reply, extract a JSON object with keys:
{
  "vendor_name": string,
  "line_items": [{"name":string,"qty":int,"unit_price":number,"total_price":number,"notes":string}],
  "total_price": number,
  "delivery_days": int,
  "warranty_months": int,
  "payment_terms": string,
  "missing_information": [string]
}
ONLY output valid JSON (no extra commentary). Email: ${typeof emailTextOrObj === 'string' ? emailTextOrObj : ''}`;

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const raw = extractTextFromResponse(resp) || '{}';
    // log raw for debugging (optional)
    console.log('Gemini raw parse output:', raw);

    // attempt strict parse, then substring parse, then lenient cleanup
    const parsedFromModel = tryExtractJson(raw);
    if (parsedFromModel) {
      return normalizeProposal(parsedFromModel);
    }

    // last attempt: if model returned something that parses directly
    try {
      const direct = JSON.parse(raw);
      return normalizeProposal(direct);
    } catch (e) {
      // fallback: return raw text wrapped
      return normalizeProposal({ raw: typeof emailTextOrObj === 'string' ? emailTextOrObj : raw });
    }
  } catch (err) {
    console.error('Gemini parseProposal error:', err);
    return normalizeProposal({ raw: typeof emailTextOrObj === 'string' ? emailTextOrObj : '' });
  }
}



/**
 * Compare proposals for an RFP and return an evaluation object.
 */
async function compareProposals(rfp, proposals) {
  const prompt = `You are an evaluator. Given this RFP: ${JSON.stringify(rfp.structured_json || rfp)}
and these proposals: ${JSON.stringify(proposals)}
For each proposal, compute:
- price_total (number),
- spec_match_score (0-100),
- delivery_risk ("low"/"medium"/"high"),
- overall_score (0-100).
Return JSON:
{
  "evaluations": [
    {"proposal_id": "...", "vendor_id": "...", "price_total": number, "spec_match_score": number, "delivery_risk": "...", "overall_score": number, "notes": "..."}
  ],
  "recommended_proposal_id": "...",
  "explanation": "short human-readable reason (1-3 sentences)"
}
ONLY output JSON.`;

  try {
    const resp = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

      const raw = extractTextFromResponse(resp) || '{}';

      // Clean up common wrappers (code fences) and escaped JSON
      let cleaned = raw.trim();
      // strip triple-backtick fences and leading language tokens (e.g. ```json)
      cleaned = cleaned.replace(/```\w*\n?/g, '').replace(/```$/g, '').trim();

      // If model returned a quoted JSON string, unquote once
      if ((cleaned.startsWith('"') && cleaned.endsWith('"')) || (cleaned.startsWith("'") && cleaned.endsWith("'"))) {
        try {
          cleaned = JSON.parse(cleaned);
        } catch (e) {
          // fallthrough
        }
      }

      // Unescape escaped newlines and quotes that sometimes appear in model output
      cleaned = cleaned.replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\'/g, "'");

      // Try robust extraction using helper
      let parsed = tryExtractJson(cleaned);
      if (!parsed) {
        // As a final attempt, extract the first {...} block and parse
        const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try { parsed = JSON.parse(jsonMatch[0]); } catch (_) { parsed = null; }
        }
      }

      if (!parsed) return { error: 'failed to parse AI output', raw };

      // Normalize evaluations: coerce numbers and trim strings
      if (parsed.evaluations && Array.isArray(parsed.evaluations)) {
        parsed.evaluations = parsed.evaluations.map((ev) => ({
          proposal_id: (ev.proposal_id || ev.id || null) && (ev.proposal_id || ev.id || null).toString(),
          vendor_id: (ev.vendor_id || ev.vendor || null) && (ev.vendor_id || ev.vendor || null).toString(),
          price_total: parseNumber(ev.price_total ?? ev.total_price ?? ev.price) ?? null,
          spec_match_score: toPercentNumber(ev.spec_match_score ?? ev.spec_match ?? ev.spec_score) ?? null,
          delivery_risk: (ev.delivery_risk || ev.delivery || '').toString().trim().toLowerCase() || null,
          overall_score: toPercentNumber(ev.overall_score ?? ev.score ?? ev.overall) ?? null,
          notes: (ev.notes || ev.comment || ev.comments || '').toString().trim() || null
        }));
      }

      // Ensure recommended_proposal_id and explanation are strings
      if (parsed.recommended_proposal_id) parsed.recommended_proposal_id = parsed.recommended_proposal_id.toString();
      if (parsed.explanation) parsed.explanation = parsed.explanation.toString().trim();

      return parsed;
  } catch (err) {
    console.error('Gemini compareProposals error:', err);
    return { error: 'comparison failed', details: String(err) };
  }
}

module.exports = { createRfpFromText, parseProposal, compareProposals };
