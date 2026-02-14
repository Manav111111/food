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
    <div className="health-score-container">
      {/* Circular gauge */}
      <div className="health-gauge">
        <svg className="health-gauge__circle" width="150" height="150" viewBox="0 0 150 150">
          <circle className="health-gauge__bg" cx="75" cy="75" r={radius} />
          <circle
            className="health-gauge__fill"
            cx="75" cy="75" r={radius}
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="health-gauge__text">
          <div className="health-gauge__score" style={{ color }}>{numericScore}</div>
          <div className="health-gauge__label">Health Score</div>
        </div>
      </div>

      {/* Suitability */}
      {suitability && (
        <>
          <div className={`suitability-badge suitability-badge--${suitability.suitable ? 'suitable' : 'not-suitable'}`}>
            {suitability.suitable ? '✓ Suitable' : '✗ Not Suitable'}
            {suitability.goal && ` for ${suitability.goal.replace(/_/g, ' ')}`}
          </div>

          {explanation && (
            <p className="suitability-explanation">{explanation}</p>
          )}

          {suitability.reasons && suitability.reasons.length > 0 && (
            <ul className="suitability-reasons">
              {suitability.reasons.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
