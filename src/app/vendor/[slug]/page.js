'use client';

import Link from 'next/link';

const vendorData = {
  'techworld-store': {
    name: 'TechWorld Store',
    description: 'Premium electronics and gadgets. Authorized distributor of top brands.',
    rating: 4.8,
    reviews: 236,
    products: 45,
    joined: 'January 2024',
    verified: true,
    responseTime: 'Within 2 hours',
    fulfillmentRate: '98.5%',
  },
};

export default function VendorStorePage({ params }) {
  const slug = params?.slug || 'techworld-store';
  const vendor = vendorData[slug] || vendorData['techworld-store'];

  const vendorProducts = [
    { id: 1, name: 'Premium Wireless Headphones', price: '₦25,000', originalPrice: '₦32,000', rating: 4.8, reviews: 236 },
    { id: 6, name: 'Wireless Headset', price: '₦22,000', rating: 4.6, reviews: 94 },
    { id: 7, name: 'Smart Watch Series 9', price: '₦45,000', originalPrice: '₦55,000', rating: 4.8, reviews: 210 },
  ];

  return (
    <>
      {/* Vendor Header */}
      <section className="bg-ob-navy text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-20 h-20 bg-ob-purple rounded-2xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {vendor.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h1 className="text-2xl font-bold">{vendor.name}</h1>
                {vendor.verified && (
                  <span className="bg-ob-lime/20 text-ob-lime text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                    Verified
                  </span>
                )}
              </div>
              <p className="text-gray-300 text-sm">{vendor.description}</p>
              <div className="flex items-center space-x-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <svg className="w-4 h-4 text-ob-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                  <span>{vendor.rating} ({vendor.reviews} reviews)</span>
                </span>
                <span>{vendor.products} products</span>
                <span>Joined {vendor.joined}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vendor Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap gap-6 text-sm">
            <div><span className="text-gray-500">Response Time: </span><span className="font-medium text-ob-navy">{vendor.responseTime}</span></div>
            <div><span className="text-gray-500">Fulfillment Rate: </span><span className="font-medium text-ob-navy">{vendor.fulfillmentRate}</span></div>
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="section-padding bg-ob-light">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl font-bold text-ob-navy mb-6">Products by {vendor.name}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {vendorProducts.map((product) => (
              <Link key={product.id} href={`/shop/product-${product.id}`} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 card-hover group">
                <div className="aspect-square bg-gradient-to-br from-ob-purple/5 to-ob-lime/5 flex items-center justify-center">
                  <div className="w-20 h-20 bg-ob-purple/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-10 h-10 text-ob-purple/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-ob-navy text-sm mb-2 group-hover:text-ob-purple transition-colors">{product.name}</h3>
                  <div className="flex items-center space-x-1 mb-2">
                    <svg className="w-4 h-4 text-ob-gold" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                    <span className="text-sm text-gray-600">{product.rating}</span>
                    <span className="text-xs text-gray-400">({product.reviews})</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-ob-navy">{product.price}</span>
                    {product.originalPrice && <span className="text-sm text-gray-400 line-through">{product.originalPrice}</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
