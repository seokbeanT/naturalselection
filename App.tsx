"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";

type Color = "red" | "yellow" | "green" | "blue";
type Habitat = Color;
type SelectionMode = "fixed" | "timed" | "tracking";
type Counts = Record<Color, number>;
type Candy = {
  id: string;
  color: Color;
  x: number;
  y: number;
  moveX: number;
  moveY: number;
  moveDuration: number;
  moveDelay: number;
  turn: number;
  scale: number;
};
type MutationInfo = { total: number; bySource: Counts };
type Row = { generation: number; survived: Counts; offspring?: Counts; mutation?: MutationInfo };

const COLORS: { key: Color; label: string; hex: string }[] = [
  { key: "red", label: "빨간색", hex: "#e44138" },
  { key: "yellow", label: "노란색", hex: "#f1c51f" },
  { key: "green", label: "초록색", hex: "#58b650" },
  { key: "blue", label: "파란색", hex: "#267fce" },
];
const HABITATS: { key: Habitat; label: string; hex: string }[] = [
  { key: "red", label: "빨간색", hex: "#e44138" },
  { key: "yellow", label: "노란색", hex: "#f1c51f" },
  { key: "green", label: "초록색", hex: "#58b650" },
  { key: "blue", label: "파란색", hex: "#267fce" },
];
const ZERO: Counts = { red: 0, yellow: 0, green: 0, blue: 0 };
const INITIAL: Counts = { red: 10, yellow: 10, green: 10, blue: 10 };
const LAST_GENERATION = 5;
const FIXED_REMOVE_GOAL = 10;
const TIME_LIMIT_SECONDS = 5;

function randomFrom(seed: number) {
  let value = seed % 2147483647 || 1;
  return () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
}

function count(candies: Candy[]): Counts {
  const result = { ...ZERO };
  candies.forEach((candy) => { result[candy.color] += 1; });
  return result;
}

function total(counts: Counts) {
  return COLORS.reduce((sum, color) => sum + counts[color.key], 0);
}

function population(counts: Counts, seed: number): Candy[] {
  const random = randomFrom(seed);
  const colors = COLORS.flatMap(({ key }) => Array.from({ length: counts[key] }, () => key));
  for (let i = colors.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }
  const columns = Math.max(7, Math.ceil(Math.sqrt(colors.length * 1.6)));
  const rows = Math.max(5, Math.ceil(colors.length / columns));
  return colors.map((color, i) => {
    const x = 4 + ((i % columns + .5) / columns) * 92 + (random() - .5) * (65 / columns);
    const y = 6 + ((Math.floor(i / columns) + .5) / rows) * 88 + (random() - .5) * (65 / rows);
    let moveX = 5 + random() * 90;
    let moveY = 7 + random() * 86;
    if (Math.hypot(moveX - x, moveY - y) < 32) {
      moveX = x < 50 ? Math.min(95, x + 35) : Math.max(5, x - 35);
      moveY = y < 50 ? Math.min(93, y + 25) : Math.max(7, y - 25);
    }
    const moveDuration = (5 + Math.hypot(moveX - x, moveY - y) / 25) * .85;
    return {
      id: `${seed}-${i}-${Math.floor(random() * 99999)}`,
      color,
      x,
      y,
      moveX,
      moveY,
      moveDuration,
      moveDelay: -(random() * moveDuration),
      turn: Math.round(random() * 90 - 45),
      scale: .9 + random() * .22,
    };
  });
}

function doubleCounts(counts: Counts): Counts {
  return { red: counts.red * 2, yellow: counts.yellow * 2, green: counts.green * 2, blue: counts.blue * 2 };
}

function mutateAllColors(counts: Counts, seed: number) {
  const random = randomFrom(seed);
  const mutated = { ...counts };
  const bySource = { ...ZERO };

  COLORS.forEach(({ key: from }) => {
    const mutationCount = Math.round(counts[from] * 0.1);
    bySource[from] = mutationCount;
    mutated[from] -= mutationCount;
    const targets = COLORS.filter((color) => color.key !== from);
    for (let i = 0; i < mutationCount; i += 1) {
      const to = targets[Math.floor(random() * targets.length)].key;
      mutated[to] += 1;
    }
  });

  const mutation: MutationInfo = {
    total: total(bySource),
    bySource,
  };
  return { counts: mutated, mutation };
}

function percent(value: number, sum: number) {
  return sum ? `${((value / sum) * 100).toFixed(1)}%` : "0.0%";
}

export default function Home() {
  const [habitat, setHabitat] = useState<Habitat>("yellow");
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("fixed");
  const [seed, setSeed] = useState(20260817);
  const [generation, setGeneration] = useState(1);
  const [phase, setPhase] = useState<"select" | "review" | "result">("select");
  const [candies, setCandies] = useState(() => population(INITIAL, 20260817));
  const [removed, setRemoved] = useState<Counts>({ ...ZERO });
  const [rows, setRows] = useState<Row[]>([]);
  const [mutationNotice, setMutationNotice] = useState<MutationInfo | null>(null);
  const [tableOpen, setTableOpen] = useState(true);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT_SECONDS);
  const timerEndRef = useRef(0);
  const candiesRef = useRef(candies);

  const current = useMemo(() => count(candies), [candies]);
  const removedTotal = total(removed);
  const started = generation > 1 || removedTotal > 0 || rows.length > 0 || timerRunning;
  const latest = rows.at(-1);
  const boardColor = HABITATS.find((item) => item.key === habitat)?.hex;
  const candySize = candies.length > 550 ? 12 : candies.length > 350 ? 14 : candies.length > 220 ? 17 : candies.length > 120 ? 21 : candies.length > 70 ? 25 : 31;
  const isTimeMode = selectionMode !== "fixed";
  const activeTimeLimit = TIME_LIMIT_SECONDS;
  const currentTotal = total(current);

  useEffect(() => {
    candiesRef.current = candies;
  }, [candies]);

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, (timerEndRef.current - performance.now()) / 1000);
      setTimeLeft(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        setTimerRunning(false);
        setRows((old) => [...old, { generation, survived: count(candiesRef.current) }]);
        setPhase("review");
      }
    }, 50);
    return () => window.clearInterval(interval);
  }, [generation, timerRunning]);

  function startTimedSelection() {
    if (!isTimeMode || phase !== "select" || timerRunning) return;
    setTimeLeft(activeTimeLimit);
    timerEndRef.current = performance.now() + activeTimeLimit * 1000;
    setTimerRunning(true);
  }

  function selectMode(nextMode: SelectionMode) {
    setSelectionMode(nextMode);
    setTimeLeft(TIME_LIMIT_SECONDS);
  }

  function selectHabitat(nextHabitat: Habitat) {
    const nextSeed = seed + 97;
    setHabitat(nextHabitat);
    setSeed(nextSeed);
    setGeneration(1);
    setPhase("select");
    setCandies(population(INITIAL, nextSeed));
    setRemoved({ ...ZERO });
    setRows([]);
    setMutationNotice(null);
    setTimerRunning(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
  }

  function pick(candy: Candy) {
    if (phase !== "select" || (isTimeMode && !timerRunning)) return;
    if (isTimeMode && candies.length <= 1) return;
    const next = candies.filter((item) => item.id !== candy.id);
    const nextRemoved = { ...removed, [candy.color]: removed[candy.color] + 1 };
    candiesRef.current = next;
    setCandies(next);
    setRemoved(nextRemoved);
    if (selectionMode === "fixed" && removedTotal + 1 === FIXED_REMOVE_GOAL) {
      setRows((old) => [...old, { generation, survived: count(next) }]);
      setPhase("review");
    }
  }

  function nextGeneration() {
    if (generation === LAST_GENERATION) {
      setPhase("result");
      return;
    }
    let offspring = doubleCounts(count(candies));
    let mutation: MutationInfo | undefined;
    if (generation === 2) {
      const result = mutateAllColors(offspring, seed + generation * 997);
      offspring = result.counts;
      mutation = result.mutation;
    }
    setRows((old) => old.map((row) => row.generation === generation ? { ...row, offspring: { ...offspring }, mutation } : row));
    const nextSeed = seed + generation * 131 + total(offspring);
    setSeed(nextSeed);
    setCandies(population(offspring, nextSeed));
    setRemoved({ ...ZERO });
    setMutationNotice(mutation ?? null);
    setTimerRunning(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
    setGeneration((value) => value + 1);
    setPhase("select");
  }

  function reset() {
    const nextSeed = seed + 1777;
    setSeed(nextSeed);
    setGeneration(1);
    setPhase("select");
    setCandies(population(INITIAL, nextSeed));
    setRemoved({ ...ZERO });
    setRows([]);
    setMutationNotice(null);
    setTimerRunning(false);
    setTimeLeft(TIME_LIMIT_SECONDS);
  }

  function saveCsv() {
    const data: (string | number)[][] = [["세대", "단계", ...COLORS.map((c) => c.label), "전체"]];
    rows.forEach((row) => {
      data.push([row.generation, "선택 후 생존", ...COLORS.map((c) => row.survived[c.key]), total(row.survived)]);
      if (row.offspring) data.push([
        row.generation,
        row.mutation ? `번식 후(모든 색 약 10% 무작위 변이 · 총 ${row.mutation.total}개)` : "번식 후",
        ...COLORS.map((c) => row.offspring?.[c.key] ?? 0),
        total(row.offspring),
      ]);
    });
    if (latest) data.push([LAST_GENERATION, "최종 비율", ...COLORS.map((c) => percent(latest.survived[c.key], total(latest.survived))), "100.0%"]);
    const csv = data.map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "자연선택_모의실험_결과.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  const final = latest?.survived ?? current;
  const finalTotal = total(final);
  const dominant = COLORS.reduce((best, item) => final[item.key] > final[best.key] ? item : best);
  const timedReady = isTimeMode && phase === "select" && !timerRunning;
  const statusLabel = phase === "result"
    ? "실험 완료"
    : isTimeMode && phase === "select"
      ? `${generation}세대 · ${timerRunning ? (selectionMode === "tracking" ? "추적 모드 진행 중" : "5초 선택 중") : (selectionMode === "tracking" ? "추적 모드 준비" : "시간제한 준비")}`
      : `${generation}세대 · ${phase === "select" ? "선택 단계" : "관찰 단계"}`;
  const mainHeading = phase === "result"
    ? "세대에 따른 색 비율 변화"
    : phase === "review"
      ? "선택 결과를 확인하세요"
      : timedReady
        ? selectionMode === "tracking" ? "준비가 되면 추적 모드를 시작하세요" : "준비가 되면 5초 선택을 시작하세요"
        : selectionMode === "tracking"
          ? "움직이는 공을 빠르게 클릭하세요"
          : selectionMode === "timed"
          ? "눈에 띄는 공을 빠르게 클릭하세요"
          : "가장 먼저 눈에 띄는 개체 10개를 클릭하세요";
  const mainDescription = phase === "result"
    ? "환경에서 덜 눈에 띈 형질이 어떻게 달라졌는지 해석해 보세요."
    : phase === "review"
      ? "생존한 개체는 같은 색의 자손을 남겨 전체 개체 수가 2배로 늘어납니다."
      : timedReady
        ? selectionMode === "tracking" ? "시작하면 공이 움직이며 5초 동안 클릭할 수 있습니다." : "시작하면 5초 동안 클릭한 공만 제거됩니다."
        : "색을 정해 두지 말고, 포식자처럼 빠르게 선택해 보세요.";

  return <main className="shell">
    <header className="topbar">
      <div className="logo" aria-hidden="true"><i /><i /><i /></div>
      <div><p>BIOLOGY · INTERACTIVE LAB</p><h1>자연선택 모의실험</h1></div>
      <button className="reset" onClick={reset} type="button">↻ <span>실험 초기화</span></button>
    </header>

    <nav className="progress" aria-label={`${LAST_GENERATION}세대 중 ${generation}세대`}>
      {Array.from({ length: LAST_GENERATION }, (_, i) => i + 1).map((step) => <div className={`${step < generation ? "done" : ""} ${step === generation ? "active" : ""}`} key={step}><i>{step < generation ? "✓" : step}</i><span>{step}세대</span></div>)}
    </nav>

    <div className="workspace">
      <aside className="controls card">
        <div className="section-title"><b>01</b><span><small>실험 조건</small><strong>환경과 선택 압력</strong></span></div>
        <fieldset disabled={started}>
          <legend>배경 환경</legend>
          <div className="habitats">{HABITATS.map((item) => <button aria-pressed={habitat === item.key} className={habitat === item.key ? "selected" : ""} key={item.key} onClick={() => selectHabitat(item.key)} type="button"><i style={{ background: item.hex }} />{item.label}</button>)}</div>
        </fieldset>
        <fieldset disabled={started}>
          <legend>선택 방식</legend>
          <div className="mode-options">
            <button aria-pressed={selectionMode === "fixed"} className={selectionMode === "fixed" ? "selected" : ""} onClick={() => selectMode("fixed")} type="button"><b>10개 고정</b><small>개수 기준</small></button>
            <button aria-pressed={selectionMode === "timed"} className={selectionMode === "timed" ? "selected" : ""} onClick={() => selectMode("timed")} type="button"><b>5초 모드</b><small>시간 기준</small></button>
            <button aria-pressed={selectionMode === "tracking"} className={`tracking-option ${selectionMode === "tracking" ? "selected" : ""}`} onClick={() => selectMode("tracking")} type="button"><b>추적 모드</b><small>5초 · 움직이는 공</small></button>
          </div>
        </fieldset>
        <div className="mutation-rule"><i aria-hidden="true">↻</i><span><b>2세대 뒤 1회 변이</b><small>모든 색 약 10% → 다른 색(무작위)</small></span></div>
        {started && <p className="lock">조건을 바꾸려면 실험을 초기화하세요.</p>}
        <div className="analogy"><p>모형이 뜻하는 것</p><dl><div><dt>배경색</dt><dd>서식 환경</dd></div><div><dt>색 차이</dt><dd>개체 간 변이</dd></div><div><dt>클릭</dt><dd>포식에 의한 선택</dd></div><div><dt>2배 증가</dt><dd>생존자의 번식</dd></div></dl></div>
      </aside>

      <section className="experiment card">
        <header className="experiment-head">
          <div><small>{statusLabel}</small>
            <h2>{mainHeading}</h2>
            <p>{mainDescription}</p>
          </div>
          {phase !== "result" && <div className={`counter ${timerRunning ? "timer-active" : ""}`}>
            <span>{isTimeMode ? "남은 시간" : "선택"}</span>
            <strong>{isTimeMode ? timeLeft.toFixed(1) : removedTotal}<small>{isTimeMode ? "초" : ` / ${FIXED_REMOVE_GOAL}`}</small></strong>
            {isTimeMode && <em>{removedTotal}개 제거</em>}
          </div>}
        </header>

        {phase !== "result" ? <>
          <div className="board" style={{ backgroundColor: boardColor }} aria-label={`색깔 개체 ${candies.length}개`}>
            <div className="texture" />
            {timerRunning && <div className="timer-progress" aria-hidden="true"><i style={{ width: `${(timeLeft / activeTimeLimit) * 100}%` }} /></div>}
            {phase === "select" && mutationNotice && <div className={`mutation-toast ${timerRunning ? "with-timer" : ""}`}><b>무작위 변이 {mutationNotice.total}개</b><span>빨 {mutationNotice.bySource.red} · 노 {mutationNotice.bySource.yellow} · 초 {mutationNotice.bySource.green} · 파 {mutationNotice.bySource.blue}</span></div>}
            {candies.map((candy) => <button aria-label={`${COLORS.find((c) => c.key === candy.color)?.label} 개체 제거`} className={`candy ${candy.color} ${selectionMode === "tracking" && timerRunning ? "tracking-moving" : ""}`} disabled={phase !== "select" || (isTimeMode && !timerRunning)} key={candy.id} onClick={() => pick(candy)} style={{ left: `${candy.x}%`, top: `${candy.y}%`, width: candySize, height: candySize, transform: `translate(-50%,-50%) rotate(${candy.turn}deg) scale(${candy.scale})`, "--move-start-x": `${candy.x}%`, "--move-start-y": `${candy.y}%`, "--move-end-x": `${candy.moveX}%`, "--move-end-y": `${candy.moveY}%`, "--move-duration": `${candy.moveDuration}s`, "--move-delay": `${candy.moveDelay}s` } as CSSProperties} type="button"><i /></button>)}
            {timedReady && <div className="timer-ready-overlay"><div className={`timer-card ${selectionMode === "tracking" ? "tracking-card" : ""}`}><b>{activeTimeLimit.toFixed(1)}</b><p>{selectionMode === "tracking" ? "5초 동안 움직이는 공을 최대한 빠르게 선택하세요." : "5초 동안 보이는 공을 최대한 빠르게 선택하세요."}</p><button className="primary timer-start" onClick={startTimedSelection} type="button">{selectionMode === "tracking" ? "추적 모드 시작" : "5초 선택 시작"}</button><small>버튼을 누르는 순간 시간이 흐릅니다.</small></div></div>}
            {phase === "review" && latest && <div className="overlay"><div className="review"><b className="check">✓</b><p>{selectionMode === "tracking" ? "추적 모드 종료" : selectionMode === "timed" ? "5초 선택 종료" : "선택 완료"}</p><h3>{removedTotal}개 제거 · {total(latest.survived)}개체 생존</h3><div className="pills">{COLORS.map((color) => <span key={color.key}><i style={{ background: color.hex }} />{color.label.replace("색", "")} {latest.survived[color.key]}</span>)}</div><button className="primary" onClick={nextGeneration} type="button">{generation === LAST_GENERATION ? "최종 결과 보기" : "생존 개체 번식시키기"} →</button>{generation === 2 && <small>번식 후 모든 색 개체의 약 10%가 다른 색으로 무작위 변이합니다.</small>}</div></div>}
          </div>
          <section className="live-ratios" aria-live="polite" aria-label="현재 색상별 개체 비율">
            <header><div><small>LIVE POPULATION</small><h3>현재 개체 비율</h3></div><strong>전체 {currentTotal}개체</strong></header>
            <div className="ratio-stack" aria-hidden="true">{COLORS.map((color) => <i key={color.key} style={{ background: color.hex, width: `${currentTotal ? current[color.key] / currentTotal * 100 : 0}%` }} />)}</div>
            <div className="ratio-grid">{COLORS.map((color) => <div key={color.key}><span><i style={{ background: color.hex }} />{color.label}</span><b>{percent(current[color.key], currentTotal)}</b><small>{current[color.key]}개</small></div>)}</div>
          </section>
          <div className="board-foot"><div className="legend">{COLORS.map((color) => <span key={color.key}><i style={{ background: color.hex }} />{color.label}</span>)}</div><p>{generation === 1 && phase === "select" && removedTotal === 0 ? "초기 개체군은 색상별 10개씩, 총 40개체입니다." : timedReady ? "시작 전에는 공을 제거할 수 없습니다." : timerRunning ? `${selectionMode === "tracking" ? "5초 동안 움직이는 공" : "5초 동안 보이는 공"}을 클릭해 제거합니다. · 현재 ${removedTotal}개` : phase === "select" ? "공을 클릭할 때마다 위의 개체 비율이 즉시 바뀝니다." : `현재 전체 ${candies.length}개체`}</p></div>
        </> : <div className="results">
          <div className="summary"><div><small>가장 높은 생존 비율</small><strong><i style={{ background: dominant.hex }} />{dominant.label}</strong><span>최종 {final[dominant.key]}개 · {percent(final[dominant.key], finalTotal)}</span></div><button onClick={saveCsv} type="button">결과표 저장 ↓</button></div>
          <div className="chart"><h3>세대별 생존 개체 구성</h3><p>각 막대는 선택 직후 살아남은 개체의 색 비율입니다.</p><div className="bars">{rows.map((row) => { const sum = total(row.survived); return <div className="bar-row" key={row.generation}><b>{row.generation}세대</b><div>{COLORS.map((color) => <span key={color.key} style={{ background: color.hex, width: `${row.survived[color.key] / sum * 100}%` }}>{row.survived[color.key] / sum > .13 ? row.survived[color.key] : ""}</span>)}</div><small>{sum}개</small></div>; })}</div><div className="legend center">{COLORS.map((color) => <span key={color.key}><i style={{ background: color.hex }} />{color.label}</span>)}</div></div>
          <div className="question"><b>?</b><div><small>생각해 보기</small><h3>배경색과 비슷한 개체가 세대를 거치며 많아졌다면, 그 까닭은 무엇일까요?</h3><p>‘변이 → 선택 → 번식 → 형질의 비율 변화’ 순서로 설명해 보세요.</p></div><button className="primary" onClick={reset} type="button">다시 실험하기</button></div>
        </div>}
      </section>
    </div>

    <section className="records card">
      <button className="records-head" onClick={() => setTableOpen((value) => !value)} type="button"><b>02</b><span><small>실험 기록</small><strong>세대별 결과표</strong></span><i>{tableOpen ? "−" : "+"}</i></button>
      {tableOpen && <div className="table-wrap"><table><thead><tr><th>세대</th><th>단계</th>{COLORS.map((color) => <th key={color.key}><i style={{ background: color.hex }} />{color.label}</th>)}<th>전체</th></tr></thead><tbody>
        {Array.from({ length: LAST_GENERATION }, (_, i) => i + 1).flatMap((step) => {
          const row = rows.find((item) => item.generation === step);
          const showFinalRatio = step === LAST_GENERATION && phase === "result" && Boolean(row);
          const items = [<tr className={step === generation && phase !== "result" ? "current" : ""} key={`${step}-s`}><th rowSpan={step < LAST_GENERATION || showFinalRatio ? 2 : 1}>{step}세대</th><td>선택 후 생존</td>{COLORS.map((color) => <td key={color.key}>{row ? row.survived[color.key] : "—"}</td>)}<td>{row ? total(row.survived) : "—"}</td></tr>];
          if (step < LAST_GENERATION) items.push(<tr className="offspring" key={`${step}-o`}><td>{row?.mutation ? `번식 후 · 무작위 변이 ${row.mutation.total}개` : "번식 후 ×2"}</td>{COLORS.map((color) => <td key={color.key}>{row?.offspring ? row.offspring[color.key] : "—"}</td>)}<td>{row?.offspring ? total(row.offspring) : "—"}</td></tr>);
          if (showFinalRatio && row) items.push(<tr className="final-ratio" key={`${step}-ratio`}><td>최종 비율</td>{COLORS.map((color) => <td key={color.key}>{percent(row.survived[color.key], total(row.survived))}</td>)}<td>100.0%</td></tr>);
          return items;
        })}
      </tbody></table></div>}
    </section>
    <footer>이 모형에서는 2세대 번식 후 한 번만, 모든 색 개체의 약 10%가 다른 색으로 무작위 변이합니다. 변이는 환경의 필요에 따라 생기지 않습니다.</footer>
  </main>;
}
