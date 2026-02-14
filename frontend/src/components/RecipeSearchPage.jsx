import React, { useState, useEffect } from 'react';

/**
 * DetailedRecipeCard Component
 * Fetches and displays all intelligence details for a single recipe result.
 */
import GoalSelector from './GoalSelector';
import HealthAssessment from './HealthAssessment';

function DetailedRecipeCard({ recipe, selectedGoal }) {
  const [details, setDetails] = useState({
    nutrition: null,
    instructions: null,
    taste: null,
    flavor: null,
    utensils: null,
    processes: null,
    structuredIngredients: null,
    healthIntel: null,
    precisionHealth: null,
    loading: false
  });

  useEffect(() => {
    async function fetchFullDetails() {
      setDetails(prev => ({ ...prev, loading: true }));
      try {
        const queryParams = new URLSearchParams({
          title: recipe.title,
          goal: selectedGoal || 'balanced_diet'
        }).toString();

        const [nutRes, instRes, tasteRes, flavorRes, utensilsRes, procRes, ingCatRes, healthRes, precisionRes] = await Promise.all([
          fetch(`/api/recipes/${recipe.id}/nutrition`),
          fetch(`/api/recipes/${recipe.id}/instructions`),
          fetch(`/api/recipes/${recipe.id}/taste`),
          fetch(`/api/recipes/${recipe.id}/flavor`),
          fetch(`/api/recipes/${recipe.id}/utensils`),
          fetch(`/api/recipes/${recipe.id}/processes`),
          fetch(`/api/recipes/${recipe.id}/ingredients-categories`),
          fetch(`/api/recipes/${recipe.id}/health-intel?${queryParams}`),
          fetch(`/api/recipes/${recipe.id}/precision-health`)
        ]);

        const [nutData, instData, tasteData, flavorData, utensilsData, procData, ingCatData, healthData, precisionData] = await Promise.all([
          nutRes.json(), instRes.json(), tasteRes.json(), flavorRes.json(),
          utensilsRes.json(), procRes.json(), ingCatRes.json(), healthRes.json(),
          precisionRes.json()
        ]);

        setDetails({
          nutrition: nutData.payload?.data?.[0] || nutData.nutrition,
          instructions: instData.instructions,
          taste: tasteData.taste,
          flavor: flavorData.flavor,
          utensils: utensilsData.utensils || recipe.utensils,
          processes: procData.processes || recipe.processes,
          structuredIngredients: ingCatData.payload,
          healthIntel: healthData.success ? healthData : null,
          precisionHealth: precisionData.success ? precisionData : null,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        setDetails(prev => ({ ...prev, loading: false }));
      }
    }
    fetchFullDetails();
  }, [recipe.id, recipe.title, selectedGoal]);

  const ingredients = details.structuredIngredients?.ingredients || recipe.ingredients || [];

  // Ensure instructionText is a string (handle nested object or empty objects from API)
  let rawInstructions = details.instructions?.instructions || details.instructions;
  let instructionText = (typeof rawInstructions === 'string' && rawInstructions.trim() !== "")
    ? rawInstructions
    : "No instructions provided.";

  if (instructionText === "No instructions provided.") {
    if (recipe.processes && recipe.processes.length > 0) {
      instructionText = "Step-by-step cooking: " + recipe.processes.join(" → ");
    } else {
      const procList = Array.isArray(details.processes) ? details.processes : [];
      if (procList.length > 0) {
        instructionText = "Step-by-step cooking: " + procList.join(" → ");
      }
    }
  }

  const utensils = Array.isArray(details.utensils) ? details.utensils : (Array.isArray(recipe.utensils) ? recipe.utensils : []);
  const processes = Array.isArray(details.processes) ? details.processes : (Array.isArray(recipe.processes) ? recipe.processes : []);
  const healthIntel = details.healthIntel;
  const nutritionData = details.nutrition && typeof details.nutrition === 'object' ? details.nutrition : null;

  return (
    <div className="recipe-detail-card" style={{ marginBottom: '4rem', width: '100%', position: 'relative' }}>
      {/* Search Result Header Card */}
      <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '3rem', margin: 0, color: 'var(--text-primary)', fontWeight: '900' }}>{recipe.title}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <span className="nut-badge" style={{ background: 'rgba(255,107,107,0.15)', color: '#ff6b6b' }}>📍 {recipe.region}</span>
              <span className="nut-badge" style={{ background: 'rgba(78,205,196,0.15)', color: '#4ecdc4' }}>⏱️ {recipe.totalTime} mins</span>
              <span className="nut-badge" style={{ background: 'rgba(255,230,109,0.15)', color: '#f9ca24' }}>👥 {recipe.servings} Servings</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '3.5rem', fontWeight: '900', color: 'var(--accent)', lineHeight: 1 }}>{recipe.calories}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.7, letterSpacing: '3px', fontWeight: '800', marginTop: '0.5rem' }}>TOTAL CALORIES</div>
          </div>
        </div>

        {/* Macros */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1rem' }}>
          <div style={{ flex: 1, padding: '1.5rem', borderRadius: '16px', background: 'rgba(52, 152, 219, 0.1)', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Carbs</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{recipe.carbs}g</div>
          </div>
          <div style={{ flex: 1, padding: '1.5rem', borderRadius: '16px', background: 'rgba(46, 204, 113, 0.1)', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Protein</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{recipe.protein}g</div>
          </div>
          <div style={{ flex: 1, padding: '1.5rem', borderRadius: '16px', background: 'rgba(231, 76, 60, 0.1)', textAlign: 'center' }}>
            <div style={{ opacity: 0.7, fontSize: '0.9rem', marginBottom: '0.5rem' }}>Fat</div>
            <div style={{ fontSize: '1.8rem', fontWeight: '800' }}>{recipe.fat}g</div>
          </div>
        </div>
      </div>

      {/* PRECISION HEALTH ASSESSMENT */}
      {details.precisionHealth && (
        <div style={{
          padding: '2.5rem',
          background: '#FFFFFF', // Pure white
          borderRadius: '24px',
          marginBottom: '3rem',
          border: '1px solid rgba(0,0,0,0.1)',
          boxShadow: '0 20px 40px rgba(0,0,0,0.05)',
          color: '#000'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{
                background: details.precisionHealth.color,
                color: '#fff',
                padding: '0.8rem 1.5rem',
                borderRadius: '12px',
                fontWeight: '900',
                fontSize: '1.1rem',
                boxShadow: `0 10px 20px ${details.precisionHealth.color}33`
              }}>
                {details.precisionHealth.category.toUpperCase()}
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: '900', color: '#000' }}>
                Health Score: <span style={{ color: details.precisionHealth.color }}>{details.precisionHealth.healthScore}</span>
              </div>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#000', opacity: 0.8, fontWeight: '900', letterSpacing: '3px' }}>PRECISION ANALYTICS</div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
            {details.precisionHealth.benefits.map((b, i) => (
              <span key={i} className="nut-badge" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#27ae60', border: '2px solid rgba(46, 204, 113, 0.2)', padding: '0.6rem 1.2rem', fontSize: '1rem', fontWeight: '800' }}>
                ✨ {b}
              </span>
            ))}
            {details.precisionHealth.riskFactors.map((r, i) => (
              <span key={i} className="nut-badge" style={{ background: 'rgba(231, 76, 60, 0.1)', color: '#c0392b', border: '2px solid rgba(231, 76, 60, 0.2)', padding: '0.6rem 1.2rem', fontSize: '1rem', fontWeight: '800' }}>
                ⚠️ {r}
              </span>
            ))}
            {details.precisionHealth.benefits.length === 0 && details.precisionHealth.riskFactors.length === 0 && (
              <span style={{ opacity: 0.6, fontStyle: 'italic', color: '#000' }}>Balanced nutritional profile detected.</span>
            )}
          </div>
        </div>
      )}

      {/* HEALTH ASSESSMENT (MATCHING SCREENSHOT) */}
      {healthIntel && (
        <div className="health-dashboard-section" style={{ marginBottom: '3rem' }}>
          <div className="health-assessment-card" style={{
            textAlign: 'center',
            padding: '4rem 3rem 3rem',
            background: '#FFFFFF', // Pure white
            borderRadius: '24px',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(0,0,0,0.1)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.06)'
          }}>
            <div style={{
              position: 'absolute',
              top: '1.5rem',
              left: '2rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontSize: '1.4rem',
              fontWeight: '900',
              color: '#000' // Prominent black headline
            }}>
              <span style={{ color: '#ff4757' }}>❤️</span> Health Assessment
            </div>

            <div style={{ margin: '2rem auto' }}>
              <HealthAssessment score={healthIntel.suitability} suitability={healthIntel.suitability} />
            </div>
          </div>

          {/* HEALTHIER ALTERNATIVES (MATCHING SCREENSHOT) */}
          {healthIntel.alternatives && healthIntel.alternatives.length > 0 && (
            <div className="health-alternatives-card" style={{
              marginTop: '2rem',
              padding: '2.5rem',
              background: '#FFFFFF', // Pure white
              borderRadius: '24px',
              border: '1px solid rgba(0,0,0,0.1)',
              boxShadow: '0 15px 30px rgba(0,0,0,0.04)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.3rem', fontWeight: '900', color: '#000' }}>
                  <span style={{ color: '#3498db' }}>🔄</span> Healthier Alternatives
                </div>
                <span style={{ fontSize: '0.75rem', color: '#000', opacity: 0.8, fontWeight: '900', letterSpacing: '2px' }}>FLAVORDB</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {healthIntel.alternatives.map((alt, idx) => (
                  <div key={idx} className="alt-item" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '1.5rem',
                    background: 'rgba(0,0,0,0.02)',
                    borderRadius: '16px',
                    border: '1px solid rgba(0,0,0,0.05)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                      <span style={{ fontSize: '1.6rem', fontWeight: '950', color: '#ff4757', opacity: 0.8 }}>#{idx + 1}</span>
                      <div>
                        <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#000' }}>{alt.name}</div>
                        <div style={{ fontSize: '0.9rem', color: '#000', opacity: 0.6, marginTop: '0.3rem', fontWeight: '600' }}>🔍 {alt.cooking_method}</div>
                      </div>
                    </div>
                    <div className="match-badge" style={{
                      padding: '0.6rem 1.2rem',
                      borderRadius: '10px',
                      background: 'rgba(46, 204, 113, 0.1)',
                      color: '#27ae60',
                      fontSize: '0.9rem',
                      fontWeight: '900',
                      border: '1px solid rgba(46, 204, 113, 0.2)'
                    }}>
                      {/* Removed duplicated/extra match calculations as requested */}
                      {Math.round(alt.similarity)} match
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Details Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '3rem' }}>
        <div>
          <section style={{ marginBottom: '3rem' }}>
            <h3 style={{ borderLeft: '6px solid var(--accent)', paddingLeft: '1.5rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Full Ingredient List</h3>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              {ingredients.map((ing, i) => (
                <li key={i} style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '1.2rem' }}>
                  <span style={{ color: 'var(--accent)' }}>✅</span> {typeof ing === 'string' ? ing : ing.name}
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 style={{ borderLeft: '6px solid var(--accent)', paddingLeft: '1.5rem', marginBottom: '1.5rem', fontSize: '1.5rem' }}>Step-by-Step Cooking</h3>
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '2rem', borderRadius: '16px', lineHeight: 1.8, fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)' }}>
              {details.loading ? "Loading instructions..." : instructionText}
            </div>
          </section>
        </div>

        <div>
          {/* Utensils & Processes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ opacity: 0.6, fontSize: '0.8rem', fontWeight: '800', marginBottom: '1rem' }}>REQUIRED UTENSILS</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {utensils.map((u, i) => <span key={i} className="nut-badge" style={{ background: 'rgba(255,255,255,0.05)', fontSize: '0.75rem' }}>{u}</span>)}
              </div>
            </div>
            <div className="glass-card" style={{ padding: '1.5rem' }}>
              <div style={{ opacity: 0.6, fontSize: '0.8rem', fontWeight: '800', marginBottom: '1rem' }}>TECHNIQUES</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                {processes.map((p, i) => <span key={i} className="nut-badge" style={{ background: 'rgba(52, 152, 219, 0.1)', fontSize: '0.75rem', color: '#3498db' }}>{p}</span>)}
              </div>
            </div>
          </div>

          {/* Taste Visualizer */}
          {details.taste && (
            <div className="glass-card" style={{ padding: '2rem', marginBottom: '2rem' }}>
              <h4 style={{ marginBottom: '1.5rem', fontSize: '1.1rem' }}>Predicted Sensory Profile</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1rem' }}>
                {Object.entries(details.taste).map(([key, val]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginBottom: '0.5rem', textTransform: 'uppercase' }}>{key}</div>
                    <div style={{ height: '100px', width: '15px', background: 'rgba(255,255,255,0.05)', margin: '0 auto', borderRadius: '10px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${val * 100}%`, background: 'var(--accent)', transition: 'height 0.5s ease' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Detailed Nutrition Table */}
          {nutritionData && (
            <div className="glass-card" style={{ padding: '2rem', background: 'rgba(0,0,0,0.3)' }}>
              <h4 style={{ marginBottom: '1rem' }}>Exhaustive Nutrition Data</h4>
              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {Object.entries(nutritionData).filter(([k]) => !['_id', 'Recipe_id', 'Recipe_title', 'recipeTitle', 'ndb_id'].includes(k)).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.4rem', fontSize: '0.85rem' }}>
                    <span style={{ opacity: 0.6 }}>{k.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: '700' }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RecipeSearchPage() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState('balanced_diet');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchTriggered(true);
    try {
      const response = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      if (data.success) {
        setRecipes(data.recipes || []);
      } else {
        setError(data.error || 'Failed to fetch recipes.');
      }
    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ paddingTop: '5rem', paddingBottom: '10rem' }}>
      <div className="hero" style={{ textAlign: 'center', marginBottom: '5rem' }}>
        <h1 className="hero__title" style={{ fontSize: '5rem', fontWeight: '900', color: 'var(--text-primary)' }}>🍽️ Recipe Intelligence</h1>
        <p className="hero__subtitle" style={{ fontSize: '1.5rem', opacity: 0.8, maxWidth: '800px', margin: '1rem auto' }}>
          Connect your health goals with deep nutritional analytics and flavoring intelligence.
        </p>
      </div>

      {/* GOAL SELECTOR PART (MATCHING SCREENSHOT) */}
      <div style={{ maxWidth: '1000px', margin: '0 auto 3rem', textAlign: 'center' }}>
        <GoalSelector selectedGoal={selectedGoal} onGoalChange={setSelectedGoal} />
      </div>

      {/* SEARCH/ANALYZE BOX (MATCHING SCREENSHOT) */}
      <div className="glass-card" style={{
        maxWidth: '1000px',
        margin: '0 auto 5rem',
        padding: '2.5rem',
        background: 'rgba(255,255,255,0.98)',
        borderRadius: '24px',
        boxShadow: '0 30px 60px rgba(0,0,0,0.12)'
      }}>
        <form onSubmit={handleSearch}>
          <input
            type="text"
            style={{
              width: '100%',
              padding: '2rem',
              background: '#f8f9fa',
              border: '2px solid rgba(0,0,0,0.05)',
              fontSize: '1.8rem',
              color: '#1a1a1a',
              borderRadius: '16px',
              outline: 'none',
              marginBottom: '1.5rem',
              fontWeight: '700'
            }}
            placeholder="Search recipes (e.g. Samosa, Pasta, Pizza)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="analyze-btn" style={{
            width: '100%',
            padding: '1.8rem',
            fontSize: '1.5rem',
            fontWeight: '900',
            letterSpacing: '1px',
            backgroundColor: '#d63384', // Matches the red/pink button in screenshot
            color: 'white',
            borderRadius: '16px',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            cursor: 'pointer',
            transition: 'transform 0.2s'
          }}>
            🔍 Analyze "{query || 'Your Recipe'}"
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '10rem 0' }}>
          <div className="loading-spinner" style={{ width: '80px', height: '80px' }}></div>
          <p style={{ marginTop: '2rem', fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>Fetching Intelligence for "{query}"...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto', borderColor: 'var(--danger)', textAlign: 'center', padding: '4rem' }}>
          <span style={{ fontSize: '5rem' }}>❌</span>
          <p style={{ fontSize: '1.8rem', marginTop: '1.5rem' }}>{error}</p>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '5rem' }}>
        {recipes.map((recipe) => (
          <DetailedRecipeCard key={recipe.id} recipe={recipe} selectedGoal={selectedGoal} />
        ))}
      </div>
    </div>
  );
}



