import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { api } from '../services/api.js';

export default function AssistantPage() {
  const [question, setQuestion] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function ask(event) {
    event.preventDefault();

    setError('');
    setResult(null);
    setLoading(true);

    try {
      const response = await api.askAssistant(question);
      setResult(response);
    } catch (caught) {
      setError(caught.message || 'Unable to retrieve recommendations.');
    } finally {
      setLoading(false);
    }
  }

  function getModeMessage(mode) {
    switch (mode) {
      case 'gemini':
        return 'AI-assisted recommendations based on the verified ShopSmart catalog.';

      case 'fallback':
        return 'The AI provider is currently unavailable. Showing recommendations using ShopSmart catalog rules.';

      case 'no-match':
        return 'No matching products were found in the current catalog.';

      default:
        return 'Recommendations are based on ShopSmart product information.';
    }
  }

  return (
    <section className="assistant-layout">

      {/* QUESTION SECTION */}
      <div>
        <p className="eyebrow">SHOPSMART AI ASSISTANT</p>

        <h1>Find a product</h1>

        <p>
          Ask ShopSmart for product recommendations based on
          available products, prices, and stock information.
        </p>

        <form onSubmit={ask}>
          <label>
            Your question

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              minLength="3"
              maxLength="300"
              placeholder="Which keyboard is below ₱2,000?"
              disabled={loading}
              required
            />
          </label>

          <button type="submit" disabled={loading}>
            {loading ? 'Finding products...' : 'Ask ShopSmart'}
          </button>
        </form>
      </div>

      {/* ANSWER SECTION */}
      <div className="assistant-answer">

        <h2>Assistant response</h2>

        <StatusMessage type="error">{error}</StatusMessage>

        {loading && (
          <p role="status">
            Searching the ShopSmart catalog. Please wait...
          </p>
        )}

        {!result && !error && !loading && (
          <p>Your product recommendations will appear here.</p>
        )}

        {result && (
          <>
            {/* RESPONSE STATUS */}
            <p className={`assistant-mode mode-${result.mode || 'default'}`}>
              {getModeMessage(result.mode)}
            </p>

            {/* ASSISTANT ANSWER */}
            <p>{result.answer}</p>

            {/* RECOMMENDED PRODUCTS */}
            {result.recommendedProducts?.length > 0 && (
              <div className="recommendations">

                <h3>Recommended products</h3>

                {result.recommendedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="assistant-product"
                  >
                    <h4>{product.name}</h4>

                    <p>
                      <strong>Price:</strong>{' '}
                      ₱{Number(product.price).toLocaleString('en-PH')}
                    </p>

                    <p>
                      <strong>Category:</strong> {product.category}
                    </p>

                    <p>
                      <strong>Availability:</strong>{' '}
                      {typeof product.stock === 'number'
                        ? `${product.stock} in stock`
                        : 'Check product details'}
                    </p>

                    <Link to={`/products/${product.id}`}>
                      View Product
                    </Link>
                  </div>
                ))}

              </div>
            )}

            {/* PRODUCT SOURCES */}
            {result.sources?.length > 0 && (
              <div className="assistant-sources">
                <h3>Product sources</h3>

                <p>
                  These recommendations reference the current
                  ShopSmart product catalog.
                </p>

                {result.sources.map((source) => (
                  <p key={`${source.type}-${source.id}`}>
                    <strong>Source:</strong>{' '}
                    <Link to={`/products/${source.id}`}>
                      {source.name}
                    </Link>
                  </p>
                ))}
              </div>
            )}

          </>
        )}

      </div>
    </section>
  );
}