function initLogoRevealLoader() {
	gsap.registerPlugin(CustomEase, SplitText);
	CustomEase.create('loader', '0.65, 0.01, 0.05, 0.99');

	const wrap = document.querySelector('[data-load-wrap]');
	if (!wrap) return;

	const container = wrap.querySelector('[data-load-container]');
	const bg = wrap.querySelector('[data-load-bg]');
	const progressBar = wrap.querySelector('[data-load-progress]');
	const logo = wrap.querySelector('[data-load-logo]');
	const textElements = Array.from(wrap.querySelectorAll('[data-load-text]'));

	// Reset targets that are * not * split text targets
	const resetTargets = Array.from(
		wrap.querySelectorAll('[data-load-reset]:not([data-load-text])'),
	);

	// Main loader timeline
	const loadTimeline = gsap
		.timeline({
			defaults: {
				ease: 'loader',
				duration: 3,
			},
		})
		.set(wrap, { display: 'block' })
		.to(progressBar, { scaleX: 1 })
		.to(logo, { clipPath: 'inset(0% 0% 0% 0%)' }, '<')
		.to(container, { autoAlpha: 0, duration: 0.5 })
		.to(
			progressBar,
			{ scaleX: 0, transformOrigin: 'right center', duration: 0.5 },
			'<',
		)
		.add('hideContent', '<')
		.to(bg, { yPercent: -101, duration: 1 }, 'hideContent')
		.to(bg, { yPercent: -101, duration: 1 }, 'hideContent')
		.call(() => document.documentElement.classList.remove('is-loading'))
		.set(wrap, { display: 'none' })

		.set(wrap, { display: 'none' });

	// If there are items to hide FOUC for, reset them at the start
	if (resetTargets.length) {
		loadTimeline.set(resetTargets, { autoAlpha: 1 }, 0);
	}

	// If there's text items, split them, and add to load timeline
	if (textElements.length >= 2) {
		const firstWord = new SplitText(textElements[0], {
			type: 'lines,chars',
			mask: 'lines',
		});
		const secondWord = new SplitText(textElements[1], {
			type: 'lines,chars',
			mask: 'lines',
		});

		// Set initial states of the text elements and letters
		gsap.set([firstWord.chars, secondWord.chars], {
			autoAlpha: 0,
			yPercent: 125,
		});
		gsap.set(textElements, { autoAlpha: 1 });

		// first text in
		loadTimeline.to(
			firstWord.chars,
			{
				autoAlpha: 1,
				yPercent: 0,
				duration: 0.6,
				stagger: { each: 0.02 },
			},
			0,
		);

		// first text out while second text in
		loadTimeline.to(
			firstWord.chars,
			{
				autoAlpha: 0,
				yPercent: -125,
				duration: 0.4,
				stagger: { each: 0.02 },
			},
			'>+=0.4',
		);

		loadTimeline.to(
			secondWord.chars,
			{
				autoAlpha: 1,
				yPercent: 0,
				duration: 0.6,
				stagger: { each: 0.02 },
			},
			'<',
		);

		// second text out
		loadTimeline.to(
			secondWord.chars,
			{
				autoAlpha: 0,
				yPercent: -125,
				duration: 0.4,
				stagger: { each: 0.02 },
			},
			'hideContent-=0.5',
		);
	}
}

// Initialize Logo Reveal Loader
document.addEventListener('DOMContentLoaded', () => {
	initLogoRevealLoader();
});

gsap.registerPlugin(ScrollTrigger, SplitText);

ScrollTrigger.config({
	ignoreMobileResize: true,
});

