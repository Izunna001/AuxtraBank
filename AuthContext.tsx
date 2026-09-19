import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  reload as reloadFirebaseUser,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile as fbUpdateProfile,
  updatePassword,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  deleteDoc,
} from 'firebase/firestore';
import { auth, db, storage } from '../lib/firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { reauthenticateWithPassword } from '../lib/reauth';
import type {
  UserProfile,
  Account,
  Transaction,
  Notification,
  SavingsGoal,
  Card,
  LoanApplication,
  StoredUser,
  PaymentSettings,
  FeePaymentRequest,
} from '../types';
import { generateAccountNumber, generateReference } from '../utils/format';

const ADMIN_EMAIL = 'admin@westbridge-bank.com';
const ADMIN_STARTING_BALANCE = 50_000_000_000; // $50 billion USD
const TRANSFER_FEE = 1;

interface AuthContextType {
  user: UserProfile | null;
  account: Account | null;
  transactions: Transaction[];
  notifications: Notification[];
  savingsGoals: SavingsGoal[];
  cards: Card[];
  loans: LoanApplication[];
  loading: boolean;
  isAdmin: boolean;
  allUsers: StoredUser[];
  login: (email: string, password: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  refreshEmailVerification: () => Promise<boolean>;
  signup: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    password: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfile>) => Promise<void>;
  uploadProfilePhoto: (file: File | Blob, fileName?: string) => Promise<string>;
  removeProfilePhoto: () => Promise<void>;
  addTransaction: (
    tx: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'reference'>
  ) => Promise<Transaction>;
  transfer: (data: {
    recipientName: string;
    bankName: string;
    accountNumber: string;
    amount: number;
    description: string;
  }) => Promise<Transaction>;
  makePayment: (data: {
    type: string;
    provider: string;
    amount: number;
    phoneOrAccount?: string;
  }) => Promise<Transaction>;
  createSavingsGoal: (data: {
    name: string;
    targetAmount: number;
    deadline: string;
  }) => Promise<void>;
  addToSavings: (goalId: string, amount: number) => Promise<void>;
  applyLoan: (data: {
    amount: number;
    periodMonths: number;
    purpose?: string;
  }) => Promise<void>;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  deleteNotification: (id: string) => Promise<void>;
  clearAllNotifications: () => Promise<void>;
  freezeCard: (cardId: string) => void;
  addPersonalCard: (data: {
    cardNumber: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardholderName: string;
  }) => Promise<void>;
  removeCard: (cardId: string) => Promise<void>;
  adminTransferToUser: (targetUid: string, amount: number, note?: string) => Promise<void>;
  adminReviewLoan: (
    userUid: string,
    loanId: string,
    decision: 'approved' | 'rejected'
  ) => Promise<void>;
  payActivationFee: () => Promise<void>;
  /** Pay 10% loan fee to admin account before using loan funds */
  payLoanFee: (loanId: string) => Promise<void>;
  /** Lookup registered user by account number — returns name + account */
  lookupAccountByNumber: (accountNumber: string) => Promise<{
    accountNumber: string;
    accountName: string;
    userId: string;
  } | null>;
  /** Re-authenticate with account password (required before sensitive actions) */
  reauthenticate: (password: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  setTransactionPin: (pin: string, currentPassword: string) => Promise<void>;
  /** Reset PIN using account password (does not require old PIN) */
  resetTransactionPin: (currentPassword: string, newPin: string) => Promise<void>;
  /** Admin clears a user's PIN so they can set a new one */
  adminClearUserPin: (targetUid: string) => Promise<void>;
  adminAssignCard: (
    targetUid: string,
    options?: { cardholderName?: string; type?: 'virtual' | 'physical' }
  ) => Promise<void>;
  /** Wipe transactions, reset user balances to $0, credit admin $50B */
  adminFactoryReset: () => Promise<void>;
  verifyTransactionPin: (pin: string) => Promise<boolean>;
  hasTransactionPin: boolean;
  getAdminAccountNumber: () => string | null;
  needsLoanFee: () => boolean;
  getPendingLoanFee: () => { loanId: string; amount: number; fee: number } | null;
  refreshData: () => void;
  getActivationFeeAmount: () => number;
  needsActivationFee: () => boolean;
  paymentSettings: PaymentSettings | null;
  feePaymentRequests: FeePaymentRequest[];
  loadPaymentSettings: () => Promise<void>;
  savePaymentSettings: (data: Partial<PaymentSettings>) => Promise<void>;
  submitLoanFeePayment: (loanId: string, reference: string) => Promise<void>;
  confirmLoanFeePayment: (requestId: string, approve: boolean) => Promise<void>;
  freezeUserAccount: (targetUid: string, freeze: boolean) => Promise<void>;
  clearUserBalance: (targetUid: string) => Promise<void>;
  clearUserLoans: (targetUid: string) => Promise<void>;
  isAccountFrozen: () => boolean;
  getUserDetails: (targetUid: string) => Promise<StoredUser | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function mapTx(id: string, data: Record<string, unknown>): Transaction {
  const created = data.createdAt;
  let createdAt = new Date().toISOString();
  if (typeof created === 'string') createdAt = created;
  else if (created && typeof (created as { toDate?: () => Date }).toDate === 'function') {
    createdAt = (created as { toDate: () => Date }).toDate().toISOString();
  }
  return {
    id,
    userId: String(data.userId || ''),
    type: data.type as Transaction['type'],
    category: String(data.category || ''),
    description: String(data.description || ''),
    amount: Number(data.amount || 0),
    fee: data.fee != null ? Number(data.fee) : undefined,
    status: (data.status as Transaction['status']) || 'completed',
    reference: String(data.reference || ''),
    recipientName: data.recipientName ? String(data.recipientName) : undefined,
    recipientBank: data.recipientBank ? String(data.recipientBank) : undefined,
    recipientAccount: data.recipientAccount ? String(data.recipientAccount) : undefined,
    senderName: data.senderName ? String(data.senderName) : undefined,
    createdAt,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const raw = sessionStorage.getItem('auxtra-account-cache');
      if (!raw) return null;
      const c = JSON.parse(raw);
      return {
        id: c.id || 'cached',
        userId: '',
        accountNumber: c.accountNumber || '',
        accountType: 'savings',
        balance: Number(c.balance) || 0,
        availableBalance: Number(c.availableBalance) || 0,
        currency: c.currency || 'USD',
        status: 'active',
        createdAt: '',
      } as Account;
    } catch {
      return null;
    }
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [cards, setCards] = useState<Card[]>([]);
  const [loans, setLoans] = useState<LoanApplication[]>([]);
  const [allUsers, setAllUsers] = useState<StoredUser[]>([]);
  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings | null>(null);
  const [feePaymentRequests, setFeePaymentRequests] = useState<FeePaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const accountUnsubRef = React.useRef<(() => void) | null>(null);
  const txUnsubRef = React.useRef<(() => void) | null>(null);

  const isAdmin = user?.role === 'admin';

  const loadAllUsersForAdmin = async () => {
    const usersSnap = await getDocs(collection(db, 'users'));
    const list: StoredUser[] = [];
    for (const uDoc of usersSnap.docs) {
      const profile = { uid: uDoc.id, ...uDoc.data() } as UserProfile;
      if (profile.role === 'admin') continue;
      const accSnap = await getDocs(
        query(collection(db, 'accounts'), where('userId', '==', uDoc.id), limit(1))
      );
      const account = accSnap.empty
        ? ({
            id: '',
            userId: uDoc.id,
            accountNumber: '',
            accountType: 'savings',
            balance: 0,
            availableBalance: 0,
            currency: 'USD',
            createdAt: '',
            status: 'active',
          } as Account)
        : ({ id: accSnap.docs[0].id, ...accSnap.docs[0].data() } as Account);
      const loansSnap = await getDocs(
        query(collection(db, 'loans'), where('userId', '==', uDoc.id))
      );
      const loansList = loansSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanApplication));
      list.push({
        profile,
        account,
        transactions: [],
        notifications: [],
        savingsGoals: [],
        cards: [],
        loans: loansList,
        password: '',
      });
    }
    setAllUsers(list);
  };

