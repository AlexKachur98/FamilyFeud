/**
 * @file EditUser.jsx
 * @author Pierre Moreau
 * @since 2025-11-28
 * @purpose Component to edit user details.
*/

import PageSection from "./PageSection";
import profileIcon from '../assets/Icon.png';
import { useEffect, useState } from "react";

import COUNTRY_LIST from '../assets/countries.json';

export default function EditUser({ user, setUser, onConfirm, onCancel }) {

    const [form, setForm] = useState({
        username: user?.username || '',
        email: user?.email || '',
        country: user?.country || '',
        bio: user?.bio || '',
        image: user?.image || null,
    });

    const [formPassword, setFormPassword] = useState({password: '', confirmPassword: ''});
    
    const defaultStatus = { state: 'idle', message: '' };
    const [status, setStatus] = useState(defaultStatus);
    
    function handleChange(e) {
        const { name, value, files } = e.target;
        
        if (files) setForm((prev) => ({ ...prev, image: files[0] }));
        else setForm((prev) => ({ ...prev, [name]: value }) );

        setStatus(defaultStatus);
    }

    const handlePasswordChange = (e) => {
        setFormPassword((prev) => ({ ...prev, [e.target.name]: e.target.value }));

        if (e.target.name === 'password' && e.target.value === '') {
            setFormPassword({ password: '', confirmPassword: '' });
        }
        
        setStatus(defaultStatus);
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

    useEffect(() => {
        return () => {
            if (form.image && typeof form.image === 'string' && form.image.startsWith('blob:')) {
                URL.revokeObjectURL(form.image);
            }
        };
    }, [form.image]);

    const checkData = (e) => {
        e?.preventDefault();

        if (formPassword.password !== formPassword.confirmPassword) {
            setStatus({ state: 'error', message: 'Passwords do not match.' });
            return;
        } else if (formPassword.password.length > 0 && formPassword.password.length < 6) {
            setStatus({ state: 'error', message: 'Password must be at least 6 characters.' });
            return;
        }

        setStatus(defaultStatus);
        setUser({ ...form, password: formPassword.password });
        onConfirm(e);
    }
    
    const isSubmitting = status.state === 'loading';
    
    return (
        <div className="popup-backdrop" onClick={(e) => e.stopPropagation()}>
            <div className="page page--wide">
                <PageSection title={user.username} description="Editing page for user.">
                    <form className="form-grid grid--edit-user" onSubmit={checkData}>
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
                        </div>
                        
                        <div className="profile-detail">
                            <label><strong>Username:</strong> 
                                <input
                                    type='text'
                                    name='username'
                                    value={form.username}
                                    onChange={handleChange}
                                    placeholder='Enter a username...'
                                    disabled={isSubmitting}
                                />
                            </label>

                            <label><strong>Email:</strong> 
                                <input
                                    type='email'
                                    name='email'
                                    value={form.email}
                                    onChange={handleChange}
                                    placeholder='Enter an email...'
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

                            <span></span>
                            
                            <label><strong>Bio:</strong>
                                <textarea
                                    name='bio'
                                    value={form?.bio}
                                    onChange={handleChange}
                                    placeholder='Enter a bio...'
                                    disabled={isSubmitting}
                                />
                            </label>
                            
                            <div className="edit-password-container">
                                <label><strong>Password:</strong>
                                    <input
                                        type='password'
                                        name='password'
                                        value={formPassword.password}
                                        onChange={handlePasswordChange}
                                        placeholder='Enter a password...'
                                        disabled={isSubmitting}
                                    />
                                </label>
                                <label><strong>Confirm Password:</strong>
                                    <input
                                        type='password'
                                        name='confirmPassword'
                                        value={formPassword.confirmPassword}
                                        onChange={handlePasswordChange}
                                        placeholder='Enter the same password'
                                        disabled={isSubmitting}
                                    />
                                </label>
                            </div>

                        </div>
                            
                        <div className="edit-user-action-buttons--wide">
                            <button type="submit" className="primary-button">Confirm</button>
                            <button type="reset" className="cancel-button" onClick={(e) => onCancel(e)}>Cancel</button>
                            
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
                        </div>
                    </form>
                </PageSection>
            </div>
        </div>
    );
};