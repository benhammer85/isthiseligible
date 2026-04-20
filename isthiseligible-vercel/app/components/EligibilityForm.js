'use client';

import { useMemo, useState } from 'react';

const initialResult = {
  decision: 'review',
  confidence: 0,
  summary: 'Submit a receipt, product URL, or purchase description to get an eligibility decision.',
  reasons: [],
  missingInformation: [],
  extractedFacts: {},
  rawModelText: '',
};

export default function EligibilityForm() {
  const [productUrl, setProductUrl] = useState('');
  const [receiptText, setReceiptText] = useState('');
  const [policyText, setPolicyText] = useState(defaultPolicy);
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(initialResult);

  const statusClass = useMemo(() => {
    if (!result?.decision) return 'idle';
    if (result.decision === 'eligible') return 'eligible';
    if (result.decision === 'ineligible') return 'ineligible';
    return 'review';
  }, [result]);

  async function handleSubmit(event) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('productUrl', productUrl);
      formData.append('receiptText', receiptText);
      formData.append('policyText', policyText);
      formData.append('notes', notes);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/check', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Request failed.');
      }
      setResult(data);
    } catch (submitError) {
      setError(submitError.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setProductUrl('');
    setReceiptText('');
    setNotes('');
    setFile(null);
    setError('');
    setResult(initialResult);
    const input = document.getElementById('receipt-file-input');
    if (input) input.value = '';
  }

  return (
    <div className="grid">
      <section className="card">
        <h2>Check a purchase</h2>
        <p>
          Add the receipt text, a product URL, an optional image or PDF, and the policy rules you want enforced.
        </p>
        <form className="form" onSubmit={handleSubmit}>
          <label className="label">
            Product URL
            <span className="hint">Optional. Helps when the receipt description is vague.</span>
            <input
              type="url"
              value={productUrl}
              onChange={(event) => setProductUrl(event.target.value)}
              placeholder="https://example.com/bike-lock"
            />
          </label>

          <label className="label">
            Receipt text or purchase description
            <span className="hint">Paste what was bought, price, vendor, and any receipt notes.</span>
            <textarea
              value={receiptText}
              onChange={(event) => setReceiptText(event.target.value)}
              placeholder="Example: Trek FX 3 Disc bike, purchased at Wheel Works for $849 on 2026-03-18."
            />
          </label>

          <label className="label">
            Receipt image or PDF
            <span className="hint">Optional. JPG, PNG, WEBP, or PDF. Keep uploads under 20 MB.</span>
            <input
              id="receipt-file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
            />
          </label>

          <label className="label">
            Eligibility policy
            <span className="hint">Edit these rules to match your benefit policy.</span>
            <textarea value={policyText} onChange={(event) => setPolicyText(event.target.value)} />
          </label>

          <label className="label">
            Extra notes
            <span className="hint">Optional context, such as employee role, program year, or exception notes.</span>
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Example: Annual bike commuter benefit, max reimbursement $1,000."
            />
          </label>

          <div className="actions">
            <button className="primary" type="submit" disabled={loading}>
              {loading ? 'Checking...' : 'Check eligibility'}
            </button>
            <button className="secondary" type="button" onClick={resetForm} disabled={loading}>
              Reset
            </button>
          </div>
        </form>
      </section>

      <aside className="card">
        <div className="resultHeader">
          <div>
            <h2>Decision</h2>
            <p>Structured output from Gemini.</p>
          </div>
          <span className={`pill ${statusClass}`}>
            {result.decision ? result.decision.toUpperCase() : 'REVIEW'}
          </span>
        </div>

        {error ? (
          <p style={{ color: '#d93025', fontWeight: 700 }}>{error}</p>
        ) : (
          <>
            <div className="metric">
              <span className="hint">Summary</span>
              <strong>{result.summary}</strong>
            </div>

            <div className="metric">
              <span className="hint">Confidence</span>
              <strong>{Math.round((result.confidence || 0) * 100)}%</strong>
            </div>

            <h3>Reasons</h3>
            {result.reasons?.length ? (
              <ul className="list">
                {result.reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            ) : (
              <p className="hint">No reasons yet.</p>
            )}

            <h3>Missing information</h3>
            {result.missingInformation?.length ? (
              <ul className="list">
                {result.missingInformation.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : (
              <p className="hint">Nothing critical missing.</p>
            )}

            <div className="kv">
              <div>Item</div>
              <div>{result.extractedFacts?.itemName || '—'}</div>
              <div>Vendor</div>
              <div>{result.extractedFacts?.vendor || '—'}</div>
              <div>Price</div>
              <div>{result.extractedFacts?.price || '—'}</div>
              <div>Date</div>
              <div>{result.extractedFacts?.purchaseDate || '—'}</div>
              <div>Category</div>
              <div>{result.extractedFacts?.category || '—'}</div>
            </div>

            <details>
              <summary>Raw model output</summary>
              <pre className="code">{result.rawModelText || 'No raw text available.'}</pre>
            </details>

            <p className="footerNote">
              This starter biases toward caution. It returns <strong>review</strong> when evidence is incomplete.
            </p>
          </>
        )}
      </aside>
    </div>
  );
}

const defaultPolicy = `You are evaluating whether a purchase is eligible for reimbursement under a bike commuter benefit.

Core rules:
- Eligible: bicycles, helmets, bike lights, locks, fenders, repair services, tune-ups, safety gear, and transit-to-bike accessories.
- Ineligible: non-bike items, apparel unrelated to commuting, food, memberships, gift cards, warranties unless policy explicitly allows them, and anything primarily for recreation rather than commuting.
- If the evidence is incomplete or ambiguous, return decision = review.
- Never invent receipt details.
- Explain the exact rule behind the decision.
- Extract the key purchase facts when available.
- Confidence must be a number from 0 to 1.`;
