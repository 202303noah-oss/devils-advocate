// Three screens: Input → Loading → Result
// Plus the sample data used by Result.

const { useState: useS, useEffect: useE, useMemo: useM } = React;

// ─────────────────────────────────────────────────────────────────────────────
// SAMPLE DATA
// ─────────────────────────────────────────────────────────────────────────────
const SAMPLE_RESULT = {
  mode: "hard",
  modeLabel: "🔥 빡센 검증",
  devilComment: "방향은 보입니다. 하지만 이 정도 설명으로는 부족합니다.",
  status: { problem: "yellow", target: "red", solution: "yellow" },
  feedback: {
    problem: {
      label: "문제 정의",
      status: "yellow",
      reaction: "방향은 보이지만 아직 설득되진 않습니다.",
      reason: "“경험 부족”이라는 표현만으로는 부족합니다.",
      question: "이 문제가 교육으로 다룰 수 있는 지식 또는 스킬 부족인지 더 명확히 설명해보세요.",
    },
    target: {
      label: "대상 정의",
      status: "red",
      reaction: "이 설명으로는 넘기기 어렵습니다.",
      reason: "모든 스타트업의 마케터들이 전부 같은 문제를 겪는 건 아니겠지요?",
      question: "이 교육이 필요한 마케터의 유형을 더 구체적으로 설명해보세요.",
    },
    solution: {
      label: "해결 방식",
      status: "yellow",
      reaction: "지금 상태로는 설득력이 부족합니다.",
      reason: "왜 프로젝트형 교육을 선택했는지 설명이 약합니다.",
      question: "이 교육 방식을 선택한 이유, 즉 이 방식이 효과적이라고 판단한 근거를 설명해보세요.",
    },
  },
  defaultTab: "target",
  closingMessage: "설득될 때까지 다시 작성해보세요.",
};

const STATUS_META = {
  green:  { dot: '🟢', label: '통과',          color: 'var(--green)',  bg: 'var(--green-bg)',  word: '통과' },
  yellow: { dot: '🟡', label: '보완 필요',     color: 'var(--yellow)', bg: 'var(--yellow-bg)', word: '보완 필요' },
  red:    { dot: '🔴', label: '다시 생각 필요', color: 'var(--red)',    bg: 'var(--red-bg)',    word: '다시 생각 필요' },
};

window.SAMPLE_RESULT = SAMPLE_RESULT;
window.STATUS_META = STATUS_META;

// ─────────────────────────────────────────────────────────────────────────────
// SHARED PRIMITIVES
// ─────────────────────────────────────────────────────────────────────────────
function Shell({ children, maxWidth = 720 }) {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      padding: '40px 24px 96px',
    }}>
      <div style={{ width: '100%', maxWidth }}>{children}</div>
    </div>
  );
}

