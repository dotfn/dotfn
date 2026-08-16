import { useState, useEffect, useRef } from 'react';

const WEEK_DAYS = 7;
const WEEKS_COUNT = 53;
const TOTAL_DAYS = WEEKS_COUNT * WEEK_DAYS;
const SCAN_DURATION_MS = 900;
const SCAN_TICK_MS = 40;
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

interface DateCell {
	dateStr: string;
	dateObj: Date;
	count: number;
	level: number;
}

interface Week {
	days: DateCell[];
	monthLabel?: string;
}

interface ScanState {
	tick: number;
	progress: number;
}

function getRandomLevelForTick(wIdx: number, dIdx: number, tick: number): number {
	const seed = Math.sin(wIdx * 12.9898 + dIdx * 78.233 + tick * 45.19) * 43758.5453;
	const r = seed - Math.floor(seed);
	if (r < 0.45) return 0;
	if (r < 0.7) return 1;
	if (r < 0.85) return 2;
	if (r < 0.94) return 3;
	return 4;
}

function getDeterministicCount(dateStr: string): number {
	let hash = 0;
	for (let i = 0; i < dateStr.length; i++) {
		hash = dateStr.charCodeAt(i) + ((hash << 5) - hash);
	}
	const mod = Math.abs(hash) % 100;
	if (mod < 65) return 0;
	if (mod < 82) return 1;
	if (mod < 93) return 3;
	if (mod < 98) return 5;
	return 8;
}

function mapCountToLevel(count: number): number {
	if (count <= 0) return 0;
	if (count <= 2) return 1;
	if (count <= 4) return 2;
	if (count <= 6) return 3;
	return 4;
}

// Sunday of 52 weeks ago through today: 53 full weeks, 371 days.
function generateDateList(today: Date): DateCell[] {
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - 364);
	startDate.setDate(startDate.getDate() - startDate.getDay());

	const dateList: DateCell[] = [];
	const cursor = new Date(startDate);
	for (let i = 0; i < TOTAL_DAYS; i++) {
		dateList.push({
			dateStr: cursor.toISOString().split('T')[0],
			dateObj: new Date(cursor),
			count: 0,
			level: 0,
		});
		cursor.setDate(cursor.getDate() + 1);
	}
	return dateList;
}

// Groups a flat date list into weeks and labels the first week of each month.
function groupIntoWeeks(dates: DateCell[]): Week[] {
	const weekList: Week[] = [];
	for (let i = 0; i < dates.length; i += WEEK_DAYS) {
		weekList.push({ days: dates.slice(i, i + WEEK_DAYS) });
	}

	let lastMonth = -1;
	weekList.forEach((week) => {
		const currentMonth = week.days[0].dateObj.getMonth();
		if (currentMonth !== lastMonth) {
			week.monthLabel = MONTH_NAMES[currentMonth];
			lastMonth = currentMonth;
		}
	});

	return weekList;
}

function generateInitialWeeks(today: Date): Week[] {
	return groupIntoWeeks(generateDateList(today));
}

// During the intro scan, columns resolve left-to-right; a column shows real
// data once the sweep has passed it, otherwise it flickers with noise.
function getCellLevel(wIdx: number, dIdx: number, realLevel: number, scan: ScanState | null, totalWeeks: number): number {
	if (!scan) return realLevel;
	const revealAt = wIdx / totalWeeks;
	if (scan.progress >= revealAt) return realLevel;
	return getRandomLevelForTick(wIdx, dIdx, scan.tick);
}

