/**
 * @file Questions.jsx
 * @author Pierre Moreau
 * @since 2025-11-25
 * @purpose Manage questions for Family Feud rounds.
 */
import { useEffect, useState } from 'react';

import { useQuestions } from '../context/questions.context.jsx';
import { createQuestion, editQuestion, deleteQuestionById } from '../api/questions.api.js';

import Sidebar from '../components/Sidebar.jsx';
import SearchBar from '../components/SearchBar.jsx';
import PageSection from '../components/PageSection.jsx';
import VerifyAction from '../components/VerifyAction.jsx';
import logo from '/Family_Feud_Logo.png';

export default function Questions() {

  const { isLoadingQuestions, questions, setQuestions } = useQuestions();

  const [filteredQuestions, setFilteredQuestions] = useState([]);

  useEffect(() => {
    if (!isLoadingQuestions) setFilteredQuestions(questions);
  }, [isLoadingQuestions]);

  const [showWarning, setShowWarning] = useState(false);
  const [event, setEvent] = useState(null);

  const [action, setAction] = useState({prev: null, current: 'create'}); // 'create' or 'edit' or 'delete'
  const [focusQuestion, setFocusQuestion] = useState({prev: {id: null, index: null}, current: {id: null, index: null}});
  const [answers, setAnswers] = useState([{ answer: '', points: '' }, { answer: '', points: '' }, { answer: '', points: '' }]);

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const newQuestion = {
      text: formData.get('title'),
      isFastMoney: formData.get('roundType') === 'yes',
      difficulty: formData.get('difficulty'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
      answers: answers.filter(ans => ans.answer && ans.points).map(ans => ({
        text: ans.answer,
        points: Number(ans.points)
      }))
    };

    if (action.current === 'create') {
      await createQuestion(newQuestion)
      .then(data => data)
      .then(createdQuestion => {
          if (createdQuestion?.message) return;
          const question = {
              ...createdQuestion,
              updatedAt: new Date().toISOString()
          }
          setQuestions([question, ...questions]);
          setFilteredQuestions([question, ...filteredQuestions]);
          
      })
      .catch(error => {
          console.error('Error:', error);
          return null;
      });
    }

    const form = document.querySelector('form');
    form.reset();

    setAnswers([{ answer: '', points: '' }, { answer: '', points: '' }, { answer: '', points: '' }]);
    setFocusQuestion({prev: focusQuestion.current, current: {id: null, index: null}});
    setAction({ prev: action.current, current: 'create' });
    
    setEvent(null);
    setShowWarning(false);
  };
  
  const handleEditSubmit = async () => {
    event?.preventDefault();
    const formData = new FormData(event?.target);

    const newQuestion = {
      text: formData.get('title'),
      isFastMoney: formData.get('roundType') === 'yes',
      difficulty: formData.get('difficulty'),
      tags: formData.get('tags') ? formData.get('tags').split(',').map(tag => tag.trim()) : [],
      answers: answers.filter(ans => ans.answer && ans.points).map(ans => ({
        text: ans.answer,
        points: Number(ans.points)
      }))
    };

    if (action.current === 'edit') {
      await editQuestion(focusQuestion.current.id, newQuestion)
      .then(data => data)
      .then(editedQuestion => {
        if (editedQuestion?.message) return;
          const question = {
            ...editedQuestion,
            updatedAt: new Date().toISOString()
          }

          setQuestions(questions.map((q, index) => {
            if (q._id === focusQuestion.current.id) return question;
            return q;
          }));

          setFilteredQuestions(filteredQuestions.map((q, index) => {
            if (q._id === focusQuestion.current.id) return question;
            return q;
          }));
      })
      .catch(error => {
          console.error('Error:', error);
          return null;
      });
    }

    const form = document.querySelector('form');
    form.reset();

    setAnswers([{ answer: '', points: '' }, { answer: '', points: '' }, { answer: '', points: '' }]);
    setFocusQuestion({prev: focusQuestion.current, current: {id: null, index: null}});
    setAction({ prev: action.current, current: 'create' });
    
    setEvent(null);
    setShowWarning(false);
  };

  const handleDeleteSubmit = async () => {
    event?.preventDefault();

    await deleteQuestionById(focusQuestion.current.id)
    .then(() => {
        setQuestions(questions.filter(q => q._id !== focusQuestion.current.id && q.id !== focusQuestion.current.id));
        setFilteredQuestions(filteredQuestions.filter(q => q._id !== focusQuestion.current.id && q.id !== focusQuestion.current.id));
    })
    .catch(error => {
        console.error('Error:', error);
    });

    if (focusQuestion.current.id === focusQuestion.prev.id) {
      setFocusQuestion({prev: {id: null, index: null}, current: {id: null, index: null}});
      setAction({ prev: null, current: 'create' });

      const form = document.querySelector('form');
      form.reset();
    } else {
      setFocusQuestion({prev: {id: null, index: null}, current: focusQuestion.prev});
      setAction({ prev: null, current: action.prev });
    }

    setEvent(null);
    setShowWarning(false);
  }
  
  const handleEdit = (question, index) => {
    const text = document.querySelector('input[name="title"]');
    const difficulty = document.querySelector('select[name="difficulty"]');
    const roundTypeYes = document.querySelector('input[name="roundType"][value="yes"]');
    const roundTypeNo = document.querySelector('input[name="roundType"][value="no"]');
    const tags = document.querySelector('input[name="tags"]');

    text.value = question.text;
    difficulty.value = question.difficulty || 'easy';
    if (question.isFastMoney) roundTypeYes.checked = true;
    else roundTypeNo.checked = true;
    tags.value = question.tags ? question.tags.join(', ') : '';
    
    setAnswers(question.answers.map(ans => ({ answer: ans.text, points: ans.points })));
    
    setFocusQuestion({ prev: focusQuestion.current, current: { id: question._id || question.id, index } });
    setAction({ prev: action.current, current: 'edit' });

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      if (text && typeof text.focus === 'function') text.focus();
    });
  }

  const handleReset = () => {
    const form = document.querySelector('form');
    form.reset();
    setAnswers([{ answer: '', points: '' }, { answer: '', points: '' }, { answer: '', points: '' }]);
    setFocusQuestion({prev: focusQuestion.current, current: {id: null, index: null}});
    setAction({ prev: action.current, current: 'create' });
  };

  const handleVerifyCancel = () => {
    if (action.current === 'delete') {
      setAction({ prev: action.prev, current: action.prev });
      setFocusQuestion({prev: focusQuestion.prev, current: focusQuestion.prev}) 
    } 
    setEvent(null);
    setShowWarning(false);
  }

  const handleShowWarning = (e) => {
    e.preventDefault();
    if (action.current === 'edit' || (action.current === 'delete' && action.prev === 'edit')) {
      setEvent(e);
      setShowWarning(true);
    } else {
      handleCreateSubmit(e);
    }
  }
  
  const handleAnswerChange = (index, field, value) => {
    const newAnswers = [...answers];
    newAnswers[index][field] = value;
    setAnswers(newAnswers);
  };

  const addAnswer = () => {
    if (answers.length < 8) setAnswers([...answers, { answer: '', points: '' }]);
  };

  const removeAnswer = (index) => {
    const newAnswers = [...answers];
    newAnswers.splice(index, 1); // This should remove the specific index
    setAnswers(newAnswers);
  };

  return (
    <div className="game_theme">

      <Sidebar />

      {
        !showWarning ? null
        : <VerifyAction 
            action={action.current}
            text="this question"
            onConfirm={async () => action.current === 'edit' ? handleEditSubmit() : handleDeleteSubmit()} 
            onCancel={() => handleVerifyCancel()}
          />
      }

      <div className="page page--wide questions-page">
        <header className="page__header">
          <p className="eyebrow">Question Bank</p>
          <h2>Questions</h2>
          <p>Curate questions for upcoming episodes.</p>
          <img src={logo} alt="Family Feud Logo" className='page__logo' />
        </header>

        <PageSection
          title={(action.current === 'edit' || (action.current === 'delete' && action.prev === 'edit')) ? "Edit Question" : "Create Question"}
          description={(action.current === 'edit' || (action.current === 'delete' && action.prev === 'edit')) ? "Edit the question, answers, and tags." : "Add a new question, answers, and optional tags."}
        >
          <form
            className="form-grid form-grid--wide"
            onSubmit={(e) => handleShowWarning(e)}
          >
            <label>
              Question
              <input type="text" name="title" placeholder="What can you find in a kitchen?" required />
            </label>

            <div className='form__input-container'>
              <label className='form__difficulty'>
                Difficulty
                <select className='form__difficulty-select' name="difficulty" defaultValue="easy">
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </label>
              
              <label className='form__fast-money'>
                Fast Money?
                <div className="radio-group">
                  <label className="radio-inline">
                    <input type="radio" name="roundType" value="yes" /> Yes
                  </label>
                  <label className="radio-inline">
                    <input type="radio" name="roundType" value="no" defaultChecked /> No
                  </label>
                </div>
              </label>
            </div>

              <label>
                Tags (comma separated)
                <input type="text" name="tags" placeholder="holiday, food" />
              </label>

            <div className="form-grid__full">
              <p className="form-help">Add answers below. Points should mirror 100 points.</p>
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
                onClick={() => handleReset()}
              >
                Reset
              </button>
              <button type="submit" className="primary-button">
                {action.current === 'edit' ? "Save Question" : "Create Question"}
              </button>
            </div>

            <div className="answer-list">
              {
                answers.map((answer, index) => (
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
                      {
                        answers.length <= 3 ? null 
                        : <button
                          type="button"
                          className="remove-answer-button"
                          onClick={() => removeAnswer(index)}
                          aria-label="Remove answer"
                        >
                          ×
                        </button>
                      }
                    </div>
                ))
              }
            </div>
          </form>
        </PageSection>

        <PageSection
          title={`Existing Questions - ${filteredQuestions.length}`}
          description="Edit or remove questions."
          actions={<SearchBar placeholder="Search questions..." type="questions" data={questions} setData={setFilteredQuestions} />}
        >
          { isLoadingQuestions ? (
            <div className="loading-message">Loading questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="empty-state">
              <p>No questions found.</p>
              <p>Create your first question to organize your game content.</p>
            </div>
          ) : (
            <div className="table-placeholder__questions">
              <div className="table-placeholder__row table-placeholder__row--head">
                <span>Question</span>
                <span>Difficulty</span>
                <span>Answers</span>
                <span>Updated</span>
                <span>Actions</span>
              </div>
              {filteredQuestions?.slice(0, 6).map((question, index) => (
                <div key={question._id || question.id} className="table-placeholder__row">
                  <span>{question.text}</span>
                  <span>{question.difficulty || 'None'}</span>
                  <span>{question.answers?.length || 0}</span>
                  <span>{question.updatedAt ? new Date(question.updatedAt).toLocaleDateString() : 'Unknown'}</span>
                  <span className="table-placeholder__actions">
                    <button
                      type="button"
                      className="link-button"
                      onClick={() => handleEdit(question, index)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="link-button link-button--destructive"
                      onClick={() => {
                        setShowWarning(true); 
                        setAction({prev: action.current, current: 'delete'}); 
                        setFocusQuestion({prev: focusQuestion.current, current: {id: question._id || question.id, index}});
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
