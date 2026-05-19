// simulate.jsx
// Heuristic, offline "devil's advocate" simulator.
// Given a raw plan draft + mode (hard|normal), returns a result object
// in the same shape as SAMPLE_RESULT so ResultScreen can render it.
//
// This is NOT an LLM — it's keyword-driven so behavior is predictable
// while we're still on sample data.

(function () {
  // ────────────────────────────────────────────────────────────────────────
  // Heuristic vocabulary. Each axis (problem / target / solution) has:
  //   • signals : phrases that, if mentioned in the draft, *raise* clarity
  //   • smells  : vague phrases that, if mentioned, *lower* clarity
  //
  // The scoring is intentionally simple: signals - smells. A higher score
  // means the draft is more specific on that axis.
  // ────────────────────────────────────────────────────────────────────────
  const AXES = {
    problem: {
      signals: [
        '문제는', '문제점은', '구체적으로', '데이터', '%', '비율',
        '인터뷰', '설문', '관찰', '현장에서', '사례', '경험상',
        '리텐션', '전환율', 'CAC', 'LTV', 'NPS', '이탈',
      ],
      smells: [
        '경험 부족', '잘 모름', '잘 못함', '부족합니다', '어려움이 있',
        '문제가 많', '잘 안', '잘 모르', '여러 가지',
      ],
    },
    target: {
      signals: [
        '예를 들어', '구체적으로', '~ 이상', '~ 미만',
        '1~3년차', '2~5년차', '주니어', '시니어', '리드',
        'B2B', 'B2C', 'SaaS', '커머스', '핀테크', '에듀테크',
        '월 매출', '직원 수', '시드', '시리즈',
      ],
      smells: [
        '모든', '전부', '모두', '누구나', '일반적인', '많은',
        '대부분의', '스타트업', '마케터', '직장인', '사람들',
      ],
    },
    solution: {
      signals: [
        '왜냐하면', '근거', '효과적', '검증', '레퍼런스',
        '연구', '논문', '커리큘럼', '4주', '6주', '8주', '12주',
        '실습', '과제', '피드백', '코칭', '1:1', 'PT',
        '기대 성과', 'KPI', '결과물', '아웃풋',
      ],
      smells: [
        '프로젝트형', '워크숍', '온라인', '오프라인', '강의',
        '교육', '학습', '커뮤니티', '도와', '돕습니다',
      ],
    },
  };

  // Reaction copy buckets — one for each (status, mode) combination.
  // Pulled at random for variety. Hard tone is sharper.
  const REACTIONS = {
    green: {
      hard: [
        '여기는 넘어가도 되겠네요.',
        '꽤 단단합니다. 다음.',
      ],
      normal: [
        '이 부분은 명확합니다.',
        '괜찮네요. 다음으로 갑시다.',
      ],
    },
    yellow: {
      hard: [
        '방향은 보이지만 아직 설득되진 않습니다.',
        '지금 상태로는 설득력이 부족합니다.',
        '괜찮아 보이지만, 이대로는 못 넘기겠는데요.',
      ],
      normal: [
        '방향은 좋은데 살짝 모자랍니다.',
        '조금만 더 구체적이면 좋겠어요.',
        '여기, 한 번만 더 짚어볼까요?',
      ],
    },
    red: {
      hard: [
        '이 설명으로는 넘기기 어렵습니다.',
        '음… 이건 그냥은 못 넘기겠는데요?',
        '여기, 다시 가야 합니다.',
      ],
      normal: [
        '이 부분은 다시 생각해봐야 할 것 같아요.',
        '여기는 좀 더 풀어주셔야겠어요.',
      ],
    },
  };

  // Per-axis canned "이유" copy — picks the snarkiest one whose trigger
  // keyword appears in the draft, otherwise a generic fallback.
  const REASONS = {
    problem: [
      { trigger: ['경험 부족', '잘 모름', '잘 못함'],
        text: '“경험 부족”이라는 표현만으로는 부족합니다.' },
      { trigger: ['어려움이 있', '문제가 많'],
        text: '어떤 어려움인지가 빠져 있습니다. 듣는 사람이 그려지지 않아요.' },
      { trigger: [],
        text: '문제가 일반론처럼 들립니다. 진짜 누가, 언제 겪는지가 보이지 않아요.' },
    ],
    target: [
      { trigger: ['모든', '전부', '모두', '누구나'],
        text: '모든 스타트업의 마케터들이 전부 같은 문제를 겪는 건 아니겠지요?' },
      { trigger: ['마케터', '직장인', '사람들'],
        text: '대상이 너무 넓습니다. 어떤 마케터인지가 빠져 있어요.' },
      { trigger: [],
        text: '대상이 추상적입니다. 한 명을 떠올릴 수 있을 만큼 좁혀지지 않았어요.' },
    ],
    solution: [
      { trigger: ['프로젝트형'],
        text: '왜 프로젝트형 교육을 선택했는지 설명이 약합니다.' },
      { trigger: ['워크숍', '강의', '교육', '학습'],
        text: '이 형태가 왜 효과적인지에 대한 근거가 빠져 있습니다.' },
      { trigger: [],
        text: '해결 방식의 근거가 약합니다. 왜 이 방식이어야 하나요?' },
    ],
  };

  const QUESTIONS = {
    problem: '이 문제가 교육으로 다룰 수 있는 지식 또는 스킬 부족인지 더 명확히 설명해보세요.',
    target:  '이 교육이 필요한 마케터의 유형을 더 구체적으로 설명해보세요.',
    solution:'이 교육 방식을 선택한 이유, 즉 이 방식이 효과적이라고 판단한 근거를 설명해보세요.',
  };

  const LABELS = {
    problem: '문제 정의',
    target:  '대상 정의',
    solution:'해결 방식',
  };

  // ────────────────────────────────────────────────────────────────────────
  // Split a draft into rough "sentences" so we can extract the snippet that
  // most likely speaks to a given axis.
  function splitSentences(text) {
    return text
      .split(/(?<=[.!?。？！])\s+|\n+/g)
      .map((s) => s.trim())
      .filter(Boolean);
  }

  // Pick the sentence in `text` that best matches the axis's signals+smells.
  // Fallback to a positional slice so the card always has something to show.
  function extractAxisText(axis, text) {
    if (!text) return '';
    const sentences = splitSentences(text);
    if (sentences.length === 0) return text.slice(0, 80);
    const words = [...AXES[axis].signals, ...AXES[axis].smells];
    let best = sentences[0];
    let bestScore = -1;
    for (const s of sentences) {
      let score = 0;
      for (const w of words) if (s.includes(w)) score++;
      if (score > bestScore) { bestScore = score; best = s; }
    }
    if (bestScore <= 0) {
      const positional = {
        problem: sentences[0],
        target:  sentences[Math.min(1, sentences.length - 1)],
        solution:sentences[sentences.length - 1],
      };
      return positional[axis];
    }
    return best;
  }

  function countMatches(draft, words) {
    let n = 0;
    for (const w of words) {
      // case-insensitive; simple includes works fine for Korean phrases.
      if (draft.toLowerCase().includes(w.toLowerCase())) n++;
    }
    return n;
  }

  function pickReason(axis, draft) {
    const buckets = REASONS[axis];
    for (const b of buckets) {
      if (b.trigger.length === 0) continue;
      if (b.trigger.some((t) => draft.includes(t))) return b.text;
    }
    return buckets[buckets.length - 1].text;
  }

  function pickReaction(status, mode) {
    const arr = REACTIONS[status][mode] || REACTIONS[status].normal;
    return arr[Math.floor(Math.random() * arr.length)];
  }

  // Score → status. HARD is stricter: needs more positive signals to clear.
  function scoreToStatus(score, mode) {
    if (mode === 'hard') {
      if (score >= 3) return 'green';
      if (score >= 1) return 'yellow';
      return 'red';
    }
    // normal — looser: yellow even with mild negative score so users
    // notice the difference between modes on a vague draft.
    if (score >= 2) return 'green';
    if (score >= -1) return 'yellow';
    return 'red';
  }

  function devilHeadline(statuses, mode) {
    const counts = { green: 0, yellow: 0, red: 0 };
    Object.values(statuses).forEach((s) => counts[s]++);

    if (counts.red >= 2 || (mode === 'hard' && counts.red >= 1 && counts.green === 0)) {
      return '아직 멀었습니다. 이 정도로는 못 넘깁니다.';
    }
    if (counts.green === 3) {
      return '솔직히 인정합니다. 이번 건 통과시켜드리죠.';
    }
    if (counts.green >= 2) {
      return '방향은 좋습니다. 마지막 한 군데만 다시 봅시다.';
    }
    if (counts.red >= 1) {
      return '방향은 보입니다. 하지만 이 정도 설명으로는 부족합니다.';
    }
    return '괜찮아 보입니다. 그래도 한 번 더 짚어볼게요.';
  }

  function closingFor(statuses, mode) {
    const reds = Object.values(statuses).filter((s) => s === 'red').length;
    if (reds === 0) return '좋아요. 한 단계 더 다듬어 봅시다.';
    if (mode === 'hard') return '설득될 때까지 다시 작성해보세요.';
    return '핵심부터 다시 짚어보세요.';
  }

  function pickDefaultTab(statuses) {
    // Show the toughest card first: red > yellow > green
    const order = { red: 0, yellow: 1, green: 2 };
    return Object.entries(statuses)
      .sort((a, b) => order[a[1]] - order[b[1]])[0][0];
  }

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC: simulateValidation(draft, mode, fileName)
  // ────────────────────────────────────────────────────────────────────────
  function simulateValidation(draft, mode = 'hard', fileName = null) {
    const text = (draft || '').trim();

    // If user attached a file but didn't type anything, we still produce a
    // result — but the heuristic has nothing to score, so we lean weak.
    const effective = text || (fileName ? `[file: ${fileName}]` : '');

    // Score each axis.
    const scores = {};
    const statuses = {};
    for (const axis of Object.keys(AXES)) {
      const s =
        countMatches(effective, AXES[axis].signals) -
        countMatches(effective, AXES[axis].smells);
      scores[axis] = s;
      statuses[axis] = scoreToStatus(s, mode);
    }

    // Build per-axis feedback objects.
    const feedback = {};
    for (const axis of Object.keys(AXES)) {
      feedback[axis] = {
        label: LABELS[axis],
        status: statuses[axis],
        text: extractAxisText(axis, effective),
        reaction: pickReaction(statuses[axis], mode),
        reason: pickReason(axis, effective),
        question: QUESTIONS[axis],
      };
    }

    return {
      mode,
      modeLabel: mode === 'hard' ? '🔥 빡센 검증' : '⚡ 기본 검증',
      devilComment: devilHeadline(statuses, mode),
      status: statuses,
      feedback,
      defaultTab: pickDefaultTab(statuses),
      closingMessage: closingFor(statuses, mode),
      // Debug — useful when iterating thresholds
      _debug: { scores },
    };
  }

  // ────────────────────────────────────────────────────────────────────────
  // PUBLIC: simulateAxis(text, axis, mode)
  // Re-validate a single axis with a user-edited snippet.
  // ────────────────────────────────────────────────────────────────────────
  function simulateAxis(text, axis, mode = 'hard') {
    const t = (text || '').trim();
    const score =
      countMatches(t, AXES[axis].signals) -
      countMatches(t, AXES[axis].smells);
    const status = scoreToStatus(score, mode);
    return {
      label: LABELS[axis],
      status,
      text: t,
      reaction: pickReaction(status, mode),
      reason: pickReason(axis, t),
      question: QUESTIONS[axis],
      _score: score,
    };
  }

  window.simulateValidation = simulateValidation;
  window.simulateAxis = simulateAxis;
})();