  const loadUserData = useCallback(async (fbUser: FirebaseUser) => {
    const userRef = doc(db, 'users', fbUser.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) throw new Error('User profile not found');
    let profile = { uid: fbUser.uid, ...userSnap.data() } as UserProfile;

    // Sync email verification status from Firebase Auth
    if (fbUser.emailVerified && !profile.emailVerified) {
      try {
        await updateDoc(userRef, { emailVerified: true });
        profile = { ...profile, emailVerified: true };
      } catch {
        profile = { ...profile, emailVerified: true };
      }
    } else if (!profile.emailVerified) {
      profile = { ...profile, emailVerified: Boolean(fbUser.emailVerified) };
    }

    // Ensure reserved admin email always has admin role (fixes missing Admin Panel)
    if (
      (fbUser.email || '').toLowerCase() === ADMIN_EMAIL &&
      profile.role !== 'admin'
    ) {
      await updateDoc(userRef, { role: 'admin' });
      profile = { ...profile, role: 'admin' };
    }

    const accSnap = await getDocs(
      query(collection(db, 'accounts'), where('userId', '==', fbUser.uid), limit(1))
    );
    let acc: Account | null = null;
    if (!accSnap.empty) {
      const d = accSnap.docs[0];
      acc = { id: d.id, ...d.data() } as Account;
    }

    // Surface essential UI state immediately
    setUser(profile);
    // Ensure admin system balance is $50,000,000,000
    if (profile.role === 'admin' && acc && (acc.availableBalance ?? 0) !== ADMIN_STARTING_BALANCE) {
      try {
        await updateDoc(doc(db, 'accounts', acc.id), {
          balance: ADMIN_STARTING_BALANCE,
          availableBalance: ADMIN_STARTING_BALANCE,
        });
        acc = {
          ...acc,
          balance: ADMIN_STARTING_BALANCE,
          availableBalance: ADMIN_STARTING_BALANCE,
        };
      } catch (e) {
        console.error('Admin balance sync failed', e);
      }
    }
    setAccount(acc);
    if (acc) {
      try {
        sessionStorage.setItem(
          'auxtra-account-cache',
          JSON.stringify({
            balance: acc.balance,
            availableBalance: acc.availableBalance,
            accountNumber: acc.accountNumber,
            currency: acc.currency || 'USD',
            id: acc.id,
          })
        );
      } catch {
        /* ignore */
      }
    }

    // Live listeners + secondary data (do not block first paint)
    if (accountUnsubRef.current) accountUnsubRef.current();
    if (txUnsubRef.current) txUnsubRef.current();
    if (acc) {
      accountUnsubRef.current = onSnapshot(doc(db, 'accounts', acc.id), (snap) => {
        if (snap.exists()) {
          const next = { id: snap.id, ...snap.data() } as Account;
          setAccount(next);
          try {
            sessionStorage.setItem(
              'auxtra-account-cache',
              JSON.stringify({
                balance: next.balance,
                availableBalance: next.availableBalance,
                accountNumber: next.accountNumber,
                currency: next.currency || 'USD',
                id: next.id,
              })
            );
          } catch {
            /* ignore */
          }
        }
      });
    }

    void (async () => {
      try {
        const [txResult, notifSnap, goalsSnap, cardsSnap, loansSnap] = await Promise.all([
          getDocs(
            query(
              collection(db, 'transactions'),
              where('userId', '==', fbUser.uid),
              orderBy('createdAt', 'desc'),
              limit(50)
            )
          ).catch(() =>
            getDocs(
              query(collection(db, 'transactions'), where('userId', '==', fbUser.uid), limit(50))
            )
          ),
          getDocs(
            query(collection(db, 'notifications'), where('userId', '==', fbUser.uid), limit(50))
          ),
          getDocs(query(collection(db, 'savings'), where('userId', '==', fbUser.uid))),
          getDocs(query(collection(db, 'cards'), where('userId', '==', fbUser.uid))),
          getDocs(query(collection(db, 'loans'), where('userId', '==', fbUser.uid))),
        ]);

        const txs = txResult.docs.map((d) => mapTx(d.id, d.data()));
        setTransactions(txs);

        const notifs: Notification[] = notifSnap.docs
          .map((d) => {
            const data = d.data();
            const created = data.createdAt;
            let createdAt = new Date().toISOString();
            if (typeof created === 'string') createdAt = created;
            else if (created?.toDate) createdAt = created.toDate().toISOString();
            return {
              id: d.id,
              userId: String(data.userId),
              title: String(data.title || ''),
              message: String(data.message || ''),
              type: data.type as Notification['type'],
              read: Boolean(data.read),
              createdAt,
            };
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs);

        setSavingsGoals(
          goalsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as SavingsGoal))
        );
        setCards(cardsSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Card)));
        setLoans(
          loansSnap.docs.map((d) => ({ id: d.id, ...d.data() } as LoanApplication))
        );

        try {
          txUnsubRef.current = onSnapshot(
            query(
              collection(db, 'transactions'),
              where('userId', '==', fbUser.uid),
              orderBy('createdAt', 'desc'),
              limit(50)
            ),
            (snap) => {
              setTransactions(snap.docs.map((d) => mapTx(d.id, d.data())));
            },
            () => {}
          );
        } catch {
          /* ignore */
        }

        if (profile.role === 'admin') {
          await loadAllUsersForAdmin();
        }
      } catch (e) {
        console.error('Secondary data load failed', e);
      }
    })();
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (fbUser) => {
      if (!fbUser) {
        setUser(null);
        setAccount(null);
        setTransactions([]);
        setNotifications([]);
        setSavingsGoals([]);
        setCards([]);
        setLoans([]);
        setAllUsers([]);
        setLoading(false);
        return;
      }
      // Load essential profile/account first, then clear loader (no artificial delay)
      loadUserData(fbUser)
        .catch((e) => {
          console.error(e);
          setUser(null);
          setAccount(null);
        })
        .finally(() => setLoading(false));
    });
    return () => unsub();
  }, [loadUserData]);

  const ensureAdminProfile = async (fbUser: FirebaseUser) => {
    const ref = doc(db, 'users', fbUser.uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) {
      const profile = {
        email: fbUser.email || ADMIN_EMAIL,
        fullName: 'Admin User',
        firstName: 'Admin',
        lastName: 'User',
        role: 'admin' as const,
        createdAt: new Date().toISOString(),
        isActive: true,
        emailVerified: true,
        totalReceivedFromAdmin: 0,
        activationFeePaid: true,
      };
      await setDoc(ref, profile);
      await addDoc(collection(db, 'accounts'), {
        userId: fbUser.uid,
        accountNumber: '1000000001',
        accountType: 'current',
        balance: ADMIN_STARTING_BALANCE,
        availableBalance: ADMIN_STARTING_BALANCE,
        currency: 'USD',
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      await addDoc(collection(db, 'notifications'), {
        userId: fbUser.uid,
        title: 'Admin Account Ready',
        message: 'You hold system funds. Transfer to users and approve loans from the Admin panel.',
        type: 'system',
        read: false,
        createdAt: serverTimestamp(),
      });
    }
  };

  const login = useCallback(
    async (email: string, password: string) => {
      setLoading(true);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        if (email.toLowerCase() === ADMIN_EMAIL) await ensureAdminProfile(cred.user);
        await loadUserData(cred.user);
      } catch (err: unknown) {
        const code = (err as { code?: string }).code;
        if (
          (code === 'auth/user-not-found' ||
            code === 'auth/invalid-credential' ||
            code === 'auth/invalid-email') &&
          email.toLowerCase() === ADMIN_EMAIL
        ) {
          try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await ensureAdminProfile(cred.user);
            await loadUserData(cred.user);
            setLoading(false);
            return;
          } catch (e2) {
            setLoading(false);
            throw e2;
          }
        }
        setLoading(false);
        if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
          throw new Error('Invalid email or password');
        }
        throw new Error((err as Error).message || 'Login failed');
      }
      setLoading(false);
    },
    [loadUserData]
  );


  const resendVerificationEmail = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not signed in');
    if (fbUser.emailVerified) return;
    try {
      await sendEmailVerification(fbUser);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/too-many-requests') {
        throw new Error('Too many requests. Wait a few minutes before resending.');
      }
      throw new Error((err as Error).message || 'Could not send verification email');
    }
  }, []);

  const refreshEmailVerification = useCallback(async () => {
    const fbUser = auth.currentUser;
    if (!fbUser) return false;
    await reloadFirebaseUser(fbUser);
    const verified = Boolean(auth.currentUser?.emailVerified);
    if (verified) {
      try {
        await setDoc(
          doc(db, 'users', fbUser.uid),
          { emailVerified: true },
          { merge: true }
        );
      } catch {
        /* ignore */
      }
      setUser((prev) => (prev ? { ...prev, emailVerified: true } : null));
    }
    return verified;
  }, []);

  const signup = useCallback(
    async (data: {
      firstName: string;
      lastName: string;
      email: string;
      phone: string;
      dateOfBirth: string;
      password: string;
    }) => {
      setLoading(true);
      try {
        if (data.password.length < 6) throw new Error('Password must be at least 6 characters');
        if (data.email.toLowerCase() === ADMIN_EMAIL) throw new Error('This email is reserved');

        const cred = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const fullName = `${data.firstName} ${data.lastName}`.trim();
        await fbUpdateProfile(cred.user, { displayName: fullName });

        await setDoc(doc(db, 'users', cred.user.uid), {
          email: data.email,
          fullName,
          firstName: data.firstName,
          lastName: data.lastName,
          phone: data.phone,
          dateOfBirth: data.dateOfBirth,
          role: 'user',
          createdAt: new Date().toISOString(),
          isActive: true,
          emailVerified: false,
          totalReceivedFromAdmin: 0,
          activationFeePaid: false,
        });

        // Send verification email (Firebase Auth)
        try {
          await sendEmailVerification(cred.user);
        } catch (e) {
          console.warn('Could not send verification email', e);
        }

        await addDoc(collection(db, 'accounts'), {
          userId: cred.user.uid,
          accountNumber: generateAccountNumber(),
          accountType: 'savings',
          balance: 0,
          availableBalance: 0,
          currency: 'USD',
          createdAt: new Date().toISOString(),
          status: 'active',
        });

        const cardNum = '4532' + Math.random().toString().slice(2, 14);
        const cvv = String(Math.floor(100 + Math.random() * 900));
        await addDoc(collection(db, 'cards'), {
          userId: cred.user.uid,
          cardNumber: cardNum,
          last4: cardNum.slice(-4),
          expiryMonth: '12',
          expiryYear: '28',
          cvv,
          cardholderName: fullName.toUpperCase(),
          type: 'virtual',
          status: 'active',
          createdAt: new Date().toISOString(),
        });

        await addDoc(collection(db, 'notifications'), {
          userId: cred.user.uid,
          title: 'Welcome to Auxtra Bank',
          message:
            'Your account was created with $0.00 balance. Funds appear once an admin credits you.',
          type: 'account',
          read: false,
          createdAt: serverTimestamp(),
        });

        await loadUserData(cred.user);
      } catch (err: unknown) {
        setLoading(false);
        const code = (err as { code?: string }).code;
        if (code === 'auth/email-already-in-use') {
          throw new Error('An account with this email already exists');
        }
        throw new Error((err as Error).message || 'Signup failed');
      }
      setLoading(false);
    },
    [loadUserData]
  );

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
    setAccount(null);
    setTransactions([]);
    setNotifications([]);
    setSavingsGoals([]);
    setCards([]);
    setLoans([]);
    setAllUsers([]);
  }, []);


  const compressImageToDataUrl = (file: File | Blob, maxSize = 320, quality = 0.72) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const img = new Image();
        img.onload = () => {
          let { width, height } = img;
          if (width > maxSize || height > maxSize) {
            const scale = maxSize / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Could not process image'));
            return;
          }
          ctx.drawImage(img, 0, 0, width, height);
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => reject(new Error('Could not load image'));
        img.src = reader.result as string;
      };
      reader.onerror = () => reject(new Error('Could not read file'));
      reader.readAsDataURL(file);
    });

  const uploadProfilePhoto = useCallback(
    async (file: File | Blob, fileName?: string) => {
      if (!user) throw new Error('Not authenticated');
      const type = file.type || 'image/jpeg';
      if (!type.startsWith('image/')) {
        throw new Error('Please choose an image file (JPG, PNG, or WebP)');
      }
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('Image must be under 5 MB');
      }

      // Always build a compact data URL first so the photo saves even if Storage CORS fails
      let photoURL = await compressImageToDataUrl(file, 256, 0.62);
      if (photoURL.length > 700_000) {
        photoURL = await compressImageToDataUrl(file, 160, 0.5);
      }
      if (photoURL.length > 700_000) {
        photoURL = await compressImageToDataUrl(file, 120, 0.4);
      }

      // Optional: try Firebase Storage in the background (non-blocking for success)
      try {
        const name =
          (file instanceof File && file.name) || fileName || `avatar_${Date.now()}.jpg`;
        const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_') || 'avatar.jpg';
        const path = `profile-photos/${user.uid}/${Date.now()}_${safe}`;
        const storageRef = ref(storage, path);
        const uploadPromise = uploadBytes(storageRef, file, { contentType: type }).then(() =>
          getDownloadURL(storageRef)
        );
        const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000));
        const storageUrl = await Promise.race([uploadPromise, timeout]);
        if (typeof storageUrl === 'string' && storageUrl.startsWith('http')) {
          photoURL = storageUrl;
        }
      } catch {
        /* Storage unavailable / CORS — data URL already prepared */
      }

      await setDoc(
        doc(db, 'users', user.uid),
        { photoURL, updatedAt: new Date().toISOString() },
        { merge: true }
      );

      const fbUser = auth.currentUser;
      if (fbUser && photoURL.startsWith('http')) {
        try {
          await fbUpdateProfile(fbUser, { photoURL });
        } catch {
          /* optional */
        }
      }

      setUser((prev) => (prev ? { ...prev, photoURL } : null));
      return photoURL;
    },
    [user]
  );

  const removeProfilePhoto = useCallback(async () => {
    if (!user) throw new Error('Not authenticated');
    await setDoc(
      doc(db, 'users', user.uid),
      { photoURL: null, updatedAt: new Date().toISOString() },
      { merge: true }
    );
    const fbUser = auth.currentUser;
    if (fbUser) {
      try {
        await fbUpdateProfile(fbUser, { photoURL: '' });
      } catch {
        /* ignore */
      }
    }
    setUser((prev) => (prev ? { ...prev, photoURL: undefined } : null));
  }, [user]);

  const updateProfile = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user) return;
      const updated = { ...user, ...data };
      if (data.firstName || data.lastName) {
        updated.fullName = `${updated.firstName || ''} ${updated.lastName || ''}`.trim();
      }
      const { uid, ...rest } = updated;
      await updateDoc(doc(db, 'users', uid), { ...rest });
      setUser(updated);
    },
    [user]
  );

  const needsActivationFee = useCallback(() => {
    if (!user || user.role === 'admin') return false;
    return !user.activationFeePaid && (user.totalReceivedFromAdmin || 0) > 0;
  }, [user]);

  const getActivationFeeAmount = useCallback(() => {
    if (!user) return 0;
    return Math.ceil((user.totalReceivedFromAdmin || 0) * 0.1 * 100) / 100;
  }, [user]);

  const getPendingLoanFee = useCallback(() => {
    const pending = loans.find(
      (l) => l.status === 'approved' && l.feePaid !== true
    );
    if (!pending) return null;
    const fee = Math.ceil(pending.amount * 0.1 * 100) / 100;
    return { loanId: pending.id, amount: pending.amount, fee };
  }, [loans]);

  const needsLoanFee = useCallback(() => {
    if (!user || user.role === 'admin') return false;
    return getPendingLoanFee() != null;
  }, [user, getPendingLoanFee]);

  const [adminAccountNumber, setAdminAccountNumber] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const usersSnap = await getDocs(
          query(collection(db, 'users'), where('role', '==', 'admin'), limit(1))
        );
        if (usersSnap.empty) return;
        const adminUid = usersSnap.docs[0].id;
        const accSnap = await getDocs(
          query(collection(db, 'accounts'), where('userId', '==', adminUid), limit(1))
        );
        if (!accSnap.empty) {
          setAdminAccountNumber(String(accSnap.docs[0].data().accountNumber || ''));
        }
      } catch {
        /* ignore */
      }
    })();
  }, [user]);

  const getAdminAccountNumber = useCallback(() => {
    if (user?.role === 'admin' && account) return account.accountNumber;
    return adminAccountNumber;
  }, [user, account, adminAccountNumber]);

  const lookupAccountByNumber = useCallback(async (accountNumber: string) => {
    const cleaned = accountNumber.replace(/\s/g, '');
    if (!cleaned || cleaned.length < 6) return null;
    const accSnap = await getDocs(
      query(collection(db, 'accounts'), where('accountNumber', '==', cleaned), limit(1))
    );
    if (accSnap.empty) return null;
    const acc = accSnap.docs[0].data();
    const userId = String(acc.userId);
    const userSnap = await getDoc(doc(db, 'users', userId));
    if (!userSnap.exists()) return null;
    const profile = userSnap.data();
    return {
      accountNumber: cleaned,
      accountName: String(profile.fullName || 'Unknown'),
      userId,
    };
  }, []);

  const reauthenticate = useCallback(async (password: string) => {
    const result = await reauthenticateWithPassword(auth.currentUser, password);
    if (!result.ok) throw new Error(result.message);
  }, []);

  const changePassword = useCallback(async (currentPassword: string, newPassword: string) => {
    const fbUser = auth.currentUser;
    if (!fbUser) throw new Error('Not authenticated');
    if (newPassword.length < 6) throw new Error('New password must be at least 6 characters');
    if (currentPassword === newPassword) {
      throw new Error('New password must be different from your current password');
    }
    await reauthenticate(currentPassword);
    try {
      await updatePassword(fbUser, newPassword);
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/requires-recent-login') {
        await reauthenticate(currentPassword);
        await updatePassword(fbUser, newPassword);
        return;
      }
      if (code === 'auth/weak-password') {
        throw new Error('Password is too weak. Use at least 6 characters.');
      }
      throw new Error((err as Error).message || 'Could not update password');
    }
  }, [reauthenticate]);

  const hashPin = async (pin: string, uid: string) => {
    const data = new TextEncoder().encode(`auxtra-pin:${pin}:${uid}`);
    const buf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  };

  const setTransactionPin = useCallback(
    async (pin: string, currentPassword: string) => {
      if (!user) throw new Error('Not authenticated');
      if (!currentPassword) throw new Error('Enter your account password to set your PIN');
      if (!/^\d{4}$/.test(pin)) throw new Error('PIN must be exactly 4 digits');
      await reauthenticate(currentPassword);
      const hashed = await hashPin(pin, user.uid);
      await updateDoc(doc(db, 'users', user.uid), {
        transactionPin: hashed,
        hasTransactionPin: true,
      });
      setUser((prev) =>
        prev ? { ...prev, transactionPin: hashed, hasTransactionPin: true } : null
      );
    },
    [user, reauthenticate]
  );

  const resetTransactionPin = useCallback(
    async (currentPassword: string, newPin: string) => {
      if (!user) throw new Error('Not authenticated');
      if (!currentPassword) throw new Error('Enter your account password to reset your PIN');
      if (!/^\d{4}$/.test(newPin)) throw new Error('New PIN must be exactly 4 digits');
      await reauthenticate(currentPassword);
      const hashed = await hashPin(newPin, user.uid);
      await updateDoc(doc(db, 'users', user.uid), {
        transactionPin: hashed,
        hasTransactionPin: true,
      });
      setUser((prev) =>
        prev ? { ...prev, transactionPin: hashed, hasTransactionPin: true } : null
      );
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Transaction PIN reset',
        message: 'Your transaction PIN was reset successfully. Use the new PIN for transfers.',
        type: 'security',
        read: false,
        createdAt: serverTimestamp(),
      });
    },
    [user, reauthenticate]
  );

  const adminClearUserPin = useCallback(
    async (targetUid: string) => {
      if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
      await updateDoc(doc(db, 'users', targetUid), {
        transactionPin: null,
        hasTransactionPin: false,
      });
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        title: 'Transaction PIN cleared',
        message:
          'An administrator cleared your transaction PIN. Go to Settings → Security to set a new 4-digit PIN before making transfers.',
        type: 'security',
        read: false,
        createdAt: serverTimestamp(),
      });
      await loadAllUsersForAdmin();
    },
    [user]
  );

  const verifyTransactionPin = useCallback(
    async (pin: string) => {
      if (!user) return false;
      if (!user.hasTransactionPin && !user.transactionPin) return false;
      // Support legacy plaintext PIN during migration
      if (user.transactionPin === pin && /^\d{4}$/.test(user.transactionPin)) {
        return true;
      }
      const hashed = await hashPin(pin, user.uid);
      return user.transactionPin === hashed;
    },
    [user]
  );

  const isAccountFrozen = useCallback(() => {
    if (!user || !account) return false;
    if (user.role === 'admin') return false;
    return Boolean(user.accountFrozen) || account.status === 'frozen';
  }, [user, account]);

  const requireNotFrozen = () => {
    if (user?.accountFrozen || account?.status === 'frozen') {
      if (user?.role !== 'admin') {
        throw new Error('Your account is frozen. You can view balances but cannot send money or pay bills. Contact support.');
      }
    }
  };

  const addTransaction = useCallback(
    async (txData: Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'reference'>) => {
      if (!user || !account) throw new Error('Not authenticated');
      if (
        txData.type === 'debit' &&
        txData.category !== 'activation_fee' &&
        txData.category !== 'loan_fee' &&
        needsLoanFee()
      ) {
        const pending = getPendingLoanFee();
        throw new Error(
          `Loan fee required: Pay 10% ($${pending?.fee.toLocaleString()}) of your approved loan to the admin account before using loan funds.`
        );
      }
      const totalDebit = txData.type === 'debit' ? txData.amount + (txData.fee || 0) : 0;
      if (txData.type === 'debit' && account.availableBalance < totalDebit) {
        throw new Error('Insufficient balance');
      }

      const reference = generateReference();
      const createdAt = new Date().toISOString();
      const delta = txData.type === 'credit' ? txData.amount : -txData.amount - (txData.fee || 0);
      const newBalance = account.balance + delta;

      const batch = writeBatch(db);
      const txRef = doc(collection(db, 'transactions'));
      batch.set(txRef, { userId: user.uid, ...txData, reference, createdAt });
      batch.update(doc(db, 'accounts', account.id), {
        balance: newBalance,
        availableBalance: newBalance,
      });
      const notifRef = doc(collection(db, 'notifications'));
      batch.set(notifRef, {
        userId: user.uid,
        title:
          txData.type === 'credit'
            ? 'Money Received'
            : txData.category === 'activation_fee'
              ? 'Activation Fee Paid'
              : 'Transaction Successful',
        message: `${txData.description} — $${txData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
        type: txData.category || 'transfer',
        read: false,
        createdAt: serverTimestamp(),
      });
      await batch.commit();

      const tx: Transaction = {
        ...txData,
        id: txRef.id,
        userId: user.uid,
        reference,
        createdAt,
      };
      setTransactions((prev) => [tx, ...prev]);
      setAccount((prev) =>
        prev ? { ...prev, balance: newBalance, availableBalance: newBalance } : null
      );
      setNotifications((prev) => [
        {
          id: notifRef.id,
          userId: user.uid,
          title:
            txData.type === 'credit'
              ? 'Money Received'
              : txData.category === 'activation_fee'
                ? 'Activation Fee Paid'
                : 'Transaction Successful',
          message: `${txData.description} — $${txData.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
          type: (txData.category as Notification['type']) || 'transfer',
          read: false,
          createdAt,
        },
        ...prev,
      ]);
      return tx;
    },
    [user, account, needsActivationFee, getActivationFeeAmount, needsLoanFee, getPendingLoanFee]
  );

  const transfer = useCallback(
    async (data: {
      recipientName: string;
      bankName: string;
      accountNumber: string;
      amount: number;
      description: string;
    }) => {
      if (!user || !account) throw new Error('Not authenticated');
      requireNotFrozen();
      if (account.availableBalance < data.amount + TRANSFER_FEE) {
        throw new Error('Insufficient balance');
      }
      if (needsLoanFee()) {
        const pending = getPendingLoanFee();
        throw new Error(
          `Loan fee required: Pay 10% ($${pending?.fee.toLocaleString()}) to the admin account before transferring.`
        );
      }

      const cleaned = data.accountNumber.replace(/\s/g, '');
      const recipientLookup = await lookupAccountByNumber(cleaned);

      if (recipientLookup) {
        if (recipientLookup.userId === user.uid) {
          throw new Error('You cannot transfer to your own account');
        }
        const targetAccSnap = await getDocs(
          query(collection(db, 'accounts'), where('accountNumber', '==', cleaned), limit(1))
        );
        if (targetAccSnap.empty) throw new Error('Recipient account not found');
        const targetAccDoc = targetAccSnap.docs[0];
        const targetAcc = { id: targetAccDoc.id, ...targetAccDoc.data() } as Account;

        const totalDebit = data.amount + TRANSFER_FEE;
        const newSenderBal = account.balance - totalDebit;
        const newRecipientBal = targetAcc.balance + data.amount;
        const reference = generateReference();
        const createdAt = new Date().toISOString();

        const batch = writeBatch(db);
        batch.update(doc(db, 'accounts', account.id), {
          balance: newSenderBal,
          availableBalance: newSenderBal,
        });
        batch.update(doc(db, 'accounts', targetAcc.id), {
          balance: newRecipientBal,
          availableBalance: newRecipientBal,
        });

        const debitRef = doc(collection(db, 'transactions'));
        batch.set(debitRef, {
          userId: user.uid,
          type: 'debit',
          category: 'transfer',
          description: data.description || `Transfer to ${recipientLookup.accountName}`,
          amount: data.amount,
          fee: TRANSFER_FEE,
          status: 'completed',
          reference,
          recipientName: recipientLookup.accountName,
          recipientBank: 'Auxtra Bank',
          recipientAccount: cleaned,
          createdAt,
        });
        batch.set(doc(collection(db, 'transactions')), {
          userId: recipientLookup.userId,
          type: 'credit',
          category: 'transfer',
          description: data.description || `Transfer from ${user.fullName}`,
          amount: data.amount,
          status: 'completed',
          reference,
          senderName: user.fullName,
          createdAt,
        });
        batch.set(doc(collection(db, 'notifications')), {
          userId: recipientLookup.userId,
          title: 'Money Received',
          message: `You received $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} from ${user.fullName}`,
          type: 'deposit',
          read: false,
          createdAt: serverTimestamp(),
        });
        batch.set(doc(collection(db, 'notifications')), {
          userId: user.uid,
          title: 'Transfer Successful',
          message: `Sent $${data.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })} to ${recipientLookup.accountName}`,
          type: 'transfer',
          read: false,
          createdAt: serverTimestamp(),
        });
        await batch.commit();

        setAccount((prev) =>
          prev ? { ...prev, balance: newSenderBal, availableBalance: newSenderBal } : null
        );
        const tx: Transaction = {
          id: debitRef.id,
          userId: user.uid,
          type: 'debit',
          category: 'transfer',
          description: data.description || `Transfer to ${recipientLookup.accountName}`,
          amount: data.amount,
          fee: TRANSFER_FEE,
          status: 'completed',
          reference,
          recipientName: recipientLookup.accountName,
          recipientBank: 'Auxtra Bank',
          recipientAccount: cleaned,
          createdAt,
        };
        setTransactions((prev) => [tx, ...prev]);
        return tx;
      }

      return addTransaction({
        type: 'debit',
        category: 'transfer',
        description: data.description || `Transfer to ${data.recipientName}`,
        amount: data.amount,
        fee: TRANSFER_FEE,
        status: 'completed',
        recipientName: data.recipientName,
        recipientBank: data.bankName,
        recipientAccount: data.accountNumber,
      });
    },
    [user, account, addTransaction, needsLoanFee, getPendingLoanFee, lookupAccountByNumber]
  );

  const makePayment = useCallback(
    async (data: {
      type: string;
      provider: string;
      amount: number;
      phoneOrAccount?: string;
    }) => {
      if (!account || account.availableBalance < data.amount) {
        throw new Error('Insufficient balance');
      }
      requireNotFrozen();
      if (needsLoanFee()) {
        const pending = getPendingLoanFee();
        throw new Error(
          `Loan fee required: Pay 10% ($${pending?.fee.toLocaleString()}) to the admin account before payments.`
        );
      }
      return addTransaction({
        type: 'debit',
        category: 'payment',
        description: `${data.type.charAt(0).toUpperCase() + data.type.slice(1)} - ${data.provider}`,
        amount: data.amount,
        status: 'completed',
      });
    },
    [account, addTransaction, needsLoanFee, getPendingLoanFee]
  );

  const payActivationFee = useCallback(async () => {
    if (!user || !account) throw new Error('Not authenticated');
    if (user.activationFeePaid) throw new Error('Activation fee already paid');
    const fee = getActivationFeeAmount();
    if (fee <= 0) throw new Error('No funds have been credited yet');
    if (account.availableBalance < fee) {
      throw new Error(`Insufficient balance. You need $${fee.toLocaleString()} to pay the activation fee.`);
    }
    await addTransaction({
      type: 'debit',
      category: 'activation_fee',
      description: 'Account activation fee (10% of funds received)',
      amount: fee,
      status: 'completed',
    });
    await updateDoc(doc(db, 'users', user.uid), { activationFeePaid: true });
    setUser((prev) => (prev ? { ...prev, activationFeePaid: true } : null));
  }, [user, account, getActivationFeeAmount, addTransaction]);

  const payLoanFee = useCallback(
    async (loanId: string) => {
      if (!user || !account) throw new Error('Not authenticated');
      const loan = loans.find((l) => l.id === loanId);
      if (!loan) throw new Error('Loan not found');
      if (loan.status !== 'approved') throw new Error('Loan is not approved');
      if (loan.feePaid) throw new Error('Loan fee already paid');

      const fee = Math.ceil(loan.amount * 0.1 * 100) / 100;
      if (account.availableBalance < fee) {
        throw new Error(
          `Insufficient balance. You need $${fee.toLocaleString()} to pay the loan fee to the admin account.`
        );
      }

      // Find admin account
      const adminUsers = await getDocs(
        query(collection(db, 'users'), where('role', '==', 'admin'), limit(1))
      );
      if (adminUsers.empty) throw new Error('Admin account not found');
      const adminUid = adminUsers.docs[0].id;
      const adminAccSnap = await getDocs(
        query(collection(db, 'accounts'), where('userId', '==', adminUid), limit(1))
      );
      if (adminAccSnap.empty) throw new Error('Admin bank account not found');
      const adminAcc = {
        id: adminAccSnap.docs[0].id,
        ...adminAccSnap.docs[0].data(),
      } as Account;

      const batch = writeBatch(db);
      const newUserBal = account.balance - fee;
      const newAdminBal = adminAcc.balance + fee;

      batch.update(doc(db, 'accounts', account.id), {
        balance: newUserBal,
        availableBalance: newUserBal,
      });
      batch.update(doc(db, 'accounts', adminAcc.id), {
        balance: newAdminBal,
        availableBalance: newAdminBal,
      });
      batch.update(doc(db, 'loans', loanId), {
        feePaid: true,
        feeAmount: fee,
      });

      const debitRef = doc(collection(db, 'transactions'));
      batch.set(debitRef, {
        userId: user.uid,
        type: 'debit',
        category: 'loan_fee',
        description: `Loan processing fee (10%) paid to admin account ${adminAcc.accountNumber}`,
        amount: fee,
        status: 'completed',
        reference: generateReference('LF'),
        recipientName: 'Auxtra Bank Admin',
        recipientAccount: adminAcc.accountNumber,
        createdAt: new Date().toISOString(),
      });
      batch.set(doc(collection(db, 'transactions')), {
        userId: adminUid,
        type: 'credit',
        category: 'loan_fee',
        description: `Loan fee received from ${user.fullName}`,
        amount: fee,
        status: 'completed',
        reference: generateReference('LF'),
        senderName: user.fullName,
        createdAt: new Date().toISOString(),
      });
      batch.set(doc(collection(db, 'notifications')), {
        userId: user.uid,
        title: 'Loan Fee Paid',
        message: `You paid $${fee.toLocaleString()} to admin account ${adminAcc.accountNumber}. You can now use your loan funds.`,
        type: 'account',
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();

      setAccount((prev) =>
        prev ? { ...prev, balance: newUserBal, availableBalance: newUserBal } : null
      );
      setLoans((prev) =>
        prev.map((l) =>
          l.id === loanId ? { ...l, feePaid: true, feeAmount: fee } : l
        )
      );
      setTransactions((prev) => [
        {
          id: debitRef.id,
          userId: user.uid,
          type: 'debit',
          category: 'loan_fee',
          description: `Loan processing fee (10%) paid to admin account ${adminAcc.accountNumber}`,
          amount: fee,
          status: 'completed',
          reference: generateReference('LF'),
          recipientAccount: adminAcc.accountNumber,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    },
    [user, account, loans]
  );

  const adminTransferToUser = useCallback(
    async (targetUid: string, amount: number, note?: string) => {
      if (!user || user.role !== 'admin' || !account) {
        throw new Error('Only admin can perform this action');
      }
      if (amount <= 0) throw new Error('Amount must be greater than zero');
      if (account.availableBalance < amount) throw new Error('Insufficient admin balance');

      const targetUserSnap = await getDoc(doc(db, 'users', targetUid));
      if (!targetUserSnap.exists()) throw new Error('User not found');
      const targetProfile = { uid: targetUid, ...targetUserSnap.data() } as UserProfile;
      if (targetProfile.role === 'admin') throw new Error('Cannot transfer to admin this way');

      const targetAccSnap = await getDocs(
        query(collection(db, 'accounts'), where('userId', '==', targetUid), limit(1))
      );
      if (targetAccSnap.empty) throw new Error('User account not found');
      const targetAccDoc = targetAccSnap.docs[0];
      const targetAcc = { id: targetAccDoc.id, ...targetAccDoc.data() } as Account;

      const batch = writeBatch(db);
      const newAdminBal = account.balance - amount;
      const newUserBal = targetAcc.balance + amount;
      const newReceived = (targetProfile.totalReceivedFromAdmin || 0) + amount;

      batch.update(doc(db, 'accounts', account.id), {
        balance: newAdminBal,
        availableBalance: newAdminBal,
      });
      batch.update(doc(db, 'accounts', targetAcc.id), {
        balance: newUserBal,
        availableBalance: newUserBal,
      });
      batch.update(doc(db, 'users', targetUid), { totalReceivedFromAdmin: newReceived });

      const adminTxRef = doc(collection(db, 'transactions'));
      batch.set(adminTxRef, {
        userId: user.uid,
        type: 'debit',
        category: 'admin_transfer',
        description: note || `Credit to ${targetProfile.fullName}`,
        amount,
        status: 'completed',
        reference: generateReference('ADM'),
        recipientName: targetProfile.fullName,
        recipientAccount: targetAcc.accountNumber,
        createdAt: new Date().toISOString(),
      });

      const creditTxRef = doc(collection(db, 'transactions'));
      batch.set(creditTxRef, {
        userId: targetUid,
        type: 'credit',
        category: 'admin_credit',
        description: note || 'Account credit from Auxtra Bank',
        amount,
        status: 'completed',
        reference: generateReference('CR'),
        senderName: 'Auxtra Bank Admin',
        createdAt: new Date().toISOString(),
      });

      const feeHint = !targetProfile.activationFeePaid
        ? ` Pay 10% activation fee ($${(Math.ceil(newReceived * 0.1 * 100) / 100).toLocaleString()}) before your first withdrawal.`
        : '';

      batch.set(doc(collection(db, 'notifications')), {
        userId: targetUid,
        title: 'Funds Received',
        message: `$${amount.toLocaleString()} has been credited to your account.${feeHint}`,
        type: 'deposit',
        read: false,
        createdAt: serverTimestamp(),
      });
      batch.set(doc(collection(db, 'notifications')), {
        userId: user.uid,
        title: 'Transfer Completed',
        message: `Sent $${amount.toLocaleString()} to ${targetProfile.fullName}`,
        type: 'transfer',
        read: false,
        createdAt: serverTimestamp(),
      });

      await batch.commit();
      setAccount((prev) =>
        prev ? { ...prev, balance: newAdminBal, availableBalance: newAdminBal } : null
      );
      setTransactions((prev) => [
        {
          id: adminTxRef.id,
          userId: user.uid,
          type: 'debit' as const,
          category: 'admin_transfer',
          description: note || `Credit to ${targetProfile.fullName}`,
          amount,
          status: 'completed' as const,
          reference: generateReference('ADM'),
          recipientName: targetProfile.fullName,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
      await loadAllUsersForAdmin();
    },
    [user, account]
  );

  const adminReviewLoan = useCallback(
    async (userUid: string, loanId: string, decision: 'approved' | 'rejected') => {
      if (!user || user.role !== 'admin' || !account) {
        throw new Error('Only admin can review loans');
      }
      const loanRef = doc(db, 'loans', loanId);
      const loanSnap = await getDoc(loanRef);
      if (!loanSnap.exists()) throw new Error('Loan application not found');
      const loan = { id: loanSnap.id, ...loanSnap.data() } as LoanApplication;
      if (loan.status !== 'pending') throw new Error('This loan has already been reviewed');
      if (loan.userId !== userUid) throw new Error('Loan user mismatch');

      const targetUserSnap = await getDoc(doc(db, 'users', userUid));
      if (!targetUserSnap.exists()) throw new Error('User not found');
      const targetProfile = { uid: userUid, ...targetUserSnap.data() } as UserProfile;

      if (decision === 'approved') {
        if (account.availableBalance < loan.amount) {
          throw new Error('Insufficient admin balance to fund this loan');
        }
        const targetAccSnap = await getDocs(
          query(collection(db, 'accounts'), where('userId', '==', userUid), limit(1))
        );
        if (targetAccSnap.empty) throw new Error('User account not found');
        const targetAcc = {
          id: targetAccSnap.docs[0].id,
          ...targetAccSnap.docs[0].data(),
        } as Account;

        const batch = writeBatch(db);
        const newAdminBal = account.balance - loan.amount;
        const newUserBal = targetAcc.balance + loan.amount;

        batch.update(doc(db, 'accounts', account.id), {
          balance: newAdminBal,
          availableBalance: newAdminBal,
        });
        batch.update(doc(db, 'accounts', targetAcc.id), {
          balance: newUserBal,
          availableBalance: newUserBal,
        });
        const loanFee = Math.ceil(loan.amount * 0.1 * 100) / 100;
        batch.update(loanRef, {
          status: 'approved',
          approvedAt: new Date().toISOString(),
          feePaid: false,
          feeAmount: loanFee,
        });
        batch.set(doc(collection(db, 'transactions')), {
          userId: user.uid,
          type: 'debit',
          category: 'loan_disbursement',
          description: `Loan disbursement to ${targetProfile.fullName}`,
          amount: loan.amount,
          status: 'completed',
          reference: generateReference('LN'),
          recipientName: targetProfile.fullName,
          createdAt: new Date().toISOString(),
        });
        batch.set(doc(collection(db, 'transactions')), {
          userId: userUid,
          type: 'credit',
          category: 'loan',
          description: `Loan approved — $${loan.amount.toLocaleString()} disbursed`,
          amount: loan.amount,
          status: 'completed',
          reference: generateReference('LN'),
          senderName: 'Auxtra Bank Loans',
          createdAt: new Date().toISOString(),
        });
        batch.set(doc(collection(db, 'notifications')), {
          userId: userUid,
          title: 'Loan Approved',
          message: `Your loan of $${loan.amount.toLocaleString()} was credited. Pay 10% fee ($${loanFee.toLocaleString()}) to the admin account before you can withdraw or transfer.`,
          type: 'account',
          read: false,
          createdAt: serverTimestamp(),
        });
        await batch.commit();
        setAccount((prev) =>
          prev ? { ...prev, balance: newAdminBal, availableBalance: newAdminBal } : null
        );
      } else {
        await updateDoc(loanRef, { status: 'rejected' });
        await addDoc(collection(db, 'notifications'), {
          userId: userUid,
          title: 'Loan Rejected',
          message: `Your loan application for $${loan.amount.toLocaleString()} was not approved.`,
          type: 'account',
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      await loadAllUsersForAdmin();
    },
    [user, account]
  );

  const createSavingsGoal = useCallback(
    async (data: { name: string; targetAmount: number; deadline: string }) => {
      if (!user) return;
      const ref = await addDoc(collection(db, 'savings'), {
        userId: user.uid,
        name: data.name,
        targetAmount: data.targetAmount,
        currentAmount: 0,
        deadline: data.deadline,
        createdAt: new Date().toISOString(),
        status: 'active',
      });
      setSavingsGoals((prev) => [
        ...prev,
        {
          id: ref.id,
          userId: user.uid,
          name: data.name,
          targetAmount: data.targetAmount,
          currentAmount: 0,
          deadline: data.deadline,
          createdAt: new Date().toISOString(),
          status: 'active' as const,
        },
      ]);
    },
    [user]
  );

  const addToSavings = useCallback(
    async (goalId: string, amount: number) => {
      if (!account || account.availableBalance < amount) throw new Error('Insufficient balance');
      if (needsLoanFee()) {
        const pending = getPendingLoanFee();
        throw new Error(
          `Loan fee required: Pay 10% ($${pending?.fee.toLocaleString()}) before moving funds.`
        );
      }
      const goal = savingsGoals.find((g) => g.id === goalId);
      if (!goal) throw new Error('Goal not found');
      const newAmt = goal.currentAmount + amount;
      await updateDoc(doc(db, 'savings', goalId), {
        currentAmount: newAmt,
        status: newAmt >= goal.targetAmount ? 'completed' : goal.status,
      });
      setSavingsGoals((prev) =>
        prev.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentAmount: newAmt,
                status: newAmt >= g.targetAmount ? 'completed' : g.status,
              }
            : g
        )
      );
      await addTransaction({
        type: 'debit',
        category: 'savings',
        description: 'Savings deposit',
        amount,
        status: 'completed',
      });
    },
    [account, savingsGoals, addTransaction, needsLoanFee, getPendingLoanFee]
  );

  const applyLoan = useCallback(
    async (data: { amount: number; periodMonths: number; purpose?: string }) => {
      if (!user) return;
      if (data.amount < 10000) throw new Error('Minimum loan amount is $10,000');
      const rate = 12;
      const monthlyRate = rate / 100 / 12;
      const monthly =
        (data.amount * monthlyRate * Math.pow(1 + monthlyRate, data.periodMonths)) /
        (Math.pow(1 + monthlyRate, data.periodMonths) - 1);
      const ref = await addDoc(collection(db, 'loans'), {
        userId: user.uid,
        amount: data.amount,
        periodMonths: data.periodMonths,
        interestRate: rate,
        monthlyRepayment: Math.round(monthly * 100) / 100,
        status: 'pending',
        purpose: data.purpose || '',
        createdAt: new Date().toISOString(),
      });
      setLoans((prev) => [
        ...prev,
        {
          id: ref.id,
          userId: user.uid,
          amount: data.amount,
          periodMonths: data.periodMonths,
          interestRate: rate,
          monthlyRepayment: Math.round(monthly * 100) / 100,
          status: 'pending' as const,
          purpose: data.purpose,
          createdAt: new Date().toISOString(),
        },
      ]);
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        title: 'Loan Application Submitted',
        message: `Your loan request for $${data.amount.toLocaleString()} is under review.`,
        type: 'account',
        read: false,
        createdAt: serverTimestamp(),
      });
    },
    [user]
  );

  const markNotificationRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch {
      /* ignore */
    }
  }, []);

  const markAllNotificationsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    for (const n of notifications.filter((x) => !x.read)) {
      try {
        await updateDoc(doc(db, 'notifications', n.id), { read: true });
      } catch {
        /* ignore */
      }
    }
  }, [notifications]);

  const deleteNotification = useCallback(async (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    try {
      await deleteDoc(doc(db, 'notifications', id));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const clearAllNotifications = useCallback(async () => {
    const ids = notifications.map((n) => n.id);
    setNotifications([]);
    try {
      await Promise.all(ids.map((id) => deleteDoc(doc(db, 'notifications', id)).catch(() => {})));
    } catch (e) {
      console.error(e);
    }
  }, [notifications]);


  const addPersonalCard = useCallback(
    async (data: {
      cardNumber: string;
      expiryMonth: string;
      expiryYear: string;
      cvv: string;
      cardholderName: string;
    }) => {
      if (!user) throw new Error('Not authenticated');
      const digits = data.cardNumber.replace(/\D/g, '');
      const name = data.cardholderName.trim();
      const month = data.expiryMonth.replace(/\D/g, '').padStart(2, '0');
      let year = data.expiryYear.replace(/\D/g, '');
      if (year.length === 4) year = year.slice(-2);
      const cvv = data.cvv.replace(/\D/g, '');

      if (name.length < 2) throw new Error('Enter the full name on the card');
      if (!/^[a-zA-Z\s.'-]{2,60}$/.test(name)) {
        throw new Error('Cardholder name can only include letters, spaces, and . \' -');
      }
      if (!/^\d{13,19}$/.test(digits)) {
        throw new Error('Card number must be 13–19 digits');
      }
      // Luhn check
      let sum = 0;
      let alt = false;
      for (let i = digits.length - 1; i >= 0; i--) {
        let n = Number(digits[i]);
        if (alt) {
          n *= 2;
          if (n > 9) n -= 9;
        }
        sum += n;
        alt = !alt;
      }
      if (sum % 10 !== 0) throw new Error('Card number is invalid. Check the digits and try again.');

      const m = Number(month);
      if (!/^\d{2}$/.test(month) || m < 1 || m > 12) {
        throw new Error('Expiry month must be between 01 and 12');
      }
      if (!/^\d{2}$/.test(year)) throw new Error('Enter a 2-digit expiry year (YY)');
      const now = new Date();
      const expEnd = new Date(2000 + Number(year), m, 0, 23, 59, 59);
      if (expEnd < now) throw new Error('This card appears to be expired');

      if (!/^\d{3,4}$/.test(cvv)) throw new Error('CVV must be 3 or 4 digits');

      const ref = await addDoc(collection(db, 'cards'), {
        userId: user.uid,
        cardNumber: digits,
        last4: digits.slice(-4),
        expiryMonth: month,
        expiryYear: year,
        cvv,
        cardholderName: name.toUpperCase(),
        type: 'physical',
        status: 'active',
        createdAt: new Date().toISOString(),
      });
      setCards((prev) => [
        ...prev,
        {
          id: ref.id,
          userId: user.uid,
          cardNumber: digits,
          last4: digits.slice(-4),
          expiryMonth: month,
          expiryYear: year,
          cvv,
          cardholderName: name.toUpperCase(),
          type: 'physical',
          status: 'active',
          createdAt: new Date().toISOString(),
        },
      ]);
    },
    [user]
  );

  const removeCard = useCallback(
    async (cardId: string) => {
      if (!user) throw new Error('Not authenticated');
      await deleteDoc(doc(db, 'cards', cardId));
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    },
    [user]
  );

  const freezeCard = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card) return;
      const next = card.status === 'frozen' ? 'active' : 'frozen';
      await updateDoc(doc(db, 'cards', cardId), { status: next });
      setCards((prev) =>
        prev.map((c) => (c.id === cardId ? { ...c, status: next as Card['status'] } : c))
      );
    },
    [cards]
  );


  const defaultPaymentSettings: PaymentSettings = {
    paypalEmail: '',
    paypalLink: '',
    cardInstructions: '',
    bankName: 'Auxtra Bank',
    bankAccountName: 'Auxtra Bank Admin',
    bankAccountNumber: '',
    additionalNotes: '',
  };

  const loadPaymentSettings = useCallback(async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'payment'));
      if (snap.exists()) {
        setPaymentSettings({ ...defaultPaymentSettings, ...snap.data() } as PaymentSettings);
      } else {
        setPaymentSettings(defaultPaymentSettings);
      }
    } catch {
      setPaymentSettings(defaultPaymentSettings);
    }
    try {
      const reqSnap = await getDocs(collection(db, 'feePayments'));
      const list: FeePaymentRequest[] = reqSnap.docs.map((d) => ({ id: d.id, ...d.data() } as FeePaymentRequest));
      list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setFeePaymentRequests(list);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (user) loadPaymentSettings();
  }, [user, loadPaymentSettings]);

  const savePaymentSettings = useCallback(async (data: Partial<PaymentSettings>) => {
    if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
    const next = { ...(paymentSettings || defaultPaymentSettings), ...data, updatedAt: new Date().toISOString() };
    await setDoc(doc(db, 'settings', 'payment'), next, { merge: true });
    setPaymentSettings(next);
  }, [user, paymentSettings]);

  const submitLoanFeePayment = useCallback(async (loanId: string, reference: string) => {
    if (!user) throw new Error('Not authenticated');
    const loan = loans.find((l) => l.id === loanId);
    if (!loan) throw new Error('Loan not found');
    if (loan.feePaid) throw new Error('Fee already paid');
    if (!reference.trim()) throw new Error('Enter your PayPal or card payment reference');
    const fee = Math.ceil(loan.amount * 0.1 * 100) / 100;
    await addDoc(collection(db, 'feePayments'), {
      userId: user.uid,
      userName: user.fullName,
      loanId,
      amount: loan.amount,
      feeAmount: fee,
      reference: reference.trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    });
    await updateDoc(doc(db, 'loans', loanId), {
      feePaymentPending: true,
      feePaymentRef: reference.trim(),
    });
    setLoans((prev) =>
      prev.map((l) =>
        l.id === loanId ? { ...l, feePaymentPending: true, feePaymentRef: reference.trim() } : l
      )
    );
    await addDoc(collection(db, 'notifications'), {
      userId: user.uid,
      title: 'Fee payment submitted',
      message: `Your loan fee payment reference was submitted for review. Reference: ${reference.trim()}`,
      type: 'account',
      read: false,
      createdAt: serverTimestamp(),
    });
    await loadPaymentSettings();
  }, [user, loans, loadPaymentSettings]);

  const confirmLoanFeePayment = useCallback(async (requestId: string, approve: boolean) => {
    if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
    const req = feePaymentRequests.find((r) => r.id === requestId);
    if (!req) throw new Error('Request not found');
    await updateDoc(doc(db, 'feePayments', requestId), {
      status: approve ? 'confirmed' : 'rejected',
      confirmedAt: new Date().toISOString(),
    });
    if (approve) {
      await updateDoc(doc(db, 'loans', req.loanId), {
        feePaid: true,
        feePaymentPending: false,
        feeAmount: req.feeAmount,
      });
      await addDoc(collection(db, 'notifications'), {
        userId: req.userId,
        title: 'Loan fee confirmed',
        message: 'Your 10% loan fee payment was confirmed. You can now transfer and withdraw.',
        type: 'account',
        read: false,
        createdAt: serverTimestamp(),
      });
    } else {
      await updateDoc(doc(db, 'loans', req.loanId), {
        feePaymentPending: false,
      });
      await addDoc(collection(db, 'notifications'), {
        userId: req.userId,
        title: 'Loan fee payment rejected',
        message: 'Your fee payment reference could not be verified. Please try again or contact support.',
        type: 'account',
        read: false,
        createdAt: serverTimestamp(),
      });
    }
    await loadPaymentSettings();
    await loadAllUsersForAdmin();
  }, [user, feePaymentRequests, loadPaymentSettings]);

  const freezeUserAccount = useCallback(async (targetUid: string, freeze: boolean) => {
    if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
    // Keep isActive true so the user can still log in and see the frozen state
    await updateDoc(doc(db, 'users', targetUid), {
      accountFrozen: freeze,
      isActive: true,
    });
    const accSnap = await getDocs(
      query(collection(db, 'accounts'), where('userId', '==', targetUid), limit(1))
    );
    if (!accSnap.empty) {
      await updateDoc(doc(db, 'accounts', accSnap.docs[0].id), {
        status: freeze ? 'frozen' : 'active',
      });
    }
    await addDoc(collection(db, 'notifications'), {
      userId: targetUid,
      title: freeze ? 'Account frozen' : 'Account reactivated',
      message: freeze
        ? 'Your Auxtra Bank account has been frozen. You can still log in to view your balance, but transfers and payments are disabled until an administrator unfreezes your account.'
        : 'Your Auxtra Bank account has been reactivated. You may transfer and pay bills again.',
      type: 'security',
      read: false,
      createdAt: serverTimestamp(),
    });
    await loadAllUsersForAdmin();
  }, [user]);

  const adminAssignCard = useCallback(
    async (
      targetUid: string,
      options?: { cardholderName?: string; type?: 'virtual' | 'physical' }
    ) => {
      if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
      const target = allUsers.find((u) => u.profile.uid === targetUid);
      if (!target) throw new Error('User not found');
      const cardNum = '4532' + Math.random().toString().slice(2, 14);
      const cvv = String(Math.floor(100 + Math.random() * 900));
      const name = (
        options?.cardholderName ||
        target.profile.fullName ||
        'CARDHOLDER'
      ).toUpperCase();
      await addDoc(collection(db, 'cards'), {
        userId: targetUid,
        cardNumber: cardNum,
        last4: cardNum.slice(-4),
        expiryMonth: '12',
        expiryYear: '30',
        cvv,
        cardholderName: name,
        type: options?.type || 'virtual',
        status: 'active',
        createdAt: new Date().toISOString(),
        assignedByAdmin: true,
      });
      await addDoc(collection(db, 'notifications'), {
        userId: targetUid,
        title: 'New card issued',
        message: `Auxtra Bank assigned you a new ${options?.type || 'virtual'} card ending in ${cardNum.slice(-4)}.`,
        type: 'account',
        read: false,
        createdAt: serverTimestamp(),
      });
      await loadAllUsersForAdmin();
    },
    [user, allUsers]
  );

  const adminFactoryReset = useCallback(async () => {
    if (!user || user.role !== 'admin') {
      throw new Error('You do not have permission to perform this action.');
    }

    const deleteAllInCollection = async (colName: string) => {
      const snap = await getDocs(collection(db, colName));
      for (let i = 0; i < snap.docs.length; i += 400) {
        const chunk = snap.docs.slice(i, i + 400);
        const batch = writeBatch(db);
        chunk.forEach((d) => batch.delete(d.ref));
        await batch.commit();
      }
    };

    // Wipe transactional data
    await deleteAllInCollection('transactions');
    try { await deleteAllInCollection('notifications'); } catch { /* */ }
    try { await deleteAllInCollection('loans'); } catch { /* */ }
    try { await deleteAllInCollection('feePayments'); } catch { /* */ }
    try { await deleteAllInCollection('savings'); } catch { /* */ }

    // Reset balances: users $0, admin $50B (USD)
    const accSnap = await getDocs(collection(db, 'accounts'));
    for (let i = 0; i < accSnap.docs.length; i += 400) {
      const chunk = accSnap.docs.slice(i, i + 400);
      const batch = writeBatch(db);
      chunk.forEach((d) => {
        const isAdminAcc = d.data().userId === user.uid;
        batch.update(d.ref, {
          balance: isAdminAcc ? ADMIN_STARTING_BALANCE : 0,
          availableBalance: isAdminAcc ? ADMIN_STARTING_BALANCE : 0,
          status: 'active',
          currency: 'USD',
        });
      });
      await batch.commit();
    }

    // Reset non-admin profile money flags
    const usersSnap = await getDocs(collection(db, 'users'));
    for (const d of usersSnap.docs) {
      if (d.data().role === 'admin') continue;
      await updateDoc(d.ref, {
        totalReceivedFromAdmin: 0,
        activationFeePaid: false,
        accountFrozen: false,
      });
    }

    if (account) {
      setAccount({
        ...account,
        balance: ADMIN_STARTING_BALANCE,
        availableBalance: ADMIN_STARTING_BALANCE,
        currency: 'USD',
      });
    }
    setTransactions([]);
    setNotifications([]);
    setLoans([]);
    setSavingsGoals([]);
    await loadAllUsersForAdmin();
  }, [user, account]);


  const clearUserLoans = useCallback(async (targetUid: string) => {
    if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
    const loansSnap = await getDocs(
      query(collection(db, 'loans'), where('userId', '==', targetUid))
    );
    if (loansSnap.empty) throw new Error('No loans found for this user');
    const batch = writeBatch(db);
    loansSnap.docs.forEach((d) => {
      batch.update(d.ref, {
        status: 'cleared',
        feePaid: true,
        feePaymentPending: false,
        clearedAt: new Date().toISOString(),
        clearedBy: user.uid,
      });
    });
    await batch.commit();
    await addDoc(collection(db, 'notifications'), {
      userId: targetUid,
      title: 'Loans cleared',
      message: 'An administrator has cleared your loan records. Any loan fee holds have been released.',
      type: 'account',
      read: false,
      createdAt: serverTimestamp(),
    });
    await loadAllUsersForAdmin();
  }, [user]);

  const clearUserBalance = useCallback(async (targetUid: string) => {
    if (!user || user.role !== 'admin') throw new Error('You do not have permission to perform this action.');
    const accSnap = await getDocs(
      query(collection(db, 'accounts'), where('userId', '==', targetUid), limit(1))
    );
    if (accSnap.empty) throw new Error('Account not found');
    const accId = accSnap.docs[0].id;
    const prevBal = Number(accSnap.docs[0].data().balance || 0);
    await updateDoc(doc(db, 'accounts', accId), {
      balance: 0,
      availableBalance: 0,
    });
    if (prevBal > 0) {
      await addDoc(collection(db, 'transactions'), {
        userId: targetUid,
        type: 'debit',
        category: 'admin_clear',
        description: 'Balance cleared by administrator',
        amount: prevBal,
        status: 'completed',
        reference: generateReference('CLR'),
        createdAt: new Date().toISOString(),
      });
    }
    await addDoc(collection(db, 'notifications'), {
      userId: targetUid,
      title: 'Balance cleared',
      message: 'Your account balance was set to $0.00 by an administrator.',
      type: 'account',
      read: false,
      createdAt: serverTimestamp(),
    });
    await loadAllUsersForAdmin();
  }, [user]);

  const getUserDetails = useCallback(async (targetUid: string) => {
    return allUsers.find((u) => u.profile.uid === targetUid) || null;
  }, [allUsers]);

  const refreshData = useCallback(() => {
    if (auth.currentUser) loadUserData(auth.currentUser).catch(console.error);
  }, [loadUserData]);

  return (
    <AuthContext.Provider
      value={{
        user,
        account,
        transactions,
        notifications,
        savingsGoals,
        cards,
        loans,
        loading,
        isAdmin,
        allUsers,
        login,
        signup,
        resendVerificationEmail,
        refreshEmailVerification,
        logout,
        updateProfile,
        uploadProfilePhoto,
        removeProfilePhoto,
        addTransaction,
        transfer,
        makePayment,
        createSavingsGoal,
        addToSavings,
        applyLoan,
        markNotificationRead,
        markAllNotificationsRead,
        deleteNotification,
        clearAllNotifications,
        freezeCard,
        addPersonalCard,
        removeCard,
        adminTransferToUser,
        adminReviewLoan,
        payActivationFee,
        payLoanFee,
        lookupAccountByNumber,
        reauthenticate,
        changePassword,
        setTransactionPin,
        resetTransactionPin,
        adminClearUserPin,
        adminAssignCard,
        adminFactoryReset,
        verifyTransactionPin,
        hasTransactionPin: Boolean(user?.hasTransactionPin || user?.transactionPin),
        getAdminAccountNumber,
        needsLoanFee,
        getPendingLoanFee,
        refreshData,
        getActivationFeeAmount,
        needsActivationFee,
        paymentSettings,
        feePaymentRequests,
        loadPaymentSettings,
        savePaymentSettings,
        submitLoanFeePayment,
        confirmLoanFeePayment,
        freezeUserAccount,
        clearUserBalance,
        clearUserLoans,
        isAccountFrozen,
        getUserDetails,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
