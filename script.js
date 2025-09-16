document.addEventListener('DOMContentLoaded', async function () {
	// Startup safety: remove any lingering full-screen overlays that could block clicks
	try {
		const staleOverlay = document.getElementById('paymentProofViewerOverlay');
		if (staleOverlay && staleOverlay.parentNode) {
			staleOverlay.parentNode.removeChild(staleOverlay);
		}
		if (window.closeFloatingViewer) { window.closeFloatingViewer(); }
		// Ensure no modal is left open accidentally on load
		document.querySelectorAll('.modal').forEach(m => { m.style.display = 'none'; });
	} catch (_) {}
	
	// Load words from Supabase or localStorage fallback
	let allWords = [];
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.getWords();
			if (result.success && Array.isArray(result.data) && result.data.length > 0) {
				allWords = result.data || [];
			} else {
				console.warn('Supabase returned no words; falling back to localStorage');
				allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
			}
		} catch (error) {
			console.warn('Error loading words from Supabase:', error);
			allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		}
	} else {
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
	}

	// Apply plan-based word access limitations
	let baseWords = window.getAccessibleWords ? window.getAccessibleWords(allWords) : allWords;

	// Track selected HSK level and filter words accordingly
	function getSelectedHskLevel() {
		// Prefer source of truth from Supabase, fallback to localStorage
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const currentUser = getCurrentUser();
				if (currentUser && currentUser.current_hsk_level) {
					return String(currentUser.current_hsk_level);
				}
			} catch(_) {}
		}
		
		// Fallback to localStorage
		try {
			const stored = localStorage.getItem('fizflashcard_current_hsk_level');
			if (stored) return String(stored);
		} catch(_) {}
		
		// Fallback to DOM label if storage not available
		const levelEl = document.getElementById('selectedHsk');
		if (!levelEl) return '4';
		const txt = (levelEl.textContent || '').trim();
		const match = txt.match(/HSK\s*(\d+)/i);
		return match ? match[1] : '4';
	}

	function filterWordsByHsk(all) {
		const level = getSelectedHskLevel();
		return all.filter(w => String(w.hskLevel || '4') === String(level));
	}

	// Active subset and sequencing
	let hsk4Words = filterWordsByHsk(baseWords).slice();
	let currentWordIndex = 0;
	let currentOrder = [];
	let currentOrderPos = 0;
	let masteredWords = [];
	let reviewWords = [];

	const flashcardPage = document.getElementById('flashcardPage');
	const plansPage = document.getElementById('plansPage');
	const materialsPage = document.getElementById('materialsPage');
	const accountPage = document.getElementById('accountPage');
	const navLinks = document.querySelectorAll('.nav-link');
	const flashcard = document.querySelector('.flashcard');
	const masterBtn = document.querySelector('.master-btn');
	const reviewBtn = document.querySelector('.review-btn');
	const previousBtn = document.querySelector('.previous-btn');
	const nextBtn = document.querySelector('.next-btn');
	const groupOptions = document.querySelectorAll('.group-option');
	const masteredWordsCard = document.getElementById('masteredWords');
	const remainingWordsCard = document.getElementById('remainingWords');
	const reviewWordsCard = document.getElementById('reviewWords');
	const progressFill = document.querySelector('.progress-fill');
	const progressText = document.querySelector('.progress-header span:last-child');

	// Overall progress elements
	const overallMasteredWordsCard = document.getElementById('overallMasteredWords');
	const overallRemainingWordsCard = document.getElementById('overallRemainingWords');
	const overallReviewWordsCard = document.getElementById('overallReviewWords');
	const overallBookmarksCard = document.getElementById('overallBookmarks');
	const overallProgressFill = document.getElementById('overallProgressFill');
	const overallProgressText = document.querySelector('#overallProgressHskLevel').nextElementSibling;
	const selectedGroupNameEl = document.getElementById('selectedGroupName');

	function updateFlashcard() {
		const word = hsk4Words[currentWordIndex];
		if (!word) {
			document.querySelector('.chinese-character').textContent = '';
			document.querySelector('.pinyin').textContent = '';
			document.querySelector('.meaning').textContent = '';
			document.querySelector('.bangla').textContent = '';
			return;
		}
		document.querySelector('.chinese-character').textContent = word.chinese || '';
		document.querySelector('.pinyin').textContent = word.pinyin || '';
		document.querySelector('.meaning').textContent = word.english || '';
		document.querySelector('.bangla').textContent = word.bangla || "";
	}

	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	function rebuildOrder() {
		currentOrder = shuffleArray([...Array(hsk4Words.length).keys()]);
		currentOrderPos = 0;
		currentWordIndex = currentOrder.length ? currentOrder[0] : 0;
	}

	function nextWord() {
		flashcard.classList.remove('flipped');
		if (hsk4Words.length === 0) return;
		currentOrderPos = (currentOrderPos + 1) % hsk4Words.length;
		currentWordIndex = currentOrder[currentOrderPos];
		updateFlashcard();
		// Refresh bookmark indicator for the new word
		try { updateBookmarkUI(); } catch(_) {}
	}

	function previousWord() {
		flashcard.classList.remove('flipped');
		if (hsk4Words.length === 0) return;
		currentOrderPos = (currentOrderPos - 1 + hsk4Words.length) % hsk4Words.length;
		currentWordIndex = currentOrder[currentOrderPos];
		updateFlashcard();
		// Refresh bookmark indicator for the new word
		try { updateBookmarkUI(); } catch(_) {}
	}

	// Load completed words for current group
	async function loadMasteredWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const currentUser = getCurrentUser();
				if (currentUser) {
					const result = await window.supabaseConfig.getUserProgress(currentUser.id);
					if (result.success && result.data) {
						const progress = result.data.find(p => 
							p.hsk_level === parseInt(level) && 
							p.group_range === groupRange && 
							p.progress_type === 'mastered'
						);
						return progress ? progress.word_indices : [];
					}
				}
			} catch (error) {
				console.warn('Error loading mastered words from Supabase:', error);
			}
		}
		
		// Fallback to localStorage
		const key = `fizflashcard_mastered_hsk_${level}_group_${groupRange}`;
		return JSON.parse(localStorage.getItem(key) || '[]');
	}
	
	// Load review words for current group
	async function loadReviewWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const currentUser = getCurrentUser();
				if (currentUser) {
					const result = await window.supabaseConfig.getUserProgress(currentUser.id);
					if (result.success && result.data) {
						const progress = result.data.find(p => 
							p.hsk_level === parseInt(level) && 
							p.group_range === groupRange && 
							p.progress_type === 'review'
						);
						return progress ? progress.word_indices : [];
					}
				}
			} catch (error) {
				console.warn('Error loading review words from Supabase:', error);
			}
		}
		
		// Fallback to localStorage
		const key = `fizflashcard_review_hsk_${level}_group_${groupRange}`;
		return JSON.parse(localStorage.getItem(key) || '[]');
	}
	
	// Save completed words for current group
	async function saveMasteredWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const currentUser = getCurrentUser();
				if (currentUser) {
					const result = await window.supabaseConfig.updateUserProgress(currentUser.id, {
						hsk_level: parseInt(level),
						group_range: groupRange,
						progress_type: 'mastered',
						word_indices: masteredWords
					});
					if (!result.success) {
						console.warn('Failed to save mastered words to Supabase:', result.error);
					}
				}
			} catch (error) {
				console.warn('Error saving mastered words to Supabase:', error);
			}
		}
		
		// Fallback to localStorage
		const key = `fizflashcard_mastered_hsk_${level}_group_${groupRange}`;
		localStorage.setItem(key, JSON.stringify(masteredWords));
	}
	
	// Save review words for current group
	async function saveReviewWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const currentUser = getCurrentUser();
				if (currentUser) {
					const result = await window.supabaseConfig.updateUserProgress(currentUser.id, {
						hsk_level: parseInt(level),
						group_range: groupRange,
						progress_type: 'review',
						word_indices: reviewWords
					});
					if (!result.success) {
						console.warn('Failed to save review words to Supabase:', result.error);
					}
				}
			} catch (error) {
				console.warn('Error saving review words to Supabase:', error);
			}
		}
		
		// Fallback to localStorage
		const key = `fizflashcard_review_hsk_${level}_group_${groupRange}`;
		localStorage.setItem(key, JSON.stringify(reviewWords));
	}
	
	// Get current group range (e.g., "1-100", "101-200")
	function getCurrentGroupRange() {
		const activeGroup = document.querySelector('.group-option.active');
		return activeGroup ? activeGroup.getAttribute('data-group') : '1-100';
	}

	function updateProgress() {
		// Update group progress (current group only)
		updateGroupProgress();
		
		// Update overall progress (all groups in HSK level)
		updateOverallProgress();
		
		// Update group percentages
		updateGroupPercentages();
	}
	
	function updateGroupProgress() {
		// Get the total words for the current group only
		const totalWords = hsk4Words.length;
		
		// Get completed words count for the current group only
		const masteredCount = masteredWords.length;
		
		const reviewCount = reviewWords.length;
		const remainingCount = totalWords - masteredCount; // Correct formula: total - completed (NOT including review)
		const progressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

		progressFill.style.width = progressPercent + '%';
		progressText.textContent = progressPercent + '%';
		document.querySelector('#masteredWords .stat-number').textContent = masteredCount;
		document.querySelector('#remainingWords .stat-number').textContent = Math.max(0, remainingCount);
		document.querySelector('#reviewWords .stat-number').textContent = reviewCount;
		
		// Update progress header to show current group
		const progressHskEl = document.getElementById('progressHskLevel');
		if (progressHskEl) {
			// Completely hide this element
			progressHskEl.style.display = 'none';
		}
		
		// Update selected group name display
		if (selectedGroupNameEl) {
			const activeGroup = document.querySelector('.group-option.active');
				if (activeGroup) {
					// Get only the text content before the span element
					const spanElement = activeGroup.querySelector('span');
					if (spanElement) {
						// Get text content up to the span element
						const groupText = activeGroup.textContent.substring(0, activeGroup.textContent.indexOf(spanElement.textContent)).trim();
						selectedGroupNameEl.textContent = groupText;
					} else {
						// Fallback: remove any trailing percentage
						const groupText = activeGroup.textContent.replace(/\s+\d+%$/, '').trim();
						selectedGroupNameEl.textContent = groupText;
					}
				}
		}
	}
	
	function updateOverallProgress() {
		// Get all words for current HSK level
		const level = getSelectedHskLevel();
		const allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		const levelWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4';
			return String(wordHskLevel) === String(level);
		});
		
		// For overall progress, always show the full word count for the HSK level
		// regardless of plan restrictions
		const totalWords = levelWords.length;
		
		// Get all completed words for this HSK level across all groups
		const allCompletedWords = [];
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
		groupRanges.forEach(range => {
			const key = `fizflashcard_mastered_hsk_${level}_group_${range}`;
			const groupCompleted = JSON.parse(localStorage.getItem(key) || '[]');
			allCompletedWords.push(...groupCompleted);
		});
		
		// Get all review words for this HSK level across all groups
		const allReviewWords = [];
		groupRanges.forEach(range => {
			const key = `fizflashcard_review_hsk_${level}_group_${range}`;
			const groupReview = JSON.parse(localStorage.getItem(key) || '[]');
			allReviewWords.push(...groupReview);
		});
		
		// Get all bookmarks for this HSK level across all groups
		const allBookmarks = [];
		groupRanges.forEach(range => {
			const key = `fizflashcard_bookmarks_hsk_${level}_group_${range}`;
			const groupBookmarks = JSON.parse(localStorage.getItem(key) || '[]');
			allBookmarks.push(...groupBookmarks);
		});
		
		const masteredCount = allCompletedWords.length;
		const reviewCount = allReviewWords.length;
		const bookmarkCount = allBookmarks.length;
		const remainingCount = totalWords - masteredCount;
		const progressPercent = totalWords > 0 ? Math.round((masteredCount / totalWords) * 100) : 0;

		// Update overall progress elements
		if (overallProgressFill) overallProgressFill.style.width = progressPercent + '%';
		if (overallProgressText) overallProgressText.textContent = progressPercent + '%';
		if (overallMasteredWordsCard) overallMasteredWordsCard.querySelector('.stat-number').textContent = masteredCount;
		if (overallRemainingWordsCard) overallRemainingWordsCard.querySelector('.stat-number').textContent = Math.max(0, remainingCount);
		if (overallReviewWordsCard) overallReviewWordsCard.querySelector('.stat-number').textContent = reviewCount;
		if (overallBookmarksCard) overallBookmarksCard.querySelector('.stat-number').textContent = bookmarkCount;
		
		// Update overall progress header
		const overallProgressHskEl = document.getElementById('overallProgressHskLevel');
		if (overallProgressHskEl) {
			overallProgressHskEl.textContent = `HSK ${level}`;
		}
	}

	function updateRemainingWordsDisplay() {
		// Get total words for current group only
		const totalWords = hsk4Words.length;
		
		// Calculate remaining words: total - completed (NOT including review)
		const masteredCount = masteredWords.length;
		const remainingCount = totalWords - masteredCount;
		
		// Update remaining words count
		const remainingWordsEl = document.querySelector('#remainingWords .stat-number');
		if (remainingWordsEl) {
			remainingWordsEl.textContent = Math.max(0, remainingCount);
		}
	}

	function showPage(page) {
		console.log('Showing page:', page);
		console.log('materialsPage element:', materialsPage);
		
		// Get sidebar element
		const sidebar = document.querySelector('.sidebar');
		
		flashcardPage.style.display = page === 'home' ? 'block' : 'none';
		plansPage.style.display = page === 'plans' ? 'block' : 'none';
		materialsPage.style.display = page === 'materials' ? 'block' : 'none';
		accountPage.style.display = page === 'account' ? 'block' : 'none';
		const supportPageEl = document.getElementById('supportPage');
		if (supportPageEl) supportPageEl.style.display = page === 'support' ? 'block' : 'none';
		
		// Hide sidebar for materials page, show for other pages
		if (sidebar) {
			sidebar.style.display = (page === 'materials' || page === 'support') ? 'none' : 'block';
		}
		
		// Update navigation active state
		updateNavigationActiveState(page);
		
		console.log('Materials page display style:', materialsPage.style.display);
		
		// Initialize materials when materials page is shown
		if (page === 'materials') {
			console.log('Initializing materials...');
			loadBooks();
			loadTextbookSolutions();
		} else if (page === 'support') {
			try {
				const msgSrc = document.getElementById('adminMessageArea');
				const msgDst = document.getElementById('adminMessageAreaSupport');
				if (msgSrc && msgDst) {
					msgDst.innerHTML = msgSrc.innerHTML;
				}
			} catch (_) {}
		}
	}

	function updateNavigationActiveState(activePage) {
		// Remove active class from all navigation links
		document.querySelectorAll('.nav-link').forEach(link => {
			link.classList.remove('active');
		});
		
		// Add active class to all links for the current page
		const activeLinks = document.querySelectorAll(`.nav-link[data-page="${activePage}"]`);
		activeLinks.forEach(link => {
			link.classList.add('active');
		});
		
		console.log(`Updated navigation active state for page: ${activePage}, found ${activeLinks.length} links`);
	}

	function showWordList(title, indices, showRemoveButton = false) {
		const modal = document.getElementById('wordListModal');
		const tbody = document.getElementById('wordListBody');
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		document.getElementById('wordListTitle').textContent = `${title} - HSK ${level} Group ${groupRange}`;
		tbody.innerHTML = '';
		
		if (indices.length === 0) {
			const tr = document.createElement('tr');
			const colspan = showRemoveButton ? '5' : '4';
			tr.innerHTML = `<td colspan="${colspan}" style="padding:12px; text-align:center; color:#6c757d;">No words found</td>`;
			tbody.appendChild(tr);
		} else {
			indices.forEach(i => {
				const w = hsk4Words[i];
				if (!w) return;
				const tr = document.createElement('tr');
				const removeButton = showRemoveButton ? 
					`<td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
						<button data-word-index="${i}" class="remove-word-btn" style="padding:6px 10px; border:none; border-radius:6px; background:#dc3545; color:#fff; cursor:pointer;">Remove</button>
					</td>` : '';
				tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;">${w.chinese || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.pinyin || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.english || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.bangla || '-'}</td>
				${removeButton}`;
				tbody.appendChild(tr);
			});
		}
		openModal(modal);
		
		// Attach removal handlers if remove buttons are shown
		if (showRemoveButton) {
			modal.querySelectorAll('.remove-word-btn').forEach(btn => {
				btn.addEventListener('click', async (ev) => {
					ev.stopPropagation();
					const wordIndex = parseInt(btn.getAttribute('data-word-index'));
					
					// Remove from review words if it's a review word
					if (title === 'Words to Review') {
						const reviewIndex = reviewWords.indexOf(wordIndex);
						if (reviewIndex >= 0) {
							reviewWords.splice(reviewIndex, 1);
							await saveReviewWords();
							updateProgress();
							updateGroupPercentages();
						}
					}
					
					// Remove the row from the table
					btn.closest('tr')?.remove();
					
					// If table is now empty, insert notice
					if (!tbody.querySelector('tr')) {
						const tr = document.createElement('tr');
						tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No words found</td>`;
						tbody.appendChild(tr);
					}
				});
			});
		}
	}

	function openModal(modal) {
		modal.style.display = 'flex';
	}

	// Special function for showing remaining words across all HSK level
	function showRemainingWordsList(title, indices, allWords) {
		const modal = document.getElementById('wordListModal');
		const tbody = document.getElementById('wordListBody');
		const level = getSelectedHskLevel();
		document.getElementById('wordListTitle').textContent = `${title} - HSK ${level} (All Groups)`;
		tbody.innerHTML = '';
		
		if (indices.length === 0) {
			const tr = document.createElement('tr');
			tr.innerHTML = `<td colspan="4" style="padding:12px; text-align:center; color:#6c757d;">No remaining words found</td>`;
			tbody.appendChild(tr);
		} else {
			indices.forEach(i => {
				const w = allWords[i];
				if (!w) return;
				const tr = document.createElement('tr');
				tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;">${w.chinese || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.pinyin || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.english || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.bangla || '-'}</td>`;
				tbody.appendChild(tr);
			});
		}
		openModal(modal);
	}
	
	// Function for showing overall word lists (across all groups)
	function showOverallWordList(title, type, showRemoveButton = false) {
		const modal = document.getElementById('wordListModal');
		const tbody = document.getElementById('wordListBody');
		const level = getSelectedHskLevel();
		document.getElementById('wordListTitle').textContent = `${title} - HSK ${level} (All Groups)`;
		tbody.innerHTML = '';
		
		// Get all words for current HSK level
		const allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		const levelWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4';
			return String(wordHskLevel) === String(level);
		});
		// For overall progress, use all words regardless of plan restrictions
		const accessibleWords = levelWords;
		
		// Get word indices based on type
		let wordIndices = [];
		if (type === 'mastered') {
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				const key = `fizflashcard_mastered_hsk_${level}_group_${range}`;
				const groupCompleted = JSON.parse(localStorage.getItem(key) || '[]');
				wordIndices.push(...groupCompleted);
			});
		} else if (type === 'review') {
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				const key = `fizflashcard_review_hsk_${level}_group_${range}`;
				const groupReview = JSON.parse(localStorage.getItem(key) || '[]');
				wordIndices.push(...groupReview);
			});
		} else if (type === 'remaining') {
			const allCompletedWords = [];
			const allReviewWords = [];
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				const masteredKey = `fizflashcard_mastered_hsk_${level}_group_${range}`;
				const reviewKey = `fizflashcard_review_hsk_${level}_group_${range}`;
				const groupCompleted = JSON.parse(localStorage.getItem(masteredKey) || '[]');
				const groupReview = JSON.parse(localStorage.getItem(reviewKey) || '[]');
				allCompletedWords.push(...groupCompleted);
				allReviewWords.push(...groupReview);
			});
			wordIndices = Array.from(Array(accessibleWords.length).keys())
				.filter(i => !allCompletedWords.includes(i) && !allReviewWords.includes(i));
		}
		
		if (wordIndices.length === 0) {
			const tr = document.createElement('tr');
			const colspan = showRemoveButton ? '5' : '4';
			tr.innerHTML = `<td colspan="${colspan}" style="padding:12px; text-align:center; color:#6c757d;">No words found</td>`;
			tbody.appendChild(tr);
		} else {
			wordIndices.forEach(i => {
				const w = accessibleWords[i];
				if (!w) return;
				const tr = document.createElement('tr');
				const removeButton = showRemoveButton ? 
					`<td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
						<button data-word-index="${i}" class="remove-overall-word-btn" style="padding:6px 10px; border:none; border-radius:6px; background:#dc3545; color:#fff; cursor:pointer;">Remove</button>
					</td>` : '';
				tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;">${w.chinese || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.pinyin || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.english || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${w.bangla || '-'}</td>
				${removeButton}`;
				tbody.appendChild(tr);
			});
		}
		openModal(modal);
		
		// Attach removal handlers if remove buttons are shown
		if (showRemoveButton) {
			modal.querySelectorAll('.remove-overall-word-btn').forEach(btn => {
				btn.addEventListener('click', (ev) => {
					ev.stopPropagation();
					const wordIndex = parseInt(btn.getAttribute('data-word-index'));
					
					// Remove from all groups where this word might be in review
					const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
					groupRanges.forEach(range => {
						const key = `fizflashcard_review_hsk_${level}_group_${range}`;
						const groupReview = JSON.parse(localStorage.getItem(key) || '[]');
						const index = groupReview.indexOf(wordIndex);
						if (index >= 0) {
							groupReview.splice(index, 1);
							localStorage.setItem(key, JSON.stringify(groupReview));
						}
					});
					
					// Remove the row from the table
					btn.closest('tr')?.remove();
					
					// Update progress
					updateProgress();
					
					// If table is now empty, insert notice
					if (!tbody.querySelector('tr')) {
						const tr = document.createElement('tr');
						tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No words found</td>`;
						tbody.appendChild(tr);
					}
				});
			});
		}
	}
	
	// Function for showing overall bookmarks
	function showOverallBookmarkList() {
		const modal = document.getElementById('wordListModal');
		const tbody = document.getElementById('wordListBody');
		const titleEl = document.getElementById('wordListTitle');
			const level = getSelectedHskLevel();
		titleEl.textContent = `Bookmarked Words - HSK ${level} (All Groups)`;
		tbody.innerHTML = '';

		// Get all words for current HSK level
			const allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
			const levelWords = allWords.filter(word => {
				const wordHskLevel = word.hskLevel || '4';
				return String(wordHskLevel) === String(level);
			});
		// For overall progress, use all words regardless of plan restrictions
		const accessibleWords = levelWords;
			
		// Get all bookmarks for this HSK level across all groups
		const allBookmarks = [];
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
		groupRanges.forEach(range => {
			const key = `fizflashcard_bookmarks_hsk_${level}_group_${range}`;
			const groupBookmarks = JSON.parse(localStorage.getItem(key) || '[]');
			allBookmarks.push(...groupBookmarks);
		});
		
		const rows = [];
		allBookmarks.forEach(key => {
			const word = accessibleWords.find(w => computeWordKey(w) === key);
			if (!word) return;
			const tr = document.createElement('tr');
			tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;">${word.chinese || ''}</td>
			<td style="padding:10px; border-bottom:1px solid #eee;">${word.pinyin || ''}</td>
			<td style="padding:10px; border-bottom:1px solid #eee;">${word.english || ''}</td>
			<td style="padding:10px; border-bottom:1px solid #eee;">${word.bangla || '-'}</td>
			<td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
				<button data-bm-key="${key}" class="remove-bookmark-btn" style="padding:6px 10px; border:none; border-radius:6px; background:#dc3545; color:#fff; cursor:pointer;">Remove</button>
			</td>`;
			rows.push(tr);
		});
		
		// If no bookmarks, show an empty row
		if (rows.length === 0) {
			const tr = document.createElement('tr');
			tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No bookmarks yet for HSK ${level}</td>`;
			rows.push(tr);
		}
		rows.forEach(tr => tbody.appendChild(tr));
		openModal(modal);

		// Attach removal handlers
		modal.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
			btn.addEventListener('click', (ev) => {
				ev.stopPropagation();
				const key = btn.getAttribute('data-bm-key');
				
				// Remove from all groups where this bookmark might exist
				groupRanges.forEach(range => {
					const bookmarkKey = `fizflashcard_bookmarks_hsk_${level}_group_${range}`;
					let list = JSON.parse(localStorage.getItem(bookmarkKey) || '[]');
					const i = list.indexOf(key);
					if (i >= 0) {
						list.splice(i, 1);
						localStorage.setItem(bookmarkKey, JSON.stringify(list));
					}
				});
				
				btn.closest('tr')?.remove();
				updateProgress();
				
				// If table is now empty, insert notice
				if (!tbody.querySelector('tr')) {
					const tr = document.createElement('tr');
					tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No bookmarks yet for HSK ${level}</td>`;
					tbody.appendChild(tr);
				}
			});
		});
	}

	function closeModal(modal) {
		modal.style.display = 'none';
	}
	
	// Function to show upgrade modal for free plan users
	function showUpgradeModal() {
		const modal = document.getElementById('wordListModal');
		const tbody = document.getElementById('wordListBody');
		const titleEl = document.getElementById('wordListTitle');
		const level = getSelectedHskLevel();
		
		titleEl.textContent = `Remaining Words - HSK ${level} (All Groups)`;
		tbody.innerHTML = '';
		
		// Create upgrade message
		const tr = document.createElement('tr');
		tr.innerHTML = `
			<td colspan="4" style="padding: 40px 20px; text-align: center; background: #f8f9fa; border-radius: 8px;">
				<div style="margin-bottom: 20px;">
					<i class="fas fa-lock" style="font-size: 3rem; color: #e74c3c; margin-bottom: 15px;"></i>
				</div>
				<h3 style="color: #2c3e50; margin-bottom: 15px;">🔒 Upgrade Required</h3>
				<p style="color: #6c757d; font-size: 1.1rem; margin-bottom: 20px; line-height: 1.5;">
					You are currently on the <strong>Free Plan</strong> and can only access Group 1 words.
				</p>
				<p style="color: #6c757d; font-size: 1rem; margin-bottom: 25px; line-height: 1.5;">
					To view all remaining words for HSK ${level} and access all groups, please upgrade your plan.
				</p>
				<button onclick="showPage('plans')" style="
					background: #2ecc71; 
					color: white; 
					border: none; 
					padding: 12px 24px; 
					border-radius: 6px; 
					font-size: 1rem; 
					font-weight: 500; 
					cursor: pointer;
					transition: background 0.3s ease;
				" onmouseover="this.style.background='#27ae60'" onmouseout="this.style.background='#2ecc71'">
					<i class="fas fa-arrow-up" style="margin-right: 8px;"></i>
					Upgrade Now
				</button>
			</td>
		`;
		tbody.appendChild(tr);
		openModal(modal);
	}

	// Event Listeners
	flashcard.addEventListener('click', () => {
		flashcard.classList.toggle('flipped');
	});

	masterBtn.addEventListener('click', async () => {
		if (!masteredWords.includes(currentWordIndex)) {
			// Add to local masteredWords array (for current group display)
			masteredWords.push(currentWordIndex);
			
			// Save group-specific completion data
		await saveMasteredWords();
			updateProgress();
			updateGroupPercentages();
		}
		nextWord();
	});

	reviewBtn.addEventListener('click', async () => {
		if (!reviewWords.includes(currentWordIndex)) {
			reviewWords.push(currentWordIndex);
			await saveReviewWords();
			updateProgress();
		}
		nextWord();
	});

	nextBtn.addEventListener('click', nextWord);

	previousBtn.addEventListener('click', previousWord);

	// Function to add group option listeners
	function addGroupOptionListeners() {
		const groupOptions = document.querySelectorAll('.group-option');
		groupOptions.forEach(option => {
			option.addEventListener('click', async () => {
				groupOptions.forEach(opt => opt.classList.remove('active'));
				option.classList.add('active');
				const range = option.getAttribute('data-group');
				await applyGroupRange(range);
			});
		});
	}

	function isFreePlan() {
		// Check both user storage systems
		const userId = localStorage.getItem('fizflashcard_user_id');
		const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
		
		console.log('isFreePlan() called - userId:', userId, 'currentUser:', currentUser);
		
		// If we have current user data, use that
		if (currentUser && currentUser.plan) {
			console.log('Free plan check - current user plan:', currentUser.plan, 'isFree:', currentUser.plan === 'free');
			return currentUser.plan === 'free';
		}
		
		// Fallback to users array
		if (!userId) {
			console.log('No userId found, returning true (free plan)');
			return true;
		}
		const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
		const user = users.find(u => u.id === userId);
		const isFree = !user || !user.plan || user.plan === 'free';
		console.log('Free plan check - user plan:', user?.plan, 'isFree:', isFree);
		return isFree;
	}

	async function applyGroupRange(rangeStr) {
		// Reload all words from Supabase or localStorage to get latest data
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const result = await window.supabaseConfig.getWords();
				if (result.success && Array.isArray(result.data) && result.data.length > 0) {
					allWords = result.data || [];
				} else {
					console.warn('Supabase returned no words during group switch; using localStorage');
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
				}
			} catch (error) {
				console.warn('Error loading words from Supabase:', error);
				allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
			}
		} else {
			allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		}
		
		const currentHskLevel = getSelectedHskLevel();
		
		// Filter words by HSK level first
		let levelWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4'; // Default to HSK 4 if not specified
			return String(wordHskLevel) === String(currentHskLevel);
		});
		
		// Apply plan-based access limitations
		baseWords = window.getAccessibleWords ? window.getAccessibleWords(levelWords) : levelWords;
		
		const parts = (rangeStr || '').split('-');
		let start = parseInt(parts[0] || '1', 10);
		let end = parseInt(parts[1] || String(baseWords.length), 10);
		if (isNaN(start) || isNaN(end)) { start = 1; end = baseWords.length; }
		
		// Enforce free-plan access - only allow Group 1
		if (isFreePlan() && start > 100) {
			alert('🔒 You are on the free plan. You can only access Group 1. Please upgrade your plan for full access.');
			// Reset to Group 1
			document.querySelectorAll('.group-option').forEach(opt => opt.classList.remove('active'));
			const firstGroup = document.querySelector('.group-option[data-group*="1-"]');
			if (firstGroup) {
				firstGroup.classList.add('active');
				rangeStr = firstGroup.getAttribute('data-group');
				const newParts = rangeStr.split('-');
				start = parseInt(newParts[0] || '1', 10);
				end = parseInt(newParts[1] || '100', 10);
			} else {
				start = 1; end = Math.min(100, baseWords.length);
			}
		}
		
		const s = Math.max(0, start - 1);
		const e = Math.min(baseWords.length, end);
		hsk4Words = baseWords.slice(s, e);
		if (!hsk4Words.length) {
			// Fallback to first N of this level only
			const maxN = isFreePlan() ? Math.min(100, baseWords.length) : baseWords.length;
			hsk4Words = baseWords.slice(0, maxN);
		}
		window.hsk4Words = hsk4Words;
		
		// Reload progress data for current group
		masteredWords = await loadMasteredWords();
		reviewWords = await loadReviewWords();
		
		rebuildOrder();
		updateFlashcard();
		updateProgress();
		updateRemainingWordsDisplay();
		try { updateBookmarkUI(); } catch(_) {}
	}

	// Add listeners to initial group options and initialize selection
	addGroupOptionListeners();
	
	// Force update group options to ensure lock icons are shown
	updateGroupOptionsForHskLevel();
	
	// Initialize with current group (async)
	(async () => {
	const activeGroup = document.querySelector('.group-option.active');
		await applyGroupRange(activeGroup ? activeGroup.getAttribute('data-group') : '1-100');
	})();
	
	// Ensure initial group text is set correctly
	if (selectedGroupNameEl) {
		selectedGroupNameEl.textContent = 'Group 1 (1-100)';
	}
	
	// Hide the HSK text element completely
	const progressHskEl = document.getElementById('progressHskLevel');
	if (progressHskEl) {
		progressHskEl.style.display = 'none';
	}

	// Ensure progress/bookmarks update immediately when switching HSK level
	async function handleHskLevelChange() {
		// Get current HSK level
		const levelEl = document.getElementById('selectedHsk');
		const level = levelEl ? levelEl.textContent.match(/HSK\s*(\d+)/i)?.[1] || '4' : '4';
		
		// Update localStorage to track current HSK level
		localStorage.setItem('fizflashcard_current_hsk_level', level);
		
		// Reload all words from Supabase or localStorage to get latest data
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			try {
				const result = await window.supabaseConfig.getWords();
				if (result.success && Array.isArray(result.data) && result.data.length > 0) {
					allWords = result.data || [];
				} else {
					console.warn('Supabase returned no words during HSK level change; using localStorage');
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
				}
			} catch (error) {
				console.warn('Error loading words from Supabase:', error);
				allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
			}
		} else {
			allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		}
		
		// Update group options to show only groups for this HSK level
		updateGroupOptionsForHskLevel();
		
		// Reset to first group and refresh data
		const firstGroup = document.querySelector('.group-option');
		if (firstGroup) {
			document.querySelectorAll('.group-option').forEach(opt => opt.classList.remove('active'));
			firstGroup.classList.add('active');
			await applyGroupRange(firstGroup.getAttribute('data-group'));
		}
		
		// Force immediate update of all progress displays
		updateProgress();
		updateBookmarkUI();
		updateRemainingWordsDisplay();
	}

	// Calculate progress percentage for a specific group
	function calculateGroupProgress(level, groupRange) {
		// Get all words for current HSK level
		const allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		const levelWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4';
			return String(wordHskLevel) === String(level);
		});
		const accessibleWords = window.getAccessibleWords ? window.getAccessibleWords(levelWords) : levelWords;
		
		// Parse group range (e.g., "1-50" or "101-200")
		const [startStr, endStr] = groupRange.split('-');
		const start = parseInt(startStr) - 1; // Convert to 0-based index
		const end = parseInt(endStr);
		
		// Get words in this group
		const groupWords = accessibleWords.slice(start, end);
		const totalWordsInGroup = groupWords.length;
		
		if (totalWordsInGroup === 0) return 0;
		
		// Load the completed words for this specific group
		const key = `fizflashcard_mastered_hsk_${level}_group_${groupRange}`;
		const completedWordsForGroup = JSON.parse(localStorage.getItem(key) || '[]');
		
		// Count completed words in this specific group
		const completedWordsInGroup = completedWordsForGroup.length;
		
		// Calculate percentage
		const percentage = Math.round((completedWordsInGroup / totalWordsInGroup) * 100);
		return percentage;
	}

	// Update group percentages after progress changes
	function updateGroupPercentages() {
		const level = getSelectedHskLevel();
		const groupOptions = document.querySelectorAll('.group-option');
		
		groupOptions.forEach(option => {
			const groupRange = option.getAttribute('data-group');
			const percentage = calculateGroupProgress(level, groupRange);
			const span = option.querySelector('span');
			if (span) {
				span.textContent = `${percentage}%`;
			}
		});
	}

	// Update group options based on current HSK level
	function updateGroupOptionsForHskLevel() {
		const level = getSelectedHskLevel();
		const groupContainer = document.querySelector('.group-options');
		if (!groupContainer) return;
		
		// Clear existing options
		groupContainer.innerHTML = '';
		
		// Define groups per HSK level
		const hskGroups = {
			'1': [
				{ range: '1-50', label: 'Group 1 (1-50)' },
				{ range: '51-100', label: 'Group 2 (51-100)' },
				{ range: '101-150', label: 'Group 3 (101-150)' },
				{ range: '1-150', label: 'All Words (1-150)' }
			],
			'2': [
				{ range: '1-50', label: 'Group 1 (1-50)' },
				{ range: '51-100', label: 'Group 2 (51-100)' },
				{ range: '101-150', label: 'Group 3 (101-150)' },
				{ range: '1-150', label: 'All Words (1-150)' }
			],
			'3': [
				{ range: '1-100', label: 'Group 1 (1-100)' },
				{ range: '101-200', label: 'Group 2 (101-200)' },
				{ range: '201-300', label: 'Group 3 (201-300)' },
				{ range: '1-300', label: 'All Words (1-300)' }
			],
			'4': [
				{ range: '1-100', label: 'Group 1 (1-100)' },
				{ range: '101-200', label: 'Group 2 (101-200)' },
				{ range: '201-300', label: 'Group 3 (201-300)' },
				{ range: '301-400', label: 'Group 4 (301-400)' },
				{ range: '401-500', label: 'Group 5 (401-500)' },
				{ range: '501-600', label: 'Group 6 (501-600)' },
				{ range: '1-600', label: 'All Words (1-600)' }
			],
			'5': [
            { range: '1-100', label: 'Group 1 (1-100)' },
            { range: '101-200', label: 'Group 2 (101-200)' },
            { range: '201-300', label: 'Group 3 (201-300)' },
            { range: '301-400', label: 'Group 4 (301-400)' },
            { range: '401-500', label: 'Group 5 (401-500)' },
            { range: '501-600', label: 'Group 6 (501-600)' },
            { range: '601-700', label: 'Group 7 (601-700)' },
            { range: '701-800', label: 'Group 8 (701-800)' },
            { range: '801-900', label: 'Group 9 (801-900)' },
            { range: '901-1000', label: 'Group 10 (901-1000)' },
            { range: '1001-1100', label: 'Group 11 (1001-1100)' },
            { range: '1101-1200', label: 'Group 12 (1101-1200)' },
            { range: '1201-1300', label: 'Group 13 (1201-1300)' },
				{ range: '1-1300', label: 'All Words (1-1300)' }
			],
			'6': [
				{ range: '1-433', label: 'Group 1 (1-433)' },
				{ range: '434-866', label: 'Group 2 (434-866)' },
				{ range: '867+', label: 'Group 3 (867+)' },
				{ range: '1-1300', label: 'All Words (1-1300)' }
			]
		};
		
		const groups = hskGroups[level] || hskGroups['4'];
		
		// Check if user is on free plan once
		const userIsFreePlan = isFreePlan();
		console.log('User is on free plan:', userIsFreePlan);
		
		groups.forEach((group, index) => {
			const div = document.createElement('div');
			div.className = 'group-option';
			div.setAttribute('data-group', group.range);
			
			// Calculate progress percentage for this group
			const percentage = calculateGroupProgress(level, group.range);
			
			// Check if this group is locked for free users
			const isLocked = userIsFreePlan && index > 0;
			const lockIcon = isLocked ? ' <i class="fas fa-lock" style="color: #e74c3c;"></i>' : '';
			
			console.log(`Group ${index}: ${group.label}, isFreePlan: ${userIsFreePlan}, isLocked: ${isLocked}`);
			
			div.innerHTML = `${group.label}${lockIcon} <span>${percentage}%</span>`;
			if (index === 0) div.classList.add('active');
			if (isLocked) div.style.opacity = '0.6';
			groupContainer.appendChild(div);
		});
		
		// Re-add event listeners
		addGroupOptionListeners();
	}

	// Listen to HSK dropdown options
	document.querySelectorAll('.hsk-option').forEach(opt => {
		opt.addEventListener('click', async () => {
			// Update the selected HSK display
			const level = opt.getAttribute('data-hsk');
			const levelEl = document.getElementById('selectedHsk');
			if (levelEl) {
				levelEl.textContent = `HSK ${level}`;
			}
			
			// Update active state
			document.querySelectorAll('.hsk-option').forEach(o => o.classList.remove('active'));
			opt.classList.add('active');
			
			// Update localStorage immediately
			localStorage.setItem('fizflashcard_current_hsk_level', level);
			
			// Refresh data for new level
			await handleHskLevelChange();
		});
	});

	// Initial bookmark indicator
	try { updateBookmarkUI(); } catch(_) {}

	// Bookmark support per group
	const bookmarkBtn = document.querySelector('.bookmark-toggle');
	function getBookmarkKey() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		return `fizflashcard_bookmarks_hsk_${level}_group_${groupRange}`;
	}
	function computeWordKey(word) {
		if (!word) return '';
		const level = getSelectedHskLevel();
		return `${level}::${word.chinese || ''}::${word.pinyin || ''}::${word.english || ''}`;
	}
	function loadBookmarks() {
		try { return JSON.parse(localStorage.getItem(getBookmarkKey())) || []; } catch(_) { return []; }
	}
	function saveBookmarks(arr) {
		localStorage.setItem(getBookmarkKey(), JSON.stringify(arr));
	}
	function updateBookmarkUI() {
		const word = hsk4Words[currentWordIndex];
		const key = computeWordKey(word);
		const bookmarks = loadBookmarks();
		const isBookmarked = !!key && bookmarks.includes(key);
		if (bookmarkBtn) bookmarkBtn.classList.toggle('active', isBookmarked);
		const bmCountEl = document.querySelector('#bookmarks .stat-number');
		if (bmCountEl) bmCountEl.textContent = String(bookmarks.length);
	}
	if (bookmarkBtn) {
		bookmarkBtn.addEventListener('click', (e) => {
			e.stopPropagation();
			if (!hsk4Words.length) return;
			const word = hsk4Words[currentWordIndex];
			const key = computeWordKey(word);
			if (!key) return;
			let bookmarks = loadBookmarks();
			const idx = bookmarks.indexOf(key);
			if (idx >= 0) bookmarks.splice(idx, 1); else bookmarks.push(key);
			saveBookmarks(bookmarks);
			updateBookmarkUI();
		});
	}

	// Click bookmarks stat to open list and allow removals
	(function initBookmarkListInteractions(){
		const bookmarksCard = document.getElementById('bookmarks');
		if (!bookmarksCard) return;
		bookmarksCard.addEventListener('click', () => {
			const modal = document.getElementById('wordListModal');
			const tbody = document.getElementById('wordListBody');
			const titleEl = document.getElementById('wordListTitle');
			const level = getSelectedHskLevel();
			const groupRange = getCurrentGroupRange();
			titleEl.textContent = `Bookmarked Words - HSK ${level} Group ${groupRange}`;
			tbody.innerHTML = '';

			// Get words for current group only
			const accessibleWords = hsk4Words;
			
			const bookmarks = loadBookmarks();
			const rows = [];
			bookmarks.forEach(key => {
				const word = accessibleWords.find(w => computeWordKey(w) === key);
				if (!word) return;
				const tr = document.createElement('tr');
				tr.innerHTML = `<td style="padding:10px; border-bottom:1px solid #eee;">${word.chinese || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${word.pinyin || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${word.english || ''}</td>
				<td style="padding:10px; border-bottom:1px solid #eee;">${word.bangla || '-'}</td>
				<td style="padding:10px; border-bottom:1px solid #eee; text-align:right;">
					<button data-bm-key="${key}" class="remove-bookmark-btn" style="padding:6px 10px; border:none; border-radius:6px; background:#dc3545; color:#fff; cursor:pointer;">Remove</button>
				</td>`;
				rows.push(tr);
			});
			// If no bookmarks, show an empty row
			if (rows.length === 0) {
				const tr = document.createElement('tr');
				tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No bookmarks yet for HSK ${level} Group ${groupRange}</td>`;
				rows.push(tr);
			}
			rows.forEach(tr => tbody.appendChild(tr));
			openModal(modal);

			// Attach removal handlers
			modal.querySelectorAll('.remove-bookmark-btn').forEach(btn => {
				btn.addEventListener('click', (ev) => {
					ev.stopPropagation();
					const key = btn.getAttribute('data-bm-key');
					let list = loadBookmarks();
					const i = list.indexOf(key);
					if (i >= 0) {
						list.splice(i, 1);
						saveBookmarks(list);
						btn.closest('tr')?.remove();
						updateBookmarkUI();
						// If table is now empty, insert notice
						if (!tbody.querySelector('tr')) {
							const tr = document.createElement('tr');
							tr.innerHTML = `<td colspan="5" style="padding:12px; text-align:center; color:#6c757d;">No bookmarks yet for HSK ${level} Group ${groupRange}</td>`;
							tbody.appendChild(tr);
						}
					}
				});
			});
		});
	})();

	navLinks.forEach(link => {
		link.addEventListener('click', (e) => {
			e.preventDefault();
			const page = link.getAttribute('data-page');
			console.log('Navigation clicked:', page); // Debug log
			
			// Safety: close any floating overlays that might block clicks
			if (window.closeFloatingViewer) {
				try { window.closeFloatingViewer(); } catch(_) {}
			}
			const stale = document.getElementById('paymentProofViewerOverlay');
			if (stale) { stale.parentNode.removeChild(stale); }
			
			showPage(page);
			
			// Update account page if navigating to account
			if (page === 'account') {
				updateAccountPage();
			}
		});
	});

	document.querySelectorAll('.close-modal').forEach(btn => {
		btn.addEventListener('click', (e) => {
			const modal = e.target.closest('.modal');
			closeModal(modal);
		});
	});

	document.getElementById('completePayment')?.addEventListener('click', () => {
		if (window.completePayment) {
			window.completePayment();
		} else {
			closeModal(document.getElementById('paymentModal'));
			openModal(document.getElementById('successModal'));
		}
	});

	document.getElementById('successOk')?.addEventListener('click', () => {
		closeModal(document.getElementById('successModal'));
	});

	document.getElementById('resetProgressBtn')?.addEventListener('click', () => {
		openModal(document.getElementById('resetModal'));
	});

	document.getElementById('confirmReset')?.addEventListener('click', () => {
		// Clear all group-specific progress data for current HSK level
		const level = getSelectedHskLevel();
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
		
		// Clear all group-specific data for current HSK level
		groupRanges.forEach(range => {
			localStorage.removeItem(`fizflashcard_mastered_hsk_${level}_group_${range}`);
			localStorage.removeItem(`fizflashcard_review_hsk_${level}_group_${range}`);
			localStorage.removeItem(`fizflashcard_bookmarks_hsk_${level}_group_${range}`);
		});
		
		// Clear local arrays
		masteredWords = [];
		reviewWords = [];
		currentWordIndex = 0;
		
		// Reload current group data (should be empty now)
		masteredWords = loadMasteredWords();
		reviewWords = loadReviewWords();
		
		// Update UI
		updateFlashcard();
		updateProgress();
		updateGroupPercentages();
		updateBookmarkUI();
		
		closeModal(document.getElementById('resetModal'));
		alert('All progress has been reset successfully!');
	});

	masteredWordsCard.addEventListener('click', () => {
		showWordList('Completed Words', masteredWords);
	});

	reviewWordsCard.addEventListener('click', () => {
		showWordList('Words to Review', reviewWords, true);
	});

	remainingWordsCard.addEventListener('click', () => {
		// Get all words for the current HSK level
		const level = getSelectedHskLevel();
		const allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		const levelWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4';
			return String(wordHskLevel) === String(level);
		});
		const accessibleWords = window.getAccessibleWords ? window.getAccessibleWords(levelWords) : levelWords;
		
		// Get all completed words for this HSK level across all groups
		const allCompletedWords = [];
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
		groupRanges.forEach(range => {
			const key = `fizflashcard_mastered_hsk_${level}_group_${range}`;
			const groupCompleted = JSON.parse(localStorage.getItem(key) || '[]');
			allCompletedWords.push(...groupCompleted);
		});
		
		// Get all review words for this HSK level across all groups
		const allReviewWords = [];
		groupRanges.forEach(range => {
			const key = `fizflashcard_review_hsk_${level}_group_${range}`;
			const groupReview = JSON.parse(localStorage.getItem(key) || '[]');
			allReviewWords.push(...groupReview);
		});
		
		// Find remaining words (not completed and not in review)
		const remaining = Array.from(Array(accessibleWords.length).keys())
			.filter(i => !allCompletedWords.includes(i) && !allReviewWords.includes(i));
		
		// Create a custom showWordList for remaining words that shows all HSK level words
		showRemainingWordsList('Remaining Words', remaining, accessibleWords);
	});

	// Overall progress card event listeners
	overallMasteredWordsCard.addEventListener('click', () => {
		showOverallWordList('Completed Words', 'mastered');
	});

	overallReviewWordsCard.addEventListener('click', () => {
		showOverallWordList('Words to Review', 'review', true);
	});

	overallRemainingWordsCard.addEventListener('click', () => {
		// Check if user is on free plan
		if (isFreePlan()) {
			showUpgradeModal();
		} else {
			showOverallWordList('Remaining Words', 'remaining');
		}
	});

	overallBookmarksCard.addEventListener('click', () => {
		showOverallBookmarkList();
	});

	// Function to refresh word data (called by admin)
	window.refreshWordData = async function() {
		// Reload all words from localStorage
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		const currentHskLevel = localStorage.getItem('fizflashcard_current_hsk_level') || '4';
		
		// Filter words by current HSK level
		let filteredWords = allWords.filter(word => {
			const wordHskLevel = word.hskLevel || '4';
			return String(wordHskLevel) === String(currentHskLevel);
		});
		
		// Apply plan-based access limitations
		baseWords = window.getAccessibleWords ? window.getAccessibleWords(filteredWords) : filteredWords;
		
		// Get current group selection
		const activeGroup = document.querySelector('.group-option.active');
		const rangeStr = activeGroup ? activeGroup.getAttribute('data-group') : '1-100';
		
		// Apply group range
		const parts = (rangeStr || '').split('-');
		let start = parseInt(parts[0] || '1', 10);
		let end = parseInt(parts[1] || String(baseWords.length), 10);
		if (isNaN(start) || isNaN(end)) { start = 1; end = baseWords.length; }
		
		const s = Math.max(0, start - 1);
		const e = Math.min(baseWords.length, end);
		hsk4Words = baseWords.slice(s, e);
		
		if (!hsk4Words.length) {
			const maxN = isFreePlan() ? Math.min(100, baseWords.length) : baseWords.length;
			hsk4Words = baseWords.slice(0, maxN);
		}
		
		window.hsk4Words = hsk4Words;
		
		// Reload progress data for current group
		masteredWords = await loadMasteredWords();
		reviewWords = await loadReviewWords();
		
		rebuildOrder();
		updateFlashcard();
		updateProgress();
		updateRemainingWordsDisplay();
		updateBookmarkUI();
	};

	// Make addGroupOptionListeners globally available
	window.addGroupOptionListeners = addGroupOptionListeners;

	// Initialize mobile menu
	function initializeMobileMenu() {
	const mobileMenuToggle = document.getElementById('mobileMenuToggle');
	const mobileNav = document.getElementById('mobileNav');
		
		console.log('Mobile menu elements:', { mobileMenuToggle, mobileNav });
		
	if (mobileMenuToggle && mobileNav) {
			// Add both click and touch events for better mobile support
			const toggleMenu = (e) => {
				e.preventDefault();
				e.stopPropagation();
				console.log('Mobile menu toggle clicked/touched');
			mobileNav.classList.toggle('active');
				console.log('Mobile nav classes after toggle:', mobileNav.className);
				
				// Force visibility for mobile
				if (mobileNav.classList.contains('active')) {
					mobileNav.style.left = '0px';
					mobileNav.style.display = 'block';
					mobileNav.style.visibility = 'visible';
					mobileNav.style.zIndex = '9999';
					console.log('Menu opened');
				} else {
					mobileNav.style.left = '-100%';
					console.log('Menu closed');
				}
			};
			
			mobileMenuToggle.addEventListener('click', toggleMenu);
			mobileMenuToggle.addEventListener('touchend', toggleMenu);
		
		// Close mobile menu when clicking nav links
		document.querySelectorAll('#mobileNav .nav-link').forEach(link => {
			link.addEventListener('click', () => {
				mobileNav.classList.remove('active');
					mobileNav.style.left = '-100%';
			});
		});
			
			// Close mobile menu when clicking outside
			document.addEventListener('click', (e) => {
				if (!mobileNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
					mobileNav.classList.remove('active');
					mobileNav.style.left = '-100%';
				}
			});
			
			// Prevent mobile nav from closing when clicking inside it
			mobileNav.addEventListener('click', (e) => {
				e.stopPropagation();
			});
		} else {
			console.error('Mobile menu elements not found!');
		}
	}
	
	// Initialize password visibility toggles
	function initializePasswordToggles() {
		// Login password toggle
		const loginPasswordToggle = document.getElementById('loginPasswordToggle');
		const loginPassword = document.getElementById('loginPassword');
		if (loginPasswordToggle && loginPassword) {
			loginPasswordToggle.addEventListener('click', () => {
				togglePasswordVisibility(loginPassword, loginPasswordToggle);
			});
		}
		
		// Signup password toggle
		const signupPasswordToggle = document.getElementById('signupPasswordToggle');
		const signupPassword = document.getElementById('signupPassword');
		if (signupPasswordToggle && signupPassword) {
			signupPasswordToggle.addEventListener('click', () => {
				togglePasswordVisibility(signupPassword, signupPasswordToggle);
			});
		}
		
		// Signup confirm password toggle
		const signupConfirmPasswordToggle = document.getElementById('signupConfirmPasswordToggle');
		const signupConfirmPassword = document.getElementById('signupConfirmPassword');
		if (signupConfirmPasswordToggle && signupConfirmPassword) {
			signupConfirmPasswordToggle.addEventListener('click', () => {
				togglePasswordVisibility(signupConfirmPassword, signupConfirmPasswordToggle);
			});
		}
	}
	
	function togglePasswordVisibility(passwordInput, toggleButton) {
		const icon = toggleButton.querySelector('i');
		if (passwordInput.type === 'password') {
			passwordInput.type = 'text';
			icon.classList.remove('fa-eye');
			icon.classList.add('fa-eye-slash');
		} else {
			passwordInput.type = 'password';
			icon.classList.remove('fa-eye-slash');
			icon.classList.add('fa-eye');
		}
	}

	// Initialize forgot password functionality
	function initializeForgotPassword() {
		// Forgot password link
		const forgotPasswordLink = document.getElementById('forgotPasswordLink');
		const forgotPasswordModal = document.getElementById('forgotPasswordModal');
		const loginModal = document.getElementById('loginModal');
		const backToLoginLink = document.getElementById('backToLogin');
		const forgotPasswordForm = document.getElementById('forgotPasswordForm');
		
		// Open forgot password modal
		if (forgotPasswordLink && forgotPasswordModal) {
			forgotPasswordLink.addEventListener('click', (e) => {
				e.preventDefault();
				closeModal(loginModal);
				openModal(forgotPasswordModal);
			});
		}
		
		// Back to login
		if (backToLoginLink && loginModal && forgotPasswordModal) {
			backToLoginLink.addEventListener('click', (e) => {
				e.preventDefault();
				closeModal(forgotPasswordModal);
				openModal(loginModal);
			});
		}
		
		// Handle forgot password form submission
		if (forgotPasswordForm) {
			forgotPasswordForm.addEventListener('submit', (e) => {
				e.preventDefault();
				handleForgotPassword();
			});
		}
	}
	
	function handleForgotPassword() {
		const email = document.getElementById('forgotEmail').value.trim();
		
		if (!email) {
			showNotification('Please enter your email address.', 'error');
			return;
		}
		
		// Simulate sending reset email
		showNotification('Password reset link sent to your email!', 'success');
		
		// Close modal and return to login
		const forgotPasswordModal = document.getElementById('forgotPasswordModal');
		const loginModal = document.getElementById('loginModal');
		closeModal(forgotPasswordModal);
		openModal(loginModal);
		
		// Clear the form
		document.getElementById('forgotEmail').value = '';
	}
	
	// Initialize mobile menu
	initializeMobileMenu();
	
	// Initialize password visibility toggles
	initializePasswordToggles();
	
	// Initialize forgot password functionality
	initializeForgotPassword();
	
	// Logout button event listeners
	document.querySelectorAll('.logout-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			logout();
		});
	});
	
	// Refresh icon event listener
	const refreshIcon = document.getElementById('refreshIcon');
	if (refreshIcon) {
		refreshIcon.addEventListener('click', (e) => {
			e.preventDefault();
			// Force refresh like Ctrl+F5 (hard refresh)
			window.location.reload(true);
		});
	}
	
	// Clear all words function
	function clearAllWords() {
		const confirmMessage = 'Are you sure you want to delete ALL uploaded words? This will permanently remove all words from all HSK levels and cannot be undone.';
		
		if (!confirm(confirmMessage)) {
			return;
		}
		
		// Clear all words from localStorage
		localStorage.setItem('fizflashcard_words', JSON.stringify([]));
		
		// Clear HSK levels storage (used by admin panel)
		const hskLevels = {};
		for (let i = 1; i <= 6; i++) {
			hskLevels[`hsk${i}`] = [];
		}
		localStorage.setItem('fizflashcard_hsk_levels', JSON.stringify(hskLevels));
		
		// Clear all progress data for all HSK levels and groups
		for (let i = 1; i <= 6; i++) {
			// Clear old HSK-level data
			localStorage.removeItem(`fizflashcard_mastered_hsk_${i}`);
			localStorage.removeItem(`fizflashcard_review_hsk_${i}`);
			localStorage.removeItem(`fizflashcard_bookmarks_hsk_${i}`);
			
			// Clear group-specific data for each HSK level
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '601-700', '701-800', '801-900', '901-1000', '1001-1100', '1101-1200', '1201-1300', '1-1300', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				localStorage.removeItem(`fizflashcard_mastered_hsk_${i}_group_${range}`);
				localStorage.removeItem(`fizflashcard_review_hsk_${i}_group_${range}`);
				localStorage.removeItem(`fizflashcard_bookmarks_hsk_${i}_group_${range}`);
			});
		}
		
		// Reset current arrays
		allWords = [];
		hsk4Words = [];
		masteredWords = [];
		reviewWords = [];
		currentWordIndex = 0;
		
		// Update UI
		updateFlashcard();
		updateProgress();
		updateRemainingWordsDisplay();
		updateBookmarkUI();
		
		alert('All words have been successfully deleted! The system is now empty and ready for new uploads.');
	}
	
	// Make clearAllWords globally accessible
	window.clearAllWords = clearAllWords;

	// Auth state management
	function updateAuthUI() {
		const isLoggedIn = localStorage.getItem('fizflashcard_user_id');
		const loginBtns = document.querySelectorAll('.login-btn');
		const signupBtns = document.querySelectorAll('.signup-btn');
		const logoutBtns = document.querySelectorAll('.logout-btn');
		
		loginBtns.forEach(btn => btn.style.display = isLoggedIn ? 'none' : 'block');
		signupBtns.forEach(btn => btn.style.display = isLoggedIn ? 'none' : 'block');
		logoutBtns.forEach(btn => btn.style.display = isLoggedIn ? 'block' : 'none');
		
		// Update notification button visibility
		updateNotificationButtonVisibility();
		
		// Update account page with user data if logged in
		if (isLoggedIn) {
			updateAccountPage();
		}
	}
	
	
	// Logout function
	function logout() {
		localStorage.removeItem('fizflashcard_user_id');
		updateAuthUI();
		showPage('home');
		alert('You have been logged out successfully.');
	}

	// Remaining days counter and auto-downgrade
	function updateRemainingDays() {
		const currentUser = getCurrentUser();
		if (!currentUser) return;
		
		const user = currentUser;
		if (!user.plan || user.plan === 'free') return;
		
		// Use planActivationDate if available, otherwise use enrollmentDate
		const activationDate = new Date(user.planActivationDate || user.enrollmentDate || Date.now());
		const now = new Date();
		const daysSinceActivation = Math.floor((now - activationDate) / (1000 * 60 * 60 * 24));
		
		let planDays = 0;
		switch(user.plan) {
			case '1month': planDays = 30; break;
			case '6months': planDays = 180; break;
			case 'lifetime': planDays = 999999; break;
		}
		
		const remainingDays = Math.max(0, planDays - daysSinceActivation);
		
		// Update UI
		const remainingDaysEl = document.getElementById('remainingDays');
		if (remainingDaysEl) {
			remainingDaysEl.textContent = remainingDays;
		}
		
		// Auto-downgrade if expired
		if (remainingDays === 0 && user.plan !== 'free') {
			// Update the user's plan
			user.plan = 'free';
			
			// Update localStorage
			const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
			const userIndex = users.findIndex(u => u.id === user.id);
			if (userIndex !== -1) {
			users[userIndex].plan = 'free';
			localStorage.setItem('fizflashcard_users', JSON.stringify(users));
			}
			
			// Update current user
			localStorage.setItem('fizflashcard_current_user', JSON.stringify(user));
			
			alert('Your plan has expired. You have been downgraded to the free plan.');
			// Refresh the page to update UI
			location.reload();
		}
	}

	// Check remaining days on load and set up daily check
	updateRemainingDays();
	
	// Make function globally accessible
	window.updateRemainingDays = updateRemainingDays;
	
	// Update user interface function
	function updateUserInterface() {
		const currentUser = getCurrentUser();
		const loginBtn = document.getElementById('loginButton');
		const signupBtn = document.getElementById('signupButton');
		const logoutBtn = document.getElementById('logoutButton');
		
		// Mobile auth buttons
		const loginBtnMobile = document.getElementById('loginButtonMobile');
		const signupBtnMobile = document.getElementById('signupButtonMobile');
		const logoutBtnMobile = document.getElementById('logoutButtonMobile');
		
		if (currentUser) {
			// Show logout button, hide login/signup
			if (loginBtn) loginBtn.style.display = 'none';
			if (signupBtn) signupBtn.style.display = 'none';
			if (logoutBtn) logoutBtn.style.display = 'inline-block';
			
			// Mobile buttons
			if (loginBtnMobile) loginBtnMobile.style.display = 'none';
			if (signupBtnMobile) signupBtnMobile.style.display = 'none';
			if (logoutBtnMobile) logoutBtnMobile.style.display = 'inline-block';
			
			// Update account page if it exists
			const userNameEl = document.getElementById('userName');
			const userEmailEl = document.getElementById('userEmail');
			const userUniversityEl = document.getElementById('userUniversity');
			const userPlanEl = document.getElementById('userPlan');
			const enrollmentDateEl = document.getElementById('enrollmentDate');
			const remainingDaysEl = document.getElementById('remainingDays');
			
			if (userNameEl) userNameEl.textContent = currentUser.name || '-';
			if (userEmailEl) userEmailEl.textContent = currentUser.email || '-';
			if (userUniversityEl) userUniversityEl.textContent = currentUser.university || '-';
			if (userPlanEl) userPlanEl.textContent = getPlanName(currentUser.plan);
			if (enrollmentDateEl) {
				// Format enrollment date properly
				if (currentUser.enrollmentDate) {
					const date = new Date(currentUser.enrollmentDate);
					if (!isNaN(date.getTime())) {
						enrollmentDateEl.textContent = date.toLocaleDateString('en-US', {
							year: 'numeric',
							month: 'long',
							day: 'numeric'
						});
					} else {
						enrollmentDateEl.textContent = '-';
					}
				} else {
					enrollmentDateEl.textContent = '-';
				}
			}
			if (remainingDaysEl) {
				remainingDaysEl.textContent = currentUser.remainingDays === Infinity ? '∞' : 
											 currentUser.remainingDays || '-';
			}
		} else {
			// Show login/signup buttons, hide logout
			if (loginBtn) loginBtn.style.display = 'inline-block';
			if (signupBtn) signupBtn.style.display = 'inline-block';
			if (logoutBtn) logoutBtn.style.display = 'none';
			
			// Mobile buttons
			if (loginBtnMobile) loginBtnMobile.style.display = 'inline-block';
			if (signupBtnMobile) signupBtnMobile.style.display = 'inline-block';
			if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';
			
			// Reset account page
			const userNameEl = document.getElementById('userName');
			const userEmailEl = document.getElementById('userEmail');
			const userUniversityEl = document.getElementById('userUniversity');
			const userPlanEl = document.getElementById('userPlan');
			const enrollmentDateEl = document.getElementById('enrollmentDate');
			const remainingDaysEl = document.getElementById('remainingDays');
			
			if (userNameEl) userNameEl.textContent = '-';
			if (userEmailEl) userEmailEl.textContent = '-';
			if (userUniversityEl) userUniversityEl.textContent = '-';
			if (userPlanEl) userPlanEl.textContent = 'Free Plan';
			if (enrollmentDateEl) enrollmentDateEl.textContent = '-';
			if (remainingDaysEl) remainingDaysEl.textContent = '-';
		}
	}
	
	// Get plan name function
	function getPlanName(planKey) {
		const planNames = {
			'free': 'Free Plan',
			'1month': '1 Month Access',
			'6months': '6 Months Access',
			'lifetime': 'Lifetime Access'
		};
		return planNames[planKey] || 'Free Plan';
	}
	
	// Make functions globally accessible
	window.updateUserInterface = updateUserInterface;
	window.getPlanName = getPlanName;
	
	// Set up daily check at midnight
	const now = new Date();
	const tomorrow = new Date(now);
	tomorrow.setDate(tomorrow.getDate() + 1);
	tomorrow.setHours(0, 0, 0, 0);
	const msUntilMidnight = tomorrow.getTime() - now.getTime();
	
	setTimeout(() => {
		updateRemainingDays();
		// Then check every 24 hours
		setInterval(updateRemainingDays, 24 * 60 * 60 * 1000);
	}, msUntilMidnight);

	// Initialize auth UI
	updateAuthUI();

	// Initialize progress data for current HSK level
	masteredWords = loadMasteredWords();
	reviewWords = loadReviewWords();
	
	// Init
	updateFlashcard();
	updateProgress();
	updateRemainingWordsDisplay();
	showPage('home');
	
	// Set initial navigation active state
	updateNavigationActiveState('home');
	
	// Initialize help form
	initializeHelpForm();
	
	
	// Initialize notification system
	initializeNotificationSystem();
	
	// Initialize materials system
	initializeMaterialsSystem();
	
	// Load materials on page load (accessible to all users)
	loadBooks();
	loadTextbookSolutions();
	
	// Ensure all users have display IDs
	ensureUserDisplayIds();
	
	// Update notification button visibility after everything is loaded
	setTimeout(() => {
		updateNotificationButtonVisibility();
		// Also refresh the notification badge in case there are existing notifications
		updateNotificationBadge();
	}, 100);
	
	// Debug: Check what's in localStorage
	console.log('=== DEBUGGING USER DATA ===');
	console.log('fizflashcard_user_id:', localStorage.getItem('fizflashcard_user_id'));
	console.log('fizflashcard_users:', localStorage.getItem('fizflashcard_users'));
	console.log('All localStorage keys:', Object.keys(localStorage));
	console.log('========================');
});

// Generate unique 5-digit user ID
function generateUserId() {
	let userId;
	do {
		userId = Math.floor(10000 + Math.random() * 90000).toString();
	} while (isUserIdExists(userId));
	return userId;
}

function isUserIdExists(userId) {
	// Check localStorage users array
	const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
	if (users.some(user => user.displayId === userId)) {
		return true;
	}
	
	// Check current user (Supabase users)
	const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
	if (currentUser && currentUser.displayId === userId) {
		return true;
	}
	
	return false;
}

function ensureUserDisplayIds() {
	// Check localStorage users array
	const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
	let updated = false;
	
	users.forEach(user => {
		if (!user.displayId) {
			user.displayId = generateUserId();
			updated = true;
		}
	});
	
	if (updated) {
		localStorage.setItem('fizflashcard_users', JSON.stringify(users));
		console.log('Generated display IDs for localStorage users without them');
	}
	
	// Check current user (Supabase users)
	const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
	if (currentUser && !currentUser.displayId) {
		currentUser.displayId = generateUserId();
		localStorage.setItem('fizflashcard_current_user', JSON.stringify(currentUser));
		console.log('Generated display ID for current user:', currentUser.displayId);
	}
}

// Help Form Functionality
function initializeHelpForm() {
	const helpForm = document.getElementById('helpFormInline');
	
	// Handle form submission
	helpForm.addEventListener('submit', handleHelpSubmissionInline);
	
	// Pre-fill name when account page is shown
	document.addEventListener('click', (e) => {
		if (e.target && e.target.getAttribute('data-page') === 'account') {
			setTimeout(() => {
				const currentUser = getCurrentUser();
				if (currentUser) {
					document.getElementById('helpNameInline').value = currentUser.name || '';
				}
			}, 100); // Small delay to ensure page is loaded
		}
	});
}

