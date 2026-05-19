// Character mascot — renders /character.png with a fallback pixel-art SVG
// if the image fails to load, so the layout never breaks.

const { useState } = React;

// Fallback: simple inline pixel-art devil head (matches the mood).
function CharacterFallback({ size }) {
  const cells = size / 16;
  const S = (x, y, w, h, color) => (
    <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={color} />
  );
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} shapeRendering="crispEdges" style={{ display: 'block' }}>
      {/* horns */}
      {S(3, 1, 2, 2, '#3a2418')}
      {S(11, 1, 2, 2, '#3a2418')}
      {/* head */}
      {S(3, 3, 10, 8, '#f7d9c0')}
      {S(2, 4, 1, 6, '#f7d9c0')}
      {S(13, 4, 1, 6, '#f7d9c0')}
      {/* outline */}
      {S(2, 3, 1, 1, '#1a1208')}
      {S(13, 3, 1, 1, '#1a1208')}
      {S(2, 10, 1, 1, '#1a1208')}
      {S(13, 10, 1, 1, '#1a1208')}
      {/* glasses */}
      {S(4, 5, 3, 2, '#d63b3b')}
      {S(9, 5, 3, 2, '#d63b3b')}
      {S(5, 6, 1, 1, '#fff')}
      {S(10, 6, 1, 1, '#fff')}
      {S(5, 6, 1, 1, '#1a1208')}
      {S(10, 6, 1, 1, '#1a1208')}
      {/* mouth */}
      {S(7, 9, 2, 1, '#1a1208')}
      {/* body */}
      {S(5, 11, 6, 4, '#f7d9c0')}
      {/* tail */}
      {S(11, 12, 2, 1, '#3a2418')}
      {S(12, 13, 1, 1, '#3a2418')}
    </svg>
  );
}

// Main mascot — `state` controls the animation AND which image src is used.
// Source priority (with graceful fallback):
//   1. state-specific image (character_intro.png / character_spin.png)
//   2. character.png (generic fallback)
//   3. inline SVG pixel-art fallback
//
// 'idle'    — static (no animation; intro pose)
// 'spin'    — slow rotation (loading screen)
// 'mini'    — small, no animation (result screen header)
// 'static'  — no animation, uses intro pose
function Character({ size = 200, state = 'idle', className = '' }) {
  // We track a 'srcIdx' that walks through the candidate sources on error.
  // Cache buster makes the browser re-request after a previously-404'd asset
  // gets added to the project.
  const candidates =
    state === 'spin'
      ? ['character_spin.png?v=2', 'character.png?v=2']
      : ['character_intro.png?v=2', 'character.png?v=2'];

  const [srcIdx, setSrcIdx] = useState(0);
  const [failed, setFailed] = useState(false);

  const animation =
    state === 'spin' ? 'spin-slow 2.6s linear infinite' : 'none';

  const wrapStyle = {
    width: size,
    height: size,
    display: 'inline-block',
    animation,
    transformOrigin: state === 'spin' ? '50% 55%' : '50% 100%',
    willChange: 'transform',
  };

  const imgStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'contain',
    objectPosition: 'center',
    display: 'block',
    // Transparent PNG — no blend needed. (multiply is harmless on transparent
    // pixels but can darken anti-aliased edges, so we leave it off.)
    // mixBlendMode removed — devil.png is transparent.
  };

  return (
    <div className={className} style={wrapStyle}>
      {failed ? (
        <CharacterFallback size={size} />
      ) : (
        <img
          key={candidates[srcIdx]}
          src={candidates[srcIdx]}
          alt="악마의 변호인 캐릭터"
          className="pixel-img"
          style={imgStyle}
          onError={() => {
            if (srcIdx < candidates.length - 1) setSrcIdx(srcIdx + 1);
            else setFailed(true);
          }}
        />
      )}
    </div>
  );
}

window.Character = Character;
window.CharacterFallback = CharacterFallback;
