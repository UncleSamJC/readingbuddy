import Link from "next/link";

const quickLinks = [
  { label: "Home", href: "/" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];

export function Footer() {
  return (
    <footer className="bg-warm-text text-white">
      <div className="max-w-6xl mx-auto px-6 py-14 grid grid-cols-1 md:grid-cols-3 gap-10">
        {/* Brand */}
        <div>
          <div className="text-xl font-bold text-brand mb-3">Read With Roz</div>
          <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            AI-powered English reading practice for Chinese-American children
            aged 6–12. Read together, learn naturally.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Quick Links
          </h3>
          <ul className="space-y-3">
            {quickLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm transition-colors hover:text-white"
                  style={{ color: "rgba(255,255,255,0.65)" }}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <h3
            className="text-xs font-semibold uppercase tracking-widest mb-5"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Contact
          </h3>
          <ul className="space-y-3">
            <li>
              <a
                href="mailto:hello@readwithroz.com"
                className="text-sm transition-colors hover:text-white"
                style={{ color: "rgba(255,255,255,0.65)" }}
              >
                hello@readwithroz.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs"
          style={{ color: "rgba(255,255,255,0.35)" }}>
          <span>© 2025 Read With Roz. All rights reserved.</span>
          <span>Designed for young readers everywhere</span>
        </div>
      </div>
    </footer>
  );
}
