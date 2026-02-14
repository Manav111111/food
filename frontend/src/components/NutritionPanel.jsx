import React from 'react';

const COLORS = ['#f59e0b', '#3b82f6', '#ef4444', '#10b981', '#84cc16', '#ec4899'];

function DonutChart({ nutrition }) {
  const items = [
    { label: 'Calories', value: nutrition.calories || 0, unit: 'kcal' },
    { label: 'Carbohydrates', value: nutrition.carbs || 0, unit: 'g' },
    { label: 'Fat', value: nutrition.fat || 0, unit: 'g' },
    { label: 'Protein', value: nutrition.protein || 0, unit: 'g' },
    { label: 'Fiber', value: nutrition.fiber || 0, unit: 'g' },
    { label: 'Sugar', value: nutrition.sugar || 0, unit: 'g' },
  ];

  // For the donut, use only macro values (skip calories since it's a different unit)
  const macros = items.slice(1);
  const total = macros.reduce((sum, m) => sum + m.value, 0) || 1;

  const radius = 80;
  const strokeWidth = 28;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = macros.map((m, i) => {
    const fraction = m.value / total;
    const dashLength = fraction * circumference;
    const dashOffset = -cumulativeOffset;
    cumulativeOffset += dashLength;
    return { ...m, color: COLORS[i + 1], dashLength, dashOffset, fraction };
  });

  return (
    <div className="donut-wrapper">
      <div className="donut-chart">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle cx="100" cy="100" r={radius} fill="none" stroke="rgba(0,0,0,0.05)" strokeWidth={strokeWidth} />
          {/* Segments */}
          {segments.map((seg, i) => (
            <circle
              key={i}
              cx="100" cy="100" r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dashLength} ${circumference - seg.dashLength}`}
              strokeDashoffset={seg.dashOffset}
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'all 0.8s ease' }}
            />
          ))}
        </svg>
        {/* Center text */}
        <div className="donut-center">
          <div className="donut-center__value">{items[0].value}</div>
          <div className="donut-center__unit">kcal</div>
        </div>
      </div>
      {/* Legend labels around the chart */}
      <div className="donut-labels">
        {macros.map((m, i) => (
          <div key={i} className="donut-label-item">
            <span className="donut-label-dot" style={{ background: COLORS[i + 1] }} />
            <span className="donut-label-name">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function NutritionPanel({ nutrition, recipe }) {
  if (!nutrition) return <p style={{ color: 'var(--text-muted)' }}>No nutrition data available.</p>;

  const nutrients = [
    { key: 'calories', label: 'Calories', value: nutrition.calories, unit: 'kcal', max: 800, color: 'calories' },
    { key: 'carbs', label: 'Carbohydrates', value: nutrition.carbs, unit: 'g', max: 100, color: 'carbs' },
    { key: 'fat', label: 'Fat', value: nutrition.fat, unit: 'g', max: 60, color: 'fat' },
    { key: 'protein', label: 'Protein', value: nutrition.protein, unit: 'g', max: 50, color: 'protein' },
    { key: 'fiber', label: 'Fiber', value: nutrition.fiber, unit: 'g', max: 15, color: 'fiber' },
    { key: 'sugar', label: 'Sugar', value: nutrition.sugar, unit: 'g', max: 30, color: 'sugar' }
  ];

  return (
    <div>
      {/* Recipe info */}
      {recipe && (
        <div className="recipe-info">
          <div className="recipe-info-item">
            <div className="recipe-info-item__label">Cuisine</div>
            <div className="recipe-info-item__value">{recipe.cuisine || '—'}</div>
          </div>
          <div className="recipe-info-item">
            <div className="recipe-info-item__label">Cooking</div>
            <div className="recipe-info-item__value">{recipe.cooking_method || '—'}</div>
          </div>
          <div className="recipe-info-item">
            <div className="recipe-info-item__label">Category</div>
            <div className="recipe-info-item__value">{recipe.category || '—'}</div>
          </div>
          <div className="recipe-info-item">
            <div className="recipe-info-item__label">Prep Time</div>
            <div className="recipe-info-item__value">{recipe.prep_time || '—'}</div>
          </div>
        </div>
      )}

      {/* Donut chart + Bars side by side */}
      <div className="nutrition-layout">
        {/* Left: Donut */}
        <DonutChart nutrition={nutrition} />

        {/* Right: Bars */}
        <div className="nutrition-bars">
          {nutrients.filter(n => n.value !== undefined).map(n => (
            <div key={n.key} className="nutrition-item">
              <div className="nutrition-item__header">
                <span className="nutrition-item__label">{n.label}</span>
                <span className="nutrition-item__value">{n.value} {n.unit}</span>
              </div>
              <div className="nutrition-bar">
                <div
                  className={`nutrition-bar__fill nutrition-bar__fill--${n.color}`}
                  style={{ width: `${Math.min((n.value / n.max) * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ingredients */}
      {recipe && recipe.ingredients && (
        <>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, marginTop: '1.5rem', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            🧂 Key Ingredients
          </div>
          <div className="ingredients-list">
            {recipe.ingredients.map((ing, i) => (
              <span key={i} className="ingredient-chip">{ing}</span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
