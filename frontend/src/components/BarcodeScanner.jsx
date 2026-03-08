import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

/**
 * Camera barcode scanner using html5-qrcode.
 * Calls onScan(barcode) when a barcode is detected.
 */
export default function BarcodeScanner({ onScan }) {
  const [status, setStatus] = useState('idle'); // idle | scanning | error
  const [errorMessage, setErrorMessage] = useState('');
  const scannerRef = useRef(null);
  const containerId = 'barcode-reader';

  useEffect(() => {
    let html5Qr = null;

    const start = async () => {
      try {
        setStatus('scanning');
        setErrorMessage('');
        html5Qr = new Html5Qrcode(containerId);
        await html5Qr.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            if (decodedText && onScan) onScan(decodedText);
          },
          () => {}
        );
      } catch (err) {
        setStatus('error');
        setErrorMessage(err.message || 'Could not access camera');
      }
    };

    start();
    return () => {
      if (html5Qr && html5Qr.isScanning) {
        html5Qr.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="barcode-scanner-wrap">
      <div id={containerId} style={{ width: '100%', maxWidth: 400, margin: '0 auto' }} />
      {status === 'error' && (
        <p style={{ marginTop: '0.75rem', color: 'var(--error)', fontSize: '0.9rem' }}>
          {errorMessage}
        </p>
      )}
    </div>
  );
}
