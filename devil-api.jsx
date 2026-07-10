// devil-api.jsx
// Client-side bridge to the "악마의 변호인" backend. Sends the plan draft +
// mode to /api/judge (a Vercel serverless function that holds the Gemini
// API key and the grading system prompt), then normalizes the response into
// the shape ResultScreen/StatusCard expect.

(function () {
  const LABELS = { problem: '문제 정의', target: '대상 정의', solution: '해결 방식' };

  // Normalize the backend's JSON into the shape ResultScreen/StatusCard expect.
  // Returns { kind: 'result', data } | { kind: 'edge', message } | throws.
  function normalize(parsed) {
    if (parsed && typeof parsed.systemMessage === 'string') {
      return { kind: 'edge', message: parsed.systemMessage };
    }
    if (!parsed || !parsed.status || !parsed.feedback) {
      throw new Error('예상하지 못한 응답 형식입니다.');
    }
    const feedback = {};
    for (const axis of ['problem', 'target', 'solution']) {
      const fb = parsed.feedback[axis] || {};
      feedback[axis] = {
        label: LABELS[axis],
        status: parsed.status[axis] || 'yellow',
        reaction: fb.reason || '',
        question: fb.question || '',
      };
    }
    const emoji = parsed.mode === 'hard' ? '🔥 ' : '⚡ ';
    const modeLabel = parsed.modeLabel
      ? (parsed.modeLabel.startsWith('🔥') || parsed.modeLabel.startsWith('⚡')
          ? parsed.modeLabel
          : emoji + parsed.modeLabel)
      : (emoji + (parsed.mode === 'hard' ? '빡센 검증' : '기본 검증'));

    return {
      kind: 'result',
      data: {
        mode: parsed.mode,
        modeLabel,
        devilComment: parsed.devilComment || '',
        status: parsed.status,
        feedback,
        defaultTab: parsed.defaultTab || 'problem',
        closingMessage: parsed.closingMessage || '',
      },
    };
  }

  // PUBLIC: callDevilAdvocate(draft, mode, fileName)
  // Calls the /api/judge backend. Throws on network/HTTP/parse failure —
  // caller should show an error state, not silently fall back to fake data.
  async function callDevilAdvocate(draft, mode, fileName) {
    const text = (draft || '').trim();
    const effective = text || (fileName ? `[첨부 파일: ${fileName} — 본문 텍스트 없음]` : '');

    const res = await fetch('/api/judge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft: effective || '(내용 없음)',
        mode: mode === 'hard' ? 'hard' : 'normal',
      }),
    });

    let parsed;
    try {
      parsed = await res.json();
    } catch (e) {
      throw new Error('서버 응답을 읽을 수 없습니다.');
    }

    if (!res.ok) {
      throw new Error((parsed && parsed.error) || `서버 오류 (${res.status})`);
    }

    return normalize(parsed);
  }

  window.callDevilAdvocate = callDevilAdvocate;
})();
