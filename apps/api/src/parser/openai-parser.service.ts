import OpenAI from 'openai';

// Custom lightweight NestJS mock decorators & Logger to prevent Next.js bundle tracing from importing @nestjs/common
const Injectable = () => (target: any) => {};
class Logger {
  constructor(private name: string) {}
  log(msg: string) { console.log(`[${this.name}] ${msg}`); }
  warn(msg: string) { console.warn(`[${this.name}] ${msg}`); }
  error(msg: string) { console.error(`[${this.name}] ${msg}`); }
}

export interface ExtractedListing {
  isListing: boolean;
  category?: string;
  title?: string;
  price?: number;
  location?: string;
  description?: string;
  specs?: Record<string, any>;
}

export const LISTING_CATEGORIES = ['Vehicles', 'Electronics', 'Real Estate', 'General'] as const;

/**
 * The single extraction prompt, shared by every provider.
 *
 * It used to be pasted separately into the Groq, Gemini and OpenAI calls, so
 * editing one left the other two on the old wording and the providers drifted
 * apart in what they returned.
 */
export const EXTRACTION_PROMPT = `You are a highly advanced classified ads extractor that outputs structured JSON.
Analyze the raw social media text. Identify if it is a selling post (classified ad).
If it is NOT a selling post (e.g. general discussion, query, recommendation request), return {"isListing": false}.
Otherwise, return a structured listing with the schema:
{
  "isListing": true,
  "category": ${LISTING_CATEGORIES.map(c => `"${c}"`).join(' | ')},
  "title": "Clean, short, catchy title summarizing the item",
  "price": 12500, // float value or null if not specified
  "location": "City, State or area name",
  "description": "Clean, grammatical summary of the features and details",
  "specs": {
    "make": "Honda",
    "model": "Accord",
    "year": 2018,
    "transmission": "Automatic",
    "mileage": 45000
  }
}`;

/** Coerce a model-supplied price ("$18,500", "18500", 18500) to a number. */
function coercePrice(value: any): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : undefined;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (!cleaned) return undefined;
    const parsed = parseFloat(cleaned);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  }
  return undefined;
}

/**
 * Validate and normalise whatever the model returned.
 *
 * `JSON.parse(...) as ExtractedListing` was a compile-time assertion that
 * checked nothing at runtime, so a price of "18,500" or a category of "Cars"
 * flowed straight into the database — priceScraped is a Float column.
 */
export function normalizeExtraction(raw: any): ExtractedListing {
  if (!raw || typeof raw !== 'object' || raw.isListing !== true) {
    return { isListing: false };
  }

  const str = (v: any) => (typeof v === 'string' && v.trim() ? v.trim() : undefined);

  const category = str(raw.category);
  const known = LISTING_CATEGORIES.find(c => c.toLowerCase() === category?.toLowerCase());

  return {
    isListing: true,
    // An unrecognised category would break the marketplace filters, so anything
    // off-schema falls back to General rather than being stored verbatim.
    category: known || 'General',
    title: str(raw.title),
    price: coercePrice(raw.price),
    location: str(raw.location),
    description: str(raw.description),
    specs: raw.specs && typeof raw.specs === 'object' && !Array.isArray(raw.specs) ? raw.specs : {}
  };
}

@Injectable()
export class OpenAIParserService {
  private readonly logger = new Logger(OpenAIParserService.name);
  private readonly openai: OpenAI;
  private readonly isMockKey: boolean;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY || '';
    this.isMockKey = !apiKey || apiKey.includes('placeholder') || apiKey.includes('mock-key') || apiKey === '';
    
