const nutritionData = require('../data/nutrition.json');
const RecipeDBService = require('./recipeDB');

/**
 * Nutrition Engine
 * Computes health score, evaluates suitability for goals, and generates explanations.
 */
class NutritionEngine {
  static GOALS = {
    weight_loss: 'Weight Loss',
    muscle_gain: 'Muscle Gain',
    diabetes_friendly: 'Diabetes Friendly',
    balanced_diet: 'Balanced Diet'
  };

  /**
   * Get raw nutrition data for a food
   */
  static getNutrition(foodName) {
    const key = foodName.toLowerCase().trim();

    if (nutritionData[key]) {
      return { ...nutritionData[key], name: foodName };
    }

    // Fuzzy match
    const keys = Object.keys(nutritionData);
    const match = keys.find(k => k.includes(key) || key.includes(k));
    if (match) {
      return { ...nutritionData[match], name: match };
    }

    return null;
  }

  /**
   * Compute a health score from 0–100
   */
  static computeHealthScore(foodName) {
    const nutrition = this.getNutrition(foodName);
    if (!nutrition) return null;

    let score = 70; // Start at 70 (neutral)

    // Penalize fried foods
    if (nutrition.fried) score -= 25;

    // Penalize refined ingredients
    if (nutrition.refined) score -= 10;

    // Penalize high calories (>300)
    if (nutrition.calories > 300) score -= 15;
    else if (nutrition.calories > 250) score -= 8;
    else if (nutrition.calories < 150) score += 10;

    // Penalize high carbs (>30g)
    if (nutrition.carbs > 40) score -= 10;
    else if (nutrition.carbs > 30) score -= 5;

    // Penalize high fat (>15g)
    if (nutrition.fat > 15) score -= 10;
    else if (nutrition.fat < 5) score += 5;

    // Reward high protein (>15g)
    if (nutrition.protein > 20) score += 15;
    else if (nutrition.protein > 15) score += 10;
    else if (nutrition.protein > 10) score += 5;

    // Reward high fiber (>3g)
    if (nutrition.fiber > 4) score += 8;
    else if (nutrition.fiber > 2) score += 4;

    // Penalize high sugar (>15g)
    if (nutrition.sugar > 20) score -= 15;
    else if (nutrition.sugar > 10) score -= 8;

    // Penalize high sodium (>500mg)
    if (nutrition.sodium > 600) score -= 8;
    else if (nutrition.sodium > 400) score -= 4;

    // Clamp to 0–100
    return Math.max(0, Math.min(100, score));
  }

  /**
   * Evaluate suitability for a specific health goal
   * @returns {{ suitable: boolean, score: number, reasons: string[], explanation: string }}
   */
  static evaluateSuitability(foodName, goal) {
    const nutrition = this.getNutrition(foodName);
    if (!nutrition) {
      return {
        suitable: false,
        score: 0,
        reasons: ['Food not found in our database.'],
        explanation: 'Unable to evaluate this food item.'
      };
    }

    const recipe = RecipeDBService.getRecipe(foodName);
    const reasons = [];
    let penalty = 0;

    // Common checks
    if (nutrition.fried) {
      reasons.push('Deep-fried preparation is unhealthy');
      penalty += 30;
    }
    if (nutrition.refined) {
      reasons.push('Contains refined ingredients');
      penalty += 10;
    }

    // Goal-specific checks
    switch (goal) {
      case 'weight_loss':
        if (nutrition.calories > 250) {
          reasons.push(`High calorie count (${nutrition.calories} kcal)`);
          penalty += 20;
        }
        if (nutrition.fat > 15) {
          reasons.push(`High fat content (${nutrition.fat}g)`);
          penalty += 15;
        }
        if (nutrition.carbs > 30) {
          reasons.push(`High carbohydrate content (${nutrition.carbs}g)`);
          penalty += 10;
        }
        if (nutrition.sugar > 15) {
          reasons.push(`High sugar content (${nutrition.sugar}g)`);
          penalty += 10;
        }
        break;

      case 'muscle_gain':
        if (nutrition.protein < 10) {
          reasons.push(`Low protein content (${nutrition.protein}g) — poor for muscle building`);
          penalty += 25;
        }
        if (nutrition.protein < 15) {
          reasons.push(`Moderate protein (${nutrition.protein}g) — could be higher`);
          penalty += 10;
        }
        if (nutrition.calories < 100) {
          reasons.push('Very low-calorie — insufficient for muscle gain');
          penalty += 15;
        }
        break;

      case 'diabetes_friendly':
        if (nutrition.carbs > 30) {
          reasons.push(`High carbohydrate content (${nutrition.carbs}g) — spikes blood sugar`);
          penalty += 25;
        }
        if (nutrition.sugar > 10) {
          reasons.push(`High sugar content (${nutrition.sugar}g)`);
          penalty += 20;
        }
        if (nutrition.refined) {
          reasons.push('Refined ingredients cause rapid blood sugar spikes');
          penalty += 15;
        }
        if (nutrition.fiber < 2) {
          reasons.push(`Low fiber (${nutrition.fiber}g) — doesn't slow glucose absorption`);
          penalty += 10;
        }
        break;

      case 'balanced_diet':
        if (nutrition.fried) {
          reasons.push('Fried foods should be limited in a balanced diet');
          penalty += 15;
        }
        if (nutrition.fat > 20) {
          reasons.push(`Excessive fat (${nutrition.fat}g)`);
          penalty += 10;
        }
        if (nutrition.sugar > 15) {
          reasons.push(`High sugar (${nutrition.sugar}g)`);
          penalty += 10;
        }
        if (nutrition.sodium > 500) {
          reasons.push(`High sodium (${nutrition.sodium}mg)`);
          penalty += 5;
        }
        break;
    }

    const score = this.computeHealthScore(foodName);
    const goalAdjustedScore = Math.max(0, score - penalty);
    const suitable = goalAdjustedScore >= 50 && reasons.length <= 1;

    // Generate human-readable explanation
    let explanation;
    if (suitable) {
      explanation = `This food is a reasonable choice for your ${this.GOALS[goal] || goal} goals.`;
      if (reasons.length > 0) {
        explanation += ` Minor note: ${reasons[0].toLowerCase()}.`;
      }
    } else {
      const cookingNote = recipe ? ` Its ${recipe.cooking_method} preparation` : '';
      const mainIssues = reasons.slice(0, 2).map(r => r.toLowerCase()).join(' and ');
      explanation = `${mainIssues.charAt(0).toUpperCase() + mainIssues.slice(1)}${cookingNote ? cookingNote : ''} makes this food ${suitable ? 'marginally suitable' : 'not ideal'} for ${this.GOALS[goal] || goal} goals.`;
    }

    return {
      suitable,
      score: goalAdjustedScore,
      reasons,
      explanation,
      goal: this.GOALS[goal] || goal
    };
  }

  /**
   * Full analysis: nutrition + health score + suitability
   */
  static fullAnalysis(foodName, goal) {
    const nutrition = this.getNutrition(foodName);
    const healthScore = this.computeHealthScore(foodName);
    const suitability = this.evaluateSuitability(foodName, goal);

    return {
      nutrition,
      healthScore,
      suitability
    };
  }
}

module.exports = NutritionEngine;
