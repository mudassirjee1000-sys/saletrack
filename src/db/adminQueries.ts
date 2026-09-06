import { db } from './index.ts';
import {
  adminUsers,
  businesses,
  subscriptions,
  payments,
  loginActivity,
  profiles,
} from './schema.ts';
import { eq, ilike, or, and, sql, desc, gte } from 'drizzle-orm';

/**
 * Strictly verify if an authenticated user possesses valid admin authorization.
 * Checks server database records and designated owner email directly.
 * NEVER checks for the substring "admin" in email addresses.
 */
export async function verifyAdminStatus(uid: string, email: string): Promise<{
  isAdmin: boolean;
  role: string;
  name?: string;
}> {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const designatedEmail = (process.env.ADMIN_EMAIL || 'mudassirjee1000@gmail.com').trim().toLowerCase();

  try {
    // 1. Check exact match in database table `admin_users`
    const adminRows = await db
      .select()
      .from(adminUsers)
      .where(
        and(
          eq(adminUsers.isActive, true),
          or(
            sql`LOWER(${adminUsers.email}) = ${normalizedEmail}`,
            uid ? eq(adminUsers.uid, uid) : sql`false`
          )
        )
      )
      .limit(1);

    if (adminRows.length > 0) {
      const admin = adminRows[0];
      return {
        isAdmin: true,
        role: admin.role,
        name: admin.name || undefined,
      };
    }

    // 2. Exact match against designated primary admin owner
    if (normalizedEmail === designatedEmail && designatedEmail.length > 0) {
      // Auto-register designated owner if not in table
      await db
        .insert(adminUsers)
        .values({
          uid: uid || null,
          email: normalizedEmail,
          name: 'SaleTrack Owner',
          role: 'super_admin',
          isActive: true,
        })
        .onConflictDoUpdate({
          target: adminUsers.email,
          set: {
            role: 'super_admin',
            isActive: true,
            ...(uid ? { uid } : {}),
          },
        });

      return {
        isAdmin: true,
        role: 'super_admin',
        name: 'SaleTrack Owner',
      };
    }

    return { isAdmin: false, role: 'none' };
  } catch (err) {
    console.error('Error verifying admin status:', err);
    // Safety check fallback for designated owner
    if (normalizedEmail === designatedEmail && designatedEmail.length > 0) {
      return { isAdmin: true, role: 'super_admin', name: 'SaleTrack Owner' };
    }
    return { isAdmin: false, role: 'none' };
  }
}

/**
 * Retrieve high-level operational and financial KPIs for the Admin Dashboard
 */
export async function getAdminOverviewMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  try {
    // Business counts
    const allBiz = await db.select().from(businesses);
    const totalBusinesses = allBiz.length;
    const activeBusinesses = allBiz.filter((b) => b.status === 'active').length;
    const trialBusinesses = allBiz.filter((b) => b.subscriptionStatus === 'trial').length;
    const payingCustomers = allBiz.filter((b) => b.subscriptionStatus === 'active').length;
    const cancelledSubscriptions = allBiz.filter((b) => b.subscriptionStatus === 'cancelled').length;

    const newCustomersThisMonth = allBiz.filter(
      (b) => b.createdAt && new Date(b.createdAt) >= startOfMonth
    ).length;

    // Active Subscriptions
    const activeSubs = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.status, 'active'));

    const mrr = activeSubs.reduce((sum, s) => sum + (Number(s.amount) || 4.0), 0);
    const activeSubscribers = activeSubs.length;

    // Estimated previous month MRR for trend comparison
    const previousMonthMrr = Math.max(0, mrr - (newCustomersThisMonth * 4.0));

    // Churn rate calculation
    const totalCustomerBase = activeSubscribers + cancelledSubscriptions;
    const churnRate = totalCustomerBase > 0
      ? Number(((cancelledSubscriptions / totalCustomerBase) * 100).toFixed(1))
      : 0;

    // Total Revenue from all successful payment transactions
    const allPayments = await db
      .select()
      .from(payments)
      .where(eq(payments.status, 'succeeded'));

    const totalRevenue = allPayments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);

    // Monthly revenue breakdown for chart (last 6 months)
    const monthlyRevenueMap: Record<string, number> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyRevenueMap[monthKey] = 0;
    }

    allPayments.forEach((p) => {
      if (p.createdAt) {
        const pDate = new Date(p.createdAt);
        const mKey = pDate.toLocaleString('en-US', { month: 'short', year: '2-digit' });
        if (monthlyRevenueMap[mKey] !== undefined) {
          monthlyRevenueMap[mKey] += Number(p.amount) || 0;
        }
      }
    });

    const monthlyRevenueChart = Object.entries(monthlyRevenueMap).map(([month, amount]) => ({
      month,
      revenue: Number(amount.toFixed(2)),
    }));

    return {
      totalBusinesses,
      activeBusinesses,
      trialBusinesses,
      payingCustomers,
      cancelledSubscriptions,
      mrr: Number(mrr.toFixed(2)),
      previousMonthMrr: Number(previousMonthMrr.toFixed(2)),
      totalRevenue: Number(totalRevenue.toFixed(2)),
      newCustomersThisMonth,
      activeSubscribers,
      churnRate,
      monthlyRevenueChart,
    };
  } catch (err) {
    console.warn('Could not query admin metrics from SQL database, returning empty defaults:', err);
    const monthlyRevenueChart: { month: string; revenue: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthlyRevenueChart.push({ month: monthKey, revenue: 0 });
    }
    return {
      totalBusinesses: 0,
      activeBusinesses: 0,
      trialBusinesses: 0,
      payingCustomers: 0,
      cancelledSubscriptions: 0,
      mrr: 0,
      previousMonthMrr: 0,
      totalRevenue: 0,
      newCustomersThisMonth: 0,
      activeSubscribers: 0,
      churnRate: 0,
      monthlyRevenueChart,
    };
  }
}

