export interface AdminBusiness {
  id: string;
  userId: string;
  name: string;
  ownerEmail: string;
  status: 'active' | 'suspended';
  plan: string;
  subscriptionStatus: 'trial' | 'active' | 'cancelled' | 'expired';
  trialStartDate?: string | null;
  trialEndDate?: string | null;
  subscriptionStartDate?: string | null;
  nextBillingDate?: string | null;
  lastLoginAt?: string | null;
  isTest: boolean;
  createdAt: string;
}

export interface AdminSubscription {
  id: string;
  businessId: string;
  userId: string;
  businessName: string;
  ownerEmail: string;
  plan: string;
  amount: number;
  currency: string;
  interval: string;
  status: 'trial' | 'active' | 'cancelled' | 'expired';
  startDate: string;
  currentPeriodStart: string;
  currentPeriodEnd?: string | null;
  canceledAt?: string | null;
  externalSubscriptionId?: string | null;
  isTest: boolean;
  createdAt: string;
}

export interface AdminPayment {
  id: string;
  businessId: string;
  userId: string;
  businessName: string;
  ownerEmail: string;
  subscriptionId?: string | null;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'pending' | 'refunded';
  provider: string;
  transactionId: string;
  paymentMethodType?: string | null;
  invoiceNumber?: string | null;
  isTest: boolean;
  createdAt: string;
}

export interface AdminLoginActivity {
  id: number;
  userId: string;
  email: string;
  businessName?: string | null;
  status: 'successful' | 'failed';
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;
}

export interface MonthlyRevenuePoint {
  month: string;
  revenue: number;
}

export interface AdminOverviewMetrics {
  totalBusinesses: number;
  activeBusinesses: number;
  trialBusinesses: number;
  payingCustomers: number;
  cancelledSubscriptions: number;
  mrr: number;
  previousMonthMrr: number;
  totalRevenue: number;
  newCustomersThisMonth: number;
  activeSubscribers: number;
  churnRate: number;
  monthlyRevenueChart: MonthlyRevenuePoint[];
}

export interface BusinessDrillDownDetails {
  business: AdminBusiness;
  subscriptions: AdminSubscription[];
  payments: AdminPayment[];
  loginActivity: AdminLoginActivity[];
}