// Small "DEV LOGO" header — keeps brand without clutter.
function BrandTag() {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      color: 'var(--ink-3)',
      fontFamily: 'JetBrains Mono, ui-monospace, monospace',
      fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase',
    }}>
      <span style={{
        display: 'inline-block', width: 6, height: 6, background: 'var(--devil)',
        boxShadow: '0 0 0 2px #fff, 0 0 0 3px var(--devil)',
        borderRadius: 1,
      }} />
      <span>Devil&apos;s Advocate · 4주차</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INPUT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function InputScreen({ onSubmit, characterSize, accent }) {
  const [draft, setDraft] = useS("");
  const [mode, setMode] = useS('hard');
  const [fileName, setFileName] = useS(null);
  const [dragOver, setDragOver] = useS(false);

  const canSubmit = draft.trim().length > 0 || !!fileName;

  return (
    <Shell>
      {/* HERO — centered, compact */}
      <div style={{ textAlign: 'center' }}>
        {/* character + speech bubble */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          marginTop: 12,
          marginBottom: 8,
        }}>
          <Character size={characterSize} state="static" />

          {/* speech bubble — sits to the right of the character, tail points left */}
          <div className="anim-fade-up" style={{
            position: 'absolute',
            left: `calc(100% - 8px)`,
            top: '22%',
            transform: 'translateX(0)',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 14,
            padding: '10px 14px',
            fontSize: 13.5,
            lineHeight: 1.5,
            color: 'var(--ink-2)',
            fontFamily: "'Gowun Dodum', 'Pretendard', system-ui, sans-serif",
            textAlign: 'left',
            whiteSpace: 'nowrap',
            boxShadow: '0 6px 18px -10px rgba(40,30,10,0.18)',
            zIndex: 2,
          }}>
            {/* tail — two triangles for the border effect */}
            <span aria-hidden="true" style={{
              position: 'absolute',
              left: -8, top: 14,
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '8px solid var(--line)',
            }} />
            <span aria-hidden="true" style={{
              position: 'absolute',
              left: -7, top: 14,
              width: 0, height: 0,
              borderTop: '7px solid transparent',
              borderBottom: '7px solid transparent',
              borderRight: '8px solid #fff',
            }} />
            문제, 대상, 해결…<br />
            이건 기본이지.
          </div>
        </div>

        {/* character byline as a soft pill */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
          <span className="anim-fade-up" style={{
            padding: '8px 16px',
            borderRadius: 999,
            background: `${accent}14`,
            fontSize: 14,
            fontWeight: 700,
            letterSpacing: '-0.005em',
            color: accent,
            whiteSpace: 'nowrap',
          }}>
            악마의 변호인
          </span>
        </div>

        {/* main title — conversational */}
        <h1 className="anim-fade-up" style={{
          margin: '0 0 56px',
          fontSize: 30, lineHeight: 1.35, fontWeight: 700,
          letterSpacing: '-0.005em',
          color: 'var(--ink)',
          fontFamily: "'Gowun Dodum', 'Pretendard', system-ui, sans-serif",
        }}>
          이 기획… 통과할 수 있을까?
        </h1>
      </div>

      {/* INPUT GROUP — left-aligned, textarea + file attach as one block */}
      <div className="anim-fade-up" style={{
        background: '#fff',
        border: '1.5px solid var(--line)',
        borderRadius: 12,
        overflow: 'hidden',
        transition: 'border-color .15s, box-shadow .15s',
      }}
        onFocusCapture={(e) => {
          e.currentTarget.style.borderColor = accent;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${accent}22`;
        }}
        onBlurCapture={(e) => {
          e.currentTarget.style.borderColor = 'var(--line)';
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <textarea
          id="draft"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={"여기에 작성한 기획 초안을 입력하거나, 아래에서 파일을 첨부하세요."}
          rows={6}
          style={{
            width: '100%',
            display: 'block',
            padding: '20px 20px 12px',
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--ink)',
            fontSize: 17,
            lineHeight: 1.7,
            resize: 'none',
            fontFamily: 'inherit',
          }}
        />

        {/* file attach row — in the same input group */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const f = e.dataTransfer.files?.[0];
            if (f) setFileName(f.name);
          }}
          style={{
            borderTop: '1px solid var(--line-soft)',
            background: dragOver ? `${accent}10` : '#fcfaf5',
            padding: '12px 16px 12px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            transition: 'background .15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <PaperclipIcon color="var(--ink-3)" size={14} />
            <div style={{ minWidth: 0 }}>
              <span style={{
                fontSize: 14, color: 'var(--ink-2)', fontWeight: 500,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {fileName ? fileName : '파일 첨부'}
              </span>
              {!fileName && (
                <span style={{
                  marginLeft: 10,
                  fontSize: 12, color: 'var(--ink-3)',
                  fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                }}>
                  PDF · DOCX · TXT · HWP
                </span>
              )}
            </div>
          </div>
          <label style={{
            flex: 'none',
            fontSize: 13, fontWeight: 600,
            padding: '6px 12px', borderRadius: 7,
            border: '1px solid var(--line)', background: '#fff', cursor: 'pointer',
            color: 'var(--ink-2)',
          }}>
            파일 선택
            <input type="file" accept=".pdf,.docx,.txt,.hwp"
              style={{ display: 'none' }}
              onChange={(e) => setFileName(e.target.files?.[0]?.name || null)} />
          </label>
        </div>
      </div>

      {/* MODE PICKER — left-aligned section */}
      <div style={{ marginTop: 48 }}>
        <div style={{
          fontSize: 14, fontWeight: 700, color: 'var(--ink-2)',
          marginBottom: 12, letterSpacing: '0.01em',
          textTransform: 'uppercase', fontFamily: 'JetBrains Mono, monospace',
        }}>
          얼마나 까다롭게 볼까요?
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <ModeCard
            active={mode === 'hard'} onClick={() => setMode('hard')}
            emoji="🔥" title="빡센 검증" subtitle="끝까지 물고 늘어집니다"
            hint="HARD" accent={accent}
          />
          <ModeCard
            active={mode === 'normal'} onClick={() => setMode('normal')}
            emoji="⚡" title="기본 검증" subtitle="핵심만 짚고 넘어갑니다"
            hint="NORMAL" accent={accent}
          />
        </div>
      </div>

      {/* CTA — wide, tall, high contrast */}
      <button
        disabled={!canSubmit}
        onClick={() => onSubmit({ draft, mode, fileName })}
        style={{
          marginTop: 56,
          width: '100%',
          padding: '20px 20px',
          border: 'none',
          borderRadius: 14,
          background: canSubmit ? 'var(--ink)' : '#d8cdb7',
          color: '#fff',
          fontSize: 17,
          fontWeight: 700,
          letterSpacing: '-0.005em',
          transition: 'transform .12s, background .15s, box-shadow .15s',
          cursor: canSubmit ? 'pointer' : 'not-allowed',
          boxShadow: canSubmit
            ? '0 14px 32px -14px rgba(31, 26, 20, 0.45), 0 2px 0 rgba(0,0,0,0.06) inset'
            : 'none',
        }}
        onMouseEnter={(e) => {
          if (canSubmit) e.currentTarget.style.background = accent;
        }}
        onMouseLeave={(e) => {
          if (canSubmit) e.currentTarget.style.background = 'var(--ink)';
          e.currentTarget.style.transform = 'scale(1)';
        }}
        onMouseDown={(e) => canSubmit && (e.currentTarget.style.transform = 'scale(0.985)')}
        onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        기획 깨기 시작 →
      </button>

      <p style={{
        marginTop: 24, textAlign: 'center', fontSize: 11, color: 'var(--ink-3)',
        fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em',
        opacity: 0.6,
      }}>
        SAMPLE DATA
      </p>
    </Shell>
  );
}

function ModeCard({ active, onClick, emoji, title, subtitle, hint, accent }) {
  const [hover, setHover] = useS(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        textAlign: 'left',
        padding: '18px 18px',
        borderRadius: 12,
        border: active ? `1.5px solid ${accent}` : `1px solid ${hover ? 'var(--ink-3)' : 'var(--line)'}`,
        background: active ? `${accent}0e` : '#fff',
        cursor: 'pointer',
        transition: 'all .15s',
        position: 'relative',
        boxShadow: active ? `0 6px 18px -12px ${accent}99` : (hover ? '0 2px 8px -4px rgba(40,30,10,0.12)' : 'none'),
        transform: hover && !active ? 'translateY(-1px)' : 'translateY(0)',
        minHeight: 116,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 22, lineHeight: 1 }}>{emoji}</span>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 10.5, fontWeight: 700,
          color: active ? accent : 'var(--ink-3)',
          letterSpacing: '0.14em',
          padding: '3px 8px', borderRadius: 999,
          background: active ? `${accent}15` : 'transparent',
          border: `1px solid ${active ? accent + '33' : 'var(--line)'}`,
        }}>{hint}</span>
      </div>
      <div style={{
        marginTop: 14, fontSize: 17, fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-0.005em',
      }}>
        {title}
      </div>
      <div style={{ marginTop: 4, fontSize: 14, color: 'var(--ink-2)', lineHeight: 1.45 }}>
        {subtitle}
      </div>
    </button>
  );
}

function PaperclipIcon({ color = 'currentColor', size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color}
      strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/>
    </svg>
  );
}

window.InputScreen = InputScreen;

// ─────────────────────────────────────────────────────────────────────────────
// LOADING SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function LoadingScreen({ characterSize, accent }) {
  const steps = [
    '기획 초안 읽는 중…',
    '문제 정의 깨보는 중…',
    '대상 정의 따져보는 중…',
    '해결 방식 의심하는 중…',
  ];
  const [stepIdx, setStepIdx] = useS(0);

  useE(() => {
    const id = setInterval(() => {
      setStepIdx((i) => (i + 1) % steps.length);
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <Shell>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: 56,
      }}>
        <Character size={characterSize} state="spin" />

        <h2 style={{
          marginTop: 32,
          fontSize: 26, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>
          기획 깨는 중…
        </h2>

        <p style={{
          marginTop: 8, fontSize: 16, color: 'var(--ink-2)',
          fontFamily: 'Gowun Dodum, IBM Plex Sans KR, sans-serif',
        }}>
          흠… 이건 그냥 못 넘기겠는데?
        </p>

        {/* step ticker */}
        <div style={{
          marginTop: 32,
          width: '100%',
          maxWidth: 360,
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 12,
          padding: '14px 16px',
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 12.5,
          color: 'var(--ink-2)',
        }}>
          {steps.map((s, i) => {
            const done = i < stepIdx;
            const cur = i === stepIdx;
            return (
              <div key={s} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '4px 0',
                opacity: done ? 0.45 : 1,
                color: cur ? accent : 'var(--ink-2)',
                fontWeight: cur ? 600 : 400,
              }}>
                <span style={{
                  width: 8, height: 8, borderRadius: 999,
                  background: cur ? accent : (done ? 'var(--ink-3)' : 'var(--line)'),
                  animation: cur ? 'pulse-dot 1s ease-in-out infinite' : 'none',
                }} />
                <span>{s}</span>
              </div>
            );
          })}
        </div>
      </div>
    </Shell>
  );
}

window.LoadingScreen = LoadingScreen;

// ─────────────────────────────────────────────────────────────────────
// EDGE SCREEN — draft was too thin / off-topic / unreadable for the API
// to grade. Not an error — the model's own judgment call.
// ────────────────────────────────────────────────────────────────
function EdgeScreen({ message, onRetry, characterSize, accent }) {
  return (
    <Shell>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: 56, textAlign: 'center',
      }}>
        <Character size={characterSize} state="static" />

        <h2 style={{
          marginTop: 28,
          fontSize: 24, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>
          잠깐만요, 판단이 안 되네요
        </h2>

        <div style={{
          marginTop: 18,
          maxWidth: 420,
          padding: '16px 20px',
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderRadius: 14,
          fontSize: 16,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          fontFamily: 'Gowun Dodum, IBM Plex Sans KR, sans-serif',
        }}>
          {message}
        </div>

        <button
          onClick={onRetry}
          style={{
            marginTop: 28,
            padding: '14px 28px',
            border: 'none',
            borderRadius: 12,
            background: 'var(--ink)',
            color: '#fff',
            fontSize: 15.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↺ 다시 작성하기
        </button>
      </div>
    </Shell>
  );
}

window.EdgeScreen = EdgeScreen;

// ─────────────────────────────────────────────────────────────────────
// ERROR SCREEN — the API call itself failed (network, parsing, rate limit).
// ────────────────────────────────────────────────────────────────
function ErrorScreen({ message, onRetry, characterSize, accent }) {
  return (
    <Shell>
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        marginTop: 56, textAlign: 'center',
      }}>
        <Character size={characterSize} state="static" />

        <h2 style={{
          marginTop: 28,
          fontSize: 24, fontWeight: 700, color: 'var(--ink)',
          letterSpacing: '-0.01em',
        }}>
          검증을 불러오지 못했어요
        </h2>

        <div style={{
          marginTop: 18,
          maxWidth: 420,
          padding: '16px 20px',
          background: 'var(--red-bg)',
          border: '1px solid var(--red)',
          borderRadius: 14,
          fontSize: 14.5,
          lineHeight: 1.5,
          color: 'var(--ink-2)',
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          {message}
        </div>

        <button
          onClick={onRetry}
          style={{
            marginTop: 28,
            padding: '14px 28px',
            border: 'none',
            borderRadius: 12,
            background: accent,
            color: '#fff',
            fontSize: 15.5,
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          ↺ 다시 시도
        </button>
      </div>
    </Shell>
  );
}

window.ErrorScreen = ErrorScreen;

// ─────────────────────────────────────────────────────────────────────────────
// RESULT SCREEN
// ─────────────────────────────────────────────────────────────────────────────
function ResultScreen({ data, submission, onRetry, accent }) {
  const [tab, setTab] = useS(data.defaultTab || 'problem');
  const current = data.feedback[tab];
  const meta = STATUS_META[current.status];

  return (
    <Shell maxWidth={680}>
      {/* header: small character + status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, marginTop: 12 }}>
        <div style={{
          width: 64, height: 64, borderRadius: 16,
          background: 'var(--bg-deep)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden', flex: 'none',
          padding: 6,
        }}>
          <Character size={52} state="static" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4,
          }}>
            <span style={{
              fontSize: 11, color: 'var(--ink-3)',
              fontFamily: 'JetBrains Mono, monospace',
              letterSpacing: '0.1em', textTransform: 'uppercase',
              whiteSpace: 'nowrap',
            }}>
              악마의 변호를 시작합니다
            </span>
            <span style={{
              padding: '2px 8px', borderRadius: 999,
              background: '#fff', border: '1px solid var(--line)',
              fontSize: 11, fontWeight: 600, color: 'var(--ink-2)',
              whiteSpace: 'nowrap',
            }}>{data.modeLabel}</span>
          </div>
          <div style={{
            fontSize: 18, color: 'var(--ink)',
            fontWeight: 600, lineHeight: 1.4,
            letterSpacing: '-0.005em',
          }}>
            {data.devilComment}
          </div>
        </div>
      </div>

      {/* section label */}
      <div style={{
        fontSize: 18, fontWeight: 700, color: 'var(--ink)',
        marginBottom: 14, letterSpacing: '-0.005em',
      }}>
        기획 상태
      </div>

      {/* traffic-light tab cards */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 12, marginBottom: 22,
      }}>
        {['problem', 'target', 'solution'].map((key) => (
          <StatusCard
            key={key}
            label={data.feedback[key].label}
            status={data.status[key]}
            active={tab === key}
            onClick={() => setTab(key)}
            accent={accent}
          />
        ))}
      </div>

      {/* feedback panel */}
      <div
        key={tab}
        className="anim-fade-up"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--line)',
          borderTop: `3px solid ${meta.color}`,
          borderRadius: 16,
          padding: '24px 26px 26px',
          boxShadow: '0 1px 0 #fff inset, 0 12px 32px -22px rgba(40,30,10,0.2)',
        }}
      >
        {/* meta row — label + status, kept small so the message below wins attention */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginBottom: 14,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              width: 10, height: 10, borderRadius: '50%',
              background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.5), rgba(255,255,255,0) 55%), ${meta.color}`,
              display: 'inline-block',
            }} />
            <span style={{
              fontSize: 13, fontWeight: 600, color: 'var(--ink-2)',
              letterSpacing: '0.005em',
            }}>
              {current.label}
            </span>
            <span style={{
              fontSize: 11.5, fontWeight: 600,
              padding: '3px 9px', borderRadius: 999,
              color: meta.color, background: meta.bg,
              border: `1px solid ${meta.color}33`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>
              {meta.word}
            </span>
          </div>
        </div>

        {/* (1) user's own input excerpt — muted backdrop */}
        <UserExcerpt submission={submission} accent={accent} />

        {/* (2) devil's actual line — the headline */}
        <div style={{
          margin: '18px 0 4px',
          padding: '20px 22px 16px',
          background: `${accent}0e`,
          border: `1px solid ${accent}22`,
          borderRadius: 14,
          position: 'relative',
        }}>
          {/* tiny muted attribution — demoted */}
          <div style={{
            fontSize: 10.5,
            color: 'var(--ink-3)',
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: '0.1em',
            marginBottom: 6,
            opacity: 0.75,
          }}>
            devil
          </div>
          <div style={{
            fontSize: 19,
            lineHeight: 1.5,
            fontWeight: 600,
            color: accent,
            letterSpacing: '-0.005em',
            fontFamily: 'IBM Plex Sans KR, Pretendard, system-ui, sans-serif',
          }}>
            {current.reaction}
          </div>
        </div>

        {/* (3) question — the reaction bubble above already carries the
           full reasoning, so we don't repeat it in a second row */}
        <FeedbackRow
          marker="설득 질문"
          accent={accent}
          text={current.question}
          strong
        />

        <button
          onClick={onRetry}
          style={{
            marginTop: 26, width: '100%',
            padding: '15px 16px',
            border: 'none',
            borderRadius: 12,
            background: 'var(--ink)',
            color: '#fff',
            fontSize: 16,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'transform .12s',
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          ↺ 수정해서 다시 검증
        </button>
      </div>

      <p style={{
        marginTop: 22, textAlign: 'center', fontSize: 14,
        color: 'var(--ink-2)',
        fontFamily: 'Gowun Dodum, IBM Plex Sans KR, sans-serif',
      }}>
        {data.closingMessage}
      </p>
    </Shell>
  );
}

function StatusCard({ label, status, active, onClick, accent }) {
  const meta = STATUS_META[status];
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '22px 14px 18px',
        background: active ? '#fff' : '#fcfaf5',
        border: active ? `1.5px solid ${accent}` : '1px solid var(--line)',
        borderRadius: 16,
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all .15s',
        boxShadow: active ? '0 10px 28px -18px rgba(40, 30, 10, 0.35)' : 'none',
        transform: active ? 'translateY(-2px)' : 'translateY(0)',
      }}
    >
      {/* active indicator notch */}
      {active && (
        <span style={{
          position: 'absolute', top: -1, left: '50%',
          transform: 'translateX(-50%)',
          width: 28, height: 3,
          background: accent,
          borderRadius: '0 0 4px 4px',
        }} />
      )}

      {/* solid traffic-light disc — no ring, no tinted backdrop */}
      <div style={{
        width: 48, height: 48, margin: '0 auto',
        borderRadius: '50%',
        background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.55), rgba(255,255,255,0) 55%), ${meta.color}`,
        boxShadow: `0 6px 14px -6px ${meta.color}88, inset 0 -3px 6px rgba(0,0,0,0.12)`,
      }} />

      <div style={{
        marginTop: 14,
        fontSize: 16, fontWeight: 700, color: 'var(--ink)',
        letterSpacing: '-0.005em',
      }}>
        {label}
      </div>
      <div style={{
        marginTop: 4, fontSize: 13,
        color: meta.color, fontWeight: 600,
      }}>
        {meta.word}
      </div>
    </button>
  );
}

// UserExcerpt — collapsible block showing what the user submitted, so the
// devil's reaction is read with their own draft fresh on screen.
function UserExcerpt({ submission, accent }) {
  const [expanded, setExpanded] = useS(false);

  const draft = ((submission && submission.draft) || '').trim();
  const fileName = submission && submission.fileName;

  // Nothing to show — don't render an empty block.
  if (!draft && !fileName) return null;

  const CHAR_LIMIT = 110;
  const isLong = draft.length > CHAR_LIMIT;
  const visibleDraft = expanded || !isLong
    ? draft
    : draft.slice(0, CHAR_LIMIT).trimEnd() + '…';

  return (
    <div style={{
      padding: '12px 14px',
      background: 'var(--bg-deep)',
      border: '1px solid var(--line-soft)',
      borderRadius: 12,
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: draft ? 6 : 0,
      }}>
        <span style={{
          fontSize: 11, color: 'var(--ink-3)',
          fontFamily: 'JetBrains Mono, monospace',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}>
          내 입력
        </span>
        {fileName && (
          <span style={{
            fontSize: 11, color: 'var(--ink-3)',
            fontFamily: 'JetBrains Mono, monospace',
            maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            📎 {fileName}
          </span>
        )}
      </div>
      {draft && (
        <div style={{
          fontSize: 13.5,
          lineHeight: 1.55,
          color: 'var(--ink-2)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}>
          {visibleDraft}
          {isLong && (
            <button
              onClick={() => setExpanded((v) => !v)}
              style={{
                marginLeft: 6,
                padding: 0,
                background: 'transparent',
                border: 'none',
                color: accent,
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {expanded ? '접기' : '더 보기'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function FeedbackRow({ marker, text, accent, strong }) {
  return (
    <div style={{
      display: 'flex', gap: 14, marginTop: 18,
      alignItems: 'flex-start',
    }}>
      <div style={{
        flex: 'none',
        width: 86,
        paddingTop: 2,
        fontSize: 13, fontWeight: 600,
        color: accent,
        fontFamily: 'JetBrains Mono, monospace',
        letterSpacing: '0.04em',
      }}>
        → {marker}
      </div>
      <div style={{
        flex: 1,
        fontSize: 16,
        lineHeight: 1.6,
        color: strong ? 'var(--ink)' : 'var(--ink-2)',
        fontWeight: strong ? 500 : 400,
      }}>
        {text}
      </div>
    </div>
  );
}

window.ResultScreen = ResultScreen;
