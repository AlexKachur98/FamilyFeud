/**
 * @file Questions.jsx
 * @author Pierre Moreau
 * @since 2025-11-25
 * @purpose Manage questions for Family Feud rounds.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PageSection from '../components/PageSection.jsx';
import { useQuestions } from '../context/questions.context.jsx';

export default function Questions() {
  const navigate = useNavigate();

  const { questions, setQuestions } = useQuestions();

  // const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [answers, setAnswers] = useState([{ answer: '', points: '' }, { answer: '', points: '' }, { answer: '', points: '' }]);
  // const [roundType, setRoundType] = useState('no');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newQuestion = {
      title: formData.get('title'),
      difficulty: formData.get('difficulty'),
      isFastMoney: formData.get('roundType') === 'yes',
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
      answers: answers.filter(ans => ans.answer && ans.points)
    };

  };

  const addAnswer = () => {
    if (answers.length < 8) setAnswers([...answers, { answer: '', points: '' }]);
  };

  // if (loading) {
  //   return (
  //     <div className="page page--stacked">
  //       <div className="loading-message">Loading questions...</div>
  //     </div>
  //   );
  // }

  return (
    <div className="game_theme">
    <div className="page page--wide question-sets-page">
      <header className="page__header">
        <p className="eyebrow">Question Bank</p>
        <h2>Questions</h2>
        <p>Curate questions for upcoming episodes.</p>
      </header>

      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      <PageSection
        title="Create Question"
        description="Add a new question, answers, and optional tags."
      >
        <form
          className="form-grid form-grid--vertical"
          onSubmit={handleSubmit}
        >
          <label>
            Question
            <input type="text" name="title" placeholder="What can you find in a kitchen?" required />
          </label>

          <label>
            Difficulty
            <select name="difficulty" defaultValue="easy">
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label>
            Is this a Fast Money question?
            <div className="radio-group">
              <label className="radio-inline">
                <input type="radio" name="roundType" value="yes" /> Yes
              </label>
              <label className="radio-inline">
                <input type="radio" name="roundType" value="no" defaultChecked /> No
              </label>
            </div>
          </label>

          <label>
            Tags (comma separated)
            <input type="text" name="tags" placeholder="holiday, food" />
          </label>

          <div className="form-grid__full">
            <p className="form-help">Add answers below. Points should mirror 100 points.</p>
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
                  placeholder="Points"
                  min="0"
                  required
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={addAnswer}
            >
              Add Another Answer
            </button>
            <button type="submit" className="primary-button">
              Save Question
            </button>
          </div>
        </form>
      </PageSection>

      <PageSection
        title="Existing Questions"
        description="Edit or remove questions."
      >
        {questions.length === 0 ? (
          <div className="empty-state">
            <p>No questions found.</p>
            <p>Create your first question to organize your game content.</p>
          </div>
        ) : (
          <div className="table-placeholder">
            <div className="table-placeholder__row table-placeholder__row--head">
              <span>Question</span>
              <span>Difficulty</span>
              <span>Fast Money</span>
              <span>Answers</span>
              <span>Updated</span>
              <span>Actions</span>
            </div>
            {questions.slice(0, 20).map((question) => (
              <div key={question._id || question.id} className="table-placeholder__row">
                <span>{question.text}</span>
                <span>{question.difficulty || 'None'}</span>
                <span>{question?.isFastMoney ? "Yes" : "No"}</span>
                <span>{question.answers?.length || 0}</span>
                <span>{question.updatedAt ? new Date(question.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                <span className="table-placeholder__actions">
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => navigate(`/questions/${question._id || question.id}`)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="link-button link-button--destructive"
                    // onClick={async () => {
                    //   if (window.confirm('Are you sure you want to delete this question set?')) {
                    //     try {
                    //       const response = await fetch(`/api/v1/question-sets/${set._id || set.id}`, {
                    //         method: 'DELETE',
                    //         credentials: 'include',
                    //         headers: { 'Content-Type': 'application/json' },
                    //       });

                    //       if (!response.ok) {
                    //         const errorData = await response.json().catch(() => ({}));
                    //         throw new Error(errorData.message || 'Failed to delete question set');
                    //       }

                    //       // Refresh the list after deletion
                    //       const updatedResponse = await fetch('/api/v1/question-sets', {
                    //         credentials: 'include',
                    //         headers: { 'Content-Type': 'application/json' },
                    //       });

                    //       if (updatedResponse.ok) {
                    //         const updatedData = await updatedResponse.json();
                    //         setQuestionSets(updatedData);
                    //       }
                    //     } catch (err) {
                    //       alert(`Error: ${err.message}`);
                    //     }
                    //   }
                    // }}
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
