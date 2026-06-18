import { useState, useEffect, useRef } from 'react';

function getRandomLevelForTick(wIdx: number, dIdx: number, tick: number): number {
	const seed = Math.sin(wIdx * 12.9898 + dIdx * 78.233 + tick * 45.19) * 43758.5453;
	const r = seed - Math.floor(seed);
	if (r < 0.45) return 0;
	if (r < 0.7) return 1;
	if (r < 0.85) return 2;
	if (r < 0.94) return 3;
	return 4;
}

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

function generateInitialWeeks(today: Date): Week[] {
	const dateList: DateCell[] = [];
	
	// Find Sunday of 52 weeks ago
	const startDate = new Date(today);
	startDate.setDate(today.getDate() - 364);
	const startDay = startDate.getDay();
	startDate.setDate(startDate.getDate() - startDay);

	// Generate 371 days (53 weeks * 7 days)
	const temp = new Date(startDate);
	for (let i = 0; i < 371; i++) {
		dateList.push({
			dateStr: temp.toISOString().split('T')[0],
			dateObj: new Date(temp),
			count: 0,
			level: 0
		});
		temp.setDate(temp.getDate() + 1);
	}

	// Group into 53 weeks
	const weekList: Week[] = [];
	let currentWeekDays: DateCell[] = [];
	
	dateList.forEach((d) => {
		currentWeekDays.push(d);
		if (currentWeekDays.length === 7) {
			weekList.push({
				days: currentWeekDays
			});
			currentWeekDays = [];
		}
	});

	// Assign month labels when month changes
	let lastMonth = -1;
	const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
	
	weekList.forEach((week) => {
		const firstDay = week.days[0].dateObj;
		const currentMonth = firstDay.getMonth();
		if (currentMonth !== lastMonth) {
			week.monthLabel = monthNames[currentMonth];
			lastMonth = currentMonth;
		}
	});

	return weekList;
}

export default function GitHubActivity() {
	const cardRef = useRef<HTMLDivElement>(null);
	const [status, setStatus] = useState<'loading' | 'live' | 'simulated'>('loading');
	const [weeks, setWeeks] = useState<Week[]>(() => generateInitialWeeks(new Date()));
	const [totalContribs, setTotalContribs] = useState<number>(0);
	const [animationFrame, setAnimationFrame] = useState<number>(-1);
	const [hasAnimated, setHasAnimated] = useState<boolean>(false);

	useEffect(() => {
		const element = cardRef.current;
		if (!element || hasAnimated) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						// Start matrix animation: ticks every 45ms for 16 frames (~720ms)
						setAnimationFrame(0);
						let frame = 0;
						const interval = setInterval(() => {
							frame++;
							setAnimationFrame(frame);
							if (frame >= 16) {
								clearInterval(interval);
								setAnimationFrame(-1);
								setHasAnimated(true);
							}
						}, 45);

						observer.unobserve(element);
					}
				});
			},
			{ threshold: 0.15 }
		);

		observer.observe(element);
		return () => observer.disconnect();
	}, [hasAnimated]);

	useEffect(() => {
		const today = new Date();
		const dateList: DateCell[] = [];
		
		// Find Sunday of 52 weeks ago
		const startDate = new Date(today);
		startDate.setDate(today.getDate() - 364);
		const startDay = startDate.getDay();
		startDate.setDate(startDate.getDate() - startDay);

		// Generate 371 days (53 weeks * 7 days)
		const temp = new Date(startDate);
		for (let i = 0; i < 371; i++) {
			dateList.push({
				dateStr: temp.toISOString().split('T')[0],
				dateObj: new Date(temp),
				count: 0,
				level: 0
			});
			temp.setDate(temp.getDate() + 1);
		}

		// Fetch live GitHub data from server endpoint
		fetch('/api/github')
			.then(res => {
				if (!res.ok) throw new Error('API Error');
				return res.json();
			})
			.then(data => {
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
					
					// When we have GraphQL contributions, we don't need ninety-day logic or fallback logic!
					updateCalendarData(liveCounts, 'live', dateList, false, data.totalContributions);
				}
			})
			.catch(() => {
				updateCalendarData({}, 'simulated', dateList, true);
			});
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
		const updatedDates = baseDates.map(d => {
			let count = 0;
			if (liveCounts[d.dateStr] !== undefined) {
				count = liveCounts[d.dateStr];
			} else if (useSimulatedFallback) {
				if (d.dateObj >= ninetyDaysAgo) {
					count = 0;
				} else {
					count = getDeterministicCount(d.dateStr);
				}
			} else {
				// Live GraphQL data, but this specific date wasn't in counts or is 0
				count = 0;
			}
			sum += count;
			return {
				...d,
				count,
				level: mapCountToLevel(count)
			};
		});

		// Group into 53 weeks
		const weekList: Week[] = [];
		let currentWeekDays: DateCell[] = [];
		
		updatedDates.forEach((d) => {
			currentWeekDays.push(d);
			if (currentWeekDays.length === 7) {
				weekList.push({
					days: currentWeekDays
				});
				currentWeekDays = [];
			}
		});

		// Assign month labels when month changes
		let lastMonth = -1;
		const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
		
		weekList.forEach((week) => {
			const firstDay = week.days[0].dateObj;
			const currentMonth = firstDay.getMonth();
			if (currentMonth !== lastMonth) {
				week.monthLabel = monthNames[currentMonth];
				lastMonth = currentMonth;
			}
		});

		setWeeks(weekList);
		setTotalContribs(totalContributions !== undefined ? totalContributions : sum);
		setStatus(newStatus);
	};

	return (
		<div className="github-card" ref={cardRef}>
			<div className="card-header">
				<a href="https://github.com/dotfn" target="_blank" rel="noopener noreferrer" className="user-profile">
					<div className="github-logo">
						<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
							<path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.646.64.699 1.026 1.592 1.026 2.683 0 3.842-2.337 4.687-4.565 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.137 20.164 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
						</svg>
					</div>
					<span className="github-username">@dotfn</span>
				</a>
				<div className={`status-tag ${animationFrame >= 0 ? 'loading' : status === 'loading' ? '' : status}`}>
					<span className="status-dot"></span>
					<span className="status-text">
						{animationFrame >= 0 ? 'Escaneando...' : status === 'loading' ? 'Cargando...' : status === 'live' ? 'En vivo' : 'Cacheado'}
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
					<div className={`calendar-grid ${animationFrame >= 0 ? 'is-animating' : ''}`}>
						{weeks.map((week, wIdx) => (
							<div key={wIdx} className="calendar-column">
								<span className="month-label-cell">
									{week.monthLabel || ''}
								</span>
								<div className="calendar-week">
									{week.days.map((d, dIdx) => {
										const isAnimating = animationFrame >= 0;
										const cellLevel = isAnimating
											? getRandomLevelForTick(wIdx, dIdx, animationFrame)
											: d.level;
										return (
											<div
												key={dIdx}
												className="day-cell"
												data-level={cellLevel}
												title={isAnimating ? 'Analizando actividad...' : `${d.count} contribuciones el ${d.dateObj.toLocaleDateString('es-AR', {
													weekday: 'long',
													year: 'numeric',
													month: 'long',
													day: 'numeric'
												})}`}
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
						{animationFrame >= 0 
							? 'Obteniendo historial de commits...' 
							: status === 'loading' 
								? '-- contribuciones' 
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
