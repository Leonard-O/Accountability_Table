import React, { useState, useEffect } from 'react'
import { LayoutGrid, Calendar as CalendarIcon, BarChart2, ShoppingBag, LogOut } from 'lucide-react'
import { supabase } from './supabase'
import Auth from './components/Auth'
import AccountabilityTable from './components/AccountabilityTable'
import CalendarView from './components/CalendarView'
import StudyTimer from './components/StudyTimer'
import Marketplace from './components/Marketplace'
import AnalyticsStats from './components/AnalyticsStats'
import { MonetizationProvider, useMonetization } from './components/MonetizationContext'
import PremiumModal from './components/PremiumModal'
import AdBanner from './components/AdBanner'
import LandingPage from './components/LandingPage'
import './index.css'

// Inner App Component to consume Context
const AppContent = ({ session }) => {
  const [view, setView] = useState('grid');
  const [timerOpen, setTimerOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(null);

  // Real Data from Supabase
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  const { showPremiumModal, setShowPremiumModal, isPremium, awardXP, level, xp } = useMonetization();

  // 2. Fetch Logs when Session exists
  useEffect(() => {
    if (session) {
      fetchLogs();
    }
  }, [session]);

  const fetchLogs = async () => {
    setLoading(true);
    const { data: logs, error } = await supabase
      .from('study_logs')
      .select('day_index, status, year')
      .eq('year', new Date().getFullYear()); // Current year only for now

    if (error) {
      console.error('Error fetching logs:', error);
    } else {
      // Transform to object { dayIndex: status }
      const map = {};
      logs.forEach(log => {
        map[log.day_index] = log.status;
      });
      setData(map);
    }
    setLoading(false);
  };

  const getDayOfYear = (date) => {
    const start = new Date(date.getFullYear(), 0, 0);
    const diff = date - start;
    const oneDay = 1000 * 60 * 60 * 24;
    return Math.floor(diff / oneDay);
  };

  const handleDayClick = (dayIndex) => {
    const todayIndex = getDayOfYear(new Date());

    // Prevent clicking future days
    if (dayIndex > todayIndex) return;

    // Check if already studied
    if (data[dayIndex] === 'studied') {
      if (confirm('Unmark this day as studied?')) {
        deleteLog(dayIndex);
      }
      return;
    }

    // Only allow studying current day
    if (dayIndex !== todayIndex) {
      alert("You can only study on the current day!");
      return;
    }

    setSelectedDay(dayIndex);
    setTimerOpen(true);
  };

  const deleteLog = async (dayIndex) => {
    // Optimistic update
    const newData = { ...data };
    delete newData[dayIndex];
    setData(newData);

    const { error } = await supabase
      .from('study_logs')
      .delete()
      .eq('day_index', dayIndex)
      .eq('year', new Date().getFullYear())
      .eq('user_id', session.user.id);

    if (error) {
      alert("Failed to delete log: " + error.message);
      fetchLogs(); // Revert on failure
    }
  };

  const handleTimerComplete = async (dayIndex) => {
    // Optimistic Update
    setData(prev => ({
      ...prev,
      [dayIndex]: 'studied'
    }));

    // Save to DB
    const { error } = await supabase
      .from('study_logs')
      .insert({
        user_id: session.user.id,
        day_index: dayIndex,
        year: new Date().getFullYear(),
        status: 'studied',
        verified: true
      });

    if (error) {
      alert("Error saving study session: " + error.message);
    }

    // Award XP
    awardXP(25);

    // Ad Logic: Show ad after session if free
    if (!isPremium) {
      // Mock interstitial
      console.log("Showing Interstitial Ad...");
    }
  };

  return (
    <div className="app-container">
      <header className="app-header">
        {/* LEFT: Branding */}
        <div className="header-left">
          <div style={{
            width: '35px',
            height: '35px',
            borderRadius: '8px',
            background: 'linear-gradient(135deg, hsl(145, 65%, 50%), hsl(180, 70%, 50%))',
            color: '#1a1a1a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '900',
            fontSize: '1rem',
            marginRight: '0.5rem',
            boxShadow: '0 0 15px rgba(0, 255, 128, 0.2)'
          }}>
            AG
          </div>
          <h1 className="app-title">Accountability Grid</h1>
        </div>

        {/* CENTER: Navigation (Desktop) */}
        <div className="header-center desktop-only">
          <button
            className={view === 'grid' ? 'active' : ''}
            onClick={() => setView('grid')}
          >
            365 Grid
          </button>
          <button
            className={view === 'calendar' ? 'active' : ''}
            onClick={() => setView('calendar')}
          >
            Calendar
          </button>
          <button
            className={view === 'stats' ? 'active' : ''}
            onClick={() => setView('stats')}
          >
            Stats
          </button>
          <button
            className={view === 'store' ? 'active' : ''}
            onClick={() => setView('store')}
          >
            Store
          </button>
        </div>

        {/* RIGHT: User Actions */}
        <div className="header-right">
          {/* Gamification Badge (Now on Right) */}
          <div
            className="glass-panel gamification-badge"
            style={{ cursor: 'pointer', marginRight: '0.5rem' }}
            onClick={() => setShowBadges(true)}
          >
            <span className="level-text">Lvl {level}</span>
            <div className="xp-bar-container">
              <div
                className="xp-bar-fill"
                style={{ width: `${Math.min((xp / (level * 100)) * 100, 100)}%` }}
              />
            </div>
          </div>

          {!isPremium && (
            <button className="primary-btn premium-btn" onClick={() => setShowPremiumModal(true)}>
              Go Premium
            </button>
          )}

          <button
            className="secondary-btn desktop-only"
            onClick={() => supabase.auth.signOut()}
            style={{ border: '1px solid rgba(255,255,255,0.2)', padding: '0.5rem 1rem' }}
          >
            Sign Out
          </button>

          {/* Mobile Sign Out */}
          <div className="mobile-only">
            <button className="secondary-btn" onClick={() => supabase.auth.signOut()} style={{ padding: '0.5rem' }}>
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </header>

      {loading && <p style={{ textAlign: 'center', opacity: 0.5 }}>Loading habits...</p>}

      {/* View Content */}
      <div style={{ flex: 1, width: '100%' }}>
        {!loading && view === 'grid' && (
          <AccountabilityTable
            data={data}
            onDayClick={handleDayClick}
          />
        )}

        {!loading && view === 'calendar' && (
          <CalendarView
            data={data}
            onDayClick={handleDayClick}
          />
        )}

        {!loading && view === 'stats' && (
          <AnalyticsStats data={data} />
        )}

        {!loading && view === 'store' && (
          <Marketplace />
        )}
      </div>

      <StudyTimer
        isOpen={timerOpen}
        dayIndex={selectedDay}
        onClose={() => setTimerOpen(false)}
        onComplete={handleTimerComplete}
      />

      <PremiumModal isOpen={showPremiumModal} onClose={() => setShowPremiumModal(false)} />

      <AdBanner />

      {/* Bottom Navigation (Mobile Only) */}
      <nav className="bottom-nav mobile-only">
        <button
          className={view === 'grid' ? 'active' : ''}
          onClick={() => setView('grid')}
        >
          <LayoutGrid size={24} />
          Grid
        </button>
        <button
          className={view === 'calendar' ? 'active' : ''}
          onClick={() => setView('calendar')}
        >
          <CalendarIcon size={24} />
          Calendar
        </button>
        <button
          className={view === 'stats' ? 'active' : ''}
          onClick={() => setView('stats')}
        >
          <BarChart2 size={24} />
          Stats
        </button>
        <button
          className={view === 'store' ? 'active' : ''}
          onClick={() => setView('store')}
        >
          <ShoppingBag size={24} />
          Store
        </button>
      </nav>
    </div>
  )
}

function App() {
  const [session, setSession] = useState(null)
  const [showAuth, setShowAuth] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    return () => subscription.unsubscribe()
  }, [])

  // If logged in, show the App
  if (session) {
    return (
      <MonetizationProvider session={session}>
        <AppContent session={session} />
      </MonetizationProvider>
    )
  }

  // If not logged in, decide between Auth or Landing Page
  if (showAuth) {
    return <Auth />
  }

  return <LandingPage onGetStarted={() => setShowAuth(true)} />
}

export default App
