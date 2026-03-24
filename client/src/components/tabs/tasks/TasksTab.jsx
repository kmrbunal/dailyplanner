import { useState, useRef, useCallback, useEffect } from 'react';
import TaskCategory from './TaskCategory';
import styles from './TasksTab.module.css';

const SLIDES = [
  { category: 'work', title: 'Work To-Dos', icon: '\uD83D\uDCBC' },
  { category: 'health', title: 'Health & Fitness', icon: '\uD83C\uDFCB\uFE0F' },
  { category: 'personal', title: 'Personal Tasks', icon: '\uD83C\uDF1F' },
];

/**
 * TasksTab - Container wrapping 3 TaskCategory components in a carousel layout.
 * On desktop the 3 cards display in a grid. On mobile they become a swipeable carousel.
 */
export default function TasksTab() {
  const [activeSlide, setActiveSlide] = useState(0);
  const trackRef = useRef(null);

  // Scroll to the active slide on mobile
  const scrollToSlide = useCallback((index) => {
    if (!trackRef.current) return;
    const slides = trackRef.current.children;
    if (slides[index]) {
      slides[index].scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    }
  }, []);

  // Track scroll position to update active dot
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let ticking = false;
    function handleScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollLeft = track.scrollLeft;
        const slideWidth = track.offsetWidth;
        if (slideWidth > 0) {
          const idx = Math.round(scrollLeft / slideWidth);
          setActiveSlide(Math.max(0, Math.min(idx, SLIDES.length - 1)));
        }
        ticking = false;
      });
    }

    track.addEventListener('scroll', handleScroll, { passive: true });
    return () => track.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePrev = useCallback(() => {
    setActiveSlide((prev) => {
      const next = Math.max(0, prev - 1);
      scrollToSlide(next);
      return next;
    });
  }, [scrollToSlide]);

  const handleNext = useCallback(() => {
    setActiveSlide((prev) => {
      const next = Math.min(SLIDES.length - 1, prev + 1);
      scrollToSlide(next);
      return next;
    });
  }, [scrollToSlide]);

  const handleDotClick = useCallback(
    (index) => {
      setActiveSlide(index);
      scrollToSlide(index);
    },
    [scrollToSlide]
  );

  return (
    <div>
      {/* Mobile Carousel Nav */}
      <div className={styles.carouselNav}>
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={handlePrev}
          disabled={activeSlide === 0}
          aria-label="Previous card"
        >
          {'\u2039'}
        </button>
        <div className={styles.carouselDots}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              className={`${styles.carouselDot} ${i === activeSlide ? styles.carouselDotActive : ''}`}
              onClick={() => handleDotClick(i)}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.carouselNavBtn}
          onClick={handleNext}
          disabled={activeSlide === SLIDES.length - 1}
          aria-label="Next card"
        >
          {'\u203A'}
        </button>
      </div>

      {/* Carousel Track / Grid */}
      <div ref={trackRef} className={styles.carouselTrack}>
        {SLIDES.map((slide) => (
          <div key={slide.category} className={styles.carouselSlide}>
            <TaskCategory
              category={slide.category}
              title={slide.title}
              icon={slide.icon}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