function initStickyTitleScroll() {
	const wraps = document.querySelectorAll('[data-sticky-title="wrap"]');

	// Prefer words-only animation on mobile to reduce jitter + DOM load
	const isMobile = window.matchMedia('(max-width: 767px)').matches;

	wraps.forEach((wrap) => {
		const headings = Array.from(
			wrap.querySelectorAll('[data-sticky-title="heading"]'),
		);

		const masterTl = gsap.timeline({
			scrollTrigger: {
				trigger: wrap,
				start: 'top 40%',
				end: 'bottom bottom',
				scrub: 0.4,
				// Keep transforms stable across mobile repaint/compositing quirks
				invalidateOnRefresh: false,
			},
		});

		const revealDuration = 0.7,
			fadeOutDuration = 0.7,
			overlapOffset = 0.15;

		headings.forEach((heading, index) => {
			// Save original heading content for screen readers
			heading.setAttribute('aria-label', heading.textContent);

			const split = new SplitText(heading, {
				type: isMobile ? 'words' : 'words,chars',
			});

			// Hide all the separate words from screenreader
			split.words.forEach((word) => word.setAttribute('aria-hidden', 'true'));

			// Reset visibility on the 'stacked' headings
			gsap.set(heading, { visibility: 'visible', force3D: false });

			const targets = isMobile ? split.words : split.chars;

			const headingTl = gsap.timeline();

			headingTl.from(targets, {
				autoAlpha: 0,
				stagger: { amount: revealDuration, from: 'start' },
				duration: revealDuration,
				ease: 'none',
			});

			// Animate fade-out for every heading except the last one.
			if (index < headings.length - 1) {
				headingTl.to(targets, {
					autoAlpha: 0,
					stagger: { amount: fadeOutDuration, from: 'end' },
					duration: fadeOutDuration,
					ease: 'none',
				});
			}

			// Overlap the start of fade-in of the new heading a little bit
			masterTl.add(headingTl, index === 0 ? 0 : `-=${overlapOffset}`);
		});
	});
}

// Initialize Sticky Title Scroll Effect
document.addEventListener('DOMContentLoaded', () => {
	initStickyTitleScroll();
});

// Register GSAP Plugins
gsap.registerPlugin(ScrollTrigger);

function initProgressNavigation() {
	// Cache the parent container
	let navProgress = document.querySelector('[data-progress-nav-list]');

	// Create or select the moving indicator
	let indicator = navProgress.querySelector('.progress-nav__indicator');
	if (!indicator) {
		indicator = document.createElement('div');
		indicator.className = 'progress-nav__indicator';
		navProgress.appendChild(indicator);
	}

	// Function to update the indicator based on the active nav link
	function updateIndicator(activeLink) {
		let parentWidth = navProgress.offsetWidth;
		let parentHeight = navProgress.offsetHeight;

		// Get the active link's position relative to the parent
		let parentRect = navProgress.getBoundingClientRect();
		let linkRect = activeLink.getBoundingClientRect();
		let linkPos = {
			left: linkRect.left - parentRect.left + navProgress.scrollLeft,
			top: linkRect.top - parentRect.top + navProgress.scrollTop,
		};

		let linkWidth = activeLink.offsetWidth;
		let linkHeight = activeLink.offsetHeight;

		// Calculate percentage values relative to parent dimensions
		let leftPercent = (linkPos.left / parentWidth) * 100;
		let topPercent = (linkPos.top / parentHeight) * 100;
		let widthPercent = (linkWidth / parentWidth) * 100;
		let heightPercent = (linkHeight / parentHeight) * 100;

		// Update the indicator with a smooth CSS transition (set in your CSS)
		indicator.style.left = leftPercent + '%';
		indicator.style.top = topPercent + '%';
		indicator.style.width = widthPercent + '%';
		indicator.style.height = heightPercent + '%';
		indicator.style.opacity = '1';
	}

	// Get all anchor sections
	let progressAnchors = gsap.utils.toArray('[data-progress-nav-anchor]');
	function scrollActiveIntoView(activeLink) {
		const list = navProgress; // your scrollable pill (.progress-nav__list)
		if (!list) return;

		const listRect = list.getBoundingClientRect();
		const linkRect = activeLink.getBoundingClientRect();

		// If link is clipped left/right, scroll just enough to reveal it (with padding)
		const pad = 16; // px breathing room inside the pill
		const leftDiff = linkRect.left - listRect.left;
		const rightDiff = linkRect.right - listRect.right;

		if (leftDiff < pad) {
			list.scrollBy({ left: leftDiff - pad, behavior: 'smooth' });
		} else if (rightDiff > -pad) {
			list.scrollBy({ left: rightDiff + pad, behavior: 'smooth' });
		}
	}

	progressAnchors.forEach((progressAnchor) => {
		let anchorID = progressAnchor.getAttribute('id');

		ScrollTrigger.create({
			trigger: progressAnchor,
			start: '0% 50%',
			end: '100% 50%',
			onEnter: () => {
				let activeLink = navProgress.querySelector(
					'[data-progress-nav-target="#' + anchorID + '"]',
				);
				activeLink.classList.add('is--active');
				// Remove 'is--active' class from sibling links
				let siblings = navProgress.querySelectorAll(
					'[data-progress-nav-target]',
				);
				siblings.forEach((sib) => {
					if (sib !== activeLink) {
						sib.classList.remove('is--active');
					}
				});
				updateIndicator(activeLink);
				scrollActiveIntoView(activeLink);
			},
			onEnterBack: () => {
				let activeLink = navProgress.querySelector(
					'[data-progress-nav-target="#' + anchorID + '"]',
				);
				activeLink.classList.add('is--active');
				// Remove 'is--active' class from sibling links
				let siblings = navProgress.querySelectorAll(
					'[data-progress-nav-target]',
				);
				siblings.forEach((sib) => {
					if (sib !== activeLink) {
						sib.classList.remove('is--active');
					}
				});
				updateIndicator(activeLink);
				scrollActiveIntoView(activeLink);
			},
		});
	});
}

