const flavorData = require('../data/flavordb.json');

/**
 * FlavorDB Service
 * Fetches flavor-similar foods for a given food item.
 * Uses mock data; swap with real Foodoscope FlavorDB API when keys are available.
 */
class FlavorDBService {
  /**
   * Get all similar foods for a food item
   * @param {string} foodName - lowercase food name
   * @returns {object|null} similar foods data or null
   */
  static getSimilarFoods(foodName) {
    const key = foodName.toLowerCase().trim();

    if (flavorData[key]) {
      return {
        source: 'FlavorDB',
        query: foodName,
        similar_foods: flavorData[key].similar_foods
      };
    }

    // Fuzzy match
    const keys = Object.keys(flavorData);
    const match = keys.find(k => k.includes(key) || key.includes(k));
    if (match) {
      return {
        source: 'FlavorDB',
        query: foodName,
        similar_foods: flavorData[match].similar_foods
      };
    }

    return null;
  }

  /**
   * Get healthier alternatives: filter out fried, prefer baked/steamed/grilled
   * @param {string} foodName
   * @param {boolean} originalIsFried - whether the original food is fried
   * @param {number} limit - max number of alternatives to return
   * @returns {array} filtered list of healthier alternatives
   */
  static getHealthierAlternatives(foodName, originalIsFried = false, limit = 3) {
    const data = this.getSimilarFoods(foodName);
    if (!data) return [];

    let alternatives = data.similar_foods;

    // If original food is fried, remove fried alternatives
    if (originalIsFried) {
      alternatives = alternatives.filter(f => !f.fried);
    }

    // Prefer healthier cooking methods
    const healthyMethods = ['steamed', 'baked', 'grilled', 'roasted', 'boiled', 'raw', 'blended'];

    alternatives.sort((a, b) => {
      const aHealthy = healthyMethods.some(m => a.cooking_method.toLowerCase().includes(m)) ? 1 : 0;
      const bHealthy = healthyMethods.some(m => b.cooking_method.toLowerCase().includes(m)) ? 1 : 0;

      // Prefer healthy cooking methods, then lower calories, then higher similarity
      if (bHealthy !== aHealthy) return bHealthy - aHealthy;
      if (a.calories !== b.calories) return a.calories - b.calories;
      return b.similarity - a.similarity;
    });

    return alternatives.slice(0, limit).map(alt => ({
      ...alt,
      source: 'FlavorDB'
    }));
  }
}

module.exports = FlavorDBService;
