import { GoogleGenAI } from '@google/genai';

export async function getGeminiRecommendation(question, products) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('Gemini API key is not configured.');
  }

  if (products.length === 0) {
    return [];
  }

  const ai = new GoogleGenAI({ apiKey });

  const catalog = products.map((product) => ({
    id: String(product.id),
    name: product.name,
    category: product.category,
    description: product.description,
    price: Number(product.price),
    stock: product.stock
  }));

  const prompt = `
You are ShopSmart's product recommendation assistant.

Customer question:
${question}

Available products:
${JSON.stringify(catalog)}

Instructions:
1. Recommend only relevant products from the supplied catalog.
2. Never invent product IDs.
3. Respect the customer's budget.
4. Do not recommend unavailable products.
5. Select a maximum of three products.
6. Return only a JSON object containing productIds.
7. If no product is suitable, return an empty productIds array.

Example:
{
  "productIds": ["existing-product-id"]
}
`;

const result = await ai.models.generateContent({
  model: process.env.GEMINI_MODEL || 'gemini-3.5-flash',
  contents: prompt,
  config: {
    responseMimeType: 'application/json',
    maxOutputTokens: 500,
    httpOptions: {
      timeout: 20000
    }
  }
});

  if (!result.text) {
    throw new Error('Gemini returned an empty response.');
  }

  const parsed = JSON.parse(result.text);

  if (
    !parsed ||
    !Array.isArray(parsed.productIds) ||
    parsed.productIds.length > 3 ||
    parsed.productIds.some((id) => typeof id !== 'string')
  ) {
    throw new Error('Invalid Gemini response.');
  }

  const allowedProducts = new Map(
    products.map((product) => [
      String(product.id),
      product
    ])
  );

  const selectedIds = parsed.productIds;

  if (
    new Set(selectedIds).size !== selectedIds.length ||
    selectedIds.some((id) => !allowedProducts.has(id))
  ) {
    throw new Error('Gemini returned an unknown product ID.');
  }

  return selectedIds.map((id) => allowedProducts.get(id));
}