export default function GitHubActivity() {
	const cardRef = useRef<HTMLDivElement>(null);
	const rafIdRef = useRef<number | null>(null);
	const [status, setStatus] = useState<'loading' | 'live' | 'simulated'>('loading');
	const [weeks, setWeeks] = useState<Week[]>(() => generateInitialWeeks(new Date()));
	const [totalContribs, setTotalContribs] = useState<number>(0);
	const [scan, setScan] = useState<ScanState | null>(null);
	const [hasAnimated, setHasAnimated] = useState<boolean>(false);

	useEffect(() => {
		const element = cardRef.current;
		if (!element || hasAnimated) return;

		const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				if (!entry.isIntersecting) return;
				observer.unobserve(element);

				if (prefersReducedMotion) {
					setHasAnimated(true);
					return;
				}

				const start = performance.now();
				let lastTick = -1;

				const step = (now: number) => {
					const elapsed = now - start;
					const tick = Math.floor(elapsed / SCAN_TICK_MS);
					if (tick !== lastTick) {
						lastTick = tick;
						setScan({ tick, progress: Math.min(elapsed / SCAN_DURATION_MS, 1) });
					}
					if (elapsed < SCAN_DURATION_MS) {
						rafIdRef.current = requestAnimationFrame(step);
					} else {
						setScan(null);
						setHasAnimated(true);
						rafIdRef.current = null;
					}
				};
				rafIdRef.current = requestAnimationFrame(step);
			},
			{ threshold: 0.15 }
		);

		observer.observe(element);
		return () => {
			observer.disconnect();
			if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
		};
	}, [hasAnimated]);

	useEffect(() => {
		const controller = new AbortController();
		const dateList = generateDateList(new Date());

		fetch('/api/github', { signal: controller.signal })
			.then((res) => {
				if (!res.ok) throw new Error('API Error');
				return res.json();
			})
			.then((data) => {
				if (data.simulated) {
					// Backend returned simulated: true (no GITHUB_TOKEN configured yet)
					// Generate client-side deterministic fallback
					updateCalendarData({}, 'simulated', dateList, true);
				} else {
					// Real contributions from GraphQL API!
					const liveCounts: Record<string, number> = {};
					if (Array.isArray(data.contributions)) {
						data.contributions.forEach((c: any) => {
							liveCounts[c.date] = c.count;
						});
					}
					updateCalendarData(liveCounts, 'live', dateList, false, data.totalContributions);
				}
			})
			.catch((err) => {
				if (err?.name === 'AbortError') return;
				updateCalendarData({}, 'simulated', dateList, true);
			});

		return () => controller.abort();
	}, []);

	const updateCalendarData = (
		liveCounts: Record<string, number>,
		newStatus: 'live' | 'simulated',
		baseDates: DateCell[],
		useSimulatedFallback: boolean,
		totalContributions?: number
	) => {
		const today = new Date();
		const ninetyDaysAgo = new Date();
		ninetyDaysAgo.setDate(today.getDate() - 90);

		let sum = 0;
		const updatedDates = baseDates.map((d) => {
			let count = 0;
			if (liveCounts[d.dateStr] !== undefined) {
				count = liveCounts[d.dateStr];
			} else if (useSimulatedFallback) {
				count = d.dateObj >= ninetyDaysAgo ? 0 : getDeterministicCount(d.dateStr);
			}
			sum += count;
			return { ...d, count, level: mapCountToLevel(count) };
		});

		setWeeks(groupIntoWeeks(updatedDates));
		setTotalContribs(totalContributions !== undefined ? totalContributions : sum);
		setStatus(newStatus);
	};

	const isAnimating = scan !== null;

	return (
		<div className="github-card" ref={cardRef}>
			<div className="card-header">
				<a href="https://github.com/dotfn" target="_blank" rel="noopener noreferrer" className="user-profile">
					<div className="github-logo">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
						</svg>
					</div>
					<span className="github-username">@dotfn</span>
				</a>
				<div className={`status-tag ${isAnimating ? 'loading' : status === 'loading' ? '' : status}`}>
					<span className="status-dot"></span>
					<span className="status-text">
						{isAnimating ? 'Escaneando...' : status === 'loading' ? 'Cargando...' : status === 'live' ? 'En vivo' : 'Cacheado'}
					</span>
				</div>
			</div>

			<div className="calendar-wrapper">
				<div className="calendar-grid-container">
					<div className="day-labels">
						<span>Dom</span>
						<span>Mar</span>
						<span>Jue</span>
						<span>Sáb</span>
					</div>
					<div className={`calendar-grid ${isAnimating ? 'is-animating' : ''}`}>
						{weeks.map((week, wIdx) => (
							<div key={wIdx} className="calendar-column">
								<span className="month-label-cell">{week.monthLabel || ''}</span>
								<div className="calendar-week">
									{week.days.map((d, dIdx) => {
										const cellLevel = getCellLevel(wIdx, dIdx, d.level, scan, weeks.length);
										return (
											<div
												key={dIdx}
												className="day-cell"
												data-level={cellLevel}
												title={
													isAnimating
														? 'Analizando actividad...'
														: `${d.count} contribuciones el ${d.dateObj.toLocaleDateString('es-AR', {
																weekday: 'long',
																year: 'numeric',
																month: 'long',
																day: 'numeric',
															})}`
												}
											/>
										);
									})}
								</div>
							</div>
						))}
					</div>
				</div>
				<div className="calendar-footer">
					<span className="total-contribs">
						{isAnimating
							? 'Obteniendo historial de commits...'
							: status === 'loading'
								? '… contribuciones'
								: `${totalContribs} contribuciones en el último año`}
					</span>
					<div className="legend">
						<span>Menos</span>
						<span className="square lvl-0" title="0 contribuciones"></span>
						<span className="square lvl-1" title="1-2 contribuciones"></span>
						<span className="square lvl-2" title="3-4 contribuciones"></span>
						<span className="square lvl-3" title="5-6 contribuciones"></span>
						<span className="square lvl-4" title="7+ contribuciones"></span>
						<span>Más</span>
					</div>
				</div>
			</div>
		</div>
	);
}
