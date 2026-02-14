/**
 * RecipeDB Service — Foodoscope API Integration
 * Uses direct title search endpoint (NO LOOPS to preserve API credits)
 * Auth: Authorization: Bearer <API_KEY>
 */

const API_BASE = 'https://api.foodoscope.com/recipe2-api';
const API_KEY = process.env.RECIPEDB_API_KEY;

const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache
const cache = {}; // In-memory cache

/**
 * Fetches a recipe by title using direct search endpoint + nutrition data
 * NO LOOPS - single API call per food item
 * @param {string} foodName - The name of the food to search for
 * @returns {Promise<object|null>} The recipe object or null if not found
 */
async function getRecipe(foodName) {
  const cacheKey = foodName.toLowerCase();

  // Check cache first
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL) {
    console.log(`[RecipeDB] Cache hit for "${foodName}"`);
    return cache[cacheKey].data;
  }

  // Use direct title search endpoint
  const searchUrl = `${API_BASE}/recipe-bytitle/recipeByTitle?title=${encodeURIComponent(foodName)}`;

  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        console.error('[RecipeDB API] Rate limit reached');
      } else {
        console.error(`[RecipeDB API] HTTP ${response.status} for "${foodName}"`);
      }
      return getLocalRecipe(foodName);
    }

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      const recipeBasic = data.data[0];

      // Fetch detailed nutrition data using recipe ID
      const nutritionUrl = `${API_BASE}/recipe-nutri/nutritioninfo?recipe_id=${recipeBasic.recipe_id}`;
      let nutritionData = null;

      try {
        const nutritionResponse = await fetch(nutritionUrl, {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        if (nutritionResponse.ok) {
          const nutritionJson = await nutritionResponse.json();
          if (nutritionJson.success && nutritionJson.data && nutritionJson.data.length > 0) {
            nutritionData = nutritionJson.data[0];
          }
        }
      } catch (nutritionError) {
        console.error('[RecipeDB] Nutrition fetch error:', nutritionError.message);
      }

      // Process recipe with nutrition data
      const recipe = processRecipeData(recipeBasic, nutritionData);

      // Cache it
      cache[cacheKey] = { data: recipe, timestamp: Date.now() };

      console.log(`[RecipeDB] Found "${recipe.Recipe_title}" via API`);
      return recipe;
    } else {
      console.log(`[RecipeDB] No API results for "${foodName}", using local fallback`);
      return getLocalRecipe(foodName);
    }

  } catch (error) {
    console.error('[RecipeDB] API error:', error.message);
    return getLocalRecipe(foodName);
  }
}

/**
 * Processes raw recipe data from the API
 * @param {object} rawRecipe - Raw recipe from recipeByTitle API
 * @param {object} nutritionData - Nutrition data from nutritioninfo API (optional)
 * @returns {object} Processed recipe with nutrition per serving
 */
function processRecipeData(rawRecipe, nutritionData = null) {
  const servings = parseInt(rawRecipe.servings) || 1;

  // Use nutrition data if available, otherwise use basic calories
  const nutrition = nutritionData ? {
    calories: nutritionData.Calories ? Math.round(parseFloat(nutritionData.Calories) / servings) : 0,
    carbs: nutritionData['Carbohydrate, by difference (g)'] ? Math.round(parseFloat(nutritionData['Carbohydrate, by difference (g)']) / servings) : 0,
    protein: nutritionData['Protein (g)'] ? Math.round(parseFloat(nutritionData['Protein (g)']) / servings) : 0,
    fat: nutritionData['Total lipid (fat) (g)'] ? Math.round(parseFloat(nutritionData['Total lipid (fat) (g)']) / servings) : 0,
    fiber: nutritionData['Fiber, total dietary (g)'] ? Math.round(parseFloat(nutritionData['Fiber, total dietary (g)']) / servings) : 0,
    sugar: nutritionData['Sugars, total (g)'] ? Math.round(parseFloat(nutritionData['Sugars, total (g)']) / servings) : 0,
    sodium: nutritionData['Sodium, Na (mg)'] ? Math.round(parseFloat(nutritionData['Sodium, Na (mg)']) / servings) : 0,
    source: 'RecipeDB API',
  } : {
    calories: rawRecipe.Calories ? Math.round(parseFloat(rawRecipe.Calories) / servings) : 0,
    carbs: 0,
    protein: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    source: 'RecipeDB API (basic)',
  };

  // Extract cooking method from Processes
  const cookingMethod = rawRecipe.Processes ? rawRecipe.Processes.split('||').pop().trim() : '';

  return {
    ...rawRecipe,
    nutrition,
    cooking_method: cookingMethod,
    source: 'RecipeDB API',
  };
}