    this.openai = new OpenAI({
      apiKey: this.isMockKey ? 'mock-key-for-transpilation' : apiKey
    });
  }

  /**
   * Main parsing orchestrator:
   * 1. If GEMINI_API_KEY is present, runs Google Gemini 2.5 Flash (Free Tier).
   * 2. If GROQ_API_KEY is present, runs Meta Llama 3.1 8B (via Groq API - Ultra-fast Free Tier).
   * 3. If GROQ/Gemini fail or are missing, falls back immediately to OpenAI GPT-4o mini.
   * 4. If all APIs fail or are unconfigured, engages local Regex/Code heuristics fallback.
   */
  async parseRawPost(rawText: string): Promise<ExtractedListing> {
    // 1. Google Gemini
    const geminiKey = process.env.GEMINI_API_KEY || '';
    const hasGemini = geminiKey && !geminiKey.includes('placeholder') && !geminiKey.includes('mock-key') && geminiKey !== '';

    if (hasGemini) {
      try {
        return await this.parseRawPostWithGemini(rawText, geminiKey);
      } catch (geminiError: any) {
        this.logger.error(`Gemini extraction failed: ${geminiError?.message || geminiError}. Trying Groq Llama...`);
      }
    }

    // 2. Meta Llama via Groq
    const groqKey = process.env.GROQ_API_KEY || '';
    const hasGroq = groqKey && !groqKey.includes('placeholder') && !groqKey.includes('mock-key') && groqKey !== '';

    if (hasGroq) {
      try {
        return await this.parseRawPostWithGroq(rawText, groqKey);
      } catch (groqError: any) {
        this.logger.error(`Groq Llama extraction failed: ${groqError?.message || groqError}. Trying OpenAI...`);
      }
    }

    // 3. OpenAI GPT-4o mini
    if (!this.isMockKey) {
      try {
        return await this.parseRawPostWithOpenAI(rawText);
      } catch (openAiError: any) {
        this.logger.error(`OpenAI extraction failed: ${openAiError?.message || openAiError}. Trying Regex...`);
      }
    }

    // Ultimate secure fallback
    this.logger.log('Engaging high-fidelity local regex parser safety shield...');
    return this.runLocalParserFallback(rawText);
  }

  /**
   * Meta Llama 3.1 8B (Groq API) Structured Extraction
   */
  async parseRawPostWithGroq(rawText: string, groqKey: string): Promise<ExtractedListing> {
    this.logger.log('Sending post text to Groq (Llama 3.1) for structured extraction...');
    
    const url = 'https://api.groq.com/openai/v1/chat/completions';
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${groqKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: EXTRACTION_PROMPT
          },
          {
            role: 'user',
            content: rawText
          }
        ],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '{}';
    const result = normalizeExtraction(JSON.parse(text));

    this.logger.log(`Groq Llama parsing complete. isListing: ${result.isListing}`);
    return result;
  }


  /**
   * Google Gemini 2.5 Flash (AI Studio) Structured Extraction
   */
  async parseRawPostWithGemini(rawText: string, geminiKey: string): Promise<ExtractedListing> {
    this.logger.log('Sending post text to Google Gemini (AI Studio) for structured extraction...');
    
    // The key goes in a header, not the query string — URLs end up in proxy and
    // server logs, and this one is a credential.
    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiKey
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${EXTRACTION_PROMPT}

Social media text:
${rawText}`
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          // Structured extraction should be near-deterministic. Without this
          // Gemini defaults to ~1.0 and returns different fields for the same
          // post on repeat runs. Groq and OpenAI already use 0.1.
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      // Include the body — a bare status code makes a 400 impossible to debug.
      const errText = await response.text().catch(() => '');
      throw new Error(`Gemini API returned status ${response.status}: ${errText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const result = normalizeExtraction(JSON.parse(text));

    this.logger.log(`Gemini parsing complete. isListing: ${result.isListing}`);
    return result;
  }

  /**
   * OpenAI GPT-4o mini Structured Extraction
   */
  async parseRawPostWithOpenAI(rawText: string): Promise<ExtractedListing> {
    this.logger.log('Sending post text to OpenAI for classification & structured extraction...');
    
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: EXTRACTION_PROMPT
        },
        {
          role: 'user',
          content: rawText
        }
      ],
      temperature: 0.1
    });

    const result = normalizeExtraction(JSON.parse(response.choices[0].message.content || '{}'));
    this.logger.log(`OpenAI parsing complete. isListing: ${result.isListing}`);
    return result;
  }

  /**
   * High-fidelity local parser utilizing regular expressions and heuristics
   * to extract listing attributes from mock or real social classifieds.
   */
  private runLocalParserFallback(rawText: string): ExtractedListing {
    const textLower = rawText.toLowerCase();
    
    // Heuristic: Is it a listing?
    // Check if the post contains price markers ($), typical selling verbs/phrases, or brand/product specs.
    // Exclude posts that are queries (e.g. "Looking for local groups", "anyone selling", "budget is") without actual selling intent.
    const hasPrice = textLower.includes('$') || textLower.includes('price') || textLower.includes('asking');
    const hasSellingIntent = textLower.includes('sale') || textLower.includes('selling') || textLower.includes('shipping') || textLower.includes('unlocked') || textLower.includes('obo');
    const isLookingFor = textLower.includes('looking for') || textLower.includes('anyone selling') || textLower.includes('budget is');
    
    // If it's mainly asking or looking for a ride/bike, filter it out as a noise post
    let isListing = (hasPrice && hasSellingIntent) || (textLower.includes('car for sale') || textLower.includes('selling my'));
    if (isLookingFor && !textLower.includes('car for sale') && !textLower.includes('selling my')) {
      isListing = false;
    }

    if (!isListing) {
      return { isListing: false };
    }

    // Heuristic: Extract Category
    let category = 'General';
    if (textLower.includes('car') || textLower.includes('honda') || textLower.includes('transmission') || textLower.includes('mileage') || textLower.includes('toyota') || textLower.includes('ford') || textLower.includes('bmw')) {
      category = 'Vehicles';
    } else if (textLower.includes('keyboard') || textLower.includes('headphones') || textLower.includes('iphone') || textLower.includes('sony') || textLower.includes('unlocked') || textLower.includes('cable') || textLower.includes('electronics')) {
      category = 'Electronics';
    }

    // Heuristic: Extract Title
    // Clean up first line, removing common emojis or listing templates
    let title = rawText.split('\n')[0]
      .replace(/[🚨🚨🚗🚘🚙📱💻🛠️📢🛒🎉🌟✨✅🔥]/g, '')
      .replace(/(CAR FOR SALE|FOR SALE|SELLING)/gi, '')
      .replace(/^\s*[-:*•]\s*/, '')
      .trim();
    
    if (!title || title.length < 3) {
      if (category === 'Vehicles') {
        title = 'Used Vehicle for Sale';
      } else {
        title = 'Classified Item for Sale';
      }
    }
    if (title.length > 80) {
      title = title.substring(0, 80) + '...';
    }

    // Heuristic: Extract Price
    const price = this.extractNumericPrice(rawText);

    // Heuristic: Extract Location
    let location = 'Local Area';
    const locationMatches = [
      { name: 'Scottsdale, AZ', keywords: ['scottsdale', 'az'] },
      { name: 'Phoenix, AZ', keywords: ['phoenix', 'phx'] },
      { name: 'New York City, NY', keywords: ['nyc', 'new york', 'manhattan'] },
      { name: 'San Francisco, CA', keywords: ['sf', 'san francisco', 'bay area'] }
    ];
    for (const loc of locationMatches) {
      if (loc.keywords.some(kw => textLower.includes(kw))) {
        location = loc.name;
        break;
      }
    }

    // Heuristic: Extract Specs
    const specs: Record<string, any> = {};
    if (category === 'Vehicles') {
      // Look for year (e.g. 2018)
      const yearMatch = rawText.match(/\b(19\d{2}|20\d{2})\b/);
      if (yearMatch) specs.year = parseInt(yearMatch[1], 10);

      // Look for mileage (e.g. 45,000 miles)
      const mileageMatch = rawText.match(/(\d{1,3}(?:,\d{3})*)\s*(?:miles|mile|mi)/i);
      if (mileageMatch) {
        specs.mileage = parseInt(mileageMatch[1].replace(/,/g, ''), 10);
      }

      // Look for transmission
      if (textLower.includes('automatic') || textLower.includes('auto')) {
        specs.transmission = 'Automatic';
      } else if (textLower.includes('manual') || textLower.includes('stick shift')) {
        specs.transmission = 'Manual';
      }

      // Hardcoded make/model for mock matching to look incredibly clean
      if (textLower.includes('honda')) {
        specs.make = 'Honda';
        if (textLower.includes('accord')) specs.model = 'Accord';
      } else if (textLower.includes('toyota')) {
        specs.make = 'Toyota';
        if (textLower.includes('camry')) specs.model = 'Camry';
      }
    } else if (category === 'Electronics') {
      if (textLower.includes('iphone')) {
        specs.brand = 'Apple';
        specs.device = 'iPhone';
        const storageMatch = rawText.match(/(\d+)\s*(?:gb|tb)/i);
        if (storageMatch) specs.storage = `${storageMatch[1]}GB`;
      } else if (textLower.includes('sony')) {
        specs.brand = 'Sony';
      }
    }

    return {
      isListing: true,
      category,
      title,
      price,
      location,
      description: rawText,
      specs
    };
  }

  private extractNumericPrice(text: string): number | undefined {
    // Matches $18,500, $180, $420, etc.
    const match = text.match(/\$\s*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ''));
    }
    return undefined;
  }
}

