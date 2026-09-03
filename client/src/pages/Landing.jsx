import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Zap,
  QrCode,
  Mail,
  ShieldCheck,
  ArrowRight,
  Users,
  Receipt,
  Sun,
  Moon,
  LayoutDashboard
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/UI/Badge';

export function Landing() {
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { token } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-logo" onClick={() => navigate('/')}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-brown)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.1rem',
              flexShrink: 0
            }}
          >
            T
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.2 }}>TiffinSplit</h2>
            <span className="landing-nav-logo-sub" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Shared Household Billing
            </span>
          </div>
        </div>

        <div className="landing-nav-actions">
          <a href="#features" className="landing-nav-link">Features</a>
          <a href="#how-it-works" className="landing-nav-link">How It Works</a>
          
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.55rem',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              fontSize: '0.82rem'
            }}
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            <span style={{ display: 'none', minWidth: '40px' }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {token ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
              <LayoutDashboard size={15} />
              <span>Dashboard</span>
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.75rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.85rem', padding: '0.45rem 0.85rem' }}>
                Get Started <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="landing-hero-section">
        <div className="landing-hero-badge">
          <Zap size={14} /> Introducing Fast Entry ⚡ Mode for Instant Tiffin Logging
        </div>

        <h1 className="landing-hero-title">
          Effortless Tiffin & Shared Household Expense Splitting
        </h1>

        <p className="landing-hero-desc">
          Keep track of daily roommate tiffin meals in seconds, auto-generate monthly billing statements, and verify payments with automated email statements & UPI QR codes.
        </p>

        <div className="landing-hero-actions">
          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
              <LayoutDashboard size={18} />
              <span>Go to Household Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', padding: '0.8rem 1.8rem' }}>
                <span>Create Household Workspace</span>
                <ArrowRight size={17} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: '1rem', padding: '0.8rem 1.8rem' }}>
                <span>Log In to Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Hero Interactive Showcase Card */}
        <div className="card landing-demo-card">
          <div className="landing-demo-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <Badge variant="success">⚡ Fast Entry Live Demo</Badge>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Roommates Tiffin • August 2026</span>
            </div>
            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
              <Badge variant="neutral">Kushal Waykole (₹770)</Badge>
              <Badge variant="info">UPI: 8237172878@ibl</Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div style={{ backgroundColor: 'var(--surface-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.88rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={15} style={{ color: 'var(--accent-brown)' }} /> Fast Entry Input Format
              </h4>
              <pre className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text)', margin: 0, lineHeight: 1.6, overflowX: 'auto' }}>
                01 Aug m K S SB{"\n"}
                02 Aug m K 2KP P SB SH{"\n"}
                03 Aug n K S P
              </pre>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.88rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <QrCode size={15} style={{ color: 'var(--success-text)' }} /> Monthly Statement & Verification
                </h4>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                  Auto-generates clean printable PDF statements and sends email notifications with scannable PhonePe / GPay / Paytm QR code.
                </p>
              </div>
              <div style={{ marginTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="font-mono" style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--accent-brown)' }}>Total: ₹1,470</span>
                <Badge variant="success">Manual Verification Active ✓</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '3.5rem 1.5rem', backgroundColor: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: '0.5rem' }}>Built Specifically for Tiffin & Roommate Households</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', maxWidth: '600px', margin: '0 auto' }}>
              No complex splitwise math. Simple, fast, and transparent tiffin billing for roommates.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--accent-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Zap size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Fast Entry ⚡ Mode</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Type multiple days in a single line e.g., <code>01 Aug m K S SB</code>. Includes instant line-by-line validation for invalid dates (like <code>32 Aug</code>) and shortcode checks.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <QrCode size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>UPI QR Code & One-Tap Pay</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Roommates can pay directly via PhonePe, Google Pay, or Paytm using integrated <code>upi://pay</code> deep links and embedded high-resolution QR codes.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Mail size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Automated Email Statements</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Send individual or bulk monthly bill statement emails with complete meal breakdown tables directly to your roommates' inboxes via Gmail SMTP.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--accent-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Users size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Roommate Workspaces & Rates</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Set custom default prices per tiffin (e.g. ₹40 Morning / ₹40 Night), assign shortcodes (e.g. KW, KP, SB), and manage multi-friend households effortlessly.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Receipt size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Immutable Monthly Snapshots</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Generate monthly billing snapshots that lock prices and meal quantities so past billing statements remain 100% accurate and audit-proof.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <ShieldCheck size={22} />
              </div>
              <h3 style={{ fontSize: '1.1rem' }}>Standalone Statement Links</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
                Roommates can view clean, distraction-free statement views directly from email or WhatsApp links without requiring account passwords.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '3.5rem 1.5rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: '0.5rem' }}>How TiffinSplit Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>Start managing your household tiffin bills in 3 simple steps</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              1
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Add Friends & Shortcodes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
              Add your roommates with 2-letter shortcodes (e.g. Kushal ➔ KW, Kalpesh ➔ KP).
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              2
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Log Meals via Fast Entry ⚡</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
              Type daily meals e.g. <code>01 Aug m K S SB</code>. Live validation checks dates and names automatically.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.25rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
              3
            </div>
            <h3 style={{ fontSize: '1.1rem' }}>Generate & Email Statements</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '0.4rem', lineHeight: 1.55 }}>
              Click <strong>Send All Bill Emails</strong> to email statements with integrated UPI QR codes for one-tap payment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section style={{ backgroundColor: 'var(--surface-muted)', borderTop: '1px solid var(--border)', padding: '3.5rem 1.5rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', marginBottom: '0.85rem' }}>Ready to Simplify Roommate Tiffin Billing?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '1.75rem' }}>
            Join roommate households using TiffinSplit for fast, error-free meal tracking.
          </p>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              <LayoutDashboard size={17} />
              <span>Go to Household Dashboard</span>
              <ArrowRight size={17} />
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1rem', padding: '0.85rem 2rem' }}>
              <span>Get Started Now Free</span>
              <ArrowRight size={17} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '1.5rem 1rem', textAlign: 'center', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <strong>TiffinSplit</strong> — Shared Household Tiffin Billing
          </div>
          <div>
            © 2026 TiffinSplit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
