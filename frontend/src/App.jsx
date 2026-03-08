import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Scan from './pages/Scan';
import Payment from './pages/Payment';
import Invoice from './pages/Invoice';
import Layout from './components/Layout';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Layout />}>
        <Route index element={<Navigate to="/scan" replace />} />
        <Route path="scan" element={<Scan />} />
        <Route path="payment" element={<Payment />} />
        <Route path="invoice/:orderId" element={<Invoice />} />
      </Route>
      <Route path="*" element={<Navigate to="/scan" replace />} />
    </Routes>
  );
}
