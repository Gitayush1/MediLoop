import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell,
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api/v1';

async function adminFetch<T>(path: string, secret: string): Promise<T> {
  const res = await axios.get<{ data: T }>(`${API_BASE}/admin/${path}`, {
    headers: { 'X-Admin-Secret': secret },
  });
  return res.data.data;
}

interface Stats {
  users: { total: number; verified: number; newThisWeek: number };
  medications: { active: number };
  prescriptions: { processed: number; ocrSuccessRate: number };
  doses: { taken: number; missed: number; missedDoseRate: number };
  refills: { pendingWarnings: number };
}

interface DailyStats {
  userRegistrations: Array<{ date: string; count: number }>;
  doseAdherence: Array<{ date: string; status: string; count: number }>;
}

export default function App() {
  const [secret, setSecret] = useState('');
  const [isAuthed, setIsAuthed] = useState(false);
  const [authError, setAuthError] = useState('');

  const stats = useQuery<Stats>({
    queryKey: ['admin-stats', secret],
    queryFn: () => adminFetch<Stats>('stats', secret),
    enabled: isAuthed,
    refetchInterval: 30000,
  });

  const dailyStats = useQuery<DailyStats>({
    queryKey: ['admin-daily', secret],
    queryFn: () => adminFetch<DailyStats>('daily-stats', secret),
    enabled: isAuthed,
  });

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adminFetch('health', secret);
      setIsAuthed(true);
      setAuthError('');
    } catch {
      setAuthError('Invalid admin secret');
    }
  };

  if (!isAuthed) {
    return (
      <div style={styles.authPage}>
        <div style={styles.authCard}>
          <div style={styles.logo}>💊</div>
          <h1 style={styles.authTitle}>MediLoop Admin</h1>
          <p style={styles.authSubtitle}>Enter your admin secret to access the dashboard</p>
          <form onSubmit={(e) => void handleAuth(e)}>
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Admin secret"
              style={styles.secretInput}
              autoFocus
            />
            {authError && <p style={styles.authError}>{authError}</p>}
            <button type="submit" style={styles.authBtn}>Access Dashboard</button>
          </form>
        </div>
      </div>
    );
  }

  const s = stats.data;

  // Process adherence data for chart
  const adherenceChartData = (() => {
    if (!dailyStats.data) return [];
    const byDate: Record<string, { date: string; taken: number; missed: number }> = {};
    dailyStats.data.doseAdherence.forEach(({ date, status, count }) => {
      if (!byDate[date]) byDate[date] = { date, taken: 0, missed: 0 };
      if (status === 'TAKEN') byDate[date].taken = count;
      if (status === 'MISSED') byDate[date].missed = count;
    });
    return Object.values(byDate).slice(-14);
  })();

  return (
    <div style={styles.page}>
      {/* Sidebar */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarLogo}>💊 MediLoop</div>
        <nav style={styles.nav}>
          <div style={styles.navItem}>📊 Overview</div>
          <div style={styles.navItemMuted}>👥 Users</div>
          <div style={styles.navItemMuted}>💊 Medications</div>
          <div style={styles.navItemMuted}>📋 Prescriptions</div>
          <div style={styles.navItemMuted}>🔔 Refills</div>
        </nav>
        <button onClick={() => setIsAuthed(false)} style={styles.logoutBtn}>🚪 Log out</button>
      </div>

      {/* Main */}
      <main style={styles.main}>
        <div style={styles.mainHeader}>
          <h1 style={styles.mainTitle}>Dashboard Overview</h1>
          <span style={styles.lastUpdated}>
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>

        {stats.isLoading ? (
          <p style={{ color: '#64748B' }}>Loading stats...</p>
        ) : s ? (
          <>
            {/* KPI cards */}
            <div style={styles.kpiGrid}>
              <KpiCard title="Total Users" value={s.users.total} sub={`+${s.users.newThisWeek} this week`} icon="👥" color="#4F46E5" />
              <KpiCard title="Active Medications" value={s.medications.active} sub="across all patients" icon="💊" color="#059669" />
              <KpiCard title="Prescriptions Processed" value={s.prescriptions.processed} sub={`${s.prescriptions.ocrSuccessRate}% OCR success`} icon="📋" color="#0EA5E9" />
              <KpiCard title="Missed Dose Rate" value={`${s.doses.missedDoseRate}%`} sub={`${s.doses.missed} missed doses`} icon="⚠️" color={s.doses.missedDoseRate > 20 ? '#EF4444' : '#F59E0B'} />
              <KpiCard title="Doses Taken" value={s.doses.taken} sub="all time" icon="✅" color="#10B981" />
              <KpiCard title="Refill Warnings" value={s.refills.pendingWarnings} sub="unacknowledged" icon="🔔" color="#F59E0B" />
            </div>

            {/* Email verification rate */}
            <div style={styles.chartsGrid}>
              {/* Pie: User verification */}
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>User Verification</h3>
                <PieChart width={260} height={200}>
                  <Pie data={[{ name: 'Verified', value: s.users.verified }, { name: 'Unverified', value: s.users.total - s.users.verified }]}
                    cx={130} cy={100} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#4F46E5" />
                    <Cell fill="#E5E7EB" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>

              {/* Dose quality */}
              <div style={styles.chartCard}>
                <h3 style={styles.chartTitle}>Dose Quality</h3>
                <PieChart width={260} height={200}>
                  <Pie data={[{ name: 'Taken', value: s.doses.taken }, { name: 'Missed', value: s.doses.missed }]}
                    cx={130} cy={100} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </div>
            </div>

            {/* Adherence over time */}
            {adherenceChartData.length > 0 && (
              <div style={{ ...styles.chartCard, width: '100%', maxWidth: 'none', marginTop: 24 }}>
                <h3 style={styles.chartTitle}>Dose Adherence – Last 14 Days</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={adherenceChartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="taken" fill="#10B981" name="Taken" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="missed" fill="#EF4444" name="Missed" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* User registrations */}
            {dailyStats.data?.userRegistrations && dailyStats.data.userRegistrations.length > 0 && (
              <div style={{ ...styles.chartCard, width: '100%', maxWidth: 'none', marginTop: 24 }}>
                <h3 style={styles.chartTitle}>New User Registrations – Last 30 Days</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={dailyStats.data.userRegistrations} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="count" stroke="#4F46E5" strokeWidth={2} dot={false} name="New Users" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        ) : null}

        <div style={styles.disclaimer}>
          ⚠️ This dashboard shows aggregated, anonymized statistics only. No individual patient data is displayed in compliance with healthcare data privacy requirements.
        </div>
      </main>
    </div>
  );
}

function KpiCard({ title, value, sub, icon, color }: { title: string; value: number | string; sub: string; icon: string; color: string }) {
  return (
    <div style={{ ...styles.kpiCard, borderTopColor: color, borderTopWidth: 3 }}>
      <div style={styles.kpiTop}>
        <div>
          <p style={styles.kpiTitle}>{title}</p>
          <p style={{ ...styles.kpiValue, color }}>{value}</p>
        </div>
        <div style={{ ...styles.kpiIcon, backgroundColor: color + '15' }}>
          <span style={{ fontSize: 22 }}>{icon}</span>
        </div>
      </div>
      <p style={styles.kpiSub}>{sub}</p>
    </div>
  );
}

// Inline styles (no external CSS dependency)
const styles: Record<string, React.CSSProperties> = {
  authPage: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #4F46E5, #3730A3)' },
  authCard: { background: '#fff', borderRadius: 20, padding: 40, width: 360, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.15)' },
  logo: { fontSize: 48, marginBottom: 12 },
  authTitle: { fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 8 },
  authSubtitle: { fontSize: 14, color: '#64748B', marginBottom: 28 },
  secretInput: { width: '100%', padding: '12px 16px', borderRadius: 10, border: '1.5px solid #E2E8F0', fontSize: 15, marginBottom: 12, outline: 'none' },
  authError: { color: '#EF4444', fontSize: 13, marginBottom: 8 },
  authBtn: { width: '100%', padding: '13px', borderRadius: 10, background: '#4F46E5', color: '#fff', fontSize: 15, fontWeight: 600, border: 'none', cursor: 'pointer' },
  page: { display: 'flex', minHeight: '100vh' },
  sidebar: { width: 220, background: '#1E1B4B', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 },
  sidebarLogo: { color: '#fff', fontSize: 18, fontWeight: 700, padding: '0 8px', marginBottom: 24 },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, flex: 1 },
  navItem: { color: '#fff', padding: '10px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', cursor: 'pointer', fontSize: 14, fontWeight: 500 },
  navItemMuted: { color: 'rgba(255,255,255,0.5)', padding: '10px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  logoutBtn: { color: 'rgba(255,255,255,0.6)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '10px 12px', textAlign: 'left', fontSize: 14 },
  main: { flex: 1, padding: 32, overflowY: 'auto' },
  mainHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 },
  mainTitle: { fontSize: 26, fontWeight: 700, color: '#0F172A' },
  lastUpdated: { fontSize: 13, color: '#94A3B8' },
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 28 },
  kpiCard: { background: '#fff', borderRadius: 14, padding: 20, borderTop: '3px solid #4F46E5', boxShadow: '0 1px 8px rgba(0,0,0,0.06)' },
  kpiTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  kpiTitle: { fontSize: 12, color: '#64748B', fontWeight: 500, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' },
  kpiValue: { fontSize: 28, fontWeight: 700 },
  kpiIcon: { width: 44, height: 44, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  kpiSub: { fontSize: 12, color: '#94A3B8' },
  chartsGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 },
  chartCard: { background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 8px rgba(0,0,0,0.06)', maxWidth: 340 },
  chartTitle: { fontSize: 15, fontWeight: 600, color: '#0F172A', marginBottom: 16 },
  disclaimer: { marginTop: 28, padding: 16, background: '#FEF3C7', borderRadius: 10, fontSize: 13, color: '#92400E', lineHeight: 1.5 },
};
