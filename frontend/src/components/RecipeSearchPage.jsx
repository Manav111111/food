import React, { useState, useEffect } from 'react';

/**
 * DetailedRecipeCard Component
 * Fetches and displays all intelligence details for a single recipe result.
 */
function DetailedRecipeCard({ recipe }) {
  const [details, setDetails] = useState({
    nutrition: null,
    instructions: null,
    taste: null,
    flavor: null,
    structuredIngredients: null,
    loading: false
  });

  useEffect(() => {
    async function fetchFullDetails() {
      setDetails(prev => ({ ...prev, loading: true }));
      try {
        const [nutRes, instRes, tasteRes, flavorRes, ingCatRes] = await Promise.all([
          fetch(`/api/recipes/${recipe.id}/nutrition`),
          fetch(`/api/recipes/${recipe.id}/instructions`),
          fetch(`/api/recipes/${recipe.id}/taste`),
          fetch(`/api/recipes/${recipe.id}/flavor`),
          fetch(`/api/recipes/${recipe.id}/ingredients-categories`)
        ]);

        const [nutData, instData, tasteData, flavorData, ingCatData] = await Promise.all([
          nutRes.json(), instRes.json(), tasteRes.json(), flavorRes.json(), ingCatRes.json()
        ]);

        setDetails({
          nutrition: nutData.payload?.data?.[0] || nutData.nutrition,
          instructions: instData.instructions,
          taste: tasteData.taste,
          flavor: flavorData.flavor,
          structuredIngredients: ingCatData.payload,
          loading: false
        });
      } catch (err) {
        console.error('Failed to fetch recipe details:', err);
        setDetails(prev => ({ ...prev, loading: false }));
      }
    }
    fetchFullDetails();
  }, [recipe.id]);

  const nutritionData = details.nutrition;
  const ingredients = details.structuredIngredients?.ingredients || recipe.ingredients || [];
  const instructions = details.instructions;

  return (
    <div className="glass-card" style={{ marginBottom: '2rem', padding: '2rem', width: '100%', border: '1px solid var(--glass-border)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '0.5rem', color: 'var(--text-primary)' }}>{recipe.title}</h2>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span className="nut-badge" style={{ background: 'rgba(255,107,107,0.1)', color: '#ff6b6b' }}>📍 {recipe.region}</span>
            <span className="nut-badge" style={{ background: 'rgba(78,205,196,0.1)', color: '#4ecdc4' }}>⏱️ {recipe.totalTime} mins</span>
            <span className="nut-badge" style={{ background: 'rgba(255,230,109,0.1)', color: '#f9ca24' }}>👥 {recipe.servings} servings</span>
            {recipe.vegan && <span className="nut-badge" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>Vegan</span>}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--accent)' }}>{recipe.calories}</div>
          <div style={{ fontSize: '0.8rem', opacity: 0.6, letterSpacing: '1px' }}>TOTAL CALORIES</div>
        </div>
      </div>

      {/* Basic Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="glass-card" style={{ background: 'rgba(52, 152, 219, 0.05)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '0.3rem' }}>CARBS</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{recipe.carbs}g</div>
        </div>
        <div className="glass-card" style={{ background: 'rgba(46, 204, 113, 0.05)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '0.3rem' }}>PROTEIN</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{recipe.protein}g</div>
        </div>
        <div className="glass-card" style={{ background: 'rgba(231, 76, 60, 0.05)', padding: '1rem', textAlign: 'center' }}>
          <div style={{ opacity: 0.6, fontSize: '0.8rem', marginBottom: '0.3rem' }}>FAT</div>
          <div style={{ fontSize: '1.5rem', fontWeight: '600' }}>{recipe.fat}g</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        {/* Left Column: Ingredients & Instructions */}
        <div>
          <section style={{ marginBottom: '2rem' }}>
            <h3 style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '1rem', marginBottom: '1rem' }}>Ingredients List</h3>
            <ul style={{ listStyle: 'none', padding: 0, marginTop: '0.5rem' }}>
              {ingredients.map((ing, i) => (
                <li key={i} style={{ padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ color: 'var(--accent)' }}>•</span>
                  <span>{typeof ing === 'string' ? ing : ing.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h3 style={{ borderLeft: '4px solid var(--accent)', paddingLeft: '1rem', marginBottom: '1rem' }}>Cooking Instructions</h3>
            {details.loading ? (
              <div className="loading-spinner" style={{ scale: '0.5', margin: '1rem 0' }}></div>
            ) : (
              <p style={{ lineHeight: '1.8', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', fontSize: '1.05rem' }}>
                {instructions ? (typeof instructions === 'string' ? instructions : instructions.instructions) : "No instructions available for this recipe."}
              </p>
            )}
          </section>
        </div>

        {/* Right Column: High Intelligence Metrics */}
        <div>
          {/* Utensils & Processes */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
            <div>
              <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>🍳 UTENSILS</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {recipe.utensils?.map((u, i) => <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{u}</span>)}
              </div>
            </div>
            <div>
              <h4 style={{ fontSize: '0.9rem', opacity: 0.7, marginBottom: '0.5rem' }}>⚙️ PROCESSES</h4>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                {recipe.processes?.map((p, i) => <span key={i} style={{ fontSize: '0.75rem', background: 'rgba(52, 152, 219, 0.1)', padding: '0.3rem 0.6rem', borderRadius: '4px' }}>{p}</span>)}
              </div>
            </div>
          </div>

          {/* Taste Profile */}
          {details.taste && (
            <div className="glass-card" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem', marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Sensory Taste Profile</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                {Object.entries(details.taste).map(([key, val]) => (
                  <div key={key} style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '0.65rem', opacity: 0.6, marginBottom: '0.3rem', textTransform: 'uppercase' }}>{key}</div>
                    <div style={{ height: '80px', width: '12px', background: 'rgba(255,255,255,0.05)', margin: '0 auto', borderRadius: '6px', position: 'relative', overflow: 'hidden' }}>
                      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${Math.min(val * 100, 100)}%`, background: 'var(--accent)', borderRadius: '6px' }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Exhaustive Nutrition Table */}
          {nutritionData && (
            <div className="glass-card" style={{ background: 'rgba(0,0,0,0.2)', padding: '1.5rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Exhaustive Nutrition (Detailed)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontSize: '0.8rem' }}>
                {Object.entries(nutritionData).filter(([k]) => !['_id', 'Recipe_id', 'Recipe_title', 'recipeTitle', 'ndb_id'].includes(k)).map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0.2rem' }}>
                    <span style={{ opacity: 0.6 }}>{k.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: '600' }}>{v}</span>
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
    <div className="app-container" style={{ paddingTop: '5rem', paddingBottom: '5rem' }}>
      <div className="hero" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <h1 className="hero__title" style={{ fontSize: '4rem' }}>🍽️ Recipe Intelligence</h1>
        <p className="hero__subtitle" style={{ fontSize: '1.2rem', opacity: 0.8 }}>Deep-dive into recipes, nutrition, and cooking techniques</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '900px', margin: '0 auto 4rem', padding: '1.5rem', boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem' }}>
          <input
            type="text"
            className="goal-pill"
            style={{ flex: 1, padding: '1.2rem 2rem', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', fontSize: '1.3rem', color: 'white' }}
            placeholder="Search for a recipe (e.g. Samosa, Lentil Soup)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="analyze-btn" style={{ marginTop: 0, width: 'auto', padding: '0 3rem', fontSize: '1.2rem', borderRadius: '50px' }}>
            🔍 Search
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '5rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '2rem', fontSize: '1.2rem', color: 'var(--accent)' }}>Analyzing database for "{query}"...</p>
        </div>
      )}

      {error && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-card" style={{ borderColor: 'var(--danger)', textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '4rem' }}>😕</span>
            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && searchTriggered && recipes.length === 0 && (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div className="glass-card" style={{ textAlign: 'center', padding: '3rem' }}>
            <span style={{ fontSize: '4rem' }}>🧐</span>
            <p style={{ fontSize: '1.5rem', marginTop: '1rem' }}>No exact matches for "{query}". Try something else!</p>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {recipes.map((recipe) => (
          <DetailedRecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}


