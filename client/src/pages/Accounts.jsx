/**
 * @file Accounts.jsx
 * @author Pierre Moreau
 * @since 2025-11-25
 * @purpose Manage user accounts for Family Feud.
 */
import { useEffect, useState } from 'react';

import { useAccounts } from '../context/accounts.context.jsx';
import { deleteUserById, updateUserById } from '../api/users.api.js';

import profileIcon from '../assets/Icon.png';

import Sidebar from '../components/Sidebar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import PageSection from '../components/PageSection.jsx';
import VerifyAction from '../components/VerifyAction.jsx';
import NotificationAction from '../components/NotificationAction.jsx';

import logo from '../../public/Family_Feud_Logo.png';

export default function Accounts() {

  const { isLoadingAccounts, users, setUsers } = useAccounts();
  const [filteredUsers, setFilteredUsers] = useState([]);

  useEffect(() => {
    if (!isLoadingAccounts) setFilteredUsers(users);
  }, [isLoadingAccounts]);

  const [action, setAction] = useState('');
  const [focusedUser, setFocusedUser] = useState({});

  const [isError, setIsError] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);


  const handleDelete = (user) => {
    setAction('delete');
    setFocusedUser(user);
    setShowWarning(true);
  }

  const handleEdit = (user) => {
    setAction('edit');
    setFocusedUser(user);
    setShowWarning(true);
  }

  const handleEditSubmit = async (e) => {
    e?.preventDefault();

    const updatedUser = new FormData();
    updatedUser.append('username', focusedUser.username);
    updatedUser.append('email', focusedUser.email);
    updatedUser.append('image', focusedUser.image);

    await updateUserById(focusedUser._id, updatedUser)
    .then((user) => {
      setUsers(users.map(u => {
        if (u._id === focusedUser._id) return user;
        return u;
      }));
      setFilteredUsers(filteredUsers.map(u => {
        if (u._id === focusedUser._id) return user;
        else return u
      }));
    })
    .catch(error => {
        console.error('Error:', error);
        setIsError(true);
    })
    .finally(() => {
      setShowWarning(false);
      if (isError) setShowError(true);
      else setShowSuccess(true);
    });

  }

  const handleDeleteSubmit = async (e) => {
    e?.preventDefault();
    
    await deleteUserById(focusedUser._id)
      .then(() => {
          setUsers(users.filter(q => q._id !== focusedUser._id));
          setFilteredUsers(filteredUsers.filter(q => q._id !== focusedUser._id));
      })
      .catch(error => {
          console.error('Error:', error);
          setIsError(true);
      })
      .finally(() => {
        setShowWarning(false);
        if (isError) setShowError(true);
        else setShowSuccess(true);
      });
  }

  const handleVerifyCancel = (e) => {
    e.preventDefault();

    setShowWarning(false);
    setFocusedUser({});
    setAction('');
  }

  const handleNotification = (e) => {
    e.preventDefault();

    setShowSuccess(false);
    setShowError(false);
    setFocusedUser({});
    setAction('');
  }

  return (
    <div className="game_theme">

      <Sidebar />

      {
        !showWarning ? null
        : <VerifyAction 
            action={action}
            text={focusedUser.username}
            image={typeof focusedUser.image === 'string' ? focusedUser.image : profileIcon}
            onConfirm={(e) => action === 'edit' ? handleEditSubmit(e) : handleDeleteSubmit(e)} 
            onCancel={(e) => handleVerifyCancel(e)}
          />
      }

      {
        showSuccess ? <NotificationAction type="Success" action={action === 'delete' ? "deleted" : "edited"} text={focusedUser.username} onClose={(e) => handleNotification(e)} />
        : showError ? <NotificationAction type="Error" action={action === 'delete' ? "deleted" : "edited"} text={focusedUser.username} onClose={(e) => handleNotification(e)} />
        : null
      }
      
      <div className="page page--wide accounts-page">
        
        <header className="page__header">
          <p className="eyebrow">Account Database</p>
          <h2>Accounts</h2>
          <p>Manage user accounts for Family Feud.</p>
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
        </header>

        <PageSection
          title="All User Accounts"
          description="Edit or remove user accounts."
          actions={<SearchBar placeholder="Search users..." type="accounts"  data={users} setData={setFilteredUsers} />}
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
              <div className="table-placeholder__accounts">
                <div className="table-placeholder__row table-placeholder__row--head">
                  <span>Avatar</span>
                  <span>Username</span>
                  <span>Email</span>
                  <span>Date Created</span>
                  <span>Actions</span>
                </div>
                {
                  filteredUsers?.slice(0, 10).map((user) => (
                    <div key={user._id || user.id} className="table-placeholder__row" style={{ color: user.admin ? 'yellow' : 'white' }}>
                      <img className='table-placeholder__avatar'
                        src={typeof user.image === 'string' ? user.image : profileIcon}
                        alt={`${user.username}'s avatar`}
                      />
                      <span>{user.username}</span>
                      <span>{user.email}</span>
                      <span>{user.created ? new Date(user.created).toLocaleDateString() : 'Unknown'}</span>
                      <span className="table-placeholder__actions">
                        {
                          user.admin ? null
                          : <>
                            <button
                              type="button"
                              className="link-button"
                              onClick={() => handleEdit(user)}
                            >
                              Edit
                            </button>
                              
                              <button
                                type="button"
                                className="link-button link-button--destructive"
                                onClick={() => handleDelete(user)}
                              >
                                Delete
                              </button>
                          </>
                        }
                      </span>
                    </div>
                  ))
                }
              </div>
            )
          }
        </PageSection>
      </div>
    </div>
  );
}
