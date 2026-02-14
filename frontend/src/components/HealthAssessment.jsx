import React from 'react';

export default function HealthAssessment({ score, suitability }) {
  if (score === undefined && !suitability) return null;

  const numericScore = typeof score === 'object' ? score.score : score;
  const explanation = typeof score === 'object' ? score.explanation : '';

  // Color based on score
  const getColor = (s) => {
    if (s >= 70) return 'var(--success)';
    if (s >= 40) return 'var(--warning)';
    return 'var(--danger)';
  };

  const color = getColor(numericScore);

  // SVG gauge
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (numericScore / 100) * circumference;

  return (
    <div className="health-score-container" style={{ color: '#000', textAlign: 'center' }}>
      {/* Suitability */}
      {suitability && (
        <div style={{ marginTop: '0.5rem' }}>
          <div className={`suitability-badge suitability-badge--${suitability.suitable ? 'suitable' : 'not-suitable'}`} style={{
            fontSize: '1.2rem',
            padding: '0.8rem 2.5rem',
            borderRadius: '16px',
            fontWeight: '1000',
            border: suitability.suitable ? '3px solid #27ae60' : '3px solid #c0392b',
            background: 'transparent',
            color: '#000',
            display: 'inline-block',
            letterSpacing: '0.5px'
          }}>
            {suitability.suitable ? '✓ Recommended Choice' : '✗ Limited Recommendation'}
          </div>

          {explanation && (
            <p className="suitability-explanation" style={{
              color: '#000',
              fontWeight: '700',
              marginTop: '2rem',
              fontSize: '1.3rem',
              lineHeight: 1.6,
              maxWidth: '800px',
              margin: '2rem auto'
            }}>{explanation}</p>
          )}

          {suitability.reasons && suitability.reasons.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
              {suitability.reasons.map((r, i) => (
                <span key={i} style={{
                  background: 'rgba(0,0,0,0.06)',
                  color: '#000',
                  padding: '0.6rem 1.2rem',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '800',
                  border: '1px solid rgba(0,0,0,0.1)'
                }}>
                  • {r}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
