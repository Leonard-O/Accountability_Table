import React, { useState, useEffect, useRef } from 'react';
import { X, Play, Pause, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase';
import { useMonetization } from './MonetizationContext';

const StudyTimer = ({ isOpen, onClose, onComplete, dayIndex }) => {
    const [duration, setDuration] = useState(25);
    const [timeLeft, setTimeLeft] = useState(25 * 60);
    const [isRunning, setIsRunning] = useState(false);
    const [isResearchMode, setIsResearchMode] = useState(false);
    const [statusMsg, setStatusMsg] = useState("Ready to focus?");

    const timerRef = useRef(null);
    const { isPremium, setShowPremiumModal } = useMonetization();

    // Reset timer when opening
    useEffect(() => {
        if (isOpen) {
            setTimeLeft(duration * 60);
            setIsRunning(false);
            setIsResearchMode(false);
            setStatusMsg("Ready to focus?");
        } else {
            clearInterval(timerRef.current);
        }
    }, [isOpen, duration]);

    // Timer Tick
    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) {
                        clearInterval(timerRef.current);
                        handleComplete();
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        } else {
            clearInterval(timerRef.current);
        }
        return () => clearInterval(timerRef.current);
    }, [isRunning, timeLeft]);

    // Anti-Cheat: Visibility Change
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (!isRunning || isResearchMode || !isOpen) return;

            if (document.hidden) {
                setIsRunning(false);
                setStatusMsg("Cheating detected! Timer paused.");
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [isRunning, isResearchMode, isOpen]);

    const [sessionId, setSessionId] = useState(null);

    const handleStart = async () => {
        if (isResearchMode) {
            setIsRunning(true);
            setStatusMsg("Research Mode Active.");
            return; // Local only for research
        }

        setStatusMsg("Initializing secure session...");
        try {
            const { data, error } = await supabase.rpc('start_study_session', { p_duration: duration });
            if (error) throw error;

            setSessionId(data);
            setIsRunning(true);
            setStatusMsg("Focus mode ON. Don't leave!");
        } catch (err) {
            alert("Failed to start secure session: " + err.message);
        }
    };

    const handleComplete = async () => {
        setIsRunning(false);

        if (isResearchMode) {
            onComplete(dayIndex); // Local complete for research
            onClose();
            return;
        }

        if (!sessionId) {
            alert("Session invalid.");
            return;
        }

        setStatusMsg("Verifying session with cloud...");
        try {
            // Server verifies if enough time passed
            const { data: isValid, error } = await supabase.rpc('complete_study_session', {
                p_session_id: sessionId,
                p_day_index: dayIndex
            });

            if (error) throw error;

            if (isValid) {
                onComplete(dayIndex); // Update UI
                onClose();
                alert("Great job! Session Verified & Recorded.");
            } else {
                setStatusMsg("Validation Failed: Time discrepancy detected.");
                alert("Session failed verification. Did you speed up time?");
            }
        } catch (err) {
            alert("Verification error: " + err.message);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="glass-panel modal-content">
                <h2 style={{ marginTop: 0 }}>Study Session</h2>

                {/* Config (only when not running) */}
                {!isRunning && (
                    <div className="timer-config">
                        <label>Duration: <span>{duration}</span> min</label>
                        <input
                            type="range"
                            min="1"
                            max="120"
                            step="5"
                            value={duration}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (!isPremium && val > 60) {
                                    if (confirm("Longer sessions are for Premium members only! View plans?")) {
                                        setShowPremiumModal(true);
                                    }
                                    return;
                                }
                                setDuration(val);
                            }}
                        />
                        {!isPremium && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>Free limit: 60 mins</p>}
                    </div>
                )}

                {/* Display */}
                <div className={`timer-display ${statusMsg.includes("Cheating") ? 'paused' : ''} ${isResearchMode ? 'researching' : ''}`}>
                    {formatTime(timeLeft)}
                </div>

                <p className={`status-msg ${isResearchMode ? 'researching' : ''}`}>
                    {statusMsg}
                </p>

                {/* Research Toggle */}
                {!isRunning && (
                    <div className="research-toggle-container">
                        <label className="toggle-switch">
                            <input
                                type="checkbox"
                                checked={isResearchMode}
                                onChange={(e) => setIsResearchMode(e.target.checked)}
                            />
                            <span className="slider round"></span>
                        </label>
                        <span className="toggle-label">Research Mode</span>
                    </div>
                )}

                {/* Controls */}
                <div className="timer-controls">
                    {!isRunning ? (
                        <button onClick={handleStart} className="primary-btn">Start Focus</button>
                    ) : (
                        <button onClick={() => setIsRunning(false)} className="secondary-btn">Pause</button>
                    )}

                    <button onClick={onClose} className="secondary-btn" style={{ border: 'none' }}>Cancel</button>
                </div>
            </div>
        </div>
    );
};

export default StudyTimer;
