import React from 'react';

import {
  Flame,
  Timer,
  Sparkles,
  Layers,
} from 'lucide-react';

import { getStatsOverview } from '../../../shared/api';
import type { StatsOverview, StatsPeriod } from '../model/statisticsTypes';

type Period = StatsPeriod;

type StatCard = {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
};

function safeNumber(v: unknown): number {
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : 0;
}

const DOW_RU_MON0 = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const;

function buildSparkPath(series: number[], width: number, height: number) {
  const values = series.map(safeNumber);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = Math.max(max - min, 1);

  const step = values.length > 1 ? width / (values.length - 1) : width;

  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * height;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(' ');
}

function dateToDowLabel(dateStr: string) {
  // dateStr: YYYY-MM-DD
  const d = new Date(`${dateStr}T00:00:00`);
  const js = d.getDay(); // 0=Sun..6=Sat
  const mon0 = (js + 6) % 7;
  return DOW_RU_MON0[mon0];
}

export function Statistics() {
  const [period, setPeriod] = React.useState<Period>('week');
  const [data, setData] = React.useState<StatsOverview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getStatsOverview(period);
        if (cancelled) return;
        setData(res);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message ?? 'Не удалось загрузить статистику');
        setData(null);
      } finally {
        if (cancelled) return;
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [period]);

  const learnedRate = data?.overall?.learnedRatePct ?? 0;

  const weekly = data?.activity?.last7Days ?? [];
  const weeklyMax = Math.max(...weekly.map((d) => safeNumber(d.reviews)), 1);
  const weeklySum = weekly.reduce((a, b) => a + safeNumber(b.reviews), 0);

  // Pace sparkline from API series if present, fallback to reviews/time
  const paceSeries = React.useMemo(() => {
    const series = data?.pace?.series ?? [];
    if (series.length > 0) return series.map((s) => safeNumber(s.cardsPerMin));

    // fallback: compute per-day from last7Days using avgPerReview totalMs
    const avgTotalMs = data?.time?.avgPerReviewMs?.totalMs ?? 0;
    if (!avgTotalMs) return weekly.map(() => 0);

    return weekly.map((d) => {
      const reviews = safeNumber(d.reviews);
      const totalMs = reviews * avgTotalMs;
      return totalMs > 0 ? reviews / (totalMs / 60000) : 0;
    });
  }, [data, weekly]);

  const paceAvg =
    paceSeries.length > 0
      ? paceSeries.reduce((a, b) => a + safeNumber(b), 0) / Math.max(paceSeries.length, 1)
      : 0;

  const paceCaption =
    period === 'week'
      ? 'Карточки/мин за последние 7 дней'
      : 'Карточки/мин за период';

  const streakDays = data?.activity?.streakDays ?? 0;
  const todayTotalMin = Math.round((data?.time?.today?.totalMs ?? 0) / 60000);

  const statCards: StatCard[] = [
    {
      label: 'Период',
      value: period === 'week' ? 'Неделя' : 'Месяц',
      hint: 'Переключатель влияет на период запроса статистики.',
      icon: <Sparkles size={18} />,
    },
    {
      label: 'Серия',
      value: `${streakDays} дн.`,
      hint: 'Сколько дней подряд есть повторения.',
      icon: <Flame size={18} />,
    },
    {
      label: 'Сегодня',
      value: `${todayTotalMin} мин`,
      hint: 'Суммарное время (think+grade) за сегодня.',
      icon: <Timer size={18} />,
    },
    {
      label: 'Изучено',
      value: `${data?.overall?.learnedCards ?? 0}/${data?.overall?.totalCards ?? 0}`,
      hint: 'Карточки, достигшие порога difficulty (порог хранится в профиле).',
      icon: <Layers size={18} />,
    },
  ];

  const sparkW = 320;
  const sparkH = 90;
  const sparkPath = buildSparkPath(paceSeries, sparkW, sparkH);

  return (
    <div className="stats-page">
      <div className="page__header">
        <div className="page__header-inner statsHeader">
          <div>
            <h1 className="page__title">Статистика</h1>
            <div className="statsHeader__sub">Глобальная статистика по пользователю</div>
          </div>

          <div className="statsHeader__right">
            <div className="segmented" role="tablist" aria-label="Период">
              <button
                type="button"
                role="tab"
                aria-selected={period === 'week'}
                className={`segmented__btn ${period === 'week' ? 'segmented__btn--active' : ''}`}
                onClick={() => setPeriod('week')}
              >
                Неделя
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={period === 'month'}
                className={`segmented__btn ${period === 'month' ? 'segmented__btn--active' : ''}`}
                onClick={() => setPeriod('month')}
              >
                Месяц
              </button>
            </div>

            <div className="statsRing" aria-label="Общий прогресс">
              <svg className="statsRing__svg" width="76" height="76" viewBox="0 0 76 76">
                <circle
                  cx="38"
                  cy="38"
                  r="32"
                  stroke="rgba(255,255,255,0.10)"
                  strokeWidth="8"
                  fill="none"
                />
                <circle
                  cx="38"
                  cy="38"
                  r="32"
                  stroke="var(--primary)"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 32}`}
                  strokeDashoffset={`${2 * Math.PI * 32 * (1 - learnedRate / 100)}`}
                  strokeLinecap="round"
                  className="statsRing__bar"
                />
              </svg>
              <div className="statsRing__center">
                <div className="statsRing__value">{Math.round(learnedRate)}%</div>
                <div className="statsRing__label">Общий</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 py-6 container-centered stats__content">
        {loading ? (
          <div className="card statsBlock">
            <div className="statsBlock__head">
              <h3 className="statsBlock__title">Загрузка…</h3>
            </div>
          </div>
        ) : error ? (
          <div className="card statsBlock">
            <div className="statsBlock__head">
              <h3 className="statsBlock__title">Ошибка</h3>
              <span className="statsBlock__chip">{error}</span>
            </div>
          </div>
        ) : null}

        {/* Chart: Pace */}
        <div className="card statsBlock">
          <div className="statsBlock__head">
            <h3 className="statsBlock__title">Нагрузка</h3>
            <span className="statsBlock__chip">{paceAvg.toFixed(2)} кард/мин</span>
          </div>

          <div className="spark" aria-label="График нагрузки">
            <svg className="spark__svg" viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none">
              <path d={sparkPath} className="spark__line" fill="none" />
            </svg>
          </div>
          <div className="spark__caption">{paceCaption}</div>
        </div>

        {/* Quick metrics */}
        <div className="statsGrid">
          {statCards.map((c) => (
            <div key={c.label} className="card statCard" title={c.hint}>
              <div className="statCard__top">
                <div className="statCard__icon">{c.icon}</div>
                <div className="statCard__label">{c.label}</div>
              </div>
              <div className="statCard__value">{c.value}</div>
              <div className="statCard__hint">{c.hint}</div>
            </div>
          ))}
        </div>

        {/* Weekly Activity */}
        <div className="card statsBlock">
          <div className="statsBlock__head">
            <h3 className="statsBlock__title">Активность за 7 дней</h3>
            <span className="statsBlock__chip">{weeklySum} повторений</span>
          </div>

          <div className="statsBars">
            {weekly.map((d) => {
              const value = safeNumber(d.reviews);
              const height = (value / weeklyMax) * 100;
              const day = dateToDowLabel(d.date);

              return (
                <div key={d.date} className="statsBars__col">
                  <div className="statsBars__track" aria-hidden="true">
                    <div className="statsBars__fill" style={{ height: `${height}%` }} />
                  </div>
                  <div className="statsBars__meta">
                    <span className="statsBars__day">{day}</span>
                    <span className="statsBars__val">{value}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