async function handleHelpSubmissionInline(e) {
	e.preventDefault();
	
	const name = document.getElementById('helpNameInline').value.trim();
	const description = document.getElementById('helpDescriptionInline').value.trim();
	const fileInput = document.getElementById('helpFileInline');
	const file = fileInput.files[0];
	
	if (!name || !description) {
		showNotification('Please fill in all required fields', 'error');
		return;
	}
	
	// Get current user info
	const currentUser = getCurrentUser();
	console.log('Current user in help form:', currentUser); // Debug log
	const userEmail = currentUser ? currentUser.email : 'Not logged in';
	
	// For Supabase, we need to check if user exists in database first
	let userId = currentUser ? currentUser.id : 'anonymous';
	
	// If using Supabase, check if user exists in database
	if (window.supabaseConfig && window.supabaseConfig.isConfigured() && currentUser) {
		try {
			const userCheck = await window.supabaseConfig.getUser(currentUser.email);
			if (userCheck.success && userCheck.data) {
				userId = userCheck.data.id; // Use the Supabase user ID
			} else {
				// User doesn't exist in Supabase, use anonymous
				userId = 'anonymous';
			}
		} catch (error) {
			console.error('Error checking user in Supabase:', error);
			userId = 'anonymous';
		}
	}
	
	console.log('User email:', userEmail, 'User ID:', userId); // Debug log
	
	// Create help message object
	const helpMessage = {
		id: Date.now().toString(),
		userId: userId,
		userEmail: userEmail,
		userName: name,
		userDisplayId: currentUser ? currentUser.displayId : null,
		subject: 'Help Request', // Add subject field
		message: description, // Add message field
		description: description, // Keep description for compatibility
		attachment: null,
		attachmentName: null,
		attachmentSize: null,
		attachmentType: null,
		date: new Date().toISOString(),
		resolved: false
	};
	
	// Handle file attachment
	if (file) {
		const reader = new FileReader();
		reader.onload = async function(e) {
			helpMessage.attachment = e.target.result;
			helpMessage.attachmentName = file.name;
			helpMessage.attachmentSize = file.size;
			helpMessage.attachmentType = file.type;
			
			// Save help message
			await saveHelpMessage(helpMessage);
		};
		reader.readAsDataURL(file);
	} else {
		// Save help message without attachment
		await saveHelpMessage(helpMessage);
	}
}

