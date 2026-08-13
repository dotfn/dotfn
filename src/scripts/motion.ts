import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

let lenis: Lenis | null = null;
let rafId: number | null = null;

function destroy() {
	if (rafId) cancelAnimationFrame(rafId);
	rafId = null;
	lenis?.destroy();
	lenis = null;
	ScrollTrigger.getAll().forEach((t) => t.kill());
}

export function setupMotion() {
	destroy();

	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

	// ── SMOOTH SCROLL (Lenis) ──────────────────────────────
	if (!reduced) {
		// lerp mode (not duration) — duration commits to a fixed-time easing
		// curve per scroll event, which reads as floaty/delayed. lerp tracks
		// the target every frame instead, snappier at the same smoothness.
		lenis = new Lenis({ lerp: 0.12, smoothWheel: true });
		lenis.on('scroll', ScrollTrigger.update);

		const raf = (time: number) => {
			lenis?.raf(time);
			rafId = requestAnimationFrame(raf);
		};
		rafId = requestAnimationFrame(raf);
	}

	// ── HERO ENTRANCE ───────────────────────────────────────
	const heroTargets = gsap.utils.toArray<HTMLElement>(
		'.hero-tagline, .hero-title, .hero-desc, .hero-actions, .hero-microcopy, .hero-stats'
	);
	if (heroTargets.length) {
		gsap.fromTo(
			heroTargets,
			{ opacity: 0, y: reduced ? 0 : 36 },
			{ opacity: 1, y: 0, duration: reduced ? 0.01 : 0.9, stagger: reduced ? 0 : 0.12, ease: 'power3.out', delay: 0.1 }
		);
	}

	// ── SCROLL REVEALS ──────────────────────────────────────
	// translate + opacity only (no scale) — cheaper to composite, and this
	// runs on every section simultaneously as they scroll into view.
	const revealTargets = gsap.utils.toArray<HTMLElement>(
		'main section:not(.hero-section):not([data-no-reveal]), .profile-card, .page'
	);
	revealTargets.forEach((el) => {
		gsap.fromTo(
			el,
			{ opacity: 0, y: reduced ? 0 : 40 },
			{
				opacity: 1,
				y: 0,
				duration: reduced ? 0.01 : 0.85,
				ease: 'power3.out',
				scrollTrigger: {
					trigger: el,
					start: 'top 88%',
					toggleActions: 'play none none none',
				},
			}
		);
	});

	// ── PROJECT / POWER CARD STAGGER ────────────────────────
	const cardGroups = gsap.utils.toArray<HTMLElement>('.projects-grid, .powers-grid');
	cardGroups.forEach((group) => {
		const cards = group.children;
		if (!cards.length) return;
		gsap.fromTo(
			cards,
			{ opacity: 0, y: reduced ? 0 : 24 },
			{
				opacity: 1,
				y: 0,
				duration: reduced ? 0.01 : 0.6,
				stagger: reduced ? 0 : 0.08,
				ease: 'power2.out',
				scrollTrigger: {
					trigger: group,
					start: 'top 85%',
					toggleActions: 'play none none none',
				},
			}
		);
	});

	// Images (icons, avatar, devicon SVGs) load async and shift page height,
	// which leaves ScrollTrigger's cached trigger positions stale — refresh
	// once everything has actually settled.
	window.addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}

export function teardownMotion() {
	destroy();
}
