import React, { useState, useEffect } from 'react';

export default function RecipeSearchPage() {
  const [query, setQuery] = useState('');
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [nutrition, setNutrition] = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [taste, setTaste] = useState(null);
  const [flavor, setFlavor] = useState(null);
  const [utensils, setUtensils] = useState(null);
  const [processes, setProcesses] = useState(null);
  const [structuredIngredients, setStructuredIngredients] = useState(null);





  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setSearchTriggered(true);
    try {
      console.log(`[Frontend] Searching for: "${query}"...`);
      const response = await fetch(`/api/recipes/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      console.log('[Frontend] Search response data:', data);

      if (data.success) {
        setRecipes(data.recipes || []);
        console.log(`[Frontend] Found ${data.recipes ? data.recipes.length : 0} recipes`);
      } else {
        setError(data.error || 'Failed to fetch recipes.');
      }

    } catch (err) {
      setError('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRecipeClick = async (recipe) => {
    setSelectedRecipe(recipe);
    setDetailsLoading(true);
    setNutrition(null);
    setInstructions(null);
    setTaste(null);
    setFlavor(null);
    setUtensils(recipe.utensils || null); // Try to get from recipe object first
    setProcesses(recipe.processes || null);
    setStructuredIngredients(null);

    try {
      // Fetch everything in parallel - MAXIMUM ENDPOINTS v2
      const [nutRes, instRes, tasteRes, flavorRes, utensilsRes, procRes, ingCatRes] = await Promise.all([
        fetch(`/api/recipes/${recipe.id}/nutrition`),
        fetch(`/api/recipes/${recipe.id}/instructions`),
        fetch(`/api/recipes/${recipe.id}/taste`),
        fetch(`/api/recipes/${recipe.id}/flavor`),
        fetch(`/api/recipes/${recipe.id}/utensils`),
        fetch(`/api/recipes/${recipe.id}/processes`),
        fetch(`/api/recipes/${recipe.id}/ingredients-categories`)
      ]);

      const [nutData, instData, tasteData, flavorData, utensilsData, procData, ingCatData] = await Promise.all([
        nutRes.json(),
        instRes.json(),
        tasteRes.json(),
        flavorRes.json(),
        utensilsRes.json(),
        procRes.json(),
        ingCatRes.json()
      ]);

      if (nutData.success) setNutrition(nutData.payload?.data?.[0] || nutData.nutrition);
      if (instData.success) setInstructions(instData.instructions);
      if (tasteData.success) setTaste(tasteData.taste);
      if (flavorData.success) setFlavor(flavorData.flavor);
      if (utensilsData.success && utensilsData.utensils) setUtensils(utensilsData.utensils);
      if (procData.success && procData.processes) setProcesses(procData.processes);
      if (ingCatData.success && ingCatData.payload) setStructuredIngredients(ingCatData.payload);
    } catch (err) {
      console.error('Failed to fetch details:', err);
    } finally {
      setDetailsLoading(false);
    }
  };




  return (
    <div className="app-container" style={{ paddingTop: '5rem' }}>
      <div className="hero" style={{ textAlign: 'center', marginBottom: '2rem' }}>
        <h1 className="hero__title">
          <span style={{ fontSize: '3rem' }}>🍽️</span> Recipe Search
        </h1>
        <p className="hero__subtitle">Search for any recipe and get complete nutrition information</p>
      </div>

      <div className="glass-card" style={{ maxWidth: '800px', margin: '0 auto 2rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            className="goal-pill"
            style={{ flex: 1, padding: '1rem 1.5rem', border: '1px solid var(--glass-border)', fontSize: '1.2rem' }}
            placeholder="Search for: samosa, pizza, biryani, pasta..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="submit" className="analyze-btn" style={{ marginTop: 0, width: 'auto', padding: '0 2rem' }}>
            🔍 Search
          </button>
        </form>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading-spinner"></div>
          <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Finding the best recipes for "{query}"...</p>
        </div>
      )}

      {error && (
        <div className="glass-card" style={{ borderColor: 'var(--danger)', textAlign: 'center' }}>
          <div className="no-results">
            <span className="no-results__icon">😕</span>
            <p>{error}</p>
          </div>
        </div>
      )}

      {!loading && !error && searchTriggered && recipes.length === 0 && (
        <div className="glass-card" style={{ textAlign: 'center' }}>
          <div className="no-results">
            <span className="no-results__icon">🧐</span>
            <p>No recipes found for "{query}". Try searching for: samosa, pizza, biryani, pasta</p>
          </div>
        </div>
      )}

      <div className="results-grid">
        {recipes.map((recipe) => (
          <div
            key={recipe.id || recipe.Recipe_id}
            className="glass-card result-item"
            style={{
              cursor: 'pointer',
              transition: 'transform 0.2s',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}
            onClick={() => handleRecipeClick(recipe)}
            onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
          >
            <div className="glass-card__title" style={{ fontSize: '1.25rem' }}>
              {recipe.title || recipe.Recipe_title}
            </div>

            <div className="nutrition-summary" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
              <div className="nut-badge">
                <small>Calories</small>
                <span>{recipe.calories || '-'}</span>
              </div>
              <div className="nut-badge" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>
                <small>Carbs</small>
                <span>{recipe.carbs || 0}g</span>
              </div>
              <div className="nut-badge" style={{ background: 'rgba(231, 76, 60, 0.1)' }}>
                <small>Fat</small>
                <span>{recipe.fat || 0}g</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {recipe.vegan && <span className="nut-badge" style={{ background: 'rgba(46, 204, 113, 0.2)', color: '#2ecc71' }}>Vegan</span>}
              {recipe.vegetarian && <span className="nut-badge" style={{ background: 'rgba(52, 152, 219, 0.2)', color: '#3498db' }}>Veg</span>}
              <span className="nut-badge" style={{ background: 'var(--glass-bg)' }}>{recipe.region || recipe.cuisine}</span>
            </div>

            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                Ingredients: {recipe.ingredients.slice(0, 8).join(', ')}...
              </p>
            )}

            <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
              <span>⏱️ {recipe.totalTime || recipe.total_time || '-'} mins</span>
              <button className="analyze-btn" style={{ margin: 0, padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}>
                View Full Recipe
              </button>
            </p>
          </div>
        ))}
      </div>



      {/* Detailed View Modal */}
      {selectedRecipe && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000,
          padding: '2rem'
        }} onClick={() => setSelectedRecipe(null)}>
          <div className="glass-card" style={{
            maxWidth: '1000px',
            maxHeight: '90vh',
            width: '100%',
            overflowY: 'auto',
            position: 'relative',
            padding: '2rem',
            background: 'var(--bg-primary)'
          }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setSelectedRecipe(null)}
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'none',
                border: 'none',
                fontSize: '2rem',
                cursor: 'pointer',
                color: 'var(--text-primary)'
              }}
            >
              ×
            </button>

            <h2 className="hero__title" style={{ fontSize: '2rem', textAlign: 'left', marginBottom: '1rem' }}>
              {selectedRecipe.title}
            </h2>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
              <div className="nut-badge"><span>🔥 {selectedRecipe.calories} cal</span></div>
              <div className="nut-badge"><span>📍 {selectedRecipe.region}</span></div>
              <div className="nut-badge"><span>⏱️ {selectedRecipe.totalTime} mins</span></div>
              <div className="nut-badge"><span>👥 {selectedRecipe.servings} servings</span></div>
            </div>

            <div className="results-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
              {/* Macros */}
              <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                <h3 style={{ marginBottom: '1rem' }}>Macros (per serving)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div><strong>Carbs:</strong> {selectedRecipe.carbs}g</div>
                  <div><strong>Protein:</strong> {selectedRecipe.protein}g</div>
                  <div><strong>Fat:</strong> {selectedRecipe.fat}g</div>
                </div>
              </div>

              {/* Ingredients/Instructions Placeholder or Data */}
              {detailsLoading ? (
                <div style={{ textAlign: 'center', padding: '2rem', gridColumn: '1 / -1' }}>
                  <div className="loading-spinner"></div>
                  <p>Loading full details...</p>
                </div>
              ) : (
                <>
                  {taste && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Taste Profile</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '1rem' }}>
                        {Object.entries(taste).map(([key, val]) => (
                          <div key={key} style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '0.75rem', opacity: 0.6, marginBottom: '0.3rem' }}>{key}</div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(255,255,255,0.1)', borderRadius: '3px' }}>
                              <div style={{ width: `${Math.min(val * 100, 100)}%`, height: '100%', background: 'rgb(82, 186, 179)', borderRadius: '3px' }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {utensils && utensils.length > 0 && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Utensils Needed</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {utensils.map((u, i) => <span key={i} className="nut-badge" style={{ background: 'rgba(255,255,255,0.1)' }}>{u}</span>)}
                      </div>
                    </div>
                  )}

                  {processes && processes.length > 0 && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Key Cooking Processes</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {processes.map((p, i) => <span key={i} className="nut-badge" style={{ background: 'rgba(52, 152, 219, 0.1)' }}>{p}</span>)}
                      </div>
                    </div>
                  )}

                  {flavor && flavor.length > 0 && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Flavor Profile</h3>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        {flavor.map((f, i) => <span key={i} className="nut-badge" style={{ background: 'rgba(46, 204, 113, 0.1)', color: '#2ecc71' }}>✨ {f}</span>)}
                      </div>
                    </div>
                  )}

                  {nutrition && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Exhaustive Nutrition Data</h3>
                      <div style={{ fontSize: '0.85rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.5rem' }}>
                        {Object.entries(nutrition).filter(([k]) => !['_id', 'Recipe_id', 'Recipe_title', 'recipeTitle', 'ndb_id'].includes(k)).map(([key, val]) => (
                          <div key={key} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', padding: '0.2rem' }}>
                            <span style={{ color: 'var(--text-secondary)' }}>{key.replace(/_/g, ' ')}</span>
                            <span style={{ fontWeight: '600' }}>{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Ingredients</h3>
                    {structuredIngredients ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {structuredIngredients.ingredients?.map((ing, i) => (
                          <span key={i} className="nut-badge" style={{ background: 'var(--glass-bg)' }}>{ing.name}</span>
                        ))}
                      </div>
                    ) : selectedRecipe.ingredients && (
                      <ul style={{ paddingLeft: '1.2rem', lineHeight: '1.6', fontSize: '0.9rem' }}>
                        {selectedRecipe.ingredients.map((ing, i) => <li key={i}>{ing}</li>)}
                      </ul>
                    )}
                  </div>

                  {instructions && (
                    <div className="glass-card" style={{ background: 'rgba(255,255,255,0.05)', gridColumn: '1 / -1' }}>
                      <h3 style={{ marginBottom: '1rem' }}>Cooking Instructions (How it's made)</h3>
                      <p style={{ lineHeight: '1.6', color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>
                        {typeof instructions === 'string' ? instructions : (instructions.instructions || "No instructions provided.")}
                      </p>
                    </div>
                  )}


                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