async function saveHelpMessage(helpMessage) {
	console.log('Saving help message:', helpMessage);
	try {
		if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
			// Use Supabase
			console.log('Using Supabase to save help message');
			const result = await window.supabaseConfig.addHelpMessage(helpMessage);
			if (result.success) {
				console.log('Successfully saved help message to Supabase');
				showNotification('Help request sent successfully! We\'ll get back to you soon.', 'success');
				// Reset form
				document.getElementById('helpFormInline').reset();
			} else {
				console.error('Error saving help message to Supabase:', result.error);
				// Fallback to localStorage if Supabase fails
				console.log('Falling back to localStorage due to Supabase error');
				const existingMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
				existingMessages.unshift(helpMessage);
				localStorage.setItem('fizflashcard_help_messages', JSON.stringify(existingMessages));
				
				showNotification('Help request sent successfully! We\'ll get back to you soon.', 'success');
				// Reset form
				document.getElementById('helpFormInline').reset();
			}
		} else {
			// Fallback to localStorage
			console.log('Using localStorage to save help message');
			const existingMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
			existingMessages.unshift(helpMessage);
			localStorage.setItem('fizflashcard_help_messages', JSON.stringify(existingMessages));
			
			showNotification('Help request sent successfully! We\'ll get back to you soon.', 'success');
			// Reset form
			document.getElementById('helpFormInline').reset();
		}
	} catch (error) {
		console.error('Error saving help message:', error);
		// Fallback to localStorage if any error occurs
		console.log('Falling back to localStorage due to error');
		const existingMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
		existingMessages.unshift(helpMessage);
		localStorage.setItem('fizflashcard_help_messages', JSON.stringify(existingMessages));
		
		showNotification('Help request sent successfully! We\'ll get back to you soon.', 'success');
		// Reset form
		document.getElementById('helpFormInline').reset();
	}
}

