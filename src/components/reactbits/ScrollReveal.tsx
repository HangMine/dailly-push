import { useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import './ScrollReveal.css';

interface ScrollRevealProps {
  children: ReactNode;
  scrollContainerRef?: RefObject<HTMLElement>;
  enableBlur?: boolean;
  baseOpacity?: number;
  baseRotation?: number;
  blurStrength?: number;
  containerClassName?: string;
  textClassName?: string;
  rotationEnd?: string;
  wordAnimationEnd?: string;
}

export default function ScrollReveal({
  children,
  scrollContainerRef,
  enableBlur = true,
  baseOpacity = 0.1,
  baseRotation = 3,
  blurStrength = 4,
  containerClassName = '',
  textClassName = '',
  rotationEnd = 'bottom bottom',
  wordAnimationEnd = 'bottom bottom',
}: ScrollRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const splitText = useMemo(() => {
    const text = typeof children === 'string' ? children : '';
    const segments = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);

    return segments.map((segment, index) => {
      if (segment.match(/^\s+$/)) {
        return segment;
      }

      return (
        <span className="rb-scroll-word" key={`${segment}-${index}`}>
          {segment}
        </span>
      );
    });
  }, [children]);

  useEffect(() => {
    const element = containerRef.current;

    if (!element) {
      return;
    }

    gsap.registerPlugin(ScrollTrigger);
    const scroller = scrollContainerRef?.current ?? window;

    const context = gsap.context(() => {
      gsap.fromTo(
        element,
        { transformOrigin: '0% 50%', rotate: baseRotation },
        {
          ease: 'none',
          rotate: 0,
          scrollTrigger: {
            trigger: element,
            scroller,
            start: 'top bottom',
            end: rotationEnd,
            scrub: true,
          },
        },
      );

      const wordElements = element.querySelectorAll<HTMLElement>('.rb-scroll-word');

      gsap.fromTo(
        wordElements,
        { opacity: baseOpacity, willChange: 'opacity' },
        {
          ease: 'none',
          opacity: 1,
          stagger: 0.05,
          scrollTrigger: {
            trigger: element,
            scroller,
            start: 'top bottom-=20%',
            end: wordAnimationEnd,
            scrub: true,
          },
        },
      );

      if (enableBlur) {
        gsap.fromTo(
          wordElements,
          { filter: `blur(${blurStrength}px)` },
          {
            ease: 'none',
            filter: 'blur(0px)',
            stagger: 0.05,
            scrollTrigger: {
              trigger: element,
              scroller,
              start: 'top bottom-=20%',
              end: wordAnimationEnd,
              scrub: true,
            },
          },
        );
      }
    }, element);

    return () => context.revert();
  }, [baseOpacity, baseRotation, blurStrength, enableBlur, rotationEnd, scrollContainerRef, wordAnimationEnd]);

  return (
    <div ref={containerRef} className={`rb-scroll-reveal ${containerClassName}`.trim()}>
      <div className={`rb-scroll-reveal-text ${textClassName}`.trim()}>{splitText}</div>
    </div>
  );
}