/**
 * Local JSON fallback (when API doesn't have the food)
 * @param {string} foodName - Food name to search
 * @returns {object|null} Recipe from local JSON or null
 */
function getLocalRecipe(foodName) {
  try {
    const recipeData = require('../data/recipedb.json');
    const nutritionData = require('../data/nutrition.json');

    const key = foodName.toLowerCase().trim();
    const recipe = recipeData[key];
    const nutrition = nutritionData[key];

    if (recipe) {
      console.log(`[RecipeDB] Using local JSON for "${foodName}"`);

      // Build nutrition object from local data
      const nutritionObj = nutrition ? {
        calories: nutrition.calories || 0,
        carbs: nutrition.carbs || 0,
        protein: nutrition.protein || 0,
        fat: nutrition.fat || 0,
        fiber: nutrition.fiber || 0,
        sugar: nutrition.sugar || 0,
        sodium: nutrition.sodium || 0,
        source: 'Local JSON',
      } : {
        calories: 0,
        carbs: 0,
        protein: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        source: 'Local JSON (incomplete)',
      };

      return {
        Recipe_title: recipe.name,
        cooking_method: recipe.cooking_method,
        cuisine: recipe.cuisine,
        category: recipe.category,
        prep_time: recipe.prep_time,
        ingredients: recipe.ingredients,
        description: recipe.description,
        nutrition: nutritionObj,
        source: 'Local JSON',
      };
    }
  } catch (error) {
    console.error('[RecipeDB] Error reading local JSON:', error.message);
  }
  return null;
}

/**
 * Search for recipes by name using recipesinfo endpoint
 * @param {string} query - Search query (e.g., "samosa")
 * @param {number} page - Page number (default: 1)
 * @param {number} limit - Results per page (default: 50)
 * @returns {Promise<Array>} Array of matching recipes
 */
