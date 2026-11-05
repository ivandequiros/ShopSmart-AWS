import { Router } from 'express';
import rateLimit from 'express-rate-limit';

import { prisma } from '../lib/prisma.js';

import {
  buildAssistantResponse,
  rankProducts
} from '../services/assistant.js';

import {
  getGeminiRecommendation
} from '../services/gemini.js';

import {
  assistantQuestionSchema
} from '../validators/schemas.js';

const router = Router();

const assistantLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: 'draft-8',
  legacyHeaders: false
});

router.post(
  '/questions',
  assistantLimiter,
  async (request, response, next) => {
    try {
      // Step 1: Validate the customer's question.
      const parsed = assistantQuestionSchema.safeParse(request.body);

      if (!parsed.success) {
        return response.status(422).json({
          error: {
            code: 'INVALID_QUESTION',
            message:
              'Question must contain between 3 and 300 characters.'
          }
        });
      }

      const question = parsed.data.question;

      // Step 2: Retrieve active, in-stock products.
      const products = await prisma.product.findMany({
        where: {
          active: true,
          stock: {
            gt: 0
          }
        },
        orderBy: {
          price: 'asc'
        }
      });

      // Step 3: Select relevant products.
      const candidates = rankProducts(products, question).slice(0, 5);

      // Step 4: Prepare the rule-based fallback.
      const fallback = buildAssistantResponse(candidates, question);

      // Step 5: Handle questions without matching products.
      if (candidates.length === 0) {
        return response.json({
          ...fallback,
          mode: 'no-match'
        });
      }

      // Step 6: Call Gemini.
      try {
        const selectedProducts = await getGeminiRecommendation(
          question,
          candidates
        );

        // Gemini may decide none of the candidates is suitable.
        if (selectedProducts.length === 0) {
          return response.json({
            answer: 'I could not find an in-stock product matching that request.',
            recommendedProducts: [],
            sources: [],
            mode: 'gemini'
          });
        }

        // Step 7: Build a response from verified product data.
        const verifiedResponse = buildAssistantResponse(
          selectedProducts,
          question
        );

        return response.json({
          ...verifiedResponse,

          answer:
            `Based on the current ShopSmart catalog, ` +
            `I recommend: ${selectedProducts
              .map((product) => product.name)
              .join(', ')}. ` +
            `The listed prices and availability are based ` +
            `on ShopSmart's verified product records.`,

          mode: 'gemini'
        });

} catch (error) {
  const status = error.status ?? error.code ?? 'UNKNOWN';

  console.warn('Gemini fallback triggered:', {
    errorType: error.name,
    status
  });

  return response.json({
    ...fallback,
    mode: 'fallback'
  });
}

    } catch (error) {
      next(error);
    }
  }
);

export default router;