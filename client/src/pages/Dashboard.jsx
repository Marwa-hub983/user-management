import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import Navbar from '../components/Navbar';
import ErrorMessage from '../components/ErrorMessage';
import Loader from '../components/Loader';

const Dashboard = () => {
  const { user, deleteUser } = useAuth();

  // Admin state
  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersError, setUsersError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Delete modal state
  const [userToDelete, setUserToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const isAdmin = user?.role === 'admin';

  // Fetch users if user is admin
  useEffect(() => {
    if (isAdmin) {
      const fetchUsers = async () => {
        setLoadingUsers(true);
        setUsersError('');
        try {
          const response = await api.get('/users');
          setUsersList(response.data);
        } catch (err) {
          setUsersError(err.response?.data?.message || 'Failed to fetch users list');
        } finally {
          setLoadingUsers(false);
        }
      };

      fetchUsers();
    }
  }, [isAdmin]);

  // Filter users based on search query
  const filteredUsers = usersList.filter((u) => {
    const query = searchQuery.toLowerCase().trim();
    return (
      u.name.toLowerCase().includes(query) ||
      u.email.toLowerCase().includes(query) ||
      u.role.toLowerCase().includes(query)
    );
  });

  // Confirm delete handler
  const handleConfirmDelete = async () => {
    if (!userToDelete) return;

    setIsDeleting(true);
    setDeleteError('');

    try {
      const { isSelf } = await deleteUser(userToDelete._id);
      if (!isSelf) {
        // Update users list state locally
        setUsersList((prev) => prev.filter((u) => u._id !== userToDelete._id));
      }
      setUserToDelete(null);
    } catch (err) {
      setDeleteError(err.message || 'Failed to delete user');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="layout-container">
      <Navbar />

      <main className="main-content">
        <div className="dashboard-container">
          {/* Welcome Banner */}
          <div className="welcome-banner">
            <div className="welcome-text">
              <h1>Welcome, {user?.name}!</h1>
              <p>Manage your account settings and profile details below.</p>
            </div>
            <div className={`role-pill ${user?.role}`}>
              <span className="role-dot"></span>
              {user?.role?.toUpperCase()} ACCOUNT
            </div>
          </div>

          {/* User Profile Summary Card */}
          <div className="card profile-card">
            <div className="card-header">
              <div className="user-avatar-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="user-summary-text">
                <h2>{user?.name}</h2>
                <p className="user-email-text">{user?.email}</p>
              </div>
            </div>

            <div className="profile-details-grid">
              <div className="detail-item">
                <span className="detail-label">Account Role</span>
                <span className={`role-badge ${user?.role}`}>{user?.role}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Member Since</span>
                <span className="detail-value">{formatDate(user?.createdAt)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">User ID</span>
                <span className="detail-value code-font">{user?._id}</span>
              </div>
            </div>

            {!isAdmin && (
              <div className="card-actions">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={() => setUserToDelete(user)}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                  Delete My Account
                </button>
              </div>
            )}
          </div>

          {/* Admin Management Section */}
          {isAdmin && (
            <div className="card users-table-card">
              <div className="table-header-section">
                <div>
                  <h2 className="table-title">System Users</h2>
                  <p className="table-subtitle">View and manage registered accounts</p>
                </div>

                {/* Search Bar */}
                <div className="search-box">
                  <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="search-input"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      className="search-clear-btn"
                      onClick={() => setSearchQuery('')}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

              <ErrorMessage message={usersError} />

              {loadingUsers ? (
                <Loader fullPage={false} text="Loading user list..." />
              ) : (
                <div className="table-responsive">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>User</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined Date</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length > 0 ? (
                        filteredUsers.map((u) => {
                          const isSelf = u._id === user._id;
                          return (
                            <tr key={u._id} className={isSelf ? 'row-self' : ''}>
                              <td>
                                <div className="user-cell">
                                  <div className="user-avatar-sm">
                                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                                  </div>
                                  <div className="user-cell-info">
                                    <span className="user-cell-name">
                                      {u.name} {isSelf && <span className="you-tag">(You)</span>}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="text-secondary">{u.email}</td>
                              <td>
                                <span className={`role-badge ${u.role}`}>{u.role}</span>
                              </td>
                              <td className="text-secondary">{formatDate(u.createdAt)}</td>
                              <td className="text-right">
                                <button
                                  type="button"
                                  className="btn-danger-outline btn-sm"
                                  onClick={() => setUserToDelete(u)}
                                  title={isSelf ? 'Delete your own account' : 'Delete user'}
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="5" className="empty-state">
                            {searchQuery
                              ? `No users match "${searchQuery}"`
                              : 'No registered users found.'}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Confirmation Prompt */}
      {userToDelete && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <div className="modal-icon-danger">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <h3>Confirm Delete</h3>
            </div>

            <ErrorMessage message={deleteError} onClose={() => setDeleteError('')} />

            <div className="modal-body">
              {userToDelete._id === user._id ? (
                <p className="warning-text">
                  <strong>Warning:</strong> You are about to delete your own account (
                  <strong>{userToDelete.name}</strong>). You will be logged out immediately and your account will be permanently removed.
                </p>
              ) : (
                <p>
                  Are you sure you want to delete <strong>{userToDelete.name}</strong> (
                  {userToDelete.email})? This action cannot be undone.
                </p>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setUserToDelete(null);
                  setDeleteError('');
                }}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
