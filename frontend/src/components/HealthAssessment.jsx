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
    <div className="health-score-container" style={{ color: '#000' }}>
      {/* Circular gauge */}
      <div className="health-gauge" style={{ position: 'relative', display: 'inline-block' }}>
        <svg className="health-gauge__circle" width="160" height="160" viewBox="0 0 150 150">
          <circle className="health-gauge__bg" cx="75" cy="75" r={radius} stroke="rgba(0,0,0,0.05)" strokeWidth="12" fill="none" />
          <circle
            className="health-gauge__fill"
            cx="75" cy="75" r={radius}
            stroke={color}
            strokeWidth="12"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
          />
        </svg>
        <div className="health-gauge__text" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          textAlign: 'center'
        }}>
          <div className="health-gauge__score" style={{
            color,
            fontSize: '3rem',
            fontWeight: '900',
            lineHeight: 1,
            textShadow: '0 2px 10px rgba(0,0,0,0.1)'
          }}>{numericScore}</div>
          <div className="health-gauge__label" style={{
            fontSize: '0.7rem',
            fontWeight: '900',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            color: '#000',
            marginTop: '0.2rem'
          }}>Health Score</div>
        </div>
      </div>

      {/* Suitability */}
      {suitability && (
        <div style={{ marginTop: '1.5rem' }}>
          <div className={`suitability-badge suitability-badge--${suitability.suitable ? 'suitable' : 'not-suitable'}`} style={{
            fontSize: '1rem',
            padding: '0.6rem 1.5rem',
            borderRadius: '12px',
            fontWeight: '800',
            border: suitability.suitable ? '2px solid var(--success)' : '2px solid var(--danger)',
            background: 'transparent',
            color: '#000'
          }}>
            {suitability.suitable ? '✓ Healthy Choice' : '✗ Less Healthy'}
          </div>

          {explanation && (
            <p className="suitability-explanation" style={{ color: '#000', fontWeight: '600', marginTop: '1rem', fontSize: '1.1rem' }}>{explanation}</p>
          )}

          {suitability.reasons && suitability.reasons.length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '1rem' }}>
              {suitability.reasons.map((r, i) => (
                <span key={i} style={{
                  background: 'rgba(0,0,0,0.05)',
                  color: '#000',
                  padding: '0.4rem 0.8rem',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: '700',
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
