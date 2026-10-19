import { firestoreClient, getStoredToken, setStoredAuth, clearStoredAuth, getStoredUser } from './firestoreClient';

export { getStoredToken, setStoredAuth, clearStoredAuth, getStoredUser };
export const api = firestoreClient;
