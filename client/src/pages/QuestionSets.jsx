/**
 * @file QuestionSets.jsx
 * @author Alex Kachur
 * @since 2025-11-04
 * @purpose Manage question sets for Family Feud rounds.
 */
import PageSection from '../components/PageSection.jsx';
import { getQuestionSets } from '../utils/questionSets.js';

export default function QuestionSets() {
  const questionSets = getQuestionSets();

  return (
    <div className="page page--stacked">
      <header className="page__header">
        <p className="eyebrow">Survey Bank</p>
        <h2>Question Sets</h2>
        <p>Curate survey prompts and answer lists for upcoming episodes.</p>
      </header>

      <PageSection
        title="Create Question Set"
        description="Add a new survey prompt, answers, and optional tags."
      >
        <form className="form-grid form-grid--vertical">
          <label>
            Title
            <input type="text" placeholder="Family Dinner Staples" />
          </label>
          <label>
            Category
            <input type="text" placeholder="Lifestyle" />
          </label>
          <label className="form-grid__full">
            Prompt
            <textarea rows="3" placeholder="Name something you might find..." />
          </label>
          <label>
            Round Type
            <select defaultValue="single">
              <option value="single">Single</option>
              <option value="double">Double</option>
              <option value="triple">Triple</option>
            </select>
          </label>
          <label>
            Tags
            <input type="text" placeholder="holiday, food" />
          </label>
          <div className="form-grid__full">
            <p className="form-help">Add answers below. Points should mirror percentages from the survey source.</p>
          </div>
          <div className="answer-list">
            {[1, 2, 3, 4].map((index) => (
              <div key={index} className="answer-list__row">
                <input type="text" placeholder={`Answer ${index}`} />
                <input type="number" placeholder="Points" min="0" />
              </div>
            ))}
          </div>
          <div className="form-actions">
            <button type="button">Add Another Answer</button>
            <button type="submit">Save Question Set</button>
          </div>
          {/* TODO (Backend Team): hook to POST /api/question-sets with validation + optimistic updates. */}
        </form>
      </PageSection>

      <PageSection
        title="Existing Sets"
        description="Edit or retire question sets as your content evolves."
      >
        <div className="table-placeholder">
          <div className="table-placeholder__row table-placeholder__row--head">
            <span>Title</span>
            <span>Category</span>
            <span>Round</span>
            <span>Answers</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>
          {questionSets.map((set) => (
            <div key={set.id} className="table-placeholder__row">
              <span>{set.title}</span>
              <span>{set.category}</span>
              <span>{set.roundType}</span>
              <span>{set.answers.length}</span>
              <span>{new Date(set.updatedAt).toLocaleDateString()}</span>
              <span className="table-placeholder__actions">
                <button type="button" className="link-button">Edit</button>
                <button type="button" className="link-button link-button--destructive">Delete</button>
              </span>
            </div>
          ))}
        </div>
        {/* TODO (Backend Team): power this table via GET /api/question-sets with pagination + filters. */}
      </PageSection>
    </div>
  );
}
