import React from 'react';

export default function Alternatives({ alternatives }) {
  if (!alternatives || alternatives.length === 0) {
    return <p style={{ color: 'var(--text-muted)' }}>No alternatives found.</p>;
  }

  return (
    <div className="alternatives-grid">
      {alternatives.map((alt, i) => (
        <div key={i} className="alternative-card">
          <span className="alternative-card__rank">#{i + 1}</span>
          <div className="alternative-card__info">
            <div className="alternative-card__name">{alt.name}</div>
            <div className="alternative-card__meta">
              {alt.cooking_method && (
                <span className="alternative-card__tag">
                  🍳 {alt.cooking_method}
                </span>
              )}
              {alt.reason && (
                <span className="alternative-card__tag">
                  💡 {alt.reason}
                </span>
              )}
            </div>
          </div>
          <span className="alternative-card__similarity">
            {alt.similarity}% match
          </span>
        </div>
      ))}
    </div>
  );
}
