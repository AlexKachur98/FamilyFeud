/**
 * @file Accounts.jsx
 * @author Pierre Moreau
 * @since 2025-11-25
 * @purpose Manage user accounts for Family Feud.
 */
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';

import { useAccounts } from '../context/accounts.context.jsx';

import profileIcon from '../assets/Icon.png';

export default function Accounts() {
  const navigate = useNavigate();

  const { isLoadingAccounts, users, setUsers } = useAccounts();

  return (
    <div className="game_theme">
    <div className="page page--wide accounts-page">
      <header className="page__header">
        <p className="eyebrow">Account Database</p>
        <h2>Accounts</h2>
        <p>Manage user accounts for Family Feud.</p>
      </header>

      <PageSection
        title="All User Accounts"
        description="Edit or remove user accounts."
      >
        {
          isLoadingAccounts ? (
            <div className="loading-message">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="empty-state">
              <p>No users found.</p>
              <p>Create your first user account to manage your game content.</p>
            </div>
          ) : (
            <div className="table-placeholder">
              <div className="table-placeholder__row table-placeholder__row--head">
                <span>Avatar</span>
                <span>Username</span>
                <span>Email</span>
                <span>Date Created</span>
                <span>Actions</span>
              </div>
              {users.slice(0, 20).map((user) => (
                <div key={user._id || user.id} className="table-placeholder__row" style={{ color: user.admin ? 'yellow' : 'white' }}>
                  <img className='table-placeholder__avatar'
                    src={typeof user.image === 'string' ? user.image : profileIcon}
                    alt={`${user.username}'s avatar`}
                  />
                  <span>{user.username}</span>
                  <span>{user.email}</span>
                  <span>{user.created ? new Date(user.created).toLocaleDateString() : 'Unknown'}</span>
                  <span className="table-placeholder__actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => navigate(`/users/${user._id || user.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button link-button--destructive"
                      // onClick={async () => {
                      //   if (window.confirm('Are you sure you want to delete this question set?')) {
                      //     try {
                      //       const response = await fetch(`/api/v1/question-sets/${set._id || set.id}`, {
                      //         method: 'DELETE',
                      //         credentials: 'include',
                      //         headers: { 'Content-Type': 'application/json' },
                      //       });

                      //       if (!response.ok) {
                      //         const errorData = await response.json().catch(() => ({}));
                      //         throw new Error(errorData.message || 'Failed to delete question set');
                      //       }

                      //       // Refresh the list after deletion
                      //       const updatedResponse = await fetch('/api/v1/question-sets', {
                      //         credentials: 'include',
                      //         headers: { 'Content-Type': 'application/json' },
                      //       });

                      //       if (updatedResponse.ok) {
                      //         const updatedData = await updatedResponse.json();
                      //         setQuestionSets(updatedData);
                      //       }
                      //     } catch (err) {
                      //       alert(`Error: ${err.message}`);
                      //     }
                      //   }
                      // }}
                    >
                      Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )
        }
      </PageSection>
    </div>
    </div>
  );
}