function getCurrentUser() {
	try {
		// First, check if we have current user data (Supabase users)
		const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
		if (currentUser && currentUser.id) {
			console.log('Found current user from localStorage:', currentUser);
			return currentUser;
		}
		
		// Fallback to users array (localStorage users)
		const userId = localStorage.getItem('fizflashcard_user_id');
		console.log('User ID from localStorage:', userId); // Debug log
		
		if (!userId) {
			console.log('No user ID found in localStorage'); // Debug log
			// Fallback: try to get user data from account page elements
			return getCurrentUserFromPage();
		}
		
		const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
		console.log('All users in localStorage:', users); // Debug log
		
		const user = users.find(u => u.id === userId);
		console.log('Found user:', user); // Debug log
		
		return user || getCurrentUserFromPage();
	} catch (error) {
		console.error('Error getting current user:', error);
		return getCurrentUserFromPage();
	}
}

function getCurrentUserFromPage() {
	try {
		const nameEl = document.getElementById('userName');
		const emailEl = document.getElementById('userEmail');
		
		if (nameEl && emailEl && nameEl.textContent !== '-' && emailEl.textContent !== '-') {
			console.log('Getting user data from page elements'); // Debug log
			return {
				name: nameEl.textContent,
				email: emailEl.textContent,
				id: 'page-user-' + Date.now() // Generate a temporary ID
			};
		}
		return null;
	} catch (error) {
		console.error('Error getting user from page:', error);
		return null;
	}
}



