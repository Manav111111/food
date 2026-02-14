const FoodDetector = require('./foodDetector');

/**
 * Clarifai Food Detection Service
 * Uses Clarifai's food-item-recognition model for accurate food detection.
 */
class ClarifaiService {
  static API_KEY = process.env.CLARIFAI_PAT;
  // Use the user-scoped URL for app-specific API keys
  static USER_ID = process.env.CLARIFAI_USER_ID || 'clarifai';
  static APP_ID = process.env.CLARIFAI_APP_ID || 'main';
  static MODEL_ID = 'food-item-recognition';

  /**
   * Detect food from a base64-encoded image
   * @param {string} base64Image - base64 image data (with or without data:image prefix)
   * @returns {{ label: string, confidence: number, mappedFood: string, allPredictions: array }}
   */
  static async detectFood(base64Image) {
    if (!this.API_KEY) {
      throw new Error('CLARIFAI_PAT not set in environment');
    }

    // Strip data URL prefix if present
    const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, '');

    const raw = JSON.stringify({
      user_app_id: {
        user_id: this.USER_ID,
        app_id: this.APP_ID
      },
      inputs: [
        {
          data: {
            image: {
              base64: cleanBase64
            }
          }
        }
      ]
    });

    const apiUrl = `https://api.clarifai.com/v2/models/${this.MODEL_ID}/outputs`;

    console.log(`Calling Clarifai: ${apiUrl} (user: ${this.USER_ID}, app: ${this.APP_ID})`);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${this.API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: raw
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clarifai API error:', response.status, errorText);
      throw new Error(`Clarifai API error: ${response.status} - ${errorText.substring(0, 200)}`);
    }

    const data = await response.json();

    if (data.status && data.status.code !== 10000) {
      throw new Error(`Clarifai error: ${data.status.description}`);
    }

    const concepts = data.outputs?.[0]?.data?.concepts || [];

    if (concepts.length === 0) {
      throw new Error('No food detected in the image');
    }

    // Get top predictions
    const allPredictions = concepts.slice(0, 10).map(c => ({
      label: c.name,
      confidence: Math.round(c.value * 100)
    }));

    // Map the top label to our database
    const topLabel = concepts[0].name;
    const mappedFood = FoodDetector.mapLabel(topLabel);

    return {
      label: topLabel,
      confidence: Math.round(concepts[0].value * 100),
      mappedFood,
      isKnown: FoodDetector.isKnownFood(topLabel),
      allPredictions
    };
  }
}

module.exports = ClarifaiService;
