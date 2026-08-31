'use client';

export default function AcceptableUsePage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <p className="text-ob-purple text-sm font-semibold tracking-wider uppercase mb-2">Policy</p>
        <h1 className="text-3xl md:text-4xl font-bold text-ob-navy mb-2">Acceptable Use Policy</h1>
        <p className="text-gray-400 text-sm mb-8">Last updated: August 29, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-sm leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">1. Purpose</h2>
            <p className="text-gray-600">This Acceptable Use Policy outlines the rules and guidelines for using OjaBridge. By accessing or using the platform, you agree to comply with these rules.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">2. Account Integrity</h2>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>One account per person or business entity</li>
              <li>Provide accurate and current registration information</li>
              <li>Keep login credentials confidential</li>
              <li>Do not share accounts or allow unauthorized access</li>
              <li>Report compromised accounts immediately</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">3. Communication Standards</h2>
            <p className="text-gray-600">All interactions on OjaBridge — between customers, vendors and the platform — must be professional, respectful and lawful. Harassment, threats, discrimination, spam and abusive language are not tolerated.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">4. Payment Integrity</h2>
            <p className="text-gray-600">All transactions must go through OjaBridge&apos;s official payment processing. Attempting to process payments outside the platform, manipulate pricing or circumvent commission structures is prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">5. Security</h2>
            <p className="text-gray-600">Do not attempt to probe, scan, test or compromise the security of OjaBridge. This includes unauthorized access attempts, vulnerability scanning, brute force attacks or any form of hacking activity.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">6. Content Standards</h2>
            <p className="text-gray-600">Product listings, reviews, messages and other user-generated content must be truthful, relevant and lawful. Content that is defamatory, misleading, infringing or harmful to others is prohibited.</p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-ob-navy mb-3">7. Enforcement</h2>
            <p className="text-gray-600">OjaBridge may issue warnings, restrict features, suspend accounts or permanently ban users who violate this policy. The severity of enforcement depends on the nature and frequency of the violation.</p>
          </section>

          <section className="bg-amber-50 border border-amber-200 rounded-xl p-6 mt-8">
            <p className="text-amber-700 text-sm">
              <strong>Note:</strong> This document should be reviewed by qualified legal professionals before commercial launch.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
