/**
* @file UserProfile.jsx
* @author Donnette Ansah
* @since 2025-11-13
* @purpose Provides a user profile page where users can view and update their account details.
*/

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import profileIcon from '/Default_Avatar.jpg';
import { uploads, users } from '../utils/api.js';
import { useAuth } from '../components/auth/AuthContext.js';
import { placeholderProfile } from '../temp/profilePlaceholder.js';

export default function UserProfile() {
    const { user, isLoggedIn } = useAuth();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        username: '',
        displayName: '',
        bio: '',
        country: '',
        avatarUrl: '',
        password: '',
    });

const [status, setStatus] = useState({
    state: 'idle', 
    message: '',
});

    useEffect(() => {
        if (!user || !user._id) return;
        const loadProfile = async () => {
            try {
                const res = await users.get(user._id);
                if (!res.ok) throw new Error('Failed to load profile');
                const data = await res.json();
                setFormData((prev) => ({
                    ...prev,
                    username: data.username || '',
                    displayName: data.displayName || '',
                bio: data.bio || '',
                country: data.country || '',
                avatarUrl: data.avatarUrl || '',
            }));
        } catch (err) {
                setFormData((prev) => ({
                    ...prev,
                    username: placeholderProfile.username,
                    displayName: placeholderProfile.displayName,
                    bio: placeholderProfile.bio,
                    timezone: placeholderProfile.timezone,
                    avatarUrl: placeholderProfile.avatarUrl
                }));
                setStatus({ state: 'error', message: `${err.message} (loaded placeholder profile)` });
            }
        };
        loadProfile();
    }, [user]);

function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
        ...prev,
        [name]: value,
    }));
}

async function handleAvatarChange(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setStatus({ state: 'loading', message: 'Uploading avatar…' });
    try {
        const res = await uploads.avatar(file);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Avatar upload failed');
        }
        const data = await res.json();
        setFormData((prev) => ({ ...prev, avatarUrl: data.url || '' }));
        setStatus({ state: 'success', message: 'Avatar updated' });
    } catch (err) {
        setStatus({ state: 'error', message: err.message });
    }
}

function handleSubmit(event) {
    event.preventDefault();

setStatus({
    state: 'loading',
    message: '',
});

const save = async () => {
    try {
        if (!user?._id) throw new Error('User not found. Please sign in again.');
        const payload = {
            username: formData.username,
            displayName: formData.displayName,
            bio: formData.bio,
        country: formData.country,
        avatarUrl: formData.avatarUrl
      };
        if (formData.password) payload.password = formData.password;

        const res = await users.update(user._id, payload);
        if (!res.ok) {
            const err = await res.json().catch(() => ({}));
            throw new Error(err.message || 'Profile update failed');
        }
        setStatus({ state: 'success', message: 'Profile updated!' });
    } catch (err) {
        setStatus({ state: 'error', message: err.message });
    }
};
save();
}

const isSubmitting = status.state === 'loading';

if (!isLoggedIn) {
    return (
        <div className='page page--auth'>
            <header className='page__header'>
                <p className='eyebrow'>Host Account</p>
                <h2>Sign in required</h2>
                <p>Please sign in to manage your profile.</p>
            </header>
            <div className='action-grid'>
                <button type='button' className='menu-card__cta' onClick={() => navigate('/signin')}>Sign In</button>
                <button type='button' className='menu-card__cta' onClick={() => navigate('/signup')}>Create Account</button>
            </div>
        </div>
    );
}

return (
    <div className='page page--auth'>
        <header className='page__header'>
            <p className='eyebrow'>Host Account</p>
                <h2>My Profile</h2>
                <p>View and update your account details.</p>
        </header>

        <PageSection
            title='Profile Information'
            description='Update your account details below.'
        >

    <div className='profile-card'>
    <div className='profile-avatar'>
        <img
            src={formData.avatarUrl || profileIcon}
            alt='Profile Avatar'
            className='avatar-img'
         />
        <label className='link-button' style={{ cursor: 'pointer', display: 'inline-block', marginTop: '0.5rem' }}>
            Change Avatar
            <input type='file' accept='image/*' onChange={handleAvatarChange} style={{ display: 'none' }} />
        </label>
    </div>

<form className='form-stack' onSubmit={handleSubmit}>
    <label>
        Username
        <input
            type='text'
            name='username'
            value={formData.username}
            onChange={handleChange}
            placeholder='Enter your username'
            required
            disabled={isSubmitting}
        />
</label>

    <label>
        Display Name
        <input
            type='text'
            name='displayName'
            value={formData.displayName}
            onChange={handleChange}
            placeholder='Public display name'
            disabled={isSubmitting}
        />
</label>

    <label>
        Country / Region
        <input
            type='text'
            name='country'
            value={formData.country}
            onChange={handleChange}
            placeholder='e.g. Canada'
            disabled={isSubmitting}
        />
</label>

    <label>
        Bio
        <textarea
            name='bio'
            value={formData.bio}
            onChange={handleChange}
            placeholder='Tell players a bit about you'
            maxLength={280}
            disabled={isSubmitting}
        />
</label>

    <label>
        Password
        <input
            type='password'
            name='password'
            value={formData.password}
            onChange={handleChange}
            placeholder='Enter a new password (optional)'
            disabled={isSubmitting}
        />
</label>

    <div className='form-actions'>
        <button type='submit' disabled={status.state === 'loading'}>
            {status.state === 'loading' ? 'Saving...' : 'Save Changes'}
    </button>
</div>

    {status.state !== 'idle' && (
        <p
            className={
                'form-status ' +
                    (status.state === 'error' ? 'form-status--error' : 'form-status--success')
                    }
                role='status'
            >
                {status.message}
             </p>
            )}
      </form> 
  </div>
</PageSection>
</div>
); 
}
