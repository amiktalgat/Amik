import { useState } from 'react';

type BattleTutorialProps = {
  isOwner: boolean;
  open: boolean;
  onClose: () => void;
};

const playerSteps = [
  {
    title: '1. Выбери цвет',
    text: 'Нажми на любой цвет в панели Color. Этот цвет будет ставиться на общий холст.',
  },
  {
    title: '2. Найди место',
    text: 'Перетаскивай холст мышкой или пальцем. Кнопки + и - помогают приблизить или отдалить карту.',
  },
  {
    title: '3. Поставь пиксель',
    text: 'Нажми на клетку холста. Если пиксели закончились, подожди пополнение баланса.',
  },
  {
    title: '4. Следи за результатом',
    text: 'Мини-карта показывает, где уже есть рисунки, а Profile хранит твою статистику.',
  },
];

const ownerStep = {
  title: '5. Owner tools',
  text: 'У владельца есть Paint, Erase и Size. Большой ластик стирает область выбранного размера.',
};

export function BattleTutorial({ isOwner, open, onClose }: BattleTutorialProps) {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const steps = isOwner ? [...playerSteps, ownerStep] : playerSteps;
  const current = steps[step];

  if (!open) return null;

  function finish() {
    setStarted(false);
    setStep(0);
    onClose();
  }

  return (
    <section className="battle-tutorial" aria-modal="true" role="dialog">
      <div className="battle-tutorial__card">
        {!started ? (
          <>
            <p className="battle-panel__title">Обучение</p>
            <h2>Хочешь быстро понять Pixel Battle?</h2>
            <p>За 30 секунд покажу, как выбрать цвет, двигать холст и ставить пиксели.</p>
            <div className="battle-tutorial__actions">
              <button className="battle-tutorial__primary" type="button" onClick={() => setStarted(true)}>
                Начать обучение
              </button>
              <button type="button" onClick={finish}>
                Пропустить
              </button>
            </div>
          </>
        ) : (
          <>
            <p className="battle-panel__title">Шаг {step + 1} из {steps.length}</p>
            <h2>{current.title}</h2>
            <p>{current.text}</p>
            <div className="battle-tutorial__progress">
              {steps.map((item, index) => (
                <span className={index === step ? 'active' : ''} key={item.title} />
              ))}
            </div>
            <div className="battle-tutorial__actions">
              <button type="button" disabled={step === 0} onClick={() => setStep(step - 1)}>
                Назад
              </button>
              {step === steps.length - 1 ? (
                <button className="battle-tutorial__primary" type="button" onClick={finish}>
                  Готово
                </button>
              ) : (
                <button className="battle-tutorial__primary" type="button" onClick={() => setStep(step + 1)}>
                  Дальше
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
