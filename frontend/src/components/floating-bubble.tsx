import React, { useRef } from 'react';
import styled, { keyframes } from 'styled-components';

// アニメーションのキーフレームを定義（可動域を広く設定）
const complexFloatAnimation = keyframes`
  0% { transform: translate(0, 0) rotate(0deg); }
  25% { transform: translate(-100px, 80px) rotate(45deg); }
  50% { transform: translate(150px, -120px) rotate(90deg); }
  75% { transform: translate(-80px, -150px) rotate(135deg); }
  100% { transform: translate(0, 0) rotate(180deg); }
`;

// スタイリングとアニメーションを適用した丸のコンテナ
const Bubble = styled.div<{ size: number; top: string; left: string }>`
  width: ${({ size }) => `${size}px`};
  height: ${({ size }) => `${size}px`};
  background: radial-gradient(circle, rgba(${() => Math.floor(Math.random() * 255)}, ${() => Math.floor(Math.random() * 255)}, ${() => Math.floor(Math.random() * 255)}, 0.8), transparent);
  border-radius: 50%;
  position: absolute;
  top: ${({ top }) => top};
  left: ${({ left }) => left};
  filter: blur(20px);
  animation: ${complexFloatAnimation} ${() => `${Math.random() * 6 + 6}s`} ease-in-out infinite;
  opacity: 0.7;
`;

const Background = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  z-index: -1;
`;

const FloatingBubbles: React.FC = React.memo(() => {
  const initialBubbles = useRef(
    Array.from({ length: 8 }, () => ({
      size: Math.random() * 150 + 100,
      top: `${Math.random() * 100}vh`,
      left: `${Math.random() * 100}vw`,
    }))
  );

  return (
    <Background>
      {initialBubbles.current.map((bubble, i) => (
        <Bubble key={i} size={bubble.size} top={bubble.top} left={bubble.left} />
      ))}
    </Background>
  );
});

export default FloatingBubbles;
