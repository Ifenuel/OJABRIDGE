'use client';

import Link from 'next/link';

export default function Error() {
  return (
    <div className="min-h-[70vh] bg-ob-light flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-red-300/30">500</p>
        <h1 className="text-3xl font-bold text-ob-navy mt-4 mb-3">Something Went Wrong</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          We encountered an unexpected error. Our team has been notified. Please try again or contact support.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => window.location.reload()} className="btn-primary">Try Again</button>
          <Link href="/support" className="border-2 border-ob-purple text-ob-purple font-semibold px-6 py-3 rounded-lg hover:bg-ob-purple hover:text-white transition-all">
            Contact Support
          </Link>
        </div>
      </div>
    </div>
  );
}
