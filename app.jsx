// Top-level app — manages screen state and Tweaks.

const { useState: useApS, useEffect: useApE } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#b8453d",
  "characterSize": 150,
  "loadingMs": 2200,
  "showBrandTag": true
}/*EDITMODE-END*/;

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [screen, setScreen] = useApS('input'); // 'input' | 'loading' | 'result'
  const [submission, setSubmission] = useApS(null);
  const [result, setResult] = useApS(null);

  const handleSubmit = (payload) => {
    setSubmission(payload);
    // Run the heuristic simulator with the user's draft + mode.
    const sim = window.simulateValidation(
      payload.draft, payload.mode, payload.fileName
    );
    setResult(sim);
    setScreen('loading');
  };

  useApE(() => {
    if (screen !== 'loading') return;
    const id = setTimeout(() => setScreen('result'), t.loadingMs);
    return () => clearTimeout(id);
  }, [screen, t.loadingMs]);

  const handleRetry = () => setScreen('input');

  return (
    <div data-screen-label={
      screen === 'input' ? '01 Input' :
      screen === 'loading' ? '02 Validating' : '03 Result'
    }>
      {screen === 'input' && (
        <InputScreen
          onSubmit={handleSubmit}
          characterSize={t.characterSize}
          accent={t.accent}
        />
      )}
      {screen === 'loading' && (
        <LoadingScreen
          characterSize={Math.round(t.characterSize * 0.9)}
          accent={t.accent}
        />
      )}
      {screen === 'result' && (
        <ResultScreen
          data={result || SAMPLE_RESULT}
          submission={submission}
          onRetry={handleRetry}
          accent={t.accent}
        />
      )}

      {/* dev-only screen switcher, lives bottom-left so it's not in the way */}
      <div style={{
        position: 'fixed', left: 14, bottom: 14, zIndex: 50,
        display: 'flex', gap: 6,
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
        border: '1px solid var(--line)',
        borderRadius: 10,
        padding: 4,
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 11,
      }}>
        {[
          ['input',   '01 입력'],
          ['loading', '02 검증'],
          ['result',  '03 결과'],
        ].map(([k, label]) => (
          <button
            key={k}
            onClick={() => setScreen(k)}
            style={{
              padding: '5px 10px',
              border: 'none',
              borderRadius: 6,
              background: screen === k ? 'var(--ink)' : 'transparent',
              color: screen === k ? '#fff' : 'var(--ink-2)',
              cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 11,
              fontWeight: 500,
            }}
          >{label}</button>
        ))}
      </div>

      <TweaksPanel title="Tweaks">
        <TweakSection label="Theme" />
        <TweakColor
          label="강조색"
          value={t.accent}
          options={['#b8453d', '#a83a3a', '#c1645a', '#8b3a3a', '#7a3fbf', '#1a1a1a']}
          onChange={(v) => setTweak('accent', v)}
        />
        <TweakSection label="Character" />
        <TweakSlider
          label="입력 화면 캐릭터 크기"
          value={t.characterSize}
          min={100} max={220} step={10} unit="px"
          onChange={(v) => setTweak('characterSize', v)}
        />
        <TweakSection label="Flow" />
        <TweakSlider
          label="검증 대기 시간"
          value={t.loadingMs}
          min={800} max={4000} step={200} unit="ms"
          onChange={(v) => setTweak('loadingMs', v)}
        />
      </TweaksPanel>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