async function searchRecipes(query, page = 1, limit = 50) {
  const cacheKey = `search_${query.toLowerCase()}_${page}_${limit}`;

  // Check cache first — only use cache if it has actual results
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL && cache[cacheKey].data.length > 0) {
    console.log(`[RecipeDB] Cache hit for search "${query}" (${cache[cacheKey].data.length} recipes)`);
    return cache[cacheKey].data;
  }

  // Use recipeByTitle endpoint - CORRECT ENDPOINT FROM POSTMAN COLLECTION
  const searchUrl = `${API_BASE}/recipe2-api/recipe-bytitle/recipeByTitle?title=${encodeURIComponent(query)}&page=${page}&limit=${limit}`;



  try {
    const response = await fetch(searchUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[RecipeDB API] HTTP ${response.status} for "${query}" - using fallback`);
      return getSampleRecipes(query);
    }


    const data = await response.json();

    // Handle different response structures (data.payload.data or data.data)
    const allRecipes = data.payload?.data || data.data || [];

    if (data.success && allRecipes.length > 0) {
      // Process each recipe with robust key mapping
      const processedRecipes = allRecipes.map(recipe => {
        const title = recipe.Recipe_title || recipe.recipeTitle || recipe.title || 'Unknown Recipe';

        return {
          id: recipe.Recipe_id || recipe.recipeId || recipe._id || recipe.id,
          title: title,
          calories: recipe.Calories || recipe['Energy (kcal)'] || 0,
          servings: recipe.servings || 1,
          totalTime: recipe.total_time || recipe.totalTime || 'N/A',
          region: recipe.Region || recipe.region,
          cuisine: recipe.Region || recipe.region,
          category: recipe.Sub_region || recipe.category,
          carbs: recipe['Carbohydrate, by difference (g)'] || 0,
          protein: recipe['Protein (g)'] || 0,
          fat: recipe['Total lipid (fat) (g)'] || 0,
          ingredients: recipe.Ingredients ? recipe.Ingredients.split('||') : [],
          utensils: recipe.Utensils ? recipe.Utensils.split('||') : [],
          processes: recipe.Processes ? recipe.Processes.split('||') : [],
          vegan: recipe.vegan === '1.0',
          vegetarian: recipe.lacto_vegetarian === '1.0' || recipe.ovo_vegetarian === '1.0' || recipe.ovo_lacto_vegetarian === '1.0',
          source: 'RecipeDB API'
        };

      });


      console.log(`[RecipeDB] Extracted ${processedRecipes.length} recipes for "${query}"`);

      // Cache it
      cache[cacheKey] = { data: processedRecipes, timestamp: Date.now() };
      return processedRecipes;
    }

    console.log(`[RecipeDB] No results found or data mismatch for "${query}" in live API, using fallback`);
    return getSampleRecipes(query);

  } catch (error) {
    console.error('[RecipeDB] Search error:', error.message);
    return getSampleRecipes(query);
  }
}


/**
 * Get sample recipes as fallback when API is unavailable
 * @param {string} query - Search query
 * @returns {Array} Sample recipes matching query
 */
function getSampleRecipes(query) {
  const sampleRecipes = [
    {
      id: '2612',
      title: 'Balah el Sham (Egyptian Choux Pastry)',
      calories: 183,
      servings: 40,
      prepTime: '30',
      cookTime: '26',
      totalTime: '66',
      region: 'Middle Eastern',
      subRegion: 'Egyptian',
      continent: 'African',
      cuisine: 'Middle Eastern',
      category: 'Egyptian',
      carbs: 10.07,
      protein: 0.63,
      fat: 25.0,
      ingredients: ['All-purpose flour', 'Water', 'Vegetable oil', 'Large eggs', 'Granulated sugar', 'Unsalted butter', 'Vanilla extract'],
      vegan: false,
      vegetarian: true,
      pescetarian: false,
      source: 'Sample Data (API Rate Limited)',
    },
    {
      id: '2613',
      title: 'Magpie\'s Easy Falafel Cakes',
      calories: 409,
      servings: 3,
      prepTime: '15',
      cookTime: '15',
      totalTime: '60',
      region: 'Middle Eastern',
      subRegion: 'Egyptian',
      continent: 'African',
      cuisine: 'Middle Eastern',
      category: 'Egyptian',
      carbs: 75.04,
      protein: 22.62,
      fat: 20.83,
      ingredients: ['Chickpeas', 'Onion', 'Garlic', 'Fresh parsley', 'Cumin', 'Coriander', 'Flour', 'Breadcrumbs', 'Olive oil'],
      vegan: true,
      vegetarian: true,
      pescetarian: true,
      source: 'Sample Data (API Rate Limited)',
    },
    {
      id: '2614',
      title: 'Dukkah',
      calories: 45,
      servings: 24,
      prepTime: '20',
      cookTime: '5',
      totalTime: '25',
      region: 'Middle Eastern',
      subRegion: 'Egyptian',
      continent: 'African',
      cuisine: 'Middle Eastern',
      category: 'Egyptian',
      carbs: 3.46,
      protein: 1.09,
      fat: 3.05,
      ingredients: ['Hazelnuts', 'Sesame seeds', 'Coriander seeds', 'Cumin seeds', 'Sea salt', 'Black peppercorns'],
      vegan: true,
      vegetarian: true,
      pescetarian: true,
      source: 'Sample Data (API Rate Limited)',
    },
    {
      id: 'pizza_001',
      title: 'Classic Margherita Pizza',
      calories: 266,
      servings: 8,
      prepTime: '20',
      cookTime: '15',
      totalTime: '95',
      region: 'European',
      subRegion: 'Italian',
      continent: 'European',
      cuisine: 'Italian',
      category: 'Italian',
      carbs: 33.0,
      protein: 11.0,
      fat: 10.0,
      ingredients: ['Pizza dough', 'San Marzano tomatoes', 'Fresh mozzarella cheese', 'Fresh basil leaves', 'Extra virgin olive oil', 'Sea salt'],
      vegan: false,
      vegetarian: true,
      pescetarian: false,
      source: 'Sample Data (API Rate Limited)',
    },
    {
      id: 'samosa_001',
      title: 'Vegetable Samosa',
      calories: 252,
      servings: 12,
      prepTime: '30',
      cookTime: '20',
      totalTime: '50',
      region: 'South Asian',
      subRegion: 'Indian',
      continent: 'Asian',
      cuisine: 'Indian',
      category: 'Snack',
      carbs: 28.0,
      protein: 4.5,
      fat: 13.0,
      ingredients: ['All-purpose flour', 'Boiled potatoes', 'Green peas', 'Garam masala', 'Cumin seeds', 'Oil for frying', 'Salt'],
      taste: { sweet: 0.1, salt: 0.4, sour: 0.05, bitter: 0.2, umami: 0.5 },
      vegan: true,
      vegetarian: true,
      pescetarian: true,
      source: 'Sample Data (API Rate Limited)',
    },
  ];

  const queryLower = query.toLowerCase();
  const filtered = sampleRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(queryLower)
  );

  console.log(`[RecipeDB] Returning ${filtered.length} sample recipes for "${query}" (API unavailable)`);
  return filtered;
}


/**
 * Get detailed nutrition info for a recipe
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<object|null>} Detailed nutrition data
 */
async function getDetailedNutrition(recipeId) {
  const cacheKey = `nutrition_${recipeId}`;

  // Check cache
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 2) {
    console.log(`[RecipeDB] Cache hit for nutrition ${recipeId}`);
    return cache[cacheKey].data;
  }

  // The user recommended recipe-nutri/nutritioninfo for ALL nutrients
  const nutritionUrl = `${API_BASE}/recipe-nutri/nutritioninfo?recipe_id=${recipeId}`;

  try {
    const response = await fetch(nutritionUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[RecipeDB] Nutrition fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.success && data.payload && data.payload.data && data.payload.data.length > 0) {
      const nutritionData = data.payload.data[0];

      // Cache it
      cache[cacheKey] = { data: nutritionData, timestamp: Date.now() };

      console.log(`[RecipeDB] Fetched exhaustive nutrition for recipe ${recipeId}`);
      return nutritionData;
    }


    // Check sample recipes if API fails or for sample IDs
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    if (sample && sample.nutrition) return sample.nutrition;

    return null;
  } catch (error) {
    console.error('[RecipeDB] Nutrition fetch error:', error.message);
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    return sample ? sample.nutrition : null;
  }
}


/**
 * Get cooking instructions for a recipe
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<object|null>} Instructions data
 */
async function getInstructions(recipeId) {
  const cacheKey = `instructions_${recipeId}`;

  // Check cache
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) {
    console.log(`[RecipeDB] Cache hit for instructions ${recipeId}`);
    return cache[cacheKey].data;
  }

  const instructionsUrl = `${API_BASE}/recipe-instructions/instructions/${recipeId}`;

  try {
    const response = await fetch(instructionsUrl, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`[RecipeDB] Instructions fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (data.success && data.data) {
      // Cache it
      cache[cacheKey] = { data: data.data, timestamp: Date.now() };

      console.log(`[RecipeDB] Fetched instructions for recipe ${recipeId}`);
      return data.data;
    }

    // Check sample recipes
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    if (sample && sample.instructions) return { instructions: sample.instructions };

    return null;
  } catch (error) {
    console.error('[RecipeDB] Instructions fetch error:', error.message);
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    return sample ? { instructions: sample.instructions } : null;
  }
}


