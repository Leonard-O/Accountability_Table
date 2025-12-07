import React from 'react';
import { Snowflake, Palette, Music, Lock, ShoppingBag, Zap } from 'lucide-react';
import { useMonetization } from './MonetizationContext';

const Marketplace = () => {
    const { coins, streakFreezes, isPremium, purchaseItem } = useMonetization();

    const items = [
        {
            id: 'freeze_1',
            name: 'Streak Freeze',
            description: 'Protect your streak for one missed day.',
            icon: <Snowflake size={32} color="#00d2ff" />,
            cost: 50,
            type: 'powerup',
            premiumOnly: false
        },
        {
            id: 'theme_gold',
            name: 'Midas Touch',
            description: 'Apply the exclusive Gold Theme.',
            icon: <Palette size={32} color="gold" />,
            cost: 500,
            type: 'cosmetic',
            premiumOnly: true
        },
        {
            id: 'sound_pack_rain',
            name: 'Rainy Lo-Fi',
            description: 'Immersive rain sounds for focus.',
            icon: <Music size={32} color="#a855f7" />,
            cost: 200,
            type: 'sound',
            premiumOnly: false
        },
        {
            id: 'xp_boost_1h',
            name: '2x XP Boost',
            description: 'Double XP for the next hour.',
            icon: <Zap size={32} color="#f59e0b" />,
            cost: 150,
            type: 'powerup',
            premiumOnly: false
        }
    ];

    const handleBuy = (item) => {
        if (item.premiumOnly && !isPremium) {
            alert("This item is reserved for Focus+ members!");
            return;
        }
        if (confirm(`Buy ${item.name} for ${item.cost} coins? (You have ${coins})`)) {
            purchaseItem(item.cost, item.id);
        }
    };

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1rem', color: 'white' }}>
            {/* Header */}
            <div className="glass-panel" style={{
                padding: '2rem',
                marginBottom: '2rem',
                backgroundImage: 'linear-gradient(to right, rgba(0,255,100,0.1), rgba(0,200,255,0.1))',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
            }}>
                <div>
                    <h2 style={{ margin: '0 0 10px 0', fontSize: '2rem', display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <ShoppingBag size={32} color="hsl(145, 65%, 50%)" /> Item Store
                    </h2>
                    <p style={{ margin: 0, color: 'var(--text-secondary)' }}>Customize your experience and boost your progress.</p>
                </div>
                <div style={{ display: 'flex', gap: '2rem', textAlign: 'center' }}>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'gold' }}>{coins}</div>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Coins</div>
                    </div>
                    <div>
                        <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#00d2ff' }}>{streakFreezes}</div>
                        <div style={{ fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', opacity: 0.7 }}>Freezes</div>
                    </div>
                </div>
            </div>

            {/* Product Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: '1.5rem'
            }}>
                {items.map(item => (
                    <div key={item.id} className="glass-panel product-card" style={{
                        padding: '1.5rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '1rem',
                        position: 'relative',
                        transition: 'transform 0.2s',
                        cursor: 'default'
                    }}>
                        {item.premiumOnly && (
                            <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'hsl(45, 100%, 50%)', color: 'black', padding: '2px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Lock size={10} /> PLUS
                            </div>
                        )}

                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            height: '100px',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: '0.5rem'
                        }}>
                            {item.icon}
                        </div>

                        <div style={{ flex: 1 }}>
                            <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem' }}>{item.name}</h3>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.4 }}>{item.description}</p>
                        </div>

                        <button
                            className="secondary-btn"
                            onClick={() => handleBuy(item)}
                            style={{
                                width: '100%',
                                marginTop: 'auto',
                                background: item.premiumOnly && !isPremium ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.15)',
                                color: item.premiumOnly && !isPremium ? '#555' : 'white',
                                cursor: item.premiumOnly && !isPremium ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                padding: '0.8rem 1rem'
                            }}
                        >
                            <span>Buy</span>
                            <span style={{ fontWeight: 'bold', color: item.premiumOnly && !isPremium ? '#555' : 'gold' }}>{item.cost} 🪙</span>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Marketplace;