function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Notification System
function showNotification(message, type = 'info') {
	// Remove existing notifications
	const existingNotifications = document.querySelectorAll('.notification');
	existingNotifications.forEach(notification => notification.remove());
	
	// Create notification element
	const notification = document.createElement('div');
	notification.className = `notification notification-${type}`;
	notification.innerHTML = `
		<div class="notification-content">
			<i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
			<span>${message}</span>
		</div>
		<button class="notification-close">&times;</button>
	`;
	
	// Add styles
	notification.style.cssText = `
		position: fixed;
		top: 20px;
		right: 20px;
		background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
		color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
		border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : '#bee5eb'};
		border-radius: 8px;
		padding: 15px 20px;
		box-shadow: 0 4px 12px rgba(0,0,0,0.15);
		z-index: 10000;
		display: flex;
		align-items: center;
		gap: 10px;
		max-width: 400px;
		animation: slideInRight 0.3s ease;
	`;
	
	// Add to page
	document.body.appendChild(notification);
	
	// Auto remove after 5 seconds
	setTimeout(() => {
		if (notification.parentNode) {
			notification.style.animation = 'slideOutRight 0.3s ease';
			setTimeout(() => notification.remove(), 300);
		}
	}, 5000);
	
	// Close button functionality
	notification.querySelector('.notification-close').addEventListener('click', () => {
		notification.style.animation = 'slideOutRight 0.3s ease';
		setTimeout(() => notification.remove(), 300);
	});
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
	@keyframes slideInRight {
		from { transform: translateX(100%); opacity: 0; }
		to { transform: translateX(0); opacity: 1; }
	}
	@keyframes slideOutRight {
		from { transform: translateX(0); opacity: 1; }
		to { transform: translateX(100%); opacity: 0; }
	}
	.notification-content {
		display: flex;
		align-items: center;
		gap: 10px;
		flex: 1;
	}
	.notification-close {
		background: none;
		border: none;
		font-size: 18px;
		cursor: pointer;
		padding: 0;
		margin-left: 10px;
		opacity: 0.7;
	}
	.notification-close:hover {
		opacity: 1;
	}
`;
document.head.appendChild(style);

// Notification System
function initializeNotificationSystem() {
	const notificationBtn = document.getElementById('notificationButton');
	const notificationBtnMobile = document.getElementById('notificationButtonMobile');
	const notificationsModal = document.getElementById('notificationsModal');
	const closeModal = notificationsModal.querySelector('.close-modal');
	
	// Show/hide notification button based on login status
	updateNotificationButtonVisibility();
	
	// Open notifications modal (desktop)
	if (notificationBtn) {
		notificationBtn.addEventListener('click', () => {
			notificationsModal.style.display = 'flex';
			loadNotifications();
		});
	}
	
	// Open notifications modal (mobile)
	if (notificationBtnMobile) {
		notificationBtnMobile.addEventListener('click', () => {
			notificationsModal.style.display = 'flex';
			loadNotifications();
		});
	}
	
	// Close notifications modal
	closeModal.addEventListener('click', () => {
		notificationsModal.style.display = 'none';
	});
	
	// Close on outside click
	notificationsModal.addEventListener('click', (e) => {
		if (e.target === notificationsModal) {
			notificationsModal.style.display = 'none';
		}
	});
}

function updateNotificationButtonVisibility() {
	const notificationBtn = document.getElementById('notificationButton');
	const notificationBtnMobile = document.getElementById('notificationButtonMobile');
	const currentUser = getCurrentUser();
	
	if (currentUser) {
		if (notificationBtn) notificationBtn.style.display = 'inline-block';
		if (notificationBtnMobile) notificationBtnMobile.style.display = 'inline-block';
		updateNotificationBadge();
	} else {
		if (notificationBtn) notificationBtn.style.display = 'none';
		if (notificationBtnMobile) notificationBtnMobile.style.display = 'none';
	}
}

async function loadNotifications() {
	const container = document.getElementById('notificationsList');
	
	// Check if container exists before proceeding
	if (!container) {
		console.warn('notificationsList element not found');
		return;
	}
	
	const currentUser = getCurrentUser();
	
	console.log('Loading notifications for user:', currentUser);
	console.log('Current user ID:', currentUser?.id);
	
	if (!currentUser) {
		container.innerHTML = `
			<div class="no-notifications">
				<i class="fas fa-user-slash" style="font-size: 3rem; margin-bottom: 15px; color: #dee2e6;"></i>
				<p>Please log in to view notifications</p>
			</div>
		`;
		return;
	}
	
	// Get notifications for current user - try Supabase first, then localStorage
	let notifications = [];
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			console.log('Loading notifications from Supabase...');
			const result = await window.supabaseConfig.getNotifications(currentUser.id);
			if (result.success) {
				notifications = result.data;
				console.log('Loaded notifications from Supabase:', notifications.length);
			} else {
				console.error('Error loading notifications from Supabase:', result.error);
				// Fallback to localStorage
				notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
				console.log('Fell back to localStorage:', notifications.length);
			}
		} catch (error) {
			console.error('Error loading notifications from Supabase:', error);
			// Fallback to localStorage
			notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
			console.log('Fell back to localStorage due to error:', notifications.length);
		}
	} else {
		// Use localStorage only
		notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
		console.log('Using localStorage only:', notifications.length);
	}
	
	const userNotifications = notifications.filter(notification => notification.userId === currentUser.id);
	console.log('User notifications:', userNotifications);
	
	if (userNotifications.length === 0) {
		container.innerHTML = `
			<div class="no-notifications">
				<i class="fas fa-bell-slash" style="font-size: 3rem; margin-bottom: 15px; color: #dee2e6;"></i>
				<p>No notifications yet</p>
			</div>
		`;
		return;
	}
	
	// Sort notifications by date (newest first)
	userNotifications.sort((a, b) => new Date(b.date) - new Date(a.date));
	
	container.innerHTML = userNotifications.map(notification => createNotificationItem(notification)).join('');
	
	// Add event listeners for action buttons
	container.querySelectorAll('.mark-read-notification-btn').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const notificationId = e.target.getAttribute('data-notification-id');
			await markNotificationAsRead(notificationId);
		});
	});
	
	// Add event listeners for close buttons
	container.querySelectorAll('.close-notification-btn').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const notificationId = e.target.getAttribute('data-notification-id');
			await closeNotification(notificationId);
		});
	});
}

function createNotificationItem(notification) {
	const date = new Date(notification.date).toLocaleString();
	const isRead = notification.read || false;
	const readClass = isRead ? 'read' : '';
	const unreadClass = !isRead ? 'unread' : '';
	
	return `
		<div class="notification-item ${unreadClass}">
			<div class="notification-header">
				<div class="notification-title">${escapeHtml(notification.title)}</div>
				<div class="notification-date">${date}</div>
				<button class="close-notification-btn" data-notification-id="${notification.id}" title="Close notification">
					<i class="fas fa-times"></i>
				</button>
			</div>
			<div class="notification-content">${escapeHtml(notification.message)}</div>
			<div class="notification-actions">
				<button class="mark-read-notification-btn ${readClass}" data-notification-id="${notification.id}">
					<i class="fas fa-${isRead ? 'check' : 'eye'}"></i>
					${isRead ? 'Read' : 'Mark as Read'}
				</button>
			</div>
		</div>
	`;
}

async function markNotificationAsRead(notificationId) {
	// Try Supabase first
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.updateNotification(notificationId, { read: true });
			if (!result.success) throw new Error(result.error || 'Failed to update');
		} catch (e) {
			// Fallback to localStorage
			const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
			const idx = notifications.findIndex(n => n.id === notificationId);
			if (idx !== -1) {
				notifications[idx].read = true;
				localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
			}
		}
	} else {
		const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
		const idx = notifications.findIndex(n => n.id === notificationId);
		if (idx !== -1) {
			notifications[idx].read = true;
			localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
		}
	}
	await loadNotifications();
	await updateNotificationBadge();
	showNotification('Notification marked as read', 'success');
}

async function closeNotification(notificationId) {
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.deleteNotification(notificationId);
			if (!result.success) throw new Error(result.error || 'Failed to delete');
		} catch (e) {
			const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
			const filtered = notifications.filter(n => n.id !== notificationId);
			localStorage.setItem('fizflashcard_notifications', JSON.stringify(filtered));
		}
	} else {
		const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
		const filtered = notifications.filter(n => n.id !== notificationId);
		localStorage.setItem('fizflashcard_notifications', JSON.stringify(filtered));
	}
	await loadNotifications();
	await updateNotificationBadge();
	showNotification('Notification closed', 'success');
}

async function updateNotificationBadge() {
	const currentUser = getCurrentUser();
	if (!currentUser) return;
	
	// Get notifications from the same source as loadNotifications
	let notifications = [];
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.getNotifications(currentUser.id);
			if (result.success) {
				notifications = result.data;
			} else {
				// Fallback to localStorage
				notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
			}
		} catch (error) {
			// Fallback to localStorage
			notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
		}
	} else {
		// Use localStorage only
		notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
	}
	
	const userNotifications = notifications.filter(notification => 
		notification.userId === currentUser.id && !notification.read
	);
	
	const badge = document.getElementById('notificationBadge');
	const badgeMobile = document.getElementById('notificationBadgeMobile');
	
	if (userNotifications.length > 0) {
		if (badge) {
			badge.textContent = userNotifications.length;
			badge.style.display = 'flex';
		}
		if (badgeMobile) {
			badgeMobile.textContent = userNotifications.length;
			badgeMobile.style.display = 'flex';
		}
	} else {
		if (badge) badge.style.display = 'none';
		if (badgeMobile) badgeMobile.style.display = 'none';
	}
}

async function sendNotificationToUser(userId, title, message) {
	console.log('sendNotificationToUser called with:', { userId, title, message });
	
	const notification = {
		id: Date.now().toString(),
		userId: userId,
		title: title,
		message: message,
		date: new Date().toISOString(),
		read: false
	};
	
	// Save to Supabase if configured, otherwise localStorage
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			console.log('Saving notification to Supabase...');
			const result = await window.supabaseConfig.addNotification(notification);
			if (result.success) {
				console.log('Successfully saved notification to Supabase');
			} else {
				console.error('Error saving notification to Supabase:', result.error);
				// Fallback to localStorage
				const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
				notifications.unshift(notification);
				localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
			}
		} catch (error) {
			console.error('Error saving notification to Supabase:', error);
			// Fallback to localStorage
			const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
			notifications.unshift(notification);
			localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
		}
	} else {
		// Use localStorage only
		const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
		notifications.unshift(notification);
		localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
	}
	
	console.log('Notification sent to user:', userId, 'Title:', title);
	
	// Update badge if user is currently logged in
	const currentUser = getCurrentUser();
	if (currentUser && currentUser.id === userId) {
		await updateNotificationBadge();
	}
}

// Test function for notifications (can be called from browser console)
window.testNotification = function() {
	const currentUser = getCurrentUser();
	if (currentUser) {
		sendNotificationToUser(currentUser.id, 'Test Notification', 'This is a test notification to verify the system is working!');
		updateNotificationBadge();
		console.log('Test notification sent!');
	} else {
		console.log('Please log in first to test notifications');
	}
};

// Test function for lock icons (can be called from browser console)
window.testLockIcons = function() {
	console.log('Testing lock icons...');
	updateGroupOptionsForHskLevel();
	console.log('Group options refreshed. Check the console for debug info.');
};

// Update account page with user data (global function)
function updateAccountPage() {
	const currentUser = getCurrentUser();
	console.log('Updating account page for user:', currentUser);
	
	if (!currentUser) {
		console.log('No current user found');
		return;
	}
	
	const nameEl = document.getElementById('userName');
	const emailEl = document.getElementById('userEmail');
	const universityEl = document.getElementById('userUniversity');
	const planEl = document.getElementById('userPlan');
	const enrollmentDateEl = document.getElementById('enrollmentDate');
	const daysEl = document.getElementById('remainingDays');
	const userIdEl = document.getElementById('userDisplayId');
	
	if (nameEl) nameEl.textContent = currentUser.name || 'User';
	if (emailEl) emailEl.textContent = currentUser.email || 'No email';
	if (universityEl) universityEl.textContent = currentUser.university || '-';
	if (userIdEl) userIdEl.textContent = currentUser.displayId || 'N/A';
	if (planEl) planEl.textContent = getPlanName(currentUser.plan) || 'Free';
	if (enrollmentDateEl) {
		// Format enrollment date properly
		if (currentUser.enrollmentDate) {
			const date = new Date(currentUser.enrollmentDate);
			if (!isNaN(date.getTime())) {
				enrollmentDateEl.textContent = date.toLocaleDateString('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric'
				});
			} else {
				enrollmentDateEl.textContent = '-';
			}
		} else {
			enrollmentDateEl.textContent = '-';
		}
	}
	if (daysEl) {
		daysEl.textContent = currentUser.remainingDays === Infinity ? '∞' : 
							currentUser.remainingDays || '0';
	}
}

// Test function for user account (can be called from browser console)
window.testUserAccount = function() {
	console.log('🔍 Testing User Account Display...');
	
	const currentUser = getCurrentUser();
	console.log('Current user:', currentUser);
	
	const userId = localStorage.getItem('fizflashcard_user_id');
	console.log('User ID from localStorage:', userId);
	
	const currentUserData = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
	console.log('Current user data:', currentUserData);
	
	const usersArray = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
	console.log('Users array:', usersArray);
	
	// Test account page update
	updateAccountPage();
	console.log('Account page updated. Check the account page for user info.');
};

// Test function to generate display ID for current user
window.generateDisplayId = function() {
	console.log('🔧 Generating Display ID for Current User...');
	
	const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
	if (!currentUser) {
		console.log('No current user found');
		return;
	}
	
	if (!currentUser.displayId) {
		currentUser.displayId = generateUserId();
		localStorage.setItem('fizflashcard_current_user', JSON.stringify(currentUser));
		console.log('Generated display ID:', currentUser.displayId);
		updateAccountPage();
		console.log('Account page updated with new display ID');
	} else {
		console.log('User already has display ID:', currentUser.displayId);
	}
};

// HSK Materials System
function initializeMaterialsSystem() {
	// Initialize materials tabs
	initializeMaterialsTabs();
	
	// Load books and solutions
	loadBooks();
	loadTextbookSolutions();
}

function initializeMaterialsTabs() {
	const materialsTabs = document.querySelectorAll('.materials-tab');
	const materialsContents = document.querySelectorAll('.materials-tab-content');
	
	materialsTabs.forEach(tab => {
		tab.addEventListener('click', () => {
			const targetTab = tab.getAttribute('data-tab');
			
			// Remove active class from all tabs and contents
			materialsTabs.forEach(t => t.classList.remove('active'));
			materialsContents.forEach(c => c.classList.remove('active'));
			
			// Add active class to clicked tab and corresponding content
			tab.classList.add('active');
			document.getElementById(targetTab + 'Tab').classList.add('active');
		});
	});
}

async function loadBooks() {
	const booksGrid = document.getElementById('booksGrid');
	console.log('Loading books, booksGrid:', booksGrid);
	
	if (!booksGrid) {
		console.log('Books grid not found!');
		return;
	}

	// Load from Supabase first, fallback to localStorage
	let books = [];
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.getBooks();
			if (result.success) {
				books = (result.data || []).map(b => ({
					id: String(b.id),
					title: b.title,
					description: b.description,
					coverImage: b.cover_image || b.coverImage,
					fileData: b.file_data || b.fileData,
					fileName: b.file_name || b.fileName,
					fileSize: b.file_size || b.fileSize
				}));
			} else {
				books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
			}
		} catch (err) {
			console.error('Error loading books from Supabase:', err);
			books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
		}
	} else {
		books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
	}
	console.log('Books loaded:', books);
	
	if (books.length === 0) {
		console.log('No books found, showing empty state');
		booksGrid.innerHTML = `
			<div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
				<i class="fas fa-book" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
				<p>No books available yet</p>
				<small>Check back later for new materials!</small>
			</div>
		`;
		return;
	}
	
	console.log('Rendering books:', books.length);
	booksGrid.innerHTML = books.map(book => createBookCard(book)).join('');
}

function createBookCard(book) {
	return `
		<div class="book-card">
			<div class="book-cover">
				${book.coverImage ? 
					`<img src="${book.coverImage}" alt="${book.title}" />` : 
					`<i class="fas fa-book"></i>`
				}
			</div>
			<div class="book-info">
				<h3 class="book-title">${escapeHtml(book.title)}</h3>
				<p class="book-description">${escapeHtml(book.description || 'No description available')}</p>
				<button class="book-download-btn" onclick="downloadBook('${book.id}')">
					<i class="fas fa-download"></i> Download
				</button>
			</div>
		</div>
	`;
}

function loadTextbookSolutions() {
	loadTextbooks();
	initializeTextbookSystem();
}

function loadTextbooks() {
	const textbooksList = document.getElementById('textbooksList');
	if (!textbooksList) return;
	
	const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
	console.log('Loading textbooks:', textbooks);
	
	if (textbooks.length === 0) {
		textbooksList.innerHTML = `
			<div style="text-align: center; padding: 20px; color: #6c757d;">
				<i class="fas fa-book" style="font-size: 2rem; margin-bottom: 10px; opacity: 0.5;"></i>
				<p>No textbooks available yet</p>
			</div>
		`;
		return;
	}
	
	textbooksList.innerHTML = textbooks.map(book => createTextbookItem(book)).join('');
}

function createTextbookItem(book) {
	const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
	const bookChapters = chapters.filter(chapter => chapter.bookId === book.id);
	
	return `
		<div class="book-item" data-book-id="${book.id}" onclick="selectTextbook('${book.id}')">
			<i class="fas fa-book"></i>
			<div class="book-item-info">
				<h4>${escapeHtml(book.title)}</h4>
				<p>${bookChapters.length} chapters</p>
			</div>
		</div>
	`;
}

function initializeTextbookSystem() {
	// Add event listener for back to chapters button
	const backToChaptersBtn = document.getElementById('backToChaptersBtn');
	if (backToChaptersBtn) {
		backToChaptersBtn.addEventListener('click', () => {
			showChaptersView();
		});
	}
}

function selectTextbook(bookId) {
	console.log('Selecting textbook:', bookId);
	
	// Update active book
	document.querySelectorAll('.book-item').forEach(item => {
		item.classList.remove('active');
	});
	document.querySelector(`[data-book-id="${bookId}"]`).classList.add('active');
	
	// Load chapters for this book
	loadBookChapters(bookId);
}

function loadBookChapters(bookId) {
	const chaptersView = document.getElementById('chaptersView');
	if (!chaptersView) return;
	
	const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
	const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
	
	const book = textbooks.find(b => b.id === bookId);
	const bookChapters = chapters.filter(chapter => chapter.bookId === bookId);
	
	if (!book) {
		chaptersView.innerHTML = `
			<div class="no-book-selected">
				<i class="fas fa-exclamation-triangle" style="font-size: 4rem; color: #dc3545; margin-bottom: 20px;"></i>
				<h3>Book Not Found</h3>
				<p>The selected book could not be found.</p>
			</div>
		`;
		return;
	}
	
	if (bookChapters.length === 0) {
		chaptersView.innerHTML = `
			<div class="no-book-selected">
				<i class="fas fa-file-alt" style="font-size: 4rem; color: #dee2e6; margin-bottom: 20px;"></i>
				<h3>No Chapters Available</h3>
				<p>This book doesn't have any chapters yet.</p>
			</div>
		`;
		return;
	}
	
	// Sort chapters by chapter number
	bookChapters.sort((a, b) => a.chapterNumber - b.chapterNumber);
	
	chaptersView.innerHTML = `
		<div>
			<h2>${escapeHtml(book.title)}</h2>
			<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px;">
				<p style="color: #6c757d; margin: 0;">Select a chapter to read</p>
				<p style="color: #6c757d; margin: 0; opacity: 0.6; font-size: 0.9rem;">All solutions are collected</p>
			</div>
			<div class="chapters-grid">
				${bookChapters.map(chapter => createChapterCard(chapter)).join('')}
			</div>
		</div>
	`;
}

function createChapterCard(chapter) {
	return `
		<div class="chapter-card" onclick="openChapter('${chapter.id}')">
			<h4>Chapter ${chapter.chapterNumber}</h4>
			<p>${escapeHtml(chapter.title)}</p>
		</div>
	`;
}

function openChapter(chapterId) {
	console.log('Opening chapter:', chapterId);
	
	const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
	const chapter = chapters.find(c => c.id === chapterId);
	
	if (!chapter) {
		showNotification('Chapter not found', 'error');
		return;
	}
	
	// Hide chapters view, show chapter content view
	document.getElementById('chaptersView').style.display = 'none';
	document.getElementById('chapterContentView').style.display = 'flex';
	
	// Update chapter content
	document.getElementById('chapterTitle').textContent = `Chapter ${chapter.chapterNumber}: ${chapter.title}`;
	document.getElementById('chapterContent').innerHTML = formatChapterContent(chapter.content);
}

function showChaptersView() {
	document.getElementById('chaptersView').style.display = 'block';
	document.getElementById('chapterContentView').style.display = 'none';
}

function formatChapterContent(content) {
	// Convert markdown-like formatting to HTML
	return content
		.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
		.replace(/\*(.*?)\*/g, '<em>$1</em>')
		.replace(/^### (.*$)/gim, '<h3>$1</h3>')
		.replace(/^## (.*$)/gim, '<h2>$1</h2>')
		.replace(/^# (.*$)/gim, '<h1>$1</h1>')
		.replace(/^\* (.*$)/gim, '<li>$1</li>')
		.replace(/^- (.*$)/gim, '<li>$1</li>')
		.replace(/\n\n/g, '</p><p>')
		.replace(/^(?!<[h|l])/gm, '<p>')
		.replace(/(?<!>)$/gm, '</p>')
		.replace(/<p><\/p>/g, '')
		.replace(/<li>.*<\/li>/g, (match) => `<ul>${match}</ul>`)
		.replace(/<\/ul>\s*<ul>/g, '');
}

async function downloadBook(bookId) {
	let book = null;
	if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
		try {
			const result = await window.supabaseConfig.getBooks();
			if (result.success) {
				const list = (result.data || []).map(b => ({
					id: String(b.id),
					title: b.title,
					fileData: b.file_data || b.fileData,
					fileName: b.file_name || b.fileName
				}));
				book = list.find(b => String(b.id) === String(bookId));
			}
		} catch (err) {
			console.error('Error fetching book for download from Supabase:', err);
		}
	}
	if (!book) {
		const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
		book = books.find(b => String(b.id) === String(bookId));
	}
	if (!book) {
		showNotification('Book not found', 'error');
		return;
	}
	const link = document.createElement('a');
	link.href = book.fileData;
	link.download = book.fileName || (book.title ? (book.title + '.pdf') : 'book.pdf');
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	showNotification('Download started!', 'success');
}

function downloadSolution(hskLevel, chapter) {
	const solutions = JSON.parse(localStorage.getItem('fizflashcard_solutions') || '[]');
	const solution = solutions.find(sol => sol.hskLevel === hskLevel && sol.chapter === chapter);
	
	if (!solution) {
		showNotification('Solution not found', 'error');
		return;
	}
	
	// Create download link
	const link = document.createElement('a');
	link.href = solution.fileData;
	link.download = solution.fileName || `${hskLevel.toUpperCase()}_Chapter_${chapter}_Solution.pdf`;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	
	showNotification('Solution download started!', 'success');
}

function showNoSolution() {
	showNotification('No solution available for this chapter yet', 'info');
}

// Utility function to escape HTML
function escapeHtml(text) {
	const div = document.createElement('div');
	div.textContent = text;
	return div.innerHTML;
}

// Test function to check materials system
window.testMaterialsSystem = function() {
	console.log('=== Testing Materials System ===');
	console.log('materialsPage element:', document.getElementById('materialsPage'));
	console.log('booksGrid element:', document.getElementById('booksGrid'));
	console.log('hsk1Chapters element:', document.getElementById('hsk1Chapters'));
	
	// Test localStorage
	console.log('Books in localStorage:', localStorage.getItem('fizflashcard_books'));
	console.log('Solutions in localStorage:', localStorage.getItem('fizflashcard_solutions'));
	
	// Test page switching
	console.log('Testing page switch to materials...');
	showPage('materials');
	
	console.log('=== End Test ===');
};

// Sample data creation function (for testing)
window.createSampleMaterials = function() {
	// Create sample books
	const sampleBooks = [
		{
			id: 'book1',
			title: 'HSK 1-2 Complete Guide',
			description: 'Comprehensive guide for HSK levels 1 and 2 with vocabulary, grammar, and practice exercises.',
			coverImage: null,
			fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAxIDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKNDQKZW5kb2JqCjIgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FtcGxlIFBERiBGaWxlKSBUagoKRVQKZW5kc3RyZWFtCmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE2NwolJUVPRgo=',
			fileName: 'HSK_1-2_Complete_Guide.pdf',
			fileSize: '2.5 MB',
			dateAdded: new Date().toISOString()
		},
		{
			id: 'book2',
			title: 'Chinese Grammar Essentials',
			description: 'Essential Chinese grammar rules and patterns for HSK 3-4 students.',
			coverImage: null,
			fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAxIDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKNDQKZW5kb2JqCjIgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FtcGxlIFBERiBGaWxlKSBUagoKRVQKZW5kc3RyZWFtCmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE2NwolJUVPRgo=',
			fileName: 'Chinese_Grammar_Essentials.pdf',
			fileSize: '3.2 MB',
			dateAdded: new Date().toISOString()
		}
	];
	
	// Create sample solutions
	const sampleSolutions = [
		{
			id: 'sol1',
			hskLevel: 'hsk1',
			chapter: 1,
			fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAxIDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKNDQKZW5kb2JqCjIgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FtcGxlIFBERiBGaWxlKSBUagoKRVQKZW5kc3RyZWFtCmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE2NwolJUVPRgo=',
			fileName: 'HSK1_Chapter1_Solution.pdf',
			fileSize: '1.8 MB',
			dateAdded: new Date().toISOString()
		},
		{
			id: 'sol2',
			hskLevel: 'hsk2',
			chapter: 3,
			fileData: 'data:application/pdf;base64,JVBERi0xLjQKJcOkw7zDtsO8CjIgMCBvYmoKPDwKL0xlbmd0aCAzIDAgUgovVHlwZSAvUGFnZQovUmVzb3VyY2VzIDw8Ci9Gb250IDw8Ci9GMSAxIDAgUgo+Pgo+PgovQ29udGVudHMgMiAwIFIKPj4KZW5kb2JqCjMgMCBvYmoKNDQKZW5kb2JqCjIgMCBvYmoKPDwKL0xlbmd0aCA0NAo+PgpzdHJlYW0KQlQKL0YxIDEyIFRmCjcyIDcyMCBUZAooU2FtcGxlIFBERiBGaWxlKSBUagoKRVQKZW5kc3RyZWFtCmVuZG9iagoxIDAgb2JqCjw8Ci9UeXBlIC9Gb250Ci9TdWJ0eXBlIC9UeXBlMQovQmFzZUZvbnQgL0hlbHZldGljYQo+PgplbmRvYmoKeHJlZgowIDQKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTQgMDAwMDAgbiAKMDAwMDAwMDEwOSAwMDAwMCBuIAp0cmFpbGVyCjw8Ci9TaXplIDQKL1Jvb3QgMSAwIFIKPj4Kc3RhcnR4cmVmCjE2NwolJUVPRgo=',
			fileName: 'HSK2_Chapter3_Solution.pdf',
			fileSize: '2.1 MB',
			dateAdded: new Date().toISOString()
		}
	];
	
	// Save to localStorage
	localStorage.setItem('fizflashcard_books', JSON.stringify(sampleBooks));
	localStorage.setItem('fizflashcard_solutions', JSON.stringify(sampleSolutions));
	
	console.log('Sample materials created!');
	showNotification('Sample materials created successfully!', 'success');
	
	// Reload materials if on materials page
	if (document.getElementById('materialsPage').style.display !== 'none') {
		loadBooks();
		loadTextbookSolutions();
	}
}; 