// Initialize One Page Progress Navigation
document.addEventListener('DOMContentLoaded', () => {
	initProgressNavigation();
});

window.addEventListener(
	'scroll',
	() => {
		document
			.querySelector('.site-logo-bar')
			?.classList.toggle('is--scrolled', window.scrollY > 8);
	},
	{ passive: true },
);

/* Lenis */
var lenis = null;

function initTypoScrollPreview() {
	var containers = document.querySelectorAll('[data-typo-scroll-init]');
	if (!containers.length) return;

	var hasInfinite = false;

	containers.forEach(function (container) {
		var isInfinite =
			container.getAttribute('data-typo-scroll-infinite') === 'true';

		if (isInfinite) {
			hasInfinite = true;

			var list = container.querySelector('[data-typo-scroll-list]');
			if (list) {
				var clone = list.cloneNode(true);
				clone.style.overflow = 'hidden';
				clone.style.height = '100dvh';
				container.appendChild(clone);
			}
		}
	});

	lenis = new Lenis({
		autoRaf: true,
		infinite: hasInfinite,
		syncTouch: hasInfinite,
	});

	if ('fonts' in document && document.fonts.ready) {
		document.fonts.ready.then(function () {
			if (lenis) {
				lenis.resize();
			}
		});
	}

	var isTouchDevice =
		'ontouchstart' in window ||
		navigator.maxTouchPoints > 0 ||
		navigator.msMaxTouchPoints > 0;

	if (isTouchDevice) {
		function updateActiveItems() {
			var viewportCenterY = window.innerHeight / 2;

			containers.forEach(function (container) {
				var items = container.querySelectorAll('[data-typo-scroll-item]');
				if (!items.length) return;

				var containerRect = container.getBoundingClientRect();

				if (
					viewportCenterY < containerRect.top ||
					viewportCenterY > containerRect.bottom
				) {
					items.forEach(function (item) {
						item.setAttribute('data-typo-scroll-item', '');
					});
					return;
				}

				var closestItem = null;
				var closestDistance = Infinity;

				items.forEach(function (item) {
					var rect = item.getBoundingClientRect();
					if (rect.bottom < 0 || rect.top > window.innerHeight) return;

					var itemCenterY = rect.top + rect.height / 2;
					var distance = Math.abs(viewportCenterY - itemCenterY);

					if (distance < closestDistance) {
						closestDistance = distance;
						closestItem = item;
					}
				});

				if (!closestItem) {
					items.forEach(function (item) {
						item.setAttribute('data-typo-scroll-item', '');
					});
					return;
				}

				items.forEach(function (item) {
					item.setAttribute(
						'data-typo-scroll-item',
						item === closestItem ? 'active' : '',
					);
				});
			});

			requestAnimationFrame(updateActiveItems);
		}

		requestAnimationFrame(updateActiveItems);
	} else {
		containers.forEach(function (container) {
			var items = container.querySelectorAll('[data-typo-scroll-item]');
			if (!items.length) return;

			function setActive(target) {
				items.forEach(function (item) {
					item.setAttribute(
						'data-typo-scroll-item',
						item === target ? 'active' : '',
					);
				});
			}

			function clearActive() {
				items.forEach(function (item) {
					item.setAttribute('data-typo-scroll-item', '');
				});
			}

			items.forEach(function (item) {
				item.addEventListener('mouseenter', function () {
					setActive(item);
				});
			});

			container.addEventListener('mouseleave', function () {
				clearActive();
			});
		});
	}
}

