import dynamic from 'next/dynamic';

export const metadata = {
  title: 'Admin Login | বাংলা ই-বুক রিডার',
  description: 'Admin panel login',
};

// Skip SSR entirely to prevent hydration mismatch from inline <style> tag
const AdminLoginUI = dynamic(() => import('./AdminLoginUI'), {
  ssr: false,
  loading: () => (
    <div style={{
      minHeight: '100vh',
      background: '#0c0e14',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        width: 44,
        height: 44,
        border: '3px solid rgba(124,107,255,0.25)',
        borderTopColor: '#7c6bff',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
      }} />
    </div>
  ),
});

export default function AdminLoginPage() {
  return <AdminLoginUI />;
}