/**
 * Query businesses with search, filtering, and pagination
 */
export async function getBusinessesList(options: {
  search?: string;
  subscriptionStatus?: string;
  accountStatus?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 15));
  const offset = (page - 1) * limit;

  try {
    let allBusinesses = await db
      .select()
      .from(businesses)
      .orderBy(desc(businesses.createdAt));

    // In-memory filter for flexible search & status filtering
    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      allBusinesses = allBusinesses.filter(
        (b) =>
          b.name.toLowerCase().includes(q) ||
          b.ownerEmail.toLowerCase().includes(q) ||
          b.id.toLowerCase().includes(q)
      );
    }

    if (options.subscriptionStatus && options.subscriptionStatus !== 'all') {
      allBusinesses = allBusinesses.filter(
        (b) => b.subscriptionStatus.toLowerCase() === options.subscriptionStatus!.toLowerCase()
      );
    }

    if (options.accountStatus && options.accountStatus !== 'all') {
      allBusinesses = allBusinesses.filter(
        (b) => b.status.toLowerCase() === options.accountStatus!.toLowerCase()
      );
    }

    const totalCount = allBusinesses.length;
    const paginatedBusinesses = allBusinesses.slice(offset, offset + limit);

    return {
      businesses: paginatedBusinesses,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err) {
    console.warn('Could not query businesses from SQL database:', err);
    return {
      businesses: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Retrieve comprehensive drill-down details for a specific business
 */
export async function getBusinessDetails(businessId: string) {
  try {
    const bizRows = await db
      .select()
      .from(businesses)
      .where(eq(businesses.id, businessId))
      .limit(1);

    if (bizRows.length === 0) {
      return null;
    }

    const business = bizRows[0];

    // Retrieve related subscriptions, payments, and login activity
    const [bizSubscriptions, bizPayments, bizLogins] = await Promise.all([
      db
        .select()
        .from(subscriptions)
        .where(or(eq(subscriptions.businessId, businessId), eq(subscriptions.userId, business.userId)))
        .orderBy(desc(subscriptions.createdAt)),
      db
        .select()
        .from(payments)
        .where(or(eq(payments.businessId, businessId), eq(payments.userId, business.userId)))
        .orderBy(desc(payments.createdAt)),
      db
        .select()
        .from(loginActivity)
        .where(or(eq(loginActivity.userId, business.userId), eq(loginActivity.email, business.ownerEmail)))
        .orderBy(desc(loginActivity.createdAt))
        .limit(10),
    ]);

    return {
      business,
      subscriptions: bizSubscriptions,
      payments: bizPayments,
      loginActivity: bizLogins,
    };
  } catch (err) {
    console.warn('Could not query business details from SQL database:', err);
    return null;
  }
}

/**
 * Update business account status (e.g. suspend or reactivate)
 */
export async function updateBusinessAccountStatus(
  businessId: string,
  newStatus: 'active' | 'suspended'
) {
  try {
    const updated = await db
      .update(businesses)
      .set({ status: newStatus })
      .where(eq(businesses.id, businessId))
      .returning();

    if (updated.length > 0) {
      // Also update profile status if exists
      await db
        .update(profiles)
        .set({ status: newStatus })
        .where(eq(profiles.userId, updated[0].userId));
    }

    return updated[0] || null;
  } catch (err) {
    console.warn('Could not update business account status in SQL database:', err);
    return null;
  }
}

/**
 * Query subscriptions with pagination & filtering
 */
export async function getSubscriptionsList(options: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 15));
  const offset = (page - 1) * limit;

  try {
    let allSubs = await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt));

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      allSubs = allSubs.filter(
        (s) =>
          s.businessName.toLowerCase().includes(q) ||
          s.ownerEmail.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }

    if (options.status && options.status !== 'all') {
      allSubs = allSubs.filter((s) => s.status.toLowerCase() === options.status!.toLowerCase());
    }

    const totalCount = allSubs.length;
    const paginatedSubs = allSubs.slice(offset, offset + limit);

    return {
      subscriptions: paginatedSubs,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err) {
    console.warn('Could not query subscriptions from SQL database:', err);
    return {
      subscriptions: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Query payments with pagination & filtering
 */
export async function getPaymentsList(options: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 15));
  const offset = (page - 1) * limit;

  try {
    let allPayments = await db
      .select()
      .from(payments)
      .orderBy(desc(payments.createdAt));

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      allPayments = allPayments.filter(
        (p) =>
          p.businessName.toLowerCase().includes(q) ||
          p.ownerEmail.toLowerCase().includes(q) ||
          p.transactionId.toLowerCase().includes(q) ||
          (p.invoiceNumber && p.invoiceNumber.toLowerCase().includes(q))
      );
    }

    if (options.status && options.status !== 'all') {
      allPayments = allPayments.filter(
        (p) => p.status.toLowerCase() === options.status!.toLowerCase()
      );
    }

    const totalCount = allPayments.length;
    const paginatedPayments = allPayments.slice(offset, offset + limit);

    return {
      payments: paginatedPayments,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err) {
    console.warn('Could not query payments from SQL database:', err);
    return {
      payments: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Query login activity with pagination & search
 */
export async function getLoginActivityList(options: {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 20));
  const offset = (page - 1) * limit;

  try {
    let allLogins = await db
      .select()
      .from(loginActivity)
      .orderBy(desc(loginActivity.createdAt));

    if (options.search && options.search.trim()) {
      const q = options.search.trim().toLowerCase();
      allLogins = allLogins.filter(
        (l) =>
          l.email.toLowerCase().includes(q) ||
          (l.businessName && l.businessName.toLowerCase().includes(q)) ||
          (l.ipAddress && l.ipAddress.includes(q))
      );
    }

    if (options.status && options.status !== 'all') {
      allLogins = allLogins.filter(
        (l) => l.status.toLowerCase() === options.status!.toLowerCase()
      );
    }

    const totalCount = allLogins.length;
    const paginatedLogins = allLogins.slice(offset, offset + limit);

    return {
      logins: paginatedLogins,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit) || 1,
    };
  } catch (err) {
    console.warn('Could not query login activity from SQL database:', err);
    return {
      logins: [],
      totalCount: 0,
      page,
      limit,
      totalPages: 1,
    };
  }
}

/**
 * Record a user login activity event
 */
export async function logUserLoginEvent(data: {
  userId: string;
  email: string;
  businessName?: string;
  status: 'successful' | 'failed';
  ipAddress?: string;
  userAgent?: string;
}) {
  try {
    await db.insert(loginActivity).values({
      userId: data.userId,
      email: data.email,
      businessName: data.businessName || 'SaleTrack Store',
      status: data.status,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
    });
  } catch (err) {
    console.error('Failed to log login activity event:', err);
  }
}

/**
 * Automatically ensure a registered user has an associated business record & profile
 */
export async function ensureUserBusiness(data: {
  userId: string;
  email: string;
  name?: string;
  shopName?: string;
}) {
  try {
    // 1. Check if business already exists
    const existing = await db
      .select()
      .from(businesses)
      .where(eq(businesses.userId, data.userId))
      .limit(1);

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14-day trial

    if (existing.length === 0) {
      const bizId = `biz_${data.userId.slice(0, 16)}`;
      const businessName = data.shopName || (data.name ? `${data.name}'s Shop` : 'SaleTrack Store');

      await db.insert(businesses).values({
        id: bizId,
        userId: data.userId,
        name: businessName,
        ownerEmail: data.email,
        status: 'active',
        plan: 'SaleTrack Pro — $4/month',
        subscriptionStatus: 'trial',
        trialStartDate: now,
        trialEndDate: trialEnd,
        lastLoginAt: now,
        isTest: false,
      });

      // Also create profile
      await db
        .insert(profiles)
        .values({
          userId: data.userId,
          email: data.email,
          fullName: data.name || '',
          role: 'user',
          status: 'active',
        })
        .onConflictDoUpdate({
          target: profiles.userId,
          set: {
            email: data.email,
            ...(data.name ? { fullName: data.name } : {}),
            updatedAt: now,
          },
        });
    } else {
      // Update last login
      await db
        .update(businesses)
        .set({
          lastLoginAt: now,
          ...(data.shopName ? { name: data.shopName } : {}),
        })
        .where(eq(businesses.userId, data.userId));
    }
  } catch (err) {
    console.error('Error ensuring user business record:', err);
  }
}
