import { User, ChatSession } from '../types';

const USERS_KEY = 'txopito_db_users';
const SESSIONS_KEY = 'txopito_db_sessions';
const PASSWORDS_KEY = 'txopito_db_passwords';
const CURRENT_USER_ID_KEY = 'txopito_auth_user_id';

export const db = {
  getUsers: (): User[] => {
    try {
      const data = localStorage.getItem(USERS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("DB Error", e);
      return [];
    }
  },

  saveUsers: (users: User[]) => {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  },

  getSessions: (): ChatSession[] => {
    try {
      const data = localStorage.getItem(SESSIONS_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error("DB Error", e);
      return [];
    }
  },

  saveSessions: (sessions: ChatSession[]) => {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  },

  getCurrentUserId: (): string | null => {
    return localStorage.getItem(CURRENT_USER_ID_KEY);
  },

  setCurrentUserId: (id: string) => {
    localStorage.setItem(CURRENT_USER_ID_KEY, id);
  },

  removeCurrentUserId: () => {
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  },

  // Métodos para gerenciar hashes de senhas
  getUserPasswordHash: (userId: string): string | null => {
    try {
      const passwords = localStorage.getItem(PASSWORDS_KEY);
      const passwordMap = passwords ? JSON.parse(passwords) : {};
      return passwordMap[userId] || null;
    } catch (e) {
      console.error("Password Hash DB Error", e);
      return null;
    }
  },

  saveUserPasswordHash: (userId: string, passwordHash: string) => {
    try {
      const passwords = localStorage.getItem(PASSWORDS_KEY);
      const passwordMap = passwords ? JSON.parse(passwords) : {};
      passwordMap[userId] = passwordHash;
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwordMap));
    } catch (e) {
      console.error("Password Hash Save Error", e);
    }
  },

  // Métodos legados (manter compatibilidade)
  getUserPassword: (userId: string): string | null => {
    return db.getUserPasswordHash(userId);
  },

  saveUserPassword: (userId: string, password: string) => {
    db.saveUserPasswordHash(userId, password);
  },

  removeUserPassword: (userId: string) => {
    try {
      const passwords = localStorage.getItem(PASSWORDS_KEY);
      const passwordMap = passwords ? JSON.parse(passwords) : {};
      delete passwordMap[userId];
      localStorage.setItem(PASSWORDS_KEY, JSON.stringify(passwordMap));
    } catch (e) {
      console.error("Password Remove Error", e);
    }
  },

  // Método para limpar todos os dados (útil para desenvolvimento)
  clearAllData: () => {
    localStorage.removeItem(USERS_KEY);
    localStorage.removeItem(SESSIONS_KEY);
    localStorage.removeItem(PASSWORDS_KEY);
    localStorage.removeItem(CURRENT_USER_ID_KEY);
  }
};