export default function TermsOfUse() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Terms of Use</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 28, 2026</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          ToolHub MY provides calculators and educational guides for informational purposes only. Results may not
          reflect legal, tax, or religious rulings for your specific case.
        </p>
        <p>
          You are responsible for verifying outcomes and seeking qualified professional advice where required.
        </p>
        <p>
          We may update or discontinue tools at any time without notice. Continued use of this website means you
          accept these terms.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          For terms-related questions, visit{" "}
          <a href="https://amammustofa.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            amammustofa.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
