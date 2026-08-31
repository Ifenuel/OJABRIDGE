import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[70vh] bg-ob-light flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-8xl font-bold text-ob-purple/20">404</p>
        <h1 className="text-3xl font-bold text-ob-navy mt-4 mb-3">Page Not Found</h1>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          The page you&apos;re looking for doesn&apos;t exist or has been moved. Let&apos;s get you back on track.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link href="/" className="btn-primary">Go Home</Link>
          <Link href="/shop" className="border-2 border-ob-purple text-ob-purple font-semibold px-6 py-3 rounded-lg hover:bg-ob-purple hover:text-white transition-all">
            Browse Shop
          </Link>
        </div>
      </div>
    </div>
  );
}
