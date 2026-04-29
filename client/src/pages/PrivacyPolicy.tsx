export default function PrivacyPolicy() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground">Last updated: April 28, 2026</p>
      </header>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <p>
          ToolHub MY respects your privacy. Most calculator inputs are processed in your browser and are not sent
          to our servers.
        </p>
        <p>
          We may use analytics and advertising partners (including Google AdSense) that use cookies or similar
          technologies to measure usage and serve relevant ads.
        </p>
        <p>
          You can control cookies in your browser settings. By using this site, you consent to data practices
          described in this policy.
        </p>
      </section>

      <section className="space-y-3 text-sm leading-relaxed text-muted-foreground">
        <h2 className="text-lg font-semibold text-foreground">Contact</h2>
        <p>
          For privacy questions, contact{" "}
          <a href="https://hellokalku.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
            hellokalku.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
