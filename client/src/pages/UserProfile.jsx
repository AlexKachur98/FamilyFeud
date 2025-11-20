/**
* @file UserProfile.jsx
* @author Donnette Ansah
* @since 2025-11-13
* @purpose Provides a user profile page where users can view and update their account details.
*/

import { useEffect, useState } from 'react';
import PageSection from '../components/PageSection.jsx';
import profileIcon from '../assets/Icon.png';
import { apiFetch } from '../utils/api.js';
import { useAuth } from '../components/auth/AuthContext.js';

export default function UserProfile() {
    const { user, setUser } = useAuth();

    const [form, setForm] = useState({
        username: user?.username || '',
        password: '',
        image: user?.image || null,
    });

    const [status, setStatus] = useState({
        state: 'idle', 
        message: '',
    });

    function handleChange(e) {
        const { name, value, files } = e.target;
        
        if (files) setForm((prev) => ({ ...prev, image: files[0] }));
        else setForm((prev) => ({ ...prev, [name]: value }) );
    }

    async function handleSubmit(e) {
        e.preventDefault();

        setStatus({ state: 'loading', message: '' });

        const formData = new FormData();
        formData.append('username', form.username);
        formData.append('image', form.image);

        const response = await apiFetch(`/user/${user._id}`, {
            method: 'PUT',
            body: formData
        });

        if (response.ok) {
            const updatedUser = await response.json();
            setUser(updatedUser);
            setStatus({ state: 'success', message: 'Profile updated successfully.' });
        } else {
            setStatus({ state: 'error', message: 'Failed to update profile. Please try again.' });
        }
    }

    const handleImageSearch = (e) => {
        const file = e.target.files && e.target.files[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setForm((prev) => ({ ...prev, image: url }));

        const img = document.getElementById('profile-avatar-img');
        if (img) img.src = url;

        handleChange(e);
    };

    const isSubmitting = status.state === 'loading';

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
                            src={user?.image || profileIcon}
                            id="profile-avatar-img"
                            alt='Profile Avatar'
                            className='avatar-img'
                        />
                        <input 
                            id='profile-image-input'
                            type='file'
                            name='image'
                            accept="image/*"
                            onChange={handleImageSearch}
                        />
                        <label className='profile-avatar-button' htmlFor="profile-image-input">
                            Choose Image
                        </label>
                    </div>


                    <form className='form-stack' onSubmit={handleSubmit}>
                        <label>
                            Username
                            <input
                                type='text'
                                name='username'
                                value={form.username}
                                onChange={handleChange}
                                placeholder='Enter your username'
                                required
                                disabled={isSubmitting}
                            />
                        </label>

                        <label>
                            Password
                            <input
                                type='password'
                                name='password'
                                value={form.password}
                                onChange={handleChange}
                                placeholder='Enter a new password'
                                required
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