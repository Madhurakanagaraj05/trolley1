import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import { createOrder } from '../api';
import styles from './Payment.module.css';

const UPI_ID = 'krnarmadhaofficial03@okhdfcbank';
const STORE_NAME = 'SmartStore';

function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

function GPayFlow({ totalAmount, isMobile: mobile, submitting, onPay, onDesktopDone }) {
  const [qrDataUrl, setQrDataUrl] = useState('');
  const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${totalAmount.toFixed(2)}&cu=INR`;

  useEffect(() => {
    if (!mobile) {
      QRCode.toDataURL(upiUrl, { width: 200, margin: 2 }).then(setQrDataUrl).catch(() => {});
    }
  }, [mobile, upiUrl]);

  if (mobile) {
    return (
      <div className={styles.gpayFlow}>
        <p>Pay with GPay / UPI</p>
        <button type="button" className={styles.payBtn} onClick={onPay} disabled={submitting}>
          {submitting ? 'Processing...' : 'Pay with GPay'}
        </button>
        <p className={styles.note}>Opens Google Pay / UPI app. Invoice is generated after click.</p>
      </div>
    );
  }

  return (
    <div className={styles.gpayFlow}>
      <p>Scan QR with GPay / Paytm / any UPI app</p>
      {qrDataUrl && <img src={qrDataUrl} alt="UPI QR" className={styles.qrImage} />}
      <p className={styles.amount}>Amount: ₹{totalAmount.toFixed(2)}</p>
      <button type="button" className={styles.payBtn} onClick={onDesktopDone} disabled={submitting}>
        {submitting ? 'Generating invoice...' : "I've paid, generate invoice"}
      </button>
    </div>
  );
}

export default function Payment() {
  const navigate = useNavigate();
  const [pending, setPending] = useState(null);
  const [method, setMethod] = useState(null); // 'gpay' | 'card' | 'cash'
  const [cardSuccess, setCardSuccess] = useState(false);
  const [cardForm, setCardForm] = useState({ number: '', expiry: '', cvv: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!sessionStorage.getItem('user')) {
      navigate('/login', { replace: true });
      return;
    }
    const data = sessionStorage.getItem('pendingPayment');
    if (!data) {
      navigate('/scan', { replace: true });
      return;
    }
    setPending(JSON.parse(data));
  }, [navigate]);

  const totalAmount = pending?.totalAmount ?? 0;
  const cart = pending?.cart ?? [];

  const orderPayload = () => ({
    userId: 1,
    items: cart.map((i) => ({
      productId: i.productId,
      barcode: i.barcode,
      productName: i.productName,
      price: i.price,
      quantity: i.quantity,
      subtotal: i.price * i.quantity,
      weightGrams: i.weightGrams || 0,
    })),
    totalAmount,
    paymentMode: method === 'gpay' ? 'GPay' : method === 'card' ? 'Card' : 'Cash',
    paymentStatus: method === 'cash' ? 'PENDING' : 'PAID',
  });

  const saveOrderAndGoToInvoice = async (orderId) => {
    sessionStorage.removeItem('pendingPayment');
    navigate(`/invoice/${orderId}`, { replace: true });
  };

  const handleGPay = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder(orderPayload());
      const orderId = res.orderId;
      const upiUrl = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(STORE_NAME)}&am=${totalAmount.toFixed(2)}&cu=INR`;
      if (isMobile()) {
        window.open(upiUrl, '_blank');
        await saveOrderAndGoToInvoice(orderId);
      } else {
        saveOrderAndGoToInvoice(orderId);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGPayDesktopDone = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder(orderPayload());
      await saveOrderAndGoToInvoice(res.orderId);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCardPay = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder(orderPayload());
      setCardSuccess(true);
      setTimeout(() => saveOrderAndGoToInvoice(res.orderId), 1500);
    } catch (err) {
      setError(err.message || 'Failed to process payment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCash = async () => {
    setSubmitting(true);
    setError('');
    try {
      const res = await createOrder(orderPayload());
      saveOrderAndGoToInvoice(res.orderId);
    } catch (err) {
      setError(err.message || 'Failed to create order');
    } finally {
      setSubmitting(false);
    }
  };

  if (!pending) return <div className={styles.page}>Loading...</div>;

  if (cardSuccess) {
    return (
      <div className={styles.page}>
        <div className={styles.successBox}>
          <h2>Payment successful</h2>
          <p>Redirecting to invoice...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <h2 className={styles.title}>Payment</h2>
      <div className={styles.total}>Total: ₹{totalAmount.toFixed(2)}</div>

      {!method ? (
        <div className={styles.methodGrid}>
          <button type="button" className={styles.methodCard} onClick={() => setMethod('gpay')}>
            <span className={styles.methodIcon}>GPay</span>
            <span>Online (GPay / UPI)</span>
          </button>
          <button type="button" className={styles.methodCard} onClick={() => setMethod('card')}>
            <span className={styles.methodIcon}>Card</span>
            <span>Card</span>
          </button>
          <button type="button" className={styles.methodCard} onClick={() => setMethod('cash')}>
            <span className={styles.methodIcon}>Cash</span>
            <span>Cash</span>
          </button>
        </div>
      ) : (
        <div className={styles.flow}>
          <button type="button" className={styles.backBtn} onClick={() => setMethod(null)}>
            ← Back
          </button>

          {method === 'gpay' && (
            <GPayFlow
              totalAmount={totalAmount}
              isMobile={isMobile()}
              submitting={submitting}
              onPay={handleGPay}
              onDesktopDone={handleGPayDesktopDone}
            />
          )}

          {method === 'card' && (
            <form onSubmit={handleCardPay} className={styles.cardForm}>
              <label>
                Card number
                <input
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  value={cardForm.number}
                  onChange={(e) => setCardForm((f) => ({ ...f, number: e.target.value }))}
                  className={styles.input}
                />
              </label>
              <label>
                Expiry (MM/YY)
                <input
                  type="text"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChange={(e) => setCardForm((f) => ({ ...f, expiry: e.target.value }))}
                  className={styles.input}
                />
              </label>
              <label>
                CVV
                <input
                  type="text"
                  placeholder="123"
                  value={cardForm.cvv}
                  onChange={(e) => setCardForm((f) => ({ ...f, cvv: e.target.value }))}
                  className={styles.input}
                />
              </label>
              <button type="submit" className={styles.payBtn} disabled={submitting}>
                {submitting ? 'Processing...' : 'Pay'}
              </button>
            </form>
          )}

          {method === 'cash' && (
            <div className={styles.cashFlow}>
              <p>Pay at cash counter.</p>
              <button
                type="button"
                className={styles.payBtn}
                onClick={handleCash}
                disabled={submitting}
              >
                {submitting ? 'Generating bill...' : 'Generate bill'}
              </button>
              <p className={styles.note}>Payment status will be PENDING. Please visit the cash counter to complete payment.</p>
            </div>
          )}
        </div>
      )}

      {error && <p className={styles.error} role="alert">{error}</p>}
    </div>
  );
}
