import React, { useState, useEffect } from 'react';

const ProductList = ({ onAddToCart }) => {
  // 1. Set up state to hold products and loading status
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addingId, setAddingId] = useState(null);
  const [addedId, setAddedId] = useState(null);

  // 2. Fetch data when the component mounts
  useEffect(() => {
    // Calling the secure, keyless WooCommerce Store API
    fetch('/wp-json/wc/store/products')
      .then((response) => {
        if (!response.ok) {
          return fetch('/wp-json/wc/store/v1/products').then((res) => {
            if (!res.ok) throw new Error('Failed to fetch products');
            return res.json();
          });
        }
        return response.json();
      })
      .then((data) => {
        setProducts(data); // Store the fetched products in state
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching products:', err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  // Handle Add to Cart via WooCommerce Store API + local state callback
  const handleAddToCart = async (product) => {
    setAddingId(product.id);
    try {
      // Call WooCommerce Store API Add to Cart endpoint
      const res = await fetch('/wp-json/wc/store/cart/add-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: product.id,
          quantity: 1,
        }),
      });

      let apiCartData = null;
      if (res.ok) {
        apiCartData = await res.json();
      }

      if (onAddToCart) {
        onAddToCart(product, apiCartData);
      }

      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } catch (err) {
      console.warn('Store API call warning:', err);
      if (onAddToCart) {
        onAddToCart(product, null);
      }
      setAddedId(product.id);
      setTimeout(() => setAddedId(null), 2000);
    } finally {
      setAddingId(null);
    }
  };

  // 3. UI states for Loading and Error
  if (loading) return <div className="text-center py-10 text-gray-500 font-sans">Loading  Products...</div>;
  if (error) return <div className="text-center py-10 text-red-600 font-sans">Error: {error}</div>;

  // 4. Render the Product Grid
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h2 className="text-3xl font-bold text-[#2A2724] mb-8 font-jost">Featured Products</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
        {products.map((product) => {
          const imageSrc = product.images?.[0]?.src;
          const imageAlt = product.images?.[0]?.alt || product.name;
          const isAdding = addingId === product.id;
          const isAdded = addedId === product.id;

          return (
            <div key={product.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100 p-4 flex flex-col">

              {/* Product Image */}
              <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-md bg-gray-200 mb-4">
                {imageSrc ? (
                  <img
                    src={imageSrc}
                    alt={imageAlt}
                    className="h-48 w-full object-cover object-center"
                  />
                ) : (
                  <div className="h-48 w-full flex items-center justify-center text-gray-400">No Image</div>
                )}
              </div>

              {/* Product Title */}
              <h3 className="text-lg font-semibold text-[#2A2724] font-jost mb-2">
                {product.name}
              </h3>

              {/* Product Price (WooCommerce returns formatted HTML for prices) */}
              <div
                className="text-md text-[#514C48] mb-4 font-inter"
                dangerouslySetInnerHTML={{ __html: product.price_html || product.price || '' }}
              />

              {/* Add to Cart Button */}
              <button
                onClick={() => handleAddToCart(product)}
                disabled={isAdding}
                className={`mt-auto w-full text-white py-2 px-4 rounded font-medium transition-colors ${isAdded
                    ? 'bg-green-600'
                    : isAdding
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-[#E60000] hover:bg-red-700'
                  }`}
              >
                {isAdding ? 'Adding...' : isAdded ? 'Added ✓' : 'Add to Cart'}
              </button>

            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;
