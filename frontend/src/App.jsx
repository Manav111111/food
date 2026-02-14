import React, { useState, useCallback } from 'react';
import Header from './components/Header';
import ImageUpload from './components/ImageUpload';
import GoalSelector from './components/GoalSelector';
import ResultsCard from './components/ResultsCard';
import LoadingSpinner from './components/LoadingSpinner';
import RecipeSearchPage from './components/RecipeSearchPage';
import { analyzeFood } from './api/foodApi';

const SUPPORTED_FOODS = [
  'samosa', 'pizza', 'burger', 'french fries', 'salad',
  'grilled chicken', 'biryani', 'dal', 'idli', 'dosa',
  'fried rice', 'noodles', 'pasta', 'paneer tikka', 'tandoori chicken',
  'ice cream', 'cake', 'oatmeal', 'smoothie', 'sushi'
];

export default function App() {
  const [currentPage, setCurrentPage] = useState('home'); // 'home' or 'recipes'
  const [detectedFood, setDetectedFood] = useState(null);
  const [detectedLabel, setDetectedLabel] = useState(null);
  const [goal, setGoal] = useState('balanced_diet');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCorrector, setShowCorrector] = useState(false);
  const [aiLabel, setAiLabel] = useState(null);

  const handleFoodDetected = useCallback((label, predictions) => {
    setDetectedFood(label);
    setDetectedLabel(label);
    setAiLabel(label);
    setError(null);
    setResults(null);
    setShowCorrector(false);
  }, []);

  const handleCorrectedFood = useCallback((foodName) => {
    setDetectedFood(foodName);
    setDetectedLabel(foodName);
    setShowCorrector(false);
    setError(null);
    setResults(null);
  }, []);

  const handleGoalChange = useCallback((newGoal) => {
    setGoal(newGoal);
    if (results && detectedFood) {
      runAnalysis(detectedFood, newGoal, detectedLabel);
    }
  }, [detectedFood, detectedLabel, results]);

  const runAnalysis = useCallback(async (foodName, selectedGoal, label) => {
    setLoading(true);
    setError(null);
    setResults(null);
    try {
      const data = await analyzeFood(foodName, selectedGoal, label);
      setResults(data);
      setShowCorrector(false);
    } catch (err) {
      const msg = err.message || 'Failed to analyze food.';
      setError(msg);
      if (msg.includes('not in our database') || msg.includes('not found')) {
        setShowCorrector(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleAnalyze = useCallback(() => {
    if (detectedFood) runAnalysis(detectedFood, goal, detectedLabel);
  }, [detectedFood, goal, detectedLabel, runAnalysis]);

  // Show recipe search page if selected
  if (currentPage === 'recipes') {
    return (
      <>
        {/* Navigation */}
        <div style={{
          position: 'fixed',
          top: '1rem',
          right: '1rem',
          zIndex: 1000,
          display: 'flex',
          gap: '0.5rem'
        }}>
          <button
            onClick={() => setCurrentPage('home')}
            className="goal-pill"
            style={{
              padding: '0.75rem 1.5rem',
              background: currentPage === 'home' ? 'var(--primary)' : 'var(--glass-bg)',
              color: currentPage === 'home' ? 'white' : 'var(--text-primary)',
            }}
          >
            🏠 Home
          </button>
          <button
            onClick={() => setCurrentPage('recipes')}
            className="goal-pill"
            style={{
              padding: '0.75rem 1.5rem',
              background: currentPage === 'recipes' ? 'var(--primary)' : 'var(--glass-bg)',
              color: currentPage === 'recipes' ? 'white' : 'var(--text-primary)',
            }}
          >
            🔍 Recipe Search
          </button>
        </div>
        <RecipeSearchPage />
      </>
    );
  }

  return (
    <div className="app-container">

      {/* Navigation */}
      <div style={{
        position: 'fixed',
        top: '1rem',
        right: '1rem',
        zIndex: 1000,
        display: 'flex',
        gap: '0.5rem'
      }}>
        <button
          onClick={() => setCurrentPage('home')}
          className="goal-pill"
          style={{
            padding: '0.75rem 1.5rem',
            background: currentPage === 'home' ? 'var(--primary)' : 'var(--glass-bg)',
            color: currentPage === 'home' ? 'white' : 'var(--text-primary)',
          }}
        >
          🏠 Home
        </button>
        <button
          onClick={() => setCurrentPage('recipes')}
          className="goal-pill"
          style={{
            padding: '0.75rem 1.5rem',
            background: currentPage === 'recipes' ? 'var(--primary)' : 'var(--glass-bg)',
            color: currentPage === 'recipes' ? 'white' : 'var(--text-primary)',
          }}
        >
          🔍 Recipe Search
        </button>
      </div>

      {/* ── HERO ── */}
      <section className="hero">
        <div className="hero__left">
          <h1 className="hero__title">Your Plate, Decoded</h1>
          <p className="hero__subtitle">
            Harness the power of AI to transform your eating habits.
            Snap, understand the science, and find fuel your body actually needs.
          </p>
        </div>
        <div className="hero__right">
          <div className="hero__app-badge">
            <span>🥗</span>
            <div>
              AI Food Health Advisor
              <small>Analyze food instantly</small>
            </div>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS (hero steps) ── */}
      <section className="hero-steps-section">
        <div className="hero__steps">
          <div className="hero__step">
            <div className="hero__step-icon">📸</div>
            <span className="hero__step-label">Capture</span>
          </div>
          <div className="hero__step">
            <div className="hero__step-icon">🔬</div>
            <span className="hero__step-label">Analyze</span>
          </div>
          <div className="hero__step">
            <div className="hero__step-icon">✨</div>
            <span className="hero__step-label">Optimize</span>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS DETAIL ── */}
      <section className="how-it-works">
        <h2 className="section-header">How It Works</h2>
        <div className="how-it-works__grid">
          <div className="how-card">
            <div className="how-card__icon">🔍</div>
            <div className="how-card__title">Capture</div>
            <div className="how-card__desc">Upload or snap a photo of any food item for instant recognition</div>
          </div>
          <div className="how-card">
            <div className="how-card__icon">🧬</div>
            <div className="how-card__title">Identify Hidden Ingredients</div>
            <div className="how-card__desc">RecipeDB reveals what's really in your meal</div>
          </div>
          <div className="how-card">
            <div className="how-card__icon">⚙️</div>
            <div className="how-card__title">Goal-Based Intelligence</div>
            <div className="how-card__desc">Get personalized scores for your health goal</div>
          </div>
        </div>
      </section>

      {/* ── WHY USE IT ── */}
      <section className="why-section">
        <h2 className="section-header">Why Use It?</h2>
        <div className="why-grid">
          <div className="why-card">
            <div className="why-card__icon">📊</div>
            <div className="why-card__title">Nutrition Deep Dive</div>
            <div className="why-card__desc">Complete macro breakdown with calories, carbs, fat, protein</div>
          </div>
          <div className="why-card">
            <div className="why-card__icon">🔄</div>
            <div className="why-card__title">Smart Swaps</div>
            <div className="why-card__desc">FlavorDB finds tastier, healthier alternatives</div>
          </div>
          <div className="why-card">
            <div className="why-card__icon">🎯</div>
            <div className="why-card__title">Goal Tracking</div>
            <div className="why-card__desc">Weight loss, muscle gain, diabetes friendly or balanced diet</div>
          </div>
        </div>
      </section>

      {/* ── UPLOAD ── */}
      <ImageUpload onFoodDetected={handleFoodDetected} isLoading={loading} />

      {/* ── GOAL ── */}
      <GoalSelector selectedGoal={goal} onGoalChange={handleGoalChange} />

      {/* ── ANALYZE ── */}
      {detectedFood && (
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading} id="analyze-button">
          {loading ? '⏳ Analyzing...' : `🔍 Analyze "${detectedFood}"`}
        </button>
      )}

      {loading && <LoadingSpinner />}

      {error && (
        <div className="glass-card" style={{ borderColor: 'var(--danger)' }}>
          <div className="no-results">
            <span className="no-results__icon">😕</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {showCorrector && (
        <div className="glass-card">
          <div className="glass-card__title">
            <span className="glass-card__title-icon">🔄</span>
            AI detected "{aiLabel}" — Select the correct food:
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
            {SUPPORTED_FOODS.map(food => (
              <button key={food} className="goal-pill" onClick={() => handleCorrectedFood(food)}
                style={{ textTransform: 'capitalize' }}>
                {food}
              </button>
            ))}
          </div>
        </div>
      )}

      {results && <ResultsCard data={results} />}

      {!detectedFood && !results && !loading && (
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="no-results">
            <span className="no-results__icon">👆</span>
            <p style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>
              Upload a food image or type a food name to get started
            </p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginTop: '0.5rem' }}>
              Try: samosa, pizza, biryani, grilled chicken, idli, pasta, sushi
            </p>
            <button
              onClick={() => setCurrentPage('recipes')}
              className="analyze-btn"
              style={{ marginTop: '1rem' }}
            >
              🔍 Or Search Recipes Directly
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
