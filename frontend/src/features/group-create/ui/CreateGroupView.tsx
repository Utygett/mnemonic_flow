import React from 'react';

import type { CreateGroupViewModel } from '../model/useCreateGroupModel';

type Props = CreateGroupViewModel & {
  onCancel: () => void;
};

export function CreateGroupView(props: Props) {
  const {
    title,
    setTitle,
    description,
    setDescription,
    saving,
    error,
    canSubmit,
    submit,
    onCancel,
  } = props;

  return (
    <div className="min-h-screen bg-dark p-4">
      <div className="container-centered max-w-390">
        <div className="card">
          <h2 className="page__title">Новая группа</h2>

          <label className="field">
            <div className="field__label">Название</div>
            <input
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Например: Мои колоды"
              maxLength={60}
              disabled={saving}
            />
          </label>

          <label className="field">
            <div className="field__label">Описание</div>
            <textarea
              className="input input--textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Необязательно"
              rows={3}
              disabled={saving}
            />
          </label>

          {error && <div className="text-error">{error}</div>}

          <div className="actions">
            <button className="btn-ghost" onClick={onCancel} disabled={saving}>
              Отмена
            </button>
            <button className="btn-primary" onClick={submit} disabled={saving || !canSubmit}>
              {saving ? 'Сохранение…' : 'Создать'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
