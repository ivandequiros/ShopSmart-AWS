import React, { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import StatusMessage from '../components/StatusMessage.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { api } from '../services/api.js';

const peso = (value) => `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 2 })}`;

export default function OrdersPage() {
  const { user, checking } = useAuth();
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;
    api.getMyOrders().then(setOrders).catch((caught) => setError(caught.message));
  }, [user]);

  if (checking) return <p role="status">Checking your session…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: '/orders' }} />;

  return (
    <section>
      <p className="eyebrow">MY ACCOUNT</p>
      <h1>{user.name}&rsquo;s orders</h1>
      <StatusMessage type="error">{error}</StatusMessage>

      {!orders && !error && <p role="status">Loading orders…</p>}

      {orders?.length === 0 && (
        <div className="empty-state">
          <p>You have no simulated orders yet.</p>
          <Link className="button" to="/">Browse products</Link>
        </div>
      )}

      {orders?.map((order) => (
        <article key={order.id} className="summary" style={{ marginBottom: '16px' }}>
          <h2>Order #{order.id}</h2>
          <p>
            {new Date(order.createdAt).toLocaleString('en-PH')} • {order.status} • <strong>{peso(order.total)}</strong>
          </p>
          <ul>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.product?.emoji} {item.product?.name} × {item.quantity} @ {peso(item.unitPrice)}
              </li>
            ))}
          </ul>
        </article>
      ))}
    </section>
  );
}
