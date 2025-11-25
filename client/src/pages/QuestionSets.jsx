/**
 * @file QuestionSets.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Manage question sets for Family Feud rounds.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { apiFetch } from '../utils/api.js';

export default function QuestionSets() {
  const navigate = useNavigate();
  const [questionSets, setQuestionSets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([{ answer: '', points: '' }]);

  // Fetch question sets from backend
  useEffect(() => {
    const fetchQuestionSets = async () => {
      try {
        const response = await apiFetch('/question-sets', {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch question sets');
        }

        const data = await response.json();
        setQuestionSets(data);
      } catch (err) {
        console.error('Error fetching question sets:', err);
        setError('Failed to load question sets. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestionSets();
  }, []);

  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index][field] = value;
    setAnswers(newAnswers);
  };

 const addAnswer = () => {
   if (answers.length >= 8) return; // Stop at 8
   setAnswers([...answers, { answer: '', points: '' }]);
  };

  const removeAnswer = (index) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1); // This should remove the specific index
    setAnswers(newAnswers);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Collect form data
    const formData = {
      title: e.target.elements.title.value,
      category: e.target.elements.category.value,
      prompt: e.target.elements.prompt.value,
      roundType: e.target.elements.roundType.value,
      tags: e.target.elements.tags.value.split(',').map(tag => tag.trim()).filter(tag => tag),
      answers: answers
        .filter(a => a.answer.trim() !== '' && !isNaN(a.points))
        .map(a => ({
          answer: a.answer.trim(),
          points: parseInt(a.points) || 0
        }))
    };

    try {
      
      const response = await apiFetch('/question-sets', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to create question set');
      }

      // Refresh the list after creation
      const updatedResponse = await apiFetch('/question-sets', {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setQuestionSets(updatedData);
      }

      // Reset form
      e.target.reset();
      setAnswers([{ answer: '', points: '' }]);
      alert('Question set created successfully!');
    } catch (err) {
      console.error('Error creating question set:', err);
      alert(`Error: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="game_theme" style={{ minHeight: '100vh' }}>
        <div className="page page--stacked">
          <div className="loading-message">Loading question sets...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="game_theme">
    <div className="page page--wide question-sets-page">
      <header className="page__header">
        <p className="eyebrow">Survey Bank</p>
        <h2>Question Sets</h2>
        <p>Curate survey prompts and answer lists for upcoming episodes.</p>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <PageSection
        title="Create Question Set"
        description="Add a new survey prompt, answers, and optional tags."
      >
        <form
          className="form-grid form-grid--wide"
          onSubmit={handleSubmit}
        >
          <label>
            Title
            <input type="text" name="title" placeholder="Family Dinner Staples" required />
          </label>

          <label>
            Category
            <input type="text" name="category" placeholder="Lifestyle" />
          </label>

          <label className="form-grid__full">
            Prompt
            <textarea name="prompt" rows="3" placeholder="Name something you might find..." required />
          </label>

          <label>
            Round Type
            <select name="roundType" defaultValue="single">
              <option value="single">Single Points</option>
              <option value="double">Double Points</option>
              <option value="triple">Triple Points</option>
              <option value="fast">Fast Money</option>
            </select>
          </label>

          <label>
            Tags (comma separated)
            <input type="text" name="tags" placeholder="holiday, food" />
          </label>

          <div className="form-grid__full">
            <p className="form-help">Add answers below. Points should mirror percentages from the survey source.</p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={addAnswer}
              disabled={answers.length >= 8}
            >
              {answers.length >= 8 ? 'Max Answers Reached' : 'Add Answer'}
            </button>
            <button 
              type="button" 
              className="reset-button"
              onClick={() => setAnswers([{ answer: '', points: '' }])}
            >
              Reset
            </button>
            <button type="submit" className="primary-button">
              Save Question Set
            </button>
          </div>

          <div className="answer-list">
            {answers.map((answer, index) => (
              <div key={index} className="answer-list__row">
                <input
                  type="text"
                  value={answer.answer}
                  onChange={(e) => handleAnswerChange(index, 'answer', e.target.value)}
                  placeholder={`Answer ${index + 1}`}
                  required
                />
                <input
                  type="number"
                  value={answer.points}
                  onChange={(e) => handleAnswerChange(index, 'points', e.target.value)}
                  onInput={(e) => {
                    if (e.target.value > 99) e.target.value = 99;
                    if (e.target.value < 0) e.target.value = 0;
                  }}
                  placeholder="Points"
                  min="0"
                  max="99"
                  required
                />
                <button
                  type="button"
                  className="remove-answer-button"
                  onClick={() => removeAnswer(index)} // This should be the current row's index
                  aria-label="Remove answer"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </form>
      </PageSection>

      <PageSection
        title="Existing Sets"
        description="Edit or retire question sets as your content evolves."
      >
        {questionSets.length === 0 ? (
          <div className="empty-state">
            <p>No question sets found.</p>
            <p>Create your first question set to organize your game content.</p>
          </div>
        ) : (
          <div className="table-placeholder">
            <div className="table-placeholder__row table-placeholder__row--head">
              <span>Title</span>
              <span>Category</span>
              <span>Round Type</span>
              <span>Answers</span>
              <span>Updated</span>
              <span>Actions</span>
            </div>
            {questionSets.map((set) => (
              <div key={set._id || set.id} className="table-placeholder__row">
                <span>{set.title}</span>
                <span>{set.category || 'None'}</span>
                <span>{set.roundType}</span>
                <span>{set.answers?.length || 0}</span>
                <span>{set.updatedAt ? new Date(set.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                <span className="table-placeholder__actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/question-sets/${set._id || set.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button link-button--destructive"
                    onClick={async () => {
                      if (window.confirm('Are you sure you want to delete this question set?')) {
                        try {
                          const response = await fetch(`/api/v1/question-sets/${set._id || set.id}`, {
                            method: 'DELETE',
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                          });

                          if (!response.ok) {
                            const errorData = await response.json().catch(() => ({}));
                            throw new Error(errorData.message || 'Failed to delete question set');
                          }

                          // Refresh the list after deletion
                          const updatedResponse = await fetch('/api/v1/question-sets', {
                            credentials: 'include',
                            headers: { 'Content-Type': 'application/json' },
                          });

                          if (updatedResponse.ok) {
                            const updatedData = await updatedResponse.json();
                            setQuestionSets(updatedData);
                          }
                        } catch (err) {
                          alert(`Error: ${err.message}`);
                        }
                      }
                    }}
                  >
                    Delete
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </div>
    </div>
  );
}
