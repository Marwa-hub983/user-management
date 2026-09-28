import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';

const SalesDashboard = () => {
  // Summary state
  const [summaryData, setSummaryData] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [summaryError, setSummaryError] = useState('');

  // Transactions state
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalRecords: 0, limit: 10 });
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionsError, setTransactionsError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState('');
  const [selectedOrderType, setSelectedOrderType] = useState('');

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');
  const [syncError, setSyncError] = useState('');

  // Fetch summary metrics
  const fetchSummary = async () => {
    setLoadingSummary(true);
    setSummaryError('');
    try {
      const response = await api.get('/sales/summary');
      setSummaryData(response.data);
    } catch (err) {
      setSummaryError(err.response?.data?.message || 'Failed to load sales summary data.');
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch transactions list
  const fetchTransactions = useCallback(async (page = 1) => {
    setLoadingTransactions(true);
    setTransactionsError('');
    try {
      const response = await api.get('/sales/transactions', {
        params: {
          page,
          limit: 10,
          search: searchQuery,
          payment_mode: selectedPaymentMode,
          order_type: selectedOrderType,
        },
      });
      setTransactions(response.data.transactions);
      setPagination(response.data.pagination);
    } catch (err) {
      setTransactionsError(err.response?.data?.message || 'Failed to load sales transactions.');
    } finally {
      setLoadingTransactions(false);
    }
  }, [searchQuery, selectedPaymentMode, selectedOrderType]);

  useEffect(() => {
    fetchSummary();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTransactions(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchTransactions]);

  // Sync handler for Petpooja API
  const handleSyncPetpooja = async () => {
    setIsSyncing(true);
    setSyncMessage('');
    setSyncError('');

    try {
      const response = await api.post('/sales/sync');
      setSyncMessage(response.data.message);
      // Refresh summary & transactions
      await fetchSummary();
      await fetchTransactions(1);
    } catch (err) {
      setSyncError(err.response?.data?.message || err.message || 'Failed to sync with Petpooja API.');
    } finally {
      setIsSyncing(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(val || 0);
  };

  const summary = summaryData?.summary || {};
  const paymentModes = summaryData?.paymentModes || [];
  const orderTypes = summaryData?.orderTypes || [];

  return (
    <div className="layout-container">
      <Navbar />

      <main className="main-content">
        {/* Header Banner & Petpooja Sync Action */}
        <div className="welcome-banner" style={{ marginBottom: '2rem' }}>
          <div className="welcome-text">
            <h1>Petpooja Sales & Analytics</h1>
            <p>Real-time sales tracking, revenue analysis, and Petpooja POS sync.</p>
          </div>
          <button
            className="btn btn-primary"
            onClick={handleSyncPetpooja}
            disabled={isSyncing}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: isSyncing ? 'not-allowed' : 'pointer' }}
          >
            <svg
              className={`btn-icon ${isSyncing ? 'spinning' : ''}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ width: '18px', height: '18px' }}
            >
              <path d="M21.5 2v6h-6M2.5 22v-6h6" />
              <path d="M2 11.5a10 10 0 0 1 18.8-4.3L21.5 8M22 12.5a10 10 0 0 1-18.8 4.2L2.5 16" />
            </svg>
            {isSyncing ? 'Syncing Petpooja API...' : 'Sync Live Petpooja Sales'}
          </button>
        </div>

        {/* Sync Notifications */}
        {syncMessage && (
          <div className="success-banner" style={{ marginBottom: '1.5rem', padding: '1rem', borderRadius: 'var(--radius-md)', background: 'var(--success-bg)', border: '1px solid var(--success-border)', color: 'var(--success)' }}>
            ✓ {syncMessage}
          </div>
        )}
        {syncError && <ErrorMessage message={syncError} />}

        {/* Loading / Error States for Summary */}
        {loadingSummary ? (
          <Loader />
        ) : summaryError ? (
          <ErrorMessage message={summaryError} />
        ) : (
          <>
            {/* Top Metric Cards */}
            <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '2rem' }}>
              <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Revenue</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981' }}>{formatCurrency(summary.total_revenue)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Net sales generated</div>
              </div>

              <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Total Orders</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: 'var(--primary)' }}>{summary.total_orders || 0}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Completed transactions</div>
              </div>

              <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Avg. Order Value</div>
                <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#38bdf8' }}>{formatCurrency(summary.avg_order_value)}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Per order average</div>
              </div>

              <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Tax & Discounts</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: 'var(--text-main)' }}>
                  Tax: <span style={{ color: '#a78bfa' }}>{formatCurrency(summary.total_tax)}</span>
                </div>
                <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                  Disc: <span style={{ color: '#f43f5e' }}>{formatCurrency(summary.total_discount)}</span>
                </div>
              </div>
            </div>

            {/* Breakdowns Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
              {/* Payment Methods */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)' }}>
                  💳 Payment Methods Breakdown
                </h3>
                {paymentModes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No payment breakdown available.</p>
                ) : (
                  paymentModes.map((item, idx) => {
                    const pct = summary.total_revenue > 0 ? ((item.total / summary.total_revenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>{item.payment_mode || 'Other'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.total)} ({pct}%)</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: idx % 2 === 0 ? 'var(--primary)' : '#10b981',
                              transition: 'width 0.4s ease',
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Order Types */}
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--bg-card-border)', borderRadius: 'var(--radius-lg)', padding: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', marginBottom: '1rem', color: 'var(--text-main)' }}>
                  🛍️ Order Types Breakdown
                </h3>
                {orderTypes.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No order types available.</p>
                ) : (
                  orderTypes.map((item, idx) => {
                    const pct = summary.total_revenue > 0 ? ((item.total / summary.total_revenue) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontWeight: '600' }}>{item.order_type || 'General'}</span>
                          <span style={{ color: 'var(--text-muted)' }}>{formatCurrency(item.total)} ({item.count} orders)</span>
                        </div>
                        <div style={{ height: '8px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              borderRadius: '4px',
                              background: idx % 2 === 0 ? '#38bdf8' : '#a78bfa',
                              transition: 'width 0.4s ease',
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </>
        )}

        {/* Sales Transactions List Table */}
        <div className="users-table-card">
          <div className="table-header" style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2>Recent Sales Transactions</h2>
              <p className="table-subtitle">View receipt items, dates, payment modes, and order values</p>
            </div>

            {/* Controls / Filters */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
              <div className="search-box">
                <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
                <input
                  type="text"
                  placeholder="Search receipt # or date..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <select
                className="input-field"
                style={{ width: 'auto', minWidth: '130px', padding: '0.5rem 0.75rem' }}
                value={selectedPaymentMode}
                onChange={(e) => setSelectedPaymentMode(e.target.value)}
              >
                <option value="">All Payments</option>
                {paymentModes.map((pm, i) => (
                  <option key={i} value={pm.payment_mode}>
                    {pm.payment_mode}
                  </option>
                ))}
              </select>

              <select
                className="input-field"
                style={{ width: 'auto', minWidth: '130px', padding: '0.5rem 0.75rem' }}
                value={selectedOrderType}
                onChange={(e) => setSelectedOrderType(e.target.value)}
              >
                <option value="">All Types</option>
                {orderTypes.map((ot, i) => (
                  <option key={i} value={ot.order_type}>
                    {ot.order_type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {loadingTransactions ? (
            <Loader />
          ) : transactionsError ? (
            <ErrorMessage message={transactionsError} />
          ) : transactions.length === 0 ? (
            <div className="empty-state" style={{ padding: '3rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-muted)' }}>No sales transactions found.</p>
            </div>
          ) : (
            <>
              <div className="table-responsive">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>Receipt #</th>
                      <th>Date & Time</th>
                      <th>Invoice Amt</th>
                      <th>Tax</th>
                      <th>Net Sale</th>
                      <th>Payment</th>
                      <th>Order Type</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((item) => (
                      <tr key={item.id}>
                        <td style={{ fontWeight: '600', color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                          {item.receipt_number || `REC-${item.id}`}
                        </td>
                        <td>
                          <div>{item.sale_date}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.transaction_time}</div>
                        </td>
                        <td>{formatCurrency(item.sale_amount)}</td>
                        <td style={{ color: '#a78bfa' }}>{formatCurrency(item.tax_amount)}</td>
                        <td style={{ fontWeight: '700', color: '#10b981' }}>{formatCurrency(item.net_sale)}</td>
                        <td>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', background: 'rgba(99, 102, 241, 0.15)', color: '#818cf8' }}>
                            {item.payment_mode || 'Cash'}
                          </span>
                        </td>
                        <td>
                          <span style={{ padding: '0.25rem 0.6rem', borderRadius: 'var(--radius-sm)', fontSize: '0.75rem', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                            {item.order_type || 'Standard'}
                          </span>
                        </td>
                        <td>
                          <span className="role-pill" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', background: item.transaction_status === 'Success' || item.transaction_status === 'Paid' ? 'var(--success-bg)' : 'rgba(255,255,255,0.05)', color: item.transaction_status === 'Success' || item.transaction_status === 'Paid' ? 'var(--success)' : 'var(--text-muted)' }}>
                            {item.transaction_status || 'Completed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--bg-card-border)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Showing page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalRecords} total transactions)
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    disabled={pagination.currentPage <= 1}
                    onClick={() => fetchTransactions(pagination.currentPage - 1)}
                  >
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary"
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}
                    disabled={pagination.currentPage >= pagination.totalPages}
                    onClick={() => fetchTransactions(pagination.currentPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default SalesDashboard;
