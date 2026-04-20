import EligibilityForm from './components/EligibilityForm';

export default function HomePage() {
  return (
    <main className="page">
      <section className="hero">
        <span className="badge">Vercel-ready • Gemini-powered • Receipt-aware</span>
        <h1>Is This Eligible?</h1>
        <p>
          A working starter app for reviewing receipts, product pages, and purchase descriptions against your bike
          benefit policy. It is built as a real Next.js application, so Vercel can deploy it normally.
        </p>
      </section>
      <EligibilityForm />
    </main>
  );
}
