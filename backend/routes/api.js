const express = require('express');
const router = express.Router();
const RecipeDBService = require('../services/recipeDB');
const FlavorDBService = require('../services/flavorDB');
const FoodDetector = require('../services/foodDetector');
const ClarifaiService = require('../services/clarifai');
const NutritionEngine = require('../services/nutritionEngine');


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

    res.json({
      success: !!nutrition,
      recipeId: id,
      nutrition: nutrition || null,
      message: nutrition ? undefined : `No nutrition data available for recipe ${id}`,
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

    res.json({
      success: !!instructions,
      recipeId: id,
      instructions: instructions || null,
      message: instructions ? undefined : `No instructions available for recipe ${id}`,
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
    res.json({ success: !!taste, recipeId: id, taste: taste || null });
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
    res.json({ success: !!flavor, recipeId: id, flavor: flavor || null });
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

/**
 * GET /api/recipes/method/:method
 */
router.get('/recipes/method/:method', async (req, res) => {
  try {
    const recipes = await RecipeDBService.searchByMethod(req.params.method);
    res.json({ success: true, recipes });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * GET /api/recipes/:id/health-intel
 * Get health assessment and alternatives for a recipe
 */
/**
 * GET /api/recipes/:id/precision-health
 * Calculate health score based on user-provided formula from Foodoscope data
 */
router.get('/recipes/:id/precision-health', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch exhaustive nutrition data
    const nutriData = await RecipeDBService.getDetailedNutrition(id);

    // Get basic recipe for servings count
    const recipes = await RecipeDBService.searchRecipes(''); // Search logic might need specific ID lookup if service supported it, but we'll try to find it in detailed data
    // Actually, getDetailedNutrition usually contains the data we need.

    if (!nutriData) {
      return res.json({ success: false, message: 'Nutrition data unavailable for scoring' });
    }

    // 2. Extract fields (handling potential key variations)
    const servings = parseFloat(nutriData.servings || nutriData.Servings || 1);
    const calories = parseFloat(nutriData['Energy (kcal)'] || nutriData.Calories || 0);
    const sugar = parseFloat(nutriData['Sugars, total (g)'] || nutriData.Sugar || 0);
    const satFat = parseFloat(nutriData['Fatty acids, total saturated (g)'] || nutriData['Saturated Fat'] || 0);
    const sodium = parseFloat(nutriData['Sodium, Na (mg)'] || nutriData.Sodium || 0);
    const fiber = parseFloat(nutriData['Fiber, total dietary (g)'] || nutriData.Fiber || 0);
    const protein = parseFloat(nutriData['Protein (g)'] || nutriData.Protein || 0);

    // 3. Step 1: Convert to per serving
    const pCalories = calories / servings;
    const pSugar = sugar / servings;
    const pSatFat = satFat / servings;
    const pSodium = sodium / servings;
    const pFiber = fiber / servings;
    const pProtein = protein / servings;

    // 4. Step 2: Calculate Health Score using User Formula
    // HealthScore = (Fiber * 4 + Protein * 3) - (Sugar * 3 + SaturatedFat * 4 + Sodium/200 + Calories/100)
    const healthScore = (pFiber * 4 + pProtein * 3) - (pSugar * 3 + pSatFat * 4 + pSodium / 200 + pCalories / 100);

    // 5. Step 3: Classify result
    let category = "Unhealthy";
    let color = "#e74c3c"; // Red
    if (healthScore > 15) {
      category = "Very Healthy";
      color = "#2ecc71"; // Green
    } else if (healthScore >= 5) {
      category = "Moderate";
      color = "#f1c40f"; // Yellow
    } else if (healthScore >= 0) {
      category = "Less Healthy";
      color = "#e67e22"; // Orange
    }

    // 6. Identify Benefits and Risks
    const benefits = [];
    if (pFiber > 3) benefits.push("High Fiber");
    if (pProtein > 10) benefits.push("High Protein");

    const riskFactors = [];
    if (pSugar > 5) riskFactors.push("High Sugar (Diabetes Risk)");
    if (pSodium > 400) riskFactors.push("High Sodium (BP Risk)");
    if (pSatFat > 3) riskFactors.push("High Saturated Fat (Heart Risk)");

    res.json({
      success: true,
      healthScore: Math.round(healthScore * 10) / 10,
      category,
      color,
      benefits,
      riskFactors,
      perServing: {
        calories: Math.round(pCalories),
        sugar: Math.round(pSugar * 10) / 10,
        fiber: Math.round(pFiber * 10) / 10,
        protein: Math.round(pProtein * 10) / 10
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recipes/:id/health-intel', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.query;

    if (!title) return res.status(400).json({ error: 'Title is required' });

    // 1. Check if we have specific data in NutritionEngine for this title
    const analysis = NutritionEngine.fullAnalysis(title, 'balanced_diet');

    if (!analysis.nutrition) {
      // If no data in JSON, return success: false so UI hides it
      return res.json({ success: false, message: 'No health data available' });
    }

    // 2. Get alternatives from FlavorDB
    const isFried = title.toLowerCase().includes('fry') || title.toLowerCase().includes('fried');
    const alternatives = FlavorDBService.getHealthierAlternatives(title, isFried, 3);

    res.json({
      success: true,
      healthScore: analysis.healthScore,
      suitability: analysis.suitability,
      nutrition: analysis.nutrition,
      alternatives: alternatives.length > 0 ? alternatives : null
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