// Initialize Big Typo Scroll Preview (Infinite)
document.addEventListener('DOMContentLoaded', function () {
	initTypoScrollPreview();
});

function initBunnyPlayerBackground() {
	document
		.querySelectorAll('[data-bunny-background-init]')
		.forEach(function (player) {
			var src = player.getAttribute('data-player-src');
			if (!src) return;

			var video = player.querySelector('video');
			if (!video) return;

			try {
				video.pause();
			} catch (_) {}
			try {
				video.removeAttribute('src');
				video.load();
			} catch (_) {}

			// Attribute helpers
			function setStatus(s) {
				if (player.getAttribute('data-player-status') !== s) {
					player.setAttribute('data-player-status', s);
				}
			}
			function setActivated(v) {
				player.setAttribute('data-player-activated', v ? 'true' : 'false');
			}
			if (!player.hasAttribute('data-player-activated')) setActivated(false);

			// Flags
			var lazyMode = player.getAttribute('data-player-lazy'); // "true" | "false" (no meta)
			var isLazyTrue = lazyMode === 'true';
			var autoplay = player.getAttribute('data-player-autoplay') === 'true';
			var initialMuted = player.getAttribute('data-player-muted') === 'true';

			// Used to suppress 'ready' flicker when user just pressed play in lazy modes
			var pendingPlay = false;

			// Autoplay forces muted + loop; IO will drive play/pause
			if (autoplay) {
				video.muted = true;
				video.loop = true;
			} else {
				video.muted = initialMuted;
			}

			video.setAttribute('muted', '');
			video.setAttribute('playsinline', '');
			video.setAttribute('webkit-playsinline', '');
			video.playsInline = true;
			if (typeof video.disableRemotePlayback !== 'undefined')
				video.disableRemotePlayback = true;
			if (autoplay) video.autoplay = false;

			var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
			var canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

			// Attach media only once (for actual playback)
			var isAttached = false;
			var userInteracted = false;
			var lastPauseBy = ''; // 'io' | 'manual' | ''
			function attachMediaOnce() {
				if (isAttached) return;
				isAttached = true;

				if (player._hls) {
					try {
						player._hls.destroy();
					} catch (_) {}
					player._hls = null;
				}

				if (isSafariNative) {
					video.preload = isLazyTrue ? 'none' : 'auto';
					video.src = src;
					video.addEventListener(
						'loadedmetadata',
						function () {
							readyIfIdle(player, pendingPlay);
						},
						{ once: true },
					);
				} else if (canUseHlsJs) {
					var hls = new Hls({ maxBufferLength: 10 });
					hls.attachMedia(video);
					hls.on(Hls.Events.MEDIA_ATTACHED, function () {
						hls.loadSource(src);
					});
					hls.on(Hls.Events.MANIFEST_PARSED, function () {
						readyIfIdle(player, pendingPlay);
					});
					player._hls = hls;
				} else {
					video.src = src;
				}
			}

			// Initialize based on lazy mode
			if (isLazyTrue) {
				video.preload = 'none';
			} else {
				attachMediaOnce();
			}

			// Toggle play/pause
			function togglePlay() {
				userInteracted = true;
				if (video.paused || video.ended) {
					if (isLazyTrue && !isAttached) attachMediaOnce();
					pendingPlay = true;
					lastPauseBy = '';
					setStatus('loading');
					safePlay(video);
				} else {
					lastPauseBy = 'manual';
					video.pause();
				}
			}

			// Toggle mute
			function toggleMute() {
				video.muted = !video.muted;
				player.setAttribute(
					'data-player-muted',
					video.muted ? 'true' : 'false',
				);
			}

			// Controls (delegated)
			player.addEventListener('click', function (e) {
				var btn = e.target.closest('[data-player-control]');
				if (!btn || !player.contains(btn)) return;
				var type = btn.getAttribute('data-player-control');
				if (type === 'play' || type === 'pause' || type === 'playpause')
					togglePlay();
				else if (type === 'mute') toggleMute();
			});

			// Media event wiring
			video.addEventListener('play', function () {
				setActivated(true);
				setStatus('playing');
			});
			video.addEventListener('playing', function () {
				pendingPlay = false;
				setStatus('playing');
			});
			video.addEventListener('pause', function () {
				pendingPlay = false;
				setStatus('paused');
			});
			video.addEventListener('waiting', function () {
				setStatus('loading');
			});
			video.addEventListener('canplay', function () {
				readyIfIdle(player, pendingPlay);
			});
			video.addEventListener('ended', function () {
				pendingPlay = false;
				setStatus('paused');
				setActivated(false);
			});

			// In-view auto play/pause (only when autoplay is true)
			if (autoplay) {
				if (player._io) {
					try {
						player._io.disconnect();
					} catch (_) {}
				}
				var io = new IntersectionObserver(
					function (entries) {
						entries.forEach(function (entry) {
							var inView = entry.isIntersecting && entry.intersectionRatio > 0;
							if (inView) {
								if (isLazyTrue && !isAttached) attachMediaOnce();
								if (
									lastPauseBy === 'io' ||
									(video.paused && lastPauseBy !== 'manual')
								) {
									setStatus('loading');
									if (video.paused) togglePlay();
									lastPauseBy = '';
								}
							} else {
								if (!video.paused && !video.ended) {
									lastPauseBy = 'io';
									video.pause();
								}
							}
						});
					},
					{ threshold: 0.1 },
				);
				io.observe(player);
				player._io = io;
			}
		});

	// Helper: Ready status guard
	function readyIfIdle(player, pendingPlay) {
		if (
			!pendingPlay &&
			player.getAttribute('data-player-activated') !== 'true' &&
			player.getAttribute('data-player-status') === 'idle'
		) {
			player.setAttribute('data-player-status', 'ready');
		}
	}

	// Helper: safe programmatic play
	function safePlay(video) {
		var p = video.play();
		if (p && typeof p.then === 'function') p.catch(function () {});
	}
}

