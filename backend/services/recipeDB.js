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
 * Fetches a recipe by title using direct search endpoint
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

  // Use direct title search endpoint - CORRECT PATH from Postman collection
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
      return getLocalRecipe(foodName); // Fallback to local
    }

    const data = await response.json();

    if (data.success && data.data && data.data.length > 0) {
      // Get first matching recipe
      const recipe = processRecipeData(data.data[0]);

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
 * @param {object} rawRecipe - Raw recipe from API
 * @returns {object} Processed recipe with nutrition per serving
 */
function processRecipeData(rawRecipe) {
  const servings = parseInt(rawRecipe.servings) || 1;

  const nutrition = {
    calories: rawRecipe.Calories ? Math.round(parseFloat(rawRecipe.Calories) / servings) : 0,
    carbs: rawRecipe['Carbohydrate, by difference (g)'] ? Math.round(parseFloat(rawRecipe['Carbohydrate, by difference (g)']) / servings) : 0,
    protein: rawRecipe['Protein (g)'] ? Math.round(parseFloat(rawRecipe['Protein (g)']) / servings) : 0,
    fat: rawRecipe['Total lipid (fat) (g)'] ? Math.round(parseFloat(rawRecipe['Total lipid (fat) (g)']) / servings) : 0,
    fiber: rawRecipe['Fiber, total dietary (g)'] ? Math.round(parseFloat(rawRecipe['Fiber, total dietary (g)']) / servings) : 0,
    sugar: rawRecipe['Sugars, total (g)'] ? Math.round(parseFloat(rawRecipe['Sugars, total (g)']) / servings) : 0,
    sodium: rawRecipe['Sodium, Na (mg)'] ? Math.round(parseFloat(rawRecipe['Sodium, Na (mg)']) / servings) : 0,
    source: 'RecipeDB API',
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

module.exports = {
  getRecipe,
};
