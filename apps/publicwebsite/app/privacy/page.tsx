export const metadata = {
  title: "Privacy Policy – Read With Roz",
  description: "Privacy Policy for Read With Roz",
};

export default function PrivacyPage() {
  return (
    <main className="max-w-2xl mx-auto px-6 py-16 text-warm-text">
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-warm-subtle mb-10">Effective date: April 13, 2026</p>

      <p className="mb-8 leading-relaxed">
        Read with Roz ("we", "our", or "us") is an AI-powered English reading tutor designed for
        children ages 6–12. This Privacy Policy explains what information we collect, how we use
        it, and how we protect it. By using the app, you agree to the practices described here.
      </p>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">1. Information We Collect</h2>
        <p className="mb-3 leading-relaxed">We collect the minimum information necessary to provide the service:</p>
        <ul className="list-disc pl-6 space-y-2 text-warm-subtle leading-relaxed">
          <li>
            <strong className="text-warm-text">Account information:</strong> Email address and password used to create an
            account (stored securely via Supabase Auth).
          </li>
          <li>
            <strong className="text-warm-text">Book content:</strong> Text entered by the user for reading practice (stored in
            our database to power the AI tutor).
          </li>
          <li>
            <strong className="text-warm-text">Vocabulary data:</strong> Words marked by the user for practice.
          </li>
          <li>
            <strong className="text-warm-text">Chat history:</strong> Conversations with Roz, limited to book-related content.
          </li>
          <li>
            <strong className="text-warm-text">Voice input:</strong> When the read-aloud feature is used, audio is processed
            locally on the device using the Web Speech API. We do not record or store audio.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">2. How We Use Your Information</h2>
        <ul className="list-disc pl-6 space-y-2 text-warm-subtle leading-relaxed">
          <li>To provide and operate the reading tutor features.</li>
          <li>
            To send book content and chat messages to our AI service (Anthropic Claude) solely to
            generate tutor responses. We do not use your data to train AI models.
          </li>
          <li>
            To generate audio playback of text using OpenAI's text-to-speech API. Only the sentence
            text is sent — no personal information.
          </li>
          <li>We do not use your information for advertising or sell it to third parties.</li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">3. Third-Party Services</h2>
        <p className="mb-3 leading-relaxed text-warm-subtle">We use the following third-party services to operate the app:</p>
        <ul className="list-disc pl-6 space-y-2 text-warm-subtle leading-relaxed">
          <li>
            <strong className="text-warm-text">Supabase</strong> — user authentication and database storage. Stores account
            email, book content, vocabulary, chat history, and reading progress.
          </li>
          <li>
            <strong className="text-warm-text">Anthropic, Inc. (Claude API)</strong> — AI tutor responses. We send the book
            content you have entered and your chat messages with Roz to generate tutor replies.
            Anthropic does not use API data to train its models.
          </li>
          <li>
            <strong className="text-warm-text">OpenAI (TTS API)</strong> — text-to-speech audio generation. We send only the
            sentence text to be read aloud. No account information or personal data is included.
            OpenAI does not use API data to train its models.
          </li>
          <li>
            <strong className="text-warm-text">Stripe</strong> — payment processing for paid plans. We do not store credit card
            information; all payment data is handled directly by Stripe.
          </li>
          <li>
            <strong className="text-warm-text">Vercel</strong> — web application hosting.
          </li>
        </ul>
        <p className="mt-4 text-warm-subtle leading-relaxed">
          Each service has its own privacy policy. We share only the minimum data required for each
          service to function.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">4. Children's Privacy</h2>
        <p className="mb-3 leading-relaxed text-warm-subtle">
          Read with Roz is designed for children ages 6–12 and is intended to be set up and
          managed by a parent or guardian.
        </p>
        <ul className="list-disc pl-6 space-y-2 text-warm-subtle leading-relaxed">
          <li>We do not knowingly collect personal information directly from children.</li>
          <li>
            Account registration is intended to be completed by a parent or guardian using their
            own email address.
          </li>
          <li>
            We do not display advertisements, link to external websites, or include social features
            within the app.
          </li>
          <li>
            If you believe a child has provided personal information without parental consent,
            please contact us and we will delete it promptly.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">5. Device Permissions</h2>
        <ul className="list-disc pl-6 space-y-2 text-warm-subtle leading-relaxed">
          <li>
            <strong className="text-warm-text">Microphone:</strong> Used only when the child taps the record button during
            read-aloud practice. Audio is processed on-device and is not stored or transmitted.
          </li>
          <li>
            <strong className="text-warm-text">Speech Recognition:</strong> Used on-device to convert spoken words to text for
            pronunciation comparison. No audio leaves the device.
          </li>
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">6. Data Retention and Deletion</h2>
        <p className="leading-relaxed text-warm-subtle">
          Your account data (books, vocabulary, chat history) is retained as long as your account
          is active. You may delete your account and all associated data at any time directly within
          the app by going to <strong className="text-warm-text">Settings → Delete Account</strong>. Deletion is immediate and
          permanent. If you encounter any issues, contact us at the email below.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">7. Data Security</h2>
        <p className="leading-relaxed text-warm-subtle">
          All data is transmitted over HTTPS. User passwords are never stored in plain text.
          Database access is restricted and protected by Supabase's security infrastructure.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">8. Changes to This Policy</h2>
        <p className="leading-relaxed text-warm-subtle">
          We may update this Privacy Policy from time to time. When we do, we will update the
          effective date at the top of this page. Continued use of the app after changes means you
          accept the updated policy.
        </p>
      </section>

      <section className="mb-10">
        <h2 className="text-xl font-semibold mb-4">9. Contact Us</h2>
        <p className="leading-relaxed text-warm-subtle">
          If you have any questions or requests regarding this Privacy Policy, please contact us at:
        </p>
        <p className="mt-2 font-medium">
          <a href="mailto:hello@readwithroz.com" className="text-brand hover:underline">
            hello@readwithroz.com
          </a>
        </p>
      </section>
    </main>
  );
}
