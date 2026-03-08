import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { getProductByBarcode } from '../api';
import BarcodeScanner from '../components/BarcodeScanner';
import styles from './Scan.module.css';

/**
 * Cart item shape: { productId, barcode, productName, price, quantity, weightGrams, imageUrl }
 */
function cartItemSubtotal(item) {
  return item.price * item.quantity;
}

function cartTotalWeight(items) {
  return items.reduce((sum, i) => sum + (i.weightGrams || 0) * i.quantity, 0);
}

function cartTotalAmount(items) {
  return items.reduce((sum, i) => sum + cartItemSubtotal(i), 0);
}

export default function Scan() {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [scanError, setScanError] = useState('');
  const [loading, setLoading] = useState(false);
  const lastScannedRef = useRef('');

  // Check auth on mount
  useEffect(() => {
    if (!sessionStorage.getItem('user')) {
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  const handleScan = useCallback(async (barcode) => {
    const code = (barcode || '').trim();
    if (!code || code === lastScannedRef.current) return;
    lastScannedRef.current = code;
    setScanError('');
    setScannedProduct(null);
    setLoading(true);
    try {
      const product = await getProductByBarcode(code);
      setScannedProduct({ ...product, quantity: 1 });
    } catch {
      setScanError('Product not found');
      setScannedProduct(null);
    } finally {
      setLoading(false);
      setTimeout(() => { lastScannedRef.current = ''; }, 2000);
    }
  }, []);

  const addToCart = () => {
    if (!scannedProduct) return;
    const existing = cart.find((i) => i.barcode === scannedProduct.barcode);
    if (existing) {
      setCart(cart.map((i) =>
        i.barcode === scannedProduct.barcode
          ? { ...i, quantity: i.quantity + scannedProduct.quantity }
          : i
      ));
    } else {
      setCart([
        ...cart,
        {
          productId: scannedProduct.id,
          barcode: scannedProduct.barcode,
          productName: scannedProduct.name,
          price: scannedProduct.price,
          quantity: scannedProduct.quantity,
          weightGrams: scannedProduct.weightGrams || 0,
          imageUrl: scannedProduct.imageUrl,
        },
      ]);
    }
    setScannedProduct(null);
    setScanError('');
  };

  const updateQuantity = (barcode, delta) => {
    setCart(cart.map((i) => {
      if (i.barcode !== barcode) return i;
      const q = Math.max(0, i.quantity + delta);
      if (q === 0) return null;
      return { ...i, quantity: q };
    }).filter(Boolean));
  };

  const removeFromCart = (barcode) => {
    setCart(cart.filter((i) => i.barcode !== barcode));
  };

  const goToPayment = () => {
    if (cart.length === 0) return;
    const payload = {
      cart,
      totalAmount: cartTotalAmount(cart),
      totalWeight: cartTotalWeight(cart),
    };
    sessionStorage.setItem('pendingPayment', JSON.stringify(payload));
    navigate('/payment');
  };

  const totalAmount = cartTotalAmount(cart);
  const totalWeight = cartTotalWeight(cart);

  return (
    <div className={styles.page}>
      <section className={styles.scanSection}>
        <h2 className={styles.sectionTitle}>Scan product barcode</h2>
        <BarcodeScanner onScan={handleScan} />
        {loading && <p className={styles.status}>Looking up product...</p>}
        {scanError && <p className={styles.error} role="alert">{scanError}</p>}
        {scannedProduct && (
          <div className={styles.productCard}>
            <div className={styles.productImage}>
              {scannedProduct.imageUrl ? (
                <img src={scannedProduct.imageUrl} alt={scannedProduct.name} />
              ) : (
                <span className={styles.placeholderImg}>No image</span>
              )}
            </div>
            <div className={styles.productInfo}>
              <h3>{scannedProduct.name}</h3>
              <p className={styles.price}>₹{scannedProduct.price.toFixed(2)}</p>
              <div className={styles.quantityRow}>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setScannedProduct((p) => ({ ...p, quantity: Math.max(1, p.quantity - 1) }))}
                >
                  −
                </button>
                <span className={styles.qtyValue}>{scannedProduct.quantity}</span>
                <button
                  type="button"
                  className={styles.qtyBtn}
                  onClick={() => setScannedProduct((p) => ({ ...p, quantity: p.quantity + 1 }))}
                >
                  +
                </button>
              </div>
              <button type="button" className={styles.addBtn} onClick={addToCart}>
                Add to cart
              </button>
            </div>
          </div>
        )}
      </section>

      <section className={styles.cartSection}>
        <h2 className={styles.sectionTitle}>Cart</h2>
        {cart.length === 0 ? (
          <p className={styles.emptyCart}>Cart is empty. Scan a product to add.</p>
        ) : (
          <>
            <ul className={styles.cartList}>
              {cart.map((item) => (
                <li key={item.barcode} className={styles.cartItem}>
                  <div className={styles.cartItemInfo}>
                    <span className={styles.cartName}>{item.productName}</span>
                    <span className={styles.cartMeta}>
                      ₹{item.price.toFixed(2)} × {item.quantity} = ₹{cartItemSubtotal(item).toFixed(2)}
                      {item.weightGrams ? ` · ${(item.weightGrams * item.quantity / 1000).toFixed(2)} kg` : ''}
                    </span>
                  </div>
                  <div className={styles.cartItemActions}>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.barcode, -1)}
                    >
                      −
                    </button>
                    <span className={styles.qtyValue}>{item.quantity}</span>
                    <button
                      type="button"
                      className={styles.qtyBtn}
                      onClick={() => updateQuantity(item.barcode, 1)}
                    >
                      +
                    </button>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeFromCart(item.barcode)}
                      aria-label="Remove"
                    >
                      Remove
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.totals}>
              {totalWeight > 0 && (
                <p className={styles.totalRow}>Total weight: {(totalWeight / 1000).toFixed(2)} kg</p>
              )}
              <p className={styles.totalAmount}>Total: ₹{totalAmount.toFixed(2)}</p>
            </div>
            <button
              type="button"
              className={styles.nextBtn}
              onClick={goToPayment}
            >
              Next → Payment
            </button>
          </>
        )}
      </section>
    </div>
  );
}
