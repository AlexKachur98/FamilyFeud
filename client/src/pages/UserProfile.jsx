/**
* @file UserProfile.jsx
* @author Donnette Ansah
* @since 2025-11-13
* @purpose Provides a user profile page where users can view and update their account details.
*/
import { useState } from 'react';

import { apiFetch } from '../api/api.js';
import { useAuth } from '../components/auth/AuthContext.js';

import VerifyAction from '../components/VerifyAction.jsx';
import PageSection from '../components/PageSection.jsx';
import profileIcon from '../assets/Icon.png';
import logo from '/Family_Feud_Logo.png';

import COUNTRY_LIST from '../assets/countries.json';

export default function UserProfile() {
    const { user, setUser } = useAuth();

    const [form, setForm] = useState({
        username: user?.username || '',
        image: user?.image || null,
        country: user?.country || "",
        bio: user?.bio || ""
    });

    const [showWarning, setShowWarning] = useState(false);

    const [formPassword, setFormPassword] = useState({ password: '', confirmPassword: '' });

    const defaultStatus = { state: 'idle', message: '' };
    const [status, setStatus] = useState(defaultStatus);
    const [action, setAction] = useState('');

    function handleChange(e) {
        const { name, value, files } = e.target;
        
        if (files) setForm((prev) => ({ ...prev, image: files[0] }));
        else if (name === 'password' || name === 'confirmPassword') setFormPassword((prev) => ({ ...prev, [name]: value }) );
        else setForm((prev) => ({ ...prev, [name]: value }) );

        if (e.target.name === 'password' && e.target.value === '') setFormPassword({ password: '', confirmPassword: '' });

        setStatus(defaultStatus);
    }

    async function handleEditSubmit(e) {
        e.preventDefault();

        if (formPassword.password !== formPassword.confirmPassword) {
            setStatus({ state: 'error', message: 'Passwords do not match.' });
            return;
        } else if (formPassword.password.length > 0 && formPassword.password.length < 6) {
            setStatus({ state: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        setStatus({ state: 'loading', message: '' });

        const formData = new FormData();
        
        if (form.username) formData.append('username', form.username);
        if (form.image) formData.append('image', form.image);
        if (form.country) formData.append('country', form.country);
        if (form.bio) formData.append('bio', form.bio);
        if (formPassword.password && formPassword.password === formPassword.confirmPassword) formData.append('password', formPassword.password);

        const response = await apiFetch(`/user/${user._id}`, {
            method: 'PUT',
            body: formData,
        });

        if (response.ok) {
            const updatedUser = await response.json();
            setUser(updatedUser);
            setStatus({ state: 'success', message: 'Profile updated.' });
        } else {
            setStatus({ state: 'error', message: 'Profile update unsuccessful. Please try again.' });
        }

        setShowWarning(false);
    }

    const handleVerification = (e, actionType) => {
        e.preventDefault();
        setAction(actionType);
        setShowWarning(true);
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

    async function handleDeleteAccount() {

        setStatus({ state: 'loading', message: '' });
        try {
            const response = await apiFetch(`/user/${user._id}`, {
            method: 'DELETE',
            });

            if (response.ok) {
                setStatus({ state: 'success', message: 'Your account has been deleted.' });
                setUser(null);
                setTimeout(() => {
                    window.location.href = '/';
                }, 1000);
            } else {
                setStatus({ state: 'error', message: 'We ran into an issue trying to delete your account. Please try again.' });
            }
        } catch (err) {
            setStatus({ state: 'error', message: 'Something went wrong while deleting your account. Please try again.' });
        }
        
        setShowWarning(false);
    }

    const handleVerifyCancel = (e) => {
        e.preventDefault();

        setAction('');
        setShowWarning(false);
    }

    const isSubmitting = status.state === 'loading';

    return (
        <div className="game_theme">

            {
                showWarning && (
                    <VerifyAction
                        action={action}
                        text="your account"
                        image={typeof user.image === 'string' ? user.image : profileIcon}
                        onConfirm={(e) => action === 'edit' ? handleEditSubmit(e) : handleDeleteAccount(e)} 
                        onCancel={(e) => handleVerifyCancel(e)}
                    />
                )
            }

            <div className='page page--auth'>
                <header className='page__header'>
                    <p className='eyebrow'>Host Account</p>
                    <h2>My Profile</h2>
                    <p>View and update your account details.</p>
                    <img src={logo} alt="Family Feud Logo" className='page__logo' />
                </header>

                <PageSection
                    title='Profile Information'
                    description='Update your account details below.'
                >                
                        <div className='profile-avatar'>
                            <img
                                src={typeof user.image === 'string' ? user.image : profileIcon}
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


                        <form className='form-stack form-stack--no-card' onSubmit={(e) => handleVerification(e, 'edit')}>
                            <label>
                                Username
                                <input
                                    type='text'
                                    name='username'
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder='Enter your username'
                                    disabled={isSubmitting}
                                />
                            </label>

                            <label>
                                Bio
                                <textarea
                                    name='bio'
                                    value={form?.bio}
                                    onChange={handleChange}
                                    placeholder='Enter your bio...'
                                    disabled={isSubmitting}
                                />
                            </label>

                            <label>
                                Country
                                <select
                                    name="country"
                                    value={form.country}
                                    onChange={handleChange}
                                >
                                    <option value="">Select your country</option>

                                    {COUNTRY_LIST.map((c, index) => (
                                        <option key={`${c.name}-${index}`} value={c.code}>
                                            {c.name}
                                        </option>
                                    ))}
                                </select>
                            </label>
                            
                            <label>
                                Password
                                <input
                                    type='password'
                                    name='password'
                                    value={formPassword.password}
                                    onChange={handleChange}
                                    placeholder='Enter a new password'
                                    disabled={isSubmitting}
                                />
                            </label>
                            <div hidden={formPassword.password === ''}>
                                <label>
                                    Confirm Password
                                    <input
                                        type='password'
                                        name='confirmPassword'
                                        value={formPassword.confirmPassword}
                                        onChange={handleChange}
                                        placeholder='Enter a new password'
                                        disabled={isSubmitting}
                                    />
                                </label>
                            </div>

                            <div className='form-actions'>
                                <button type='submit' disabled={status.state === 'loading'}>
                                    {status.state === 'loading' ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                            
                                
                            <div className='form-actions'>
                                <button type='button'
                                    className='delete-button'
                                    onClick={(e) => handleVerification(e, 'delete')}
                                    disabled={isSubmitting}
                                >
                                    Delete My Account
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
        </div>
    ); 
}