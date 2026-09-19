export type UserRole = 'user' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  fullName: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  dateOfBirth?: string;
  photoURL?: string;
  role: UserRole;
  createdAt: string;
  isActive: boolean;
  /** 4-digit transaction PIN (demo storage — hash in production) */
  transactionPin?: string;
  hasTransactionPin?: boolean;
  emailVerified: boolean;
  /** Total amount credited by admin */
  totalReceivedFromAdmin: number;
  /** Whether the 10% activation fee has been paid */
  activationFeePaid: boolean;
  /** Admin froze this account — user can login but cannot transact */
  accountFrozen?: boolean;
}

export interface Account {
  id: string;
  userId: string;
  accountNumber: string;
  accountType: 'savings' | 'current' | 'fixed';
  balance: number;
  availableBalance: number;
  currency: string;
  createdAt: string;
  status: 'active' | 'frozen' | 'closed';
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'credit' | 'debit' | 'transfer' | 'payment' | 'savings' | 'loan' | 'activation_fee';
  category: string;
  description: string;
  amount: number;
  fee?: number;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  recipientName?: string;
  recipientBank?: string;
  recipientAccount?: string;
  senderName?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Card {
  id: string;
  userId: string;
  cardNumber: string;
  last4: string;
  expiryMonth: string;
  expiryYear: string;
  /** Demo CVV shown only when user reveals card details */
  cvv?: string;
  cardholderName: string;
  type: 'virtual' | 'physical';
  status: 'active' | 'frozen' | 'expired';
  createdAt: string;
}

export interface Transfer {
  id: string;
  userId: string;
  recipientName: string;
  bankName: string;
  accountNumber: string;
  amount: number;
  fee: number;
  description: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  type: 'airtime' | 'data' | 'electricity' | 'internet' | 'tv' | 'other';
  provider: string;
  amount: number;
  phoneOrAccount?: string;
  status: 'pending' | 'completed' | 'failed';
  reference: string;
  createdAt: string;
}

export interface SavingsGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  createdAt: string;
  status: 'active' | 'completed' | 'cancelled';
}

export interface LoanApplication {
  id: string;
  userId: string;
  amount: number;
  periodMonths: number;
  interestRate: number;
  monthlyRepayment: number;
  status: 'pending' | 'approved' | 'rejected' | 'repaying' | 'completed' | 'cleared';
  purpose?: string;
  createdAt: string;
  approvedAt?: string;
  /** 10% fee paid to admin before loan funds can be used */
  feePaid?: boolean;
  feeAmount?: number;
  feePaymentPending?: boolean;
  feePaymentRef?: string;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transfer' | 'payment' | 'deposit' | 'security' | 'account' | 'system';
  read: boolean;
  createdAt: string;
}

export interface AppSettings {
  userId: string;
  darkMode: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  twoFactorEnabled: boolean;
}

/** Full stored user record in the global registry */
export interface StoredUser {
  profile: UserProfile;
  account: Account;
  transactions: Transaction[];
  notifications: Notification[];
  savingsGoals: SavingsGoal[];
  cards: Card[];
  loans: LoanApplication[];
  password: string; // demo only – never store plaintext in production
}

export interface PaymentSettings {
  paypalEmail: string;
  paypalLink: string;
  cardInstructions: string;
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  additionalNotes: string;
  updatedAt?: string;
}

export interface FeePaymentRequest {
  id: string;
  userId: string;
  userName: string;
  loanId: string;
  amount: number;
  feeAmount: number;
  reference: string;
  status: 'pending' | 'confirmed' | 'rejected';
  createdAt: string;
  confirmedAt?: string;
}
