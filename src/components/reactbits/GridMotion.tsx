import { useEffect, useRef, type ReactNode } from 'react';
import { gsap } from 'gsap';

import './GridMotion.css';

interface GridMotionProps {
  items?: Array<string | ReactNode>;
  gradientColor?: string;
}

export default function GridMotion({ items = [], gradientColor = 'black' }: GridMotionProps) {
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const mouseXRef = useRef(typeof window !== 'undefined' ? window.innerWidth / 2 : 0);

  const totalItems = 28;
  const defaultItems = Array.from({ length: totalItems }, (_, index) => `Item ${index + 1}`);
  const combinedItems = items.length > 0 ? items.slice(0, totalItems) : defaultItems;

  useEffect(() => {
    gsap.ticker.lagSmoothing(0);

    const handleMouseMove = (event: MouseEvent) => {
      mouseXRef.current = event.clientX;
    };

    const updateMotion = () => {
      const maxMoveAmount = 220;
      const baseDuration = 0.8;
      const inertiaFactors = [0.6, 0.4, 0.3, 0.2];

      rowRefs.current.forEach((row, index) => {
        if (!row) {
          return;
        }

        const direction = index % 2 === 0 ? 1 : -1;
        const moveAmount = ((mouseXRef.current / window.innerWidth) * maxMoveAmount - maxMoveAmount / 2) * direction;

        gsap.to(row, {
          x: moveAmount,
          duration: baseDuration + inertiaFactors[index % inertiaFactors.length],
          ease: 'power3.out',
          overwrite: 'auto',
        });
      });
    };

    gsap.ticker.add(updateMotion);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      gsap.ticker.remove(updateMotion);
    };
  }, []);

  return (
    <div className="rb-gridmotion-shell">
      <section
        className="rb-gridmotion-stage"
        style={{
          background: `radial-gradient(circle at 50% 50%, ${gradientColor} 0%, transparent 72%)`,
        }}
      >
        <div className="rb-gridmotion-container">
          {Array.from({ length: 4 }, (_, rowIndex) => (
            <div
              key={`row-${rowIndex}`}
              className="rb-gridmotion-row"
              ref={(element) => {
                rowRefs.current[rowIndex] = element;
              }}
            >
              {Array.from({ length: 7 }, (_, itemIndex) => {
                const content = combinedItems[rowIndex * 7 + itemIndex];

                return (
                  <div key={`item-${rowIndex}-${itemIndex}`} className="rb-gridmotion-item">
                    <div className="rb-gridmotion-item-inner">
                      {typeof content === 'string' && content.startsWith('http') ? (
                        <div
                          className="rb-gridmotion-item-image"
                          style={{
                            backgroundImage: `url(${content})`,
                          }}
                        ></div>
                      ) : (
                        <div className="rb-gridmotion-item-content">{content}</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div className="rb-gridmotion-fullview"></div>
      </section>
    </div>
  );
}
