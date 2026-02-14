const express = require('express');
const router = express.Router();
const RecipeDBService = require('../services/recipeDB');
const FlavorDBService = require('../services/flavorDB');
const FoodDetector = require('../services/foodDetector');
const ClarifaiService = require('../services/clarifai');

/**
 * Helper: Calculate health score from nutrition data
 */
function calculateHealthScore(nutrition, goal) {
  let score = 50; // Base score

  // Adjust based on goal
  if (goal === 'weight_loss') {
    if (nutrition.calories < 200) score += 20;
    else if (nutrition.calories < 300) score += 10;
    else if (nutrition.calories > 500) score -= 20;

    if (nutrition.fat < 10) score += 15;
    else if (nutrition.fat > 20) score -= 15;
  } else if (goal === 'muscle_gain') {
    if (nutrition.protein > 20) score += 25;
    else if (nutrition.protein > 10) score += 15;
    else if (nutrition.protein < 5) score -= 10;

    if (nutrition.carbs > 30) score += 10;
  } else { // balanced_diet
    if (nutrition.protein >= 10 && nutrition.protein <= 25) score += 15;
    if (nutrition.carbs >= 20 && nutrition.carbs <= 40) score += 15;
    if (nutrition.fat >= 5 && nutrition.fat <= 15) score += 15;
  }

  // Fiber bonus
  if (nutrition.fiber > 5) score += 10;
  else if (nutrition.fiber > 3) score += 5;

  // Sugar penalty
  if (nutrition.sugar > 15) score -= 15;
  else if (nutrition.sugar > 10) score -= 10;

  // Sodium penalty
  if (nutrition.sodium > 800) score -= 10;
  else if (nutrition.sodium > 500) score -= 5;

  return Math.max(0, Math.min(100, score));
}

/**
 * Helper: Get suitability text from health score
 */
function getSuitability(score) {
  if (score >= 80) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Moderate';
  return 'Poor';
}

/**
 * POST /api/detect-food
 * Detect food from an uploaded image using Clarifai Food Model
 */
router.post('/detect-food', async (req, res) => {
  try {
    const { image } = req.body;
    if (!image) {
      return res.status(400).json({ error: 'image (base64) is required' });
    }

    const result = await ClarifaiService.detectFood(image);
    res.json({
      success: true,
      ...result,
      supportedFoods: FoodDetector.getSupportedFoods()
    });
  } catch (error) {
    console.error('Clarifai detection error:', error);
    res.status(500).json({
      error: 'Food detection failed',
      message: error.message,
      supportedFoods: FoodDetector.getSupportedFoods()
    });
  }
});

/**
 * POST /api/analyze-food
 * Analyze food nutrition and health using LIVE API DATA ONLY
 */
router.post('/analyze-food', async (req, res) => {
  try {
    const { foodName, goal, detectedLabel } = req.body;

    if (!foodName) {
      return res.status(400).json({ error: 'foodName is required' });
    }

    // Map detected label to known food if provided
    const mappedFood = detectedLabel
      ? FoodDetector.mapLabel(detectedLabel)
      : foodName.toLowerCase().trim();

    console.log(`[Analyze] Food: "${mappedFood}", Goal: "${goal}"`);

    // 1. Get RecipeDB data from API
    const recipe = await RecipeDBService.getRecipe(mappedFood);
    console.log(`[Analyze] RecipeDB result:`, recipe ? `Found (${recipe.source})` : 'Not found');

    if (!recipe) {
      return res.status(404).json({
        error: 'Food not found',
        message: `"${foodName}" is not in our database. Try one of our supported foods.`,
        supportedFoods: FoodDetector.getSupportedFoods()
      });
    }

    // 2. Use nutrition data from API (already processed in recipeDB.js)
    const nutrition = recipe.nutrition || {
      calories: 0,
      carbs: 0,
      protein: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      source: recipe.source
    };

    console.log(`[Analyze] Using ${nutrition.source} nutrition data (${nutrition.calories} kcal per serving)`);

    // 3. Calculate health score based on API nutrition data
    const healthScore = calculateHealthScore(nutrition, goal || 'balanced_diet');
    const suitability = getSuitability(healthScore);

    // 4. Get FlavorDB alternatives
    const isFried = recipe.cooking_method
      ? recipe.cooking_method.toLowerCase().includes('fried') ||
      recipe.cooking_method.toLowerCase().includes('fry')
      : false;
    const alternatives = FlavorDBService.getHealthierAlternatives(mappedFood, isFried, 3);

    // 5. Get full FlavorDB data for display
    const flavorData = FlavorDBService.getSimilarFoods(mappedFood);

    res.json({
      success: true,
      detectedFood: mappedFood,
      originalLabel: detectedLabel || foodName,
      recipe,
      nutrition,
      healthScore,
      suitability,
      alternatives,
      flavorData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Analyze] Error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * GET /api/supported-foods
 * Get list of foods we can analyze
 */
router.get('/supported-foods', (req, res) => {
  res.json({
    success: true,
    foods: FoodDetector.getSupportedFoods()
  });
});

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      recipeDB: 'Foodoscope API',
      flavorDB: 'Local JSON',
      clarifai: 'Clarifai API'
    }
  });
});

