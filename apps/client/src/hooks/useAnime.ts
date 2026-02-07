import { useRef, useEffect, useCallback } from 'react';
import anime from 'animejs';
import type { AnimeParams } from 'animejs';

type AnimeParamsWithoutTargets = Omit<AnimeParams, 'targets'>;

/**
 * Fire-on-mount animation. Returns a ref to attach to the target element.
 * Cleans up automatically on unmount.
 */
export function useAnime<T extends HTMLElement = HTMLDivElement>(
  params: AnimeParamsWithoutTargets,
  deps: unknown[] = []
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const animationRef = useRef<anime.AnimeInstance | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    animationRef.current = anime({
      targets: ref.current,
      ...params,
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
      if (ref.current) {
        anime.remove(ref.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Stagger animation for child elements matched by a CSS selector.
 * Returns a ref for the parent container.
 */
export function useAnimeStagger<T extends HTMLElement = HTMLDivElement>(
  childSelector: string,
  params: AnimeParamsWithoutTargets,
  deps: unknown[] = []
): React.RefObject<T | null> {
  const ref = useRef<T | null>(null);
  const animationRef = useRef<anime.AnimeInstance | null>(null);

  useEffect(() => {
    if (!ref.current) return;

    const children = ref.current.querySelectorAll(childSelector);
    if (children.length === 0) return;

    animationRef.current = anime({
      targets: children,
      ...params,
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
      anime.remove(children);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return ref;
}

/**
 * Imperative animation triggered on demand (clicks, hover, state changes).
 * Returns [ref, trigger] tuple.
 */
export function useAnimeOnDemand<T extends HTMLElement = HTMLDivElement>(
  params: AnimeParamsWithoutTargets
): [React.RefObject<T | null>, () => void] {
  const ref = useRef<T | null>(null);
  const animationRef = useRef<anime.AnimeInstance | null>(null);

  const trigger = useCallback(() => {
    if (!ref.current) return;

    if (animationRef.current) {
      animationRef.current.pause();
      anime.remove(ref.current);
    }

    animationRef.current = anime({
      targets: ref.current,
      ...params,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        animationRef.current.pause();
      }
      if (ref.current) {
        anime.remove(ref.current);
      }
    };
  }, []);

  return [ref, trigger];
}
