import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder } from '../api';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import styles from './Invoice.module.css';

const STORE_NAME = 'Smart Store';
const UPI_ID = 'krnarmadhaofficial03@okhdfcbank';

export default function Invoice() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    getOrder(orderId)
      .then(setOrder)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [orderId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    if (!order) return;
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(STORE_NAME, 14, 20);
    doc.setFontSize(10);
    doc.text(`UPI ID: ${UPI_ID}`, 14, 28);
    doc.text(`Order ID: ${order.orderId}`, 14, 34);
    doc.text(`Date: ${new Date(order.createdAt).toLocaleString()}`, 14, 40);
    const totalWeightKg = order.totalWeight ? (order.totalWeight / 1000).toFixed(2) : null;
    doc.text(`Payment: ${order.paymentMode} | Status: ${order.paymentStatus}`, 14, 46);
    if (totalWeightKg) {
      doc.text(`Total weight: ${totalWeightKg} kg`, 14, 52);
    }

    const tableData = order.items.map((i) => [
      i.productName,
      i.barcode,
      `₹${i.price.toFixed(2)}`,
      i.quantity,
      `₹${i.subtotal.toFixed(2)}`,
    ]);
    autoTable(doc, {
      startY: totalWeightKg ? 58 : 52,
      head: [['Product', 'Barcode', 'Price', 'Qty', 'Subtotal']],
      body: tableData,
    });
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFont(undefined, 'bold');
    doc.text(`Total Amount: ₹${order.totalAmount.toFixed(2)}`, 14, finalY);
    doc.save(`invoice-${order.orderId}.pdf`);
  };

  if (loading) return <div className={styles.page}>Loading invoice...</div>;
  if (error || !order) return <div className={styles.page}><p className={styles.error}>{error || 'Order not found'}</p></div>;

  return (
    <div className={styles.page}>
      <div className={styles.actions}>
        <button type="button" className={styles.btn} onClick={handlePrint}>Print</button>
        <button type="button" className={styles.btn} onClick={handleDownloadPDF}>Download PDF</button>
        <button type="button" className={styles.btnSecondary} onClick={() => navigate('/scan')}>New sale</button>
      </div>

      <div className={styles.invoice} id="invoice-content">
        <header className={styles.invoiceHeader}>
          <h1>{STORE_NAME}</h1>
          <p>UPI ID: {UPI_ID}</p>
        </header>
        <div className={styles.meta}>
          <p><strong>Order ID:</strong> {order.orderId}</p>
          <p><strong>Date & Time:</strong> {new Date(order.createdAt).toLocaleString()}</p>
          <p><strong>Payment Mode:</strong> {order.paymentMode}</p>
          <p><strong>Payment Status:</strong> {order.paymentStatus}</p>
          {order.paymentStatus === 'PENDING' && (
            <p className={styles.pendingMsg}>Please visit the cash counter to complete your payment.</p>
          )}
          {order.totalWeight > 0 && (
            <p><strong>Total Weight:</strong> {(order.totalWeight / 1000).toFixed(2)} kg</p>
          )}
        </div>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Product Name</th>
              <th>Barcode</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => (
              <tr key={item.barcode + item.quantity}>
                <td>{item.productName}</td>
                <td>{item.barcode}</td>
                <td>₹{item.price.toFixed(2)}</td>
                <td>{item.quantity}</td>
                <td>₹{item.subtotal.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className={styles.total}>Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
      </div>
    </div>
  );
}
