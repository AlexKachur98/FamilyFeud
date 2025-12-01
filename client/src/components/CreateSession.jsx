/**
 * @file CreateSession.jsx
 * @author Pierre Moreau
 * @since 2025-11-28
 * @purpose Component to create a new game session.
*/

import { createGameSession } from "../api/sessions.api";
import { useAuth } from "./auth/AuthContext";
import PageSection from "./PageSection";
import { useState } from "react";


export default function CreateSession({ onConfirm, onCancel }) {

    const { user } = useAuth();

    const [form, setForm] = useState({
        hostName: user?.username || '',
        id: '',
        accessCode: ''
    });
    
    const defaultStatus = { state: 'idle', message: '' };
    const [status, setStatus] = useState(defaultStatus);

    async function handleSubmit(e) {
        e.preventDefault();

        const formData = new FormData();
        for (const key in form) formData.append(key, form[key]);

        setStatus({ state: 'loading', message: 'Creating session...' });

        await createGameSession(form)
        .then((data) => {
            setStatus({ state: 'success', message: 'Session created successfully!' });
            onConfirm(data);
        })
        .catch((error) => {
            setStatus({ state: 'error', message: 'Error creating session. Please try again.' });
        });

    }
    
    function handleChange(e) {
        const { name, value, files } = e.target;
        
        if (files) setForm((prev) => ({ ...prev, image: files[0] }));
        else setForm((prev) => ({ ...prev, [name]: value.toUpperCase() }) );

        setStatus(defaultStatus);
    }

    
    return (
        <div className="popup-backdrop" onClick={(e) => e.stopPropagation()}>
            <div className="page page--stacked popup">
                <PageSection title="Create Session" description="Creating a new game session.">
                    <form
                        className="form-stack"
                        onSubmit={handleSubmit}
                    >
                        <label htmlFor="create-room-id">
                            Room ID
                            <input
                                id="create-room-id"
                                name="id"
                                type="text"
                                value={form.id}
                                onChange={handleChange}
                                placeholder="A6X2"
                                maxLength={4}
                                minLength={4}
                                pattern="[A-Za-z0-9]{4}"
                            />
                        </label>
                        <label htmlFor="create-access-code">
                            Access Code
                            <input
                                id="create-access-code"
                                name="accessCode"
                                type="text"
                                inputMode="numeric"
                                value={form.accessCode}
                                onChange={handleChange}
                                placeholder="842159"
                                minLength={6}
                                maxLength={6}
                                pattern="[0-9]{6}"

                            />
                        </label>
                        <button type="submit" className="primary-button">Create Session</button>
                        <button type="button" className="cancel-button" onClick={onCancel}>Cancel</button>

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
                </PageSection>
            </div>
        </div>
    );
};