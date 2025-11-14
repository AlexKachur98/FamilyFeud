/**
* @file UserProfile.jsx
* @author Donnette Ansah
* @since 2025-11-13
* @purpose Provides a user profile page where users can view and update their account details.
*/

import { useState } from 'react';
import PageSection from '../components/PageSection.jsx';
import profileIcon from '../assets/Icon.png';

export default function UserProfile() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
});

const [status, setStatus] = useState({
    state: 'idle', 
    message: '',
});

function handleChange(event) {
    const { name, value } = event.target;
    setFormData((prev) => ({
        ...prev,
        [name]: value,
    }));
}

function handleSubmit(event) {
    event.preventDefault();

setStatus({
    state: 'loading',
    message: '',
});

setTimeout(() => {
    setStatus({
        state: 'success',
        message: 'Profile updated!',
});

    console.log('Profile data (fake save):', formData);
}, 500);
}

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
            src={profileIcon}
            alt='Profile Avatar'
            className='avatar-img'
         />
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
        Password
        <input
            type='password'
            name='password'
            value={formData.password}
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