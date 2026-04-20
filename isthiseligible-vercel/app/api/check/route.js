import { GoogleGenAI, Type } from '@google/genai';

export const runtime = 'nodejs';

const model = process.env.GEMINI_MODEL || 'gemini-3-flash-preview';

export async function POST(request) {
  if (!process.env.GEMINI_API_KEY) {
    return Response.json(
      { error: 'Missing GEMINI_API_KEY. Add it in Vercel Project Settings > Environment Variables.' },
      { status: 500 },
    );
  }

  try {
    const formData = await request.formData();
    const productUrl = normalizeString(formData.get('productUrl'));
    const receiptText = normalizeString(formData.get('receiptText'));
    const policyText = normalizeString(formData.get('policyText'));
    const notes = normalizeString(formData.get('notes'));
    const file = formData.get('file');

    if (!productUrl && !receiptText && !notes && !(file && typeof file.arrayBuffer === 'function')) {
      return Response.json({ error: 'Provide at least one input: text, URL, notes, or a file.' }, { status: 400 });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    const contents = [
      buildPrompt({ productUrl, receiptText, policyText, notes }),
    ];

    if (file && typeof file.arrayBuffer === 'function' && file.size > 0) {
      if (file.size > 20 * 1024 * 1024) {
        return Response.json({ error: 'File is too large. Keep uploads under 20 MB.' }, { status: 400 });
      }
      const bytes = Buffer.from(await file.arrayBuffer());
      contents.push({
        inlineData: {
          mimeType: file.type || 'application/octet-stream',
          data: bytes.toString('base64'),
        },
      });
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            decision: { type: Type.STRING, enum: ['eligible', 'ineligible', 'review'] },
            confidence: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            reasons: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingInformation: { type: Type.ARRAY, items: { type: Type.STRING } },
            extractedFacts: {
              type: Type.OBJECT,
              properties: {
                itemName: { type: Type.STRING },
                vendor: { type: Type.STRING },
                price: { type: Type.STRING },
                purchaseDate: { type: Type.STRING },
                category: { type: Type.STRING },
              },
            },
          },
          required: ['decision', 'confidence', 'summary', 'reasons', 'missingInformation', 'extractedFacts'],
        },
      },
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    return Response.json({
      decision: parsed.decision || 'review',
      confidence: clampConfidence(parsed.confidence),
      summary: parsed.summary || 'No summary returned.',
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons : [],
      missingInformation: Array.isArray(parsed.missingInformation) ? parsed.missingInformation : [],
      extractedFacts: parsed.extractedFacts || {},
      rawModelText: rawText,
    });
  } catch (error) {
    return Response.json(
      {
        error: 'Eligibility check failed.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

function normalizeString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function clampConfidence(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function buildPrompt({ productUrl, receiptText, policyText, notes }) {
  return `Return only JSON that matches the schema. Evaluate the purchase conservatively. If any critical fact is missing or contradictory, use decision=review.

POLICY RULES:
${policyText || 'No policy rules were provided.'}

PURCHASE DESCRIPTION:
${receiptText || 'None provided.'}

PRODUCT URL:
${productUrl || 'None provided.'}

EXTRA NOTES:
${notes || 'None provided.'}

Tasks:
1. Decide whether the purchase is eligible, ineligible, or requires human review.
2. Give a concise summary.
3. Provide rule-based reasons.
4. List missing information that blocks a confident approval or denial.
5. Extract item name, vendor, price, purchase date, and category when present.
6. Never fabricate facts not present in the text, URL content, or uploaded file.`;
}
