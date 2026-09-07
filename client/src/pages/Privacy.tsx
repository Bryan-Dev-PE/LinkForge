export function Privacy() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-16 sm:px-6">
      <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Privacy</h1>
      <p className="mt-4 text-slate-600">Last updated: September 2026</p>
      <div className="mt-8 space-y-8 leading-relaxed text-slate-700">
        <section>
          <h2 className="text-xl font-bold text-slate-900">What we store</h2>
          <p className="mt-2">
            LinkForge stores the accounts you create (name and email), the links you shorten, your
            QR code settings, and aggregated click analytics. No full IP addresses are ever stored.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">How analytics work</h2>
          <p className="mt-2">
            When a short link is visited, we capture a one-way cryptographic hash of the visitor's IP
            address (salted with a server secret), the raw user-agent string is classified into
            device/browser/OS categories, the referrer is reduced to its domain, and country,
            region, and city are approximated from the IP using a local GeoIP database. Raw IPs and
            full user-agent strings are discarded.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">Cookies</h2>
          <p className="mt-2">
            We use a single authentication cookie (JWT) to keep you signed in. Guest shortening does
            not set any persistent tracking cookies.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-slate-900">Open source</h2>
          <p className="mt-2">
            The entire codebase is open and public. You can audit how your data is handled or deploy
            LinkForge yourself with Docker Compose.
          </p>
        </section>
      </div>
    </div>
  );
}