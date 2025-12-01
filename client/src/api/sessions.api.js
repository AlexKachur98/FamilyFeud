import { apiFetch } from "./api.js";

export const createGameSession = async (sessionData) => {
    const response =  await apiFetch(`/gamesession/`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData)
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
        return {};
    });

    return response;
};

export const checkSessionAccessCode = async (sessionId, accessCode) => {

    const response =  await apiFetch(`/gamesession/${sessionId}/check-code`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accessCode })
    })
    .then(response => response)
    .catch(error => {
        console.error('Error:', error);
    });

    return response;
};