// Initialize Bunny HTML HLS Player (Background)
document.addEventListener('DOMContentLoaded', function () {
	initBunnyPlayerBackground();
});

// Parallax drift for the Demo Section title stack (layered depth option)
// Requires GSAP + ScrollTrigger already loaded and registered elsewhere.

function initDemoTitleParallax() {
	const sections = document.querySelectorAll('.demo-section');
	if (!sections.length) return;

	sections.forEach((section) => {
		const title = section.querySelector('.demo-section__title-stack');
		if (!title) return;

		const logo = title.querySelector('.demo-section__title-media');
		const details = title.querySelector('.demo-section__details');
		const kicker = title.querySelector('.demo-section__kicker');

		// Base drift (subtle)
		gsap.fromTo(
			title,
			{ y: 14 },
			{
				y: -14,
				ease: 'none',
				scrollTrigger: {
					trigger: section,
					start: 'top bottom',
					end: 'bottom top',
					scrub: true,
				},
			},
		);

		// Layered depth (slightly different drifts)
		if (logo) {
			gsap.fromTo(
				logo,
				{ y: 10 },
				{
					y: -10,
					ease: 'none',
					scrollTrigger: {
						trigger: section,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
					},
				},
			);
		}

		if (details) {
			gsap.fromTo(
				details,
				{ y: 22 },
				{
					y: -22,
					ease: 'none',
					scrollTrigger: {
						trigger: section,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
					},
				},
			);
		}

		if (kicker) {
			gsap.fromTo(
				kicker,
				{ y: 6 },
				{
					y: -6,
					ease: 'none',
					scrollTrigger: {
						trigger: section,
						start: 'top bottom',
						end: 'bottom top',
						scrub: true,
					},
				},
			);
		}
	});
}

document.addEventListener('DOMContentLoaded', () => {
	initDemoTitleParallax();
});