/**
 * Get taste profile for a recipe
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<object|null>} Taste profile data
 */
async function getTasteProfile(recipeId) {
  const cacheKey = `taste_${recipeId}`;
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) return cache[cacheKey].data;

  const tasteUrl = `${API_BASE}/recipe-taste/taste/${recipeId}`;
  try {
    const response = await fetch(tasteUrl, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.success && data.data) {
      cache[cacheKey] = { data: data.data, timestamp: Date.now() };
      return data.data;
    }
    // Check sample recipes
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    if (sample && sample.taste) return sample.taste;

    return null;
  } catch (error) {
    console.error('[RecipeDB] Taste fetch error:', error.message);
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    return sample ? sample.taste : null;
  }
}


/**
 * Get flavor profile for a recipe
 * @param {string} recipeId - Recipe ID
 * @returns {Promise<object|null>} Flavor profile data
 */
async function getFlavorProfile(recipeId) {
  const cacheKey = `flavor_${recipeId}`;
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) return cache[cacheKey].data;

  // Note: Flavor API might have a different base URL but we'll try API_BASE first
  const flavorUrl = `https://api.foodoscope.com/flavor-api/recipe-flavor/flavor/${recipeId}`;
  try {
    const response = await fetch(flavorUrl, {
      headers: { 'Authorization': `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    });
    if (!response.ok) return null;
    const data = await response.json();
    if (data.success && data.data) {
      cache[cacheKey] = { data: data.data, timestamp: Date.now() };
      return data.data;
    }
    // Check sample recipes
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    if (sample && sample.flavor) return sample.flavor;

    return null;
  } catch (error) {
    console.error('[RecipeDB] Flavor fetch error:', error.message);
    const samples = getSampleRecipes('');
    const sample = samples.find(s => s.id === recipeId);
    return sample ? sample.flavor : null;
  }
}

/**
 * Get ingredients with categories
 * @param {string} recipeId
 */
async function getIngredientsWithCategories(recipeId) {
  const cacheKey = `ing_cat_${recipeId}`;
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) return cache[cacheKey].data;

  // New endpoint provided by user
  const url = `${API_BASE}/recipe/recipe-day/with-ingredients-categories?recipe_id=${recipeId}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    const data = await res.json();
    if (data.success && data.payload) {
      cache[cacheKey] = { data: data.payload, timestamp: Date.now() };
      return data.payload;
    }
  } catch (e) {
    console.error('[RecipeDB] Ing-Cat fetch error:', e.message);
  }
  return null;
}

/**
 * Get utensils for a recipe

 * @param {string} recipeId
 */
async function getUtensils(recipeId) {
  const cacheKey = `utensils_${recipeId}`;
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) return cache[cacheKey].data;

  const url = `${API_BASE}/recipe-utensils/utensils/${recipeId}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error('API Fail');
    const data = await res.json();
    if (data.success && data.data) {
      cache[cacheKey] = { data: data.data, timestamp: Date.now() };
      return data.data;
    }
  } catch (e) {
    const sample = getSampleRecipes('').find(s => s.id === recipeId);
    return sample ? sample.utensils : null;
  }
  return null;
}

/**
 * Get processes for a recipe
 * @param {string} recipeId
 */
async function getProcesses(recipeId) {
  const cacheKey = `processes_${recipeId}`;
  if (cache[cacheKey] && Date.now() < cache[cacheKey].timestamp + CACHE_TTL * 4) return cache[cacheKey].data;

  const url = `${API_BASE}/recipe-processes/processes/${recipeId}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${API_KEY}` } });
    if (!res.ok) throw new Error('API Fail');
    const data = await res.json();
    if (data.success && data.data) {
      cache[cacheKey] = { data: data.data, timestamp: Date.now() };
      return data.data;
    }
  } catch (e) {
    const sample = getSampleRecipes('').find(s => s.id === recipeId);
    return sample ? sample.processes : null;
  }
  return null;
}



module.exports = {
  getRecipe,
  searchRecipes,
  getDetailedNutrition,
  getInstructions,
  getTasteProfile,
  getFlavorProfile,
  getUtensils,
  getProcesses,
  getIngredientsWithCategories,
};



