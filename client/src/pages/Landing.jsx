import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  UtensilsCrossed,
  Zap,
  QrCode,
  Mail,
  ShieldCheck,
  ArrowRight,
  CheckCircle,
  Users,
  Receipt,
  Smartphone,
  ChevronRight,
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
  const { token, user } = useAuth();

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'var(--bg)', color: 'var(--text)' }}>
      {/* Top Navbar */}
      <nav
        style={{
          height: '70px',
          borderBottom: '1px solid var(--border)',
          backgroundColor: 'var(--surface)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 2rem',
          position: 'sticky',
          top: 0,
          zIndex: 50,
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }} onClick={() => navigate('/')}>
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              backgroundColor: 'var(--accent-brown)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.2rem'
            }}
          >
            T
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', margin: 0, letterSpacing: '-0.02em' }}>TiffinSplit</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Shared Household Billing</span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <a href="#features" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>Features</a>
          <a href="#how-it-works" style={{ color: 'var(--text)', textDecoration: 'none', fontSize: '0.9rem', fontWeight: '500' }}>How It Works</a>
          
          <button
            onClick={toggleTheme}
            style={{
              background: 'none',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.4rem 0.6rem',
              cursor: 'pointer',
              color: 'var(--text)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontSize: '0.85rem'
            }}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {token ? (
            <Link to="/dashboard" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
              <LayoutDashboard size={16} /> Go to Dashboard <ArrowRight size={16} />
            </Link>
          ) : (
            <>
              <Link to="/login" className="btn btn-secondary" style={{ fontSize: '0.9rem' }}>
                Sign In
              </Link>
              <Link to="/register" className="btn btn-primary" style={{ fontSize: '0.9rem' }}>
                Get Started Free <ArrowRight size={16} />
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{ padding: '4.5rem 2rem 3.5rem 2rem', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.4rem 1rem',
            backgroundColor: 'var(--surface-muted)',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border)',
            fontSize: '0.85rem',
            color: 'var(--accent-brown)',
            fontWeight: '600',
            marginBottom: '1.5rem'
          }}
        >
          <Zap size={15} /> Introducing Fast Entry ⚡ Mode for Instant Tiffin Logging
        </div>

        <h1
          style={{
            fontSize: 'clamp(2.2rem, 5vw, 3.5rem)',
            fontWeight: '800',
            lineHeight: 1.15,
            maxWidth: '900px',
            margin: '0 auto 1.5rem auto'
          }}
        >
          Effortless Tiffin & Shared Household Expense Splitting
        </h1>

        <p
          style={{
            fontSize: '1.15rem',
            color: 'var(--text-muted)',
            maxWidth: '720px',
            margin: '0 auto 2.5rem auto',
            lineHeight: 1.6
          }}
        >
          Keep track of daily roommate tiffin meals in seconds, auto-generate monthly billing statements, and verify payments with automated email statements & UPI QR codes.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap', marginBottom: '3.5rem' }}>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
              <LayoutDashboard size={18} />
              <span>Go to Household Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
                <span>Create Household Workspace</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/login" className="btn btn-secondary btn-lg" style={{ fontSize: '1.05rem', padding: '0.85rem 2rem' }}>
                <span>Log In to Account</span>
              </Link>
            </>
          )}
        </div>

        {/* Hero Interactive Showcase Card */}
        <div
          className="card"
          style={{
            maxWidth: '960px',
            margin: '0 auto',
            padding: '2rem',
            borderRadius: 'var(--radius-xl)',
            textAlign: 'left',
            boxShadow: 'var(--shadow-md)',
            border: '2px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Badge variant="success">⚡ Fast Entry Live Demo</Badge>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Roommates Tiffin • August 2026</span>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <Badge variant="neutral">Kushal Waykole (₹770)</Badge>
              <Badge variant="info">UPI: 8237172878@ibl</Badge>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div style={{ backgroundColor: 'var(--surface-muted)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Zap size={16} style={{ color: 'var(--accent-brown)' }} /> Fast Entry Input Format
              </h4>
              <pre className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text)', margin: 0, lineHeight: 1.6 }}>
                01 Aug m K S SB{"\n"}
                02 Aug m K 2KP P SB SH{"\n"}
                03 Aug n K S P
              </pre>
            </div>

            <div style={{ backgroundColor: 'var(--surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ fontSize: '0.9rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <QrCode size={16} style={{ color: 'var(--success-text)' }} /> Monthly Statement & Manual Verification
                </h4>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
                  Auto-generates clean printable PDF statements and sends email notifications with scannable PhonePe / GPay / Paytm QR code.
                </p>
              </div>
              <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="font-mono" style={{ fontWeight: '700', fontSize: '1.1rem', color: 'var(--accent-brown)' }}>Total: ₹1,470</span>
                <Badge variant="success">Manual Verification Active ✓</Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" style={{ padding: '4rem 2rem', backgroundColor: 'var(--surface-muted)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>Built Specifically for Tiffin & Roommate Households</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', maxWidth: '600px', margin: '0 auto' }}>
              No complex splitwise math. Simple, fast, and transparent tiffin billing for roommates.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--accent-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Zap size={24} />
              </div>
              <h3>Fast Entry ⚡ Mode</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Type multiple days in a single line e.g., <code>01 Aug m K S SB</code>. Includes instant line-by-line validation for invalid dates (like <code>32 Aug</code>) and shortcode checks.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <QrCode size={24} />
              </div>
              <h3>UPI QR Code & One-Tap Pay</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Roommates can pay directly via PhonePe, Google Pay, or Paytm using integrated <code>upi://pay</code> deep links and embedded high-resolution QR codes.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Mail size={24} />
              </div>
              <h3>Automated Email Statements</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Send individual or bulk monthly bill statement emails with complete meal breakdown tables directly to your roommates' inboxes via Gmail SMTP.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--accent-brown)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Users size={24} />
              </div>
              <h3>Roommate Workspaces & Rates</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Set custom default prices per tiffin (e.g. ₹40 Morning / ₹40 Night), assign shortcodes (e.g. KW, KP, SB), and manage multi-friend households effortlessly.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--success-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <Receipt size={24} />
              </div>
              <h3>Immutable Monthly Snapshots</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Generate monthly billing snapshots that lock prices and meal quantities so past billing statements remain 100% accurate and audit-proof.
              </p>
            </div>

            <div className="card">
              <div style={{ width: '48px', height: '48px', borderRadius: '12px', backgroundColor: 'var(--surface-muted)', color: 'var(--info-text)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                <ShieldCheck size={24} />
              </div>
              <h3>Standalone Statement Links</h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
                Roommates can view clean, distraction-free statement views (without app navigation headers or sidebars) directly from email links without requiring account passwords.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" style={{ padding: '5rem 2rem', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '0.75rem' }}>How TiffinSplit Works</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>Start managing your household tiffin bills in 3 simple steps</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '2rem' }}>
          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              1
            </div>
            <h3>Add Friends & Shortcodes</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Add your roommates with 2-letter shortcodes (e.g. Kushal ➔ KW, Kalpesh ➔ KP).
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              2
            </div>
            <h3>Log Meals via Fast Entry ⚡</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Type daily meals e.g. <code>01 Aug m K S SB</code>. Live validation checks dates and names automatically.
            </p>
          </div>

          <div style={{ textAlign: 'center', padding: '1.5rem' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--accent-brown)', color: '#fff', fontSize: '1.4rem', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              3
            </div>
            <h3>Generate & Email Statements</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0.5rem', lineHeight: 1.6 }}>
              Click <strong>Send All Bill Emails</strong> to email statements with integrated UPI QR codes for one-tap payment.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Footer Banner */}
      <section style={{ backgroundColor: 'var(--surface-muted)', borderTop: '1px solid var(--border)', padding: '4rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '2.2rem', marginBottom: '1rem' }}>Ready to Simplify Roommate Tiffin Billing?</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
            Join thousands of roommate households using TiffinSplit for fast, error-free meal tracking.
          </p>
          {token ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
              <LayoutDashboard size={18} />
              <span>Go to Household Dashboard</span>
              <ArrowRight size={18} />
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary btn-lg" style={{ fontSize: '1.1rem', padding: '0.9rem 2.2rem' }}>
              <span>Get Started Now Free</span>
              <ArrowRight size={18} />
            </Link>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid var(--border)', backgroundColor: 'var(--surface)', padding: '2rem', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <strong>TiffinSplit</strong> — Shared Household Tiffin Billing & Management
          </div>
          <div>
            © 2026 TiffinSplit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