/**
 * GET /api/recipes/search
 * Search for recipes by query
 */
router.get('/recipes/search', async (req, res) => {
  try {
    const { q, page = 1, limit = 50 } = req.query;

    if (!q) {
      return res.status(400).json({ error: 'Query parameter "q" is required' });
    }

    console.log(`[Recipe Search] Query: "${q}", Page: ${page}, Limit: ${limit}`);

    const recipes = await RecipeDBService.searchRecipes(q, parseInt(page), parseInt(limit));

    res.json({
      success: true,
      query: q,
      count: recipes.length,
      recipes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Recipe Search] Error:', error);
    res.status(500).json({
      error: 'Recipe search failed',
      message: error.message
    });
  }
});

/**
 * GET /api/recipes/:id/nutrition
 * Get detailed nutrition info for a recipe
 */
router.get('/recipes/:id/nutrition', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[Recipe Nutrition] Fetching for recipe ID: ${id}`);

    const nutrition = await RecipeDBService.getDetailedNutrition(id);

    if (!nutrition) {
      return res.status(404).json({
        error: 'Nutrition data not found',
        message: `No nutrition data available for recipe ${id}`
      });
    }

    res.json({
      success: true,
      recipeId: id,
      nutrition,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Recipe Nutrition] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch nutrition data',
      message: error.message
    });
  }
});

/**
 * GET /api/recipes/:id/instructions
 * Get cooking instructions for a recipe
 */
router.get('/recipes/:id/instructions', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`[Recipe Instructions] Fetching for recipe ID: ${id}`);

    const instructions = await RecipeDBService.getInstructions(id);

    if (!instructions) {
      return res.status(404).json({
        error: 'Instructions not found',
        message: `No instructions available for recipe ${id}`
      });
    }

    res.json({
      success: true,
      recipeId: id,
      instructions,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[Recipe Instructions] Error:', error);
    res.status(500).json({
      error: 'Failed to fetch instructions',
      message: error.message
    });
  }
});

/**
 * GET /api/recipes/:id/taste
 * Get taste profile for a recipe
 */
router.get('/recipes/:id/taste', async (req, res) => {
  try {
    const { id } = req.params;
    const taste = await RecipeDBService.getTasteProfile(id);
    if (!taste) return res.status(404).json({ error: 'Taste profile not found' });
    res.json({ success: true, recipeId: id, taste });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch taste profile', message: error.message });
  }
});

/**
 * GET /api/recipes/:id/flavor
 * Get flavor profile for a recipe
 */
router.get('/recipes/:id/flavor', async (req, res) => {
  try {
    const { id } = req.params;
    const flavor = await RecipeDBService.getFlavorProfile(id);
    if (!flavor) return res.status(404).json({ error: 'Flavor profile not found' });
    res.json({ success: true, recipeId: id, flavor });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch flavor profile', message: error.message });
  }
});

/**
 * GET /api/recipes/:id/utensils
 */
router.get('/recipes/:id/utensils', async (req, res) => {
  try {
    const utensils = await RecipeDBService.getUtensils(req.params.id);
    res.json({ success: true, utensils });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/recipes/:id/processes
 */
router.get('/recipes/:id/processes', async (req, res) => {
  try {
    const processes = await RecipeDBService.getProcesses(req.params.id);
    res.json({ success: true, processes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/recipes/:id/ingredients-categories
 */
router.get('/recipes/:id/ingredients-categories', async (req, res) => {
  try {
    const ingredientsData = await RecipeDBService.getIngredientsWithCategories(req.params.id);
    res.json({ success: true, payload: ingredientsData });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


module.exports = router;



