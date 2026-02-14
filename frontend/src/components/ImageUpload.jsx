import React, { useRef, useState, useCallback } from 'react';
import { detectFood } from '../api/foodApi';

export default function ImageUpload({ onFoodDetected, onImageSelected, isLoading }) {
  const fileInputRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [manualFood, setManualFood] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [aiPredictions, setAiPredictions] = useState(null);

  const handleFileSelect = useCallback(async (file) => {
    if (!file || !file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setPreview(dataUrl);
      onImageSelected && onImageSelected(dataUrl);

      // Send to backend for Clarifai detection
      setDetecting(true);
      setAiPredictions(null);
      try {
        const result = await detectFood(dataUrl);
        setAiPredictions(result.allPredictions);

        if (result.mappedFood) {
          onFoodDetected(result.mappedFood, result.allPredictions);
        } else if (result.label) {
          onFoodDetected(result.label, result.allPredictions);
        }
      } catch (err) {
        console.warn('Clarifai detection failed:', err);
      } finally {
        setDetecting(false);
      }
    };
    reader.readAsDataURL(file);
  }, [onFoodDetected, onImageSelected]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleManualSubmit = useCallback(() => {
    if (manualFood.trim()) {
      onFoodDetected(manualFood.trim(), null);
    }
  }, [manualFood, onFoodDetected]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      handleManualSubmit();
    }
  }, [handleManualSubmit]);

  return (
    <div className="upload-area">
      <div
        className={`upload-zone ${isDragOver ? 'upload-zone--active' : ''}`}
        onClick={() => fileInputRef.current?.click()}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        role="button"
        tabIndex={0}
        id="image-upload-zone"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files[0])}
          id="file-input"
        />

        {preview ? (
          <>
            <img src={preview} alt="Food preview" className="upload-zone__preview" />
            {detecting && (
              <div className="loading-container" style={{ padding: '1rem' }}>
                <div className="spinner" style={{ width: 32, height: 32 }}></div>
                <span className="loading-text">🔍 Detecting food with Clarifai AI...</span>
              </div>
            )}
            {aiPredictions && aiPredictions.length > 0 && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                {aiPredictions.slice(0, 3).map((p, i) => (
                  <span key={i} className="ingredient-chip" style={{ fontSize: '0.75rem' }}>
                    {p.label} ({p.confidence}%)
                  </span>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <span className="upload-zone__icon">📸</span>
            <p className="upload-zone__text">
              Drag & drop a food image here, or click to browse
            </p>
            <p className="upload-zone__hint">Supports JPG, PNG, WebP • Powered by Clarifai AI</p>
          </>
        )}
      </div>

      <div className="manual-input-section">
        <span className="manual-input-section__divider">— or type a food name —</span>
        <input
          type="text"
          className="food-input"
          placeholder="e.g. samosa, pizza, biryani..."
          value={manualFood}
          onChange={(e) => setManualFood(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          id="manual-food-input"
        />
        <button
          className="analyze-btn"
          style={{ width: 'auto', marginBottom: 0, padding: '0.75rem 1.5rem', fontSize: '0.875rem' }}
          onClick={handleManualSubmit}
          disabled={!manualFood.trim() || isLoading}
          id="manual-submit-btn"
        >
          Detect
        </button>
      </div>
    </div>
  );
}
