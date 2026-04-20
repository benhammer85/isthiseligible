import { GoogleGenAI, Type } from "@google/genai";
import { SYSTEM_PROMPT, AUTO_ELIGIBLE_KEYWORDS } from "../constants";
import { AnalysisResult, EligibilityStatus, GroundingSource } from "../types";

const textCache = new Map<string, AnalysisResult>();

const normalizeKey = (str: string) => str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');

const checkHeuristics = (input: string): AnalysisResult | null => {
  const normalized = normalizeKey(input);
  const isPrivateParty = normalized.includes('craigslist') || normalized.includes('facebookmarketplace') || normalized.includes('privateparty') || normalized.includes('marketplace') || normalized.includes('fromafriend') || normalized.includes('fromaperson') || normalized.includes('used');
  
  const containsPartKeyword = normalized.includes('part') || 
                               normalized.includes('accessory') || 
                               normalized.includes('gear') || 
                               normalized.includes('lock') || 
                               normalized.includes('helmet') || 
                               normalized.includes('light') ||
                               normalized.includes('tire') ||
                               normalized.includes('tube') ||
                               normalized.includes('wheel') ||
                               normalized.includes('chain') ||
                               normalized.includes('brake') ||
                               normalized.includes('saddle') ||
                               normalized.includes('seat');

  const isFullVehicle = (normalized.includes('bicycle') || normalized.includes('bike') || normalized.includes('frame')) && !containsPartKeyword;

  if (isPrivateParty) {
    if (isFullVehicle) {
      return {
        status: EligibilityStatus.ELIGIBLE,
        itemName: "Used Bicycle/Frame",
        reasoning: "Used bicycles and bike frames are eligible for reimbursement even when purchased from private parties (like Craigslist or Marketplace).",
        recommendations: ["Ensure you have a record of the transaction or a receipt from the seller.", "Submit your claim via the Jawnt portal."],
        isReceiptDetected: false,
        estimatedCost: ""
      };
    } else if (containsPartKeyword) {
      return {
        status: EligibilityStatus.INELIGIBLE,
        itemName: "Private Party Gear/Parts",
        reasoning: "The Harvard Bike Benefit only allows Bicycles and Frames to be purchased from private parties. All other gear, parts, accessories, or apparel must be purchased from a commercial retailer to be eligible.",
        recommendations: ["Purchase gear from a commercial bike shop next time.", "Check full guidelines: https://transportation.harvard.edu/sustainable-transportation/bike-walk/bike-commuter-benefit"],
        isReceiptDetected: false,
        estimatedCost: ""
      };
    }
  }
  
  const forbidden = [
    {
      keys: ['flashlight', 'headlamp'],
      reason: "General-purpose flashlights and headlamps are not eligible. The benefit only covers rechargeable bike lights or lights specifically designed for cycling safety."
    },
    {
      keys: ['motorcycle', 'motorbike', 'moto'],
      reason: "Motorcycle gear is explicitly excluded. The benefit is for non-motorized bicycle commuting."
    },
    { 
      keys: ['citibike', 'citi'], 
      reason: "Citi Bike is not eligible. Only local Boston-area bike share services like Bluebikes and CargoB are covered." 
    },
    {
      keys: ['carrack', 'roofrack', 'trunkrack', 'hitchrack', 'vehiclerack'],
      reason: "Car-mounted bike racks are considered vehicle accessories rather than cycling equipment and are not eligible."
    }
  ];

  for (const rule of forbidden) {
    if (rule.keys.some(k => normalized.includes(k))) {
      return {
        status: EligibilityStatus.INELIGIBLE,
        itemName: "Non-Eligible Item",
        reasoning: rule.reason,
        recommendations: ["Review the Sustainable Transportation page for eligible equipment."],
        isReceiptDetected: false,
        estimatedCost: ""
      };
    }
  }

  for (const keyword of AUTO_ELIGIBLE_KEYWORDS) {
    if (normalized.includes(normalizeKey(keyword))) {
      return {
        status: EligibilityStatus.ELIGIBLE,
        itemName: keyword.charAt(0).toUpperCase() + keyword.slice(1),
        reasoning: `"${keyword}" is a standard piece of cycling equipment explicitly covered under the Harvard Bike Commuter Benefit.`,
        recommendations: ["Save your itemized receipt", "Log into the Jawnt portal to submit your claim"],
        isReceiptDetected: false,
        estimatedCost: ""
      };
    }
  }
  return null;
};

const withRetry = async <T>(fn: () => Promise<T>, retries = 3, delay = 2000): Promise<T> => {
  try {
    return await fn();
  } catch (error: any) {
    const isRateLimit = error.message?.includes('429') || error.status === 429 || error.message?.includes('RESOURCE_EXHAUSTED');
    if (retries > 0 && isRateLimit) {
      await new Promise(resolve => setTimeout(resolve, delay));
      return withRetry(fn, retries - 1, delay * 2);
    }
    throw error;
  }
};

export const analyzeBikePurchase = async (
  input: string | { data: string; mimeType: string }
): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API Key missing.");

  if (typeof input === 'string') {
    const key = normalizeKey(input);
    if (textCache.has(key)) return textCache.get(key)!;
    const hResult = checkHeuristics(input);
    if (hResult) {
      textCache.set(key, hResult);
      return hResult;
    }
  }

  const performAnalysis = async () => {
    const ai = new GoogleGenAI({ apiKey });
    const isImage = typeof input !== 'string';
    const urlRegex = /(https?:\/\/[^\s]+|www\.[^\s]+|[a-z0-9]+\.[a-z]{2,})/i;
    const needsSearch = !isImage && urlRegex.test(input);

    const contents = isImage ? 
      [{ inlineData: input }, { text: "Evaluate this receipt/image. PRIVATE PARTY RULES: ONLY full bicycles or bike frames are eligible from individuals. Gear, parts, locks, etc. from individuals MUST be INELIGIBLE." }] : 
      [{ text: `Evaluate: ${input}. STRICT: If gear/parts are from Marketplace/Craigslist/individual, return INELIGIBLE status.` }];

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: { parts: contents },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        tools: needsSearch ? [{ googleSearch: {} }] : undefined,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            status: { type: Type.STRING },
            itemName: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            recommendations: { type: Type.ARRAY, items: { type: Type.STRING } },
            isReceiptDetected: { type: Type.BOOLEAN },
            estimatedCost: { type: Type.STRING },
            followUpQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["status", "reasoning", "recommendations", "isReceiptDetected"]
        }
      },
    });

    let rawText = response.text || "";
    rawText = rawText.replace(/```json\n?/, '').replace(/\n?```/, '').trim();
    const result = JSON.parse(rawText) as AnalysisResult;

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (groundingChunks) {
      const sources: GroundingSource[] = [];
      groundingChunks.forEach((c: any) => { if (c.web?.uri) sources.push({ uri: c.web.uri, title: c.web.title || "Reference" }); });
      if (sources.length > 0) result.groundingUrls = sources;
    }
    return result;
  };

  try {
    const result = await withRetry(performAnalysis);
    if (typeof input === 'string') textCache.set(normalizeKey(input), result);
    return result;
  } catch (error: any) {
    if (error.message?.includes('429') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      throw new Error("The AI service is currently at capacity. Please wait a moment.");
    }
    throw new Error(error.message || "Analysis failed.");
  }
};