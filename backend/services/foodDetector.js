/**
 * Food Detector Service
 * Maps image classification labels to food names in our database.
 * MobileNet labels are general — this maps them to our known food items.
 */

const LABEL_MAP = {
  // Direct matches
  'pizza': 'pizza',
  'cheeseburger': 'burger',
  'hamburger': 'burger',
  'french_loaf': 'burger',
  'bagel': 'burger',
  'hotdog': 'burger',
  'hot_dog': 'burger',
  'french fries': 'french fries',
  'ice_cream': 'ice cream',
  'ice cream': 'ice cream',
  'ice_lolly': 'ice cream',
  'chocolate_sauce': 'cake',
  'trifle': 'cake',

  // MobileNet common misclassifications for Indian food
  'butternut_squash': 'samosa',
  'butternut squash': 'samosa',
  'acorn_squash': 'samosa',
  'acorn squash': 'samosa',
  'bell_pepper': 'samosa',
  'mushroom': 'samosa',
  'cucumber': 'salad',
  'zucchini': 'salad',
  'broccoli': 'salad',
  'cauliflower': 'salad',
  'head_cabbage': 'salad',
  'artichoke': 'salad',
  'corn': 'biryani',
  'ear': 'biryani',
  'banana': 'smoothie',
  'strawberry': 'smoothie',
  'orange': 'smoothie',
  'lemon': 'smoothie',
  'pineapple': 'smoothie',
  'pomegranate': 'smoothie',
  'fig': 'smoothie',
  'custard_apple': 'smoothie',
  'jackfruit': 'smoothie',
  'mango': 'smoothie',

  // MobileNet food labels
  'carbonara': 'pasta',
  'spaghetti': 'pasta',
  'spaghetti_squash': 'pasta',
  'meat_loaf': 'burger',
  'meatloaf': 'burger',
  'burrito': 'burger',
  'guacamole': 'salad',
  'caesar_salad': 'salad',
  'plate': 'biryani',
  'potpie': 'biryani',
  'pot_pie': 'biryani',
  'consomme': 'dal',
  'soup_bowl': 'dal',

  // Indian food mapping
  'samosa': 'samosa',
  'dosa': 'dosa',
  'idli': 'idli',
  'biryani': 'biryani',
  'naan': 'biryani',
  'dal': 'dal',
  'dhal': 'dal',
  'curry': 'dal',
  'masala': 'paneer tikka',

  // General categories
  'hen': 'grilled chicken',
  'rooster': 'tandoori chicken',
  'drumstick': 'tandoori chicken',
  'pretzel': 'noodles',
  'ramen': 'noodles',
  'noodles': 'noodles',
  'ladle': 'dal',
  'wok': 'fried rice',
  'frying_pan': 'fried rice',
  'spatula': 'dosa',
  'mixing_bowl': 'oatmeal',

  // Breakfast
  'waffle': 'dosa',
  'pancake': 'dosa',
  'oatmeal': 'oatmeal',
  'porridge': 'oatmeal',
  'dough': 'pizza',
  'bakery': 'cake',

  // Rice and noodles
  'fried_rice': 'fried rice',
  'fried rice': 'fried rice',
  'rice': 'biryani',

  // Sushi
  'sushi': 'sushi',

  // Common MobileNet objects that could be food-related
  'tray': 'biryani',
  'dining_table': 'biryani',
  'restaurant': 'biryani',
  'menu': 'biryani',
  'wooden_spoon': 'dal',
  'crock_pot': 'dal',
  'dutch_oven': 'biryani',
  'caldron': 'dal',
  'mortar': 'paneer tikka',
};

class FoodDetector {
  /**
   * Map a MobileNet or classifier label to a known food name
   * @param {string} label - raw label from image classifier
   * @returns {string} mapped food name
   */
  static mapLabel(label) {
    const normalized = label.toLowerCase().trim().replace(/[_\s]+/g, '_');

    // Direct lookup
    if (LABEL_MAP[normalized]) return LABEL_MAP[normalized];

    // Try with spaces
    const withSpaces = normalized.replace(/_/g, ' ');
    if (LABEL_MAP[withSpaces]) return LABEL_MAP[withSpaces];

    // Partial match
    for (const [key, value] of Object.entries(LABEL_MAP)) {
      if (normalized.includes(key) || key.includes(normalized)) {
        return value;
      }
    }

    // Return the label itself as fallback
    return withSpaces;
  }

  /**
   * Check if a label maps to a known food
   */
  static isKnownFood(label) {
    const mapped = this.mapLabel(label);
    return this.getSupportedFoods().includes(mapped);
  }

  /**
   * Get list of all supported foods
   */
  static getSupportedFoods() {
    return [
      'samosa', 'pizza', 'burger', 'french fries', 'salad',
      'grilled chicken', 'biryani', 'dal', 'idli', 'dosa',
      'fried rice', 'noodles', 'pasta', 'paneer tikka', 'tandoori chicken',
      'ice cream', 'cake', 'oatmeal', 'smoothie', 'sushi'
    ];
  }
}

module.exports = FoodDetector;
