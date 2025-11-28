import { apiFetch } from "./api.js";

export const getAllUsers = async () => {
    const response =  await apiFetch(`/user`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
        return [];
    });

    return response;
};

export const getUserById = async (id) => {
    const response =  await apiFetch(`/user/${id}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
        return {};
    });

    return response;
};

export const updateUserById = async (id, user) => {
    const response =  await apiFetch(`/user/${id}`, {
        method: 'PUT',
        body: user
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
        return {};
    });

    return response;
};

export const deleteUserById = async (id) => {
    const response =  await apiFetch(`/user/${id}`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
        }
    })
    .then(response => response.json())
    .then(data => data)
    .catch(error => {
        console.error('Error:', error);
        return {};
    });

    return response;
};