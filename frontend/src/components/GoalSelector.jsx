import React from 'react';

export default function GoalSelector({ selectedGoal, onGoalChange }) {
  const goals = [
    { id: 'weight_loss', icon: '🏃', label: 'Weight Loss' },
    { id: 'muscle_gain', icon: '💪', label: 'Muscle Gain' },
    { id: 'diabetes_friendly', icon: '🩺', label: 'Diabetes Friendly' },
    { id: 'balanced_diet', icon: '🥗', label: 'Balanced Diet' }
  ];

  return (
    <div className="goal-selector">
      <span className="goal-selector__label">Select Your Health Goal</span>
      <div className="goal-pills">
        {goals.map(g => (
          <button
            key={g.id}
            className={`goal-pill ${selectedGoal === g.id ? 'goal-pill--active' : ''}`}
            onClick={() => onGoalChange(g.id)}
          >
            <span>{g.icon}</span>
            {g.label}
          </button>
        ))}
      </div>
    </div>
  );
}
