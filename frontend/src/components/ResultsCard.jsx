import React from 'react';
import NutritionPanel from './NutritionPanel';
import HealthAssessment from './HealthAssessment';
import Alternatives from './Alternatives';

export default function ResultsCard({ data }) {
  if (!data || !data.success) return null;

  return (
    <div className="results-section">
      {/* Detected food banner */}
      <div className="detected-food-banner" style={{ marginBottom: 'var(--section-gap)' }}>
        <span className="detected-food-banner__icon">🍽️</span>
        <div className="detected-food-banner__info">
          <h2>{data.detectedFood}</h2>
          <p>Analyzed from: {data.originalLabel}</p>
        </div>
      </div>

      {/* Each section is its own full-width card */}
      <div className="results-grid">
        {/* Nutrition & Recipe */}
        <div className="glass-card">
          <div className="glass-card__title">
            <span className="glass-card__title-icon">📊</span>
            Nutrition & Ingredients
            <span className="source-tag source-tag--recipedb" style={{ marginLeft: 'auto' }}>RecipeDB</span>
          </div>
          <NutritionPanel
            nutrition={data.nutrition}
            recipe={data.recipe}
          />
        </div>

        {/* Health Assessment */}
        <div className="glass-card">
          <div className="glass-card__title">
            <span className="glass-card__title-icon">❤️</span>
            Health Assessment
          </div>
          <HealthAssessment
            score={data.healthScore}
            suitability={data.suitability}
          />
        </div>

        {/* Alternatives */}
        {data.alternatives && data.alternatives.length > 0 && (
          <div className="glass-card">
            <div className="glass-card__title">
              <span className="glass-card__title-icon">🔄</span>
              Healthier Alternatives
              <span className="source-tag source-tag--flavordb" style={{ marginLeft: 'auto' }}>FlavorDB</span>
            </div>
            <Alternatives alternatives={data.alternatives} />
          </div>
        )}
      </div>
    </div>
  );
}
