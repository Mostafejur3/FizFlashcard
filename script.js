document.addEventListener('DOMContentLoaded', function () {
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
	// Load words from localStorage or use empty array
	let allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];

	// Apply plan-based word access limitations
	let baseWords = window.getAccessibleWords ? window.getAccessibleWords(allWords) : allWords;

	// Track selected HSK level and filter words accordingly
	function getSelectedHskLevel() {
		// Prefer source of truth from localStorage (set by admin.js)
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
	const accountPage = document.getElementById('accountPage');
	const navLinks = document.querySelectorAll('.nav-link');
	const flashcard = document.querySelector('.flashcard');
	const masterBtn = document.querySelector('.master-btn');
	const reviewBtn = document.querySelector('.review-btn');
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

	// Load completed words for current group
	function loadMasteredWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		const key = `fizflashcard_mastered_hsk_${level}_group_${groupRange}`;
		return JSON.parse(localStorage.getItem(key) || '[]');
	}
	
	// Load review words for current group
	function loadReviewWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		const key = `fizflashcard_review_hsk_${level}_group_${groupRange}`;
		return JSON.parse(localStorage.getItem(key) || '[]');
	}
	
	// Save completed words for current group
	function saveMasteredWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
		const key = `fizflashcard_mastered_hsk_${level}_group_${groupRange}`;
		localStorage.setItem(key, JSON.stringify(masteredWords));
	}
	
	// Save review words for current group
	function saveReviewWords() {
		const level = getSelectedHskLevel();
		const groupRange = getCurrentGroupRange();
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
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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
		flashcardPage.style.display = page === 'home' ? 'block' : 'none';
		plansPage.style.display = page === 'plans' ? 'block' : 'none';
		accountPage.style.display = page === 'account' ? 'block' : 'none';
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
				btn.addEventListener('click', (ev) => {
					ev.stopPropagation();
					const wordIndex = parseInt(btn.getAttribute('data-word-index'));
					
					// Remove from review words if it's a review word
					if (title === 'Words to Review') {
						const reviewIndex = reviewWords.indexOf(wordIndex);
						if (reviewIndex >= 0) {
							reviewWords.splice(reviewIndex, 1);
							saveReviewWords();
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
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				const key = `fizflashcard_mastered_hsk_${level}_group_${range}`;
				const groupCompleted = JSON.parse(localStorage.getItem(key) || '[]');
				wordIndices.push(...groupCompleted);
			});
		} else if (type === 'review') {
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
			groupRanges.forEach(range => {
				const key = `fizflashcard_review_hsk_${level}_group_${range}`;
				const groupReview = JSON.parse(localStorage.getItem(key) || '[]');
				wordIndices.push(...groupReview);
			});
		} else if (type === 'remaining') {
			const allCompletedWords = [];
			const allReviewWords = [];
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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
					const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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

	masterBtn.addEventListener('click', () => {
		if (!masteredWords.includes(currentWordIndex)) {
			// Add to local masteredWords array (for current group display)
			masteredWords.push(currentWordIndex);
			
			// Save group-specific completion data
			saveMasteredWords();
			updateProgress();
			updateGroupPercentages();
		}
		nextWord();
	});

	reviewBtn.addEventListener('click', () => {
		if (!reviewWords.includes(currentWordIndex)) {
			reviewWords.push(currentWordIndex);
			saveReviewWords();
			updateProgress();
		}
		nextWord();
	});

	nextBtn.addEventListener('click', nextWord);

	// Function to add group option listeners
	function addGroupOptionListeners() {
		const groupOptions = document.querySelectorAll('.group-option');
		groupOptions.forEach(option => {
			option.addEventListener('click', () => {
				groupOptions.forEach(opt => opt.classList.remove('active'));
				option.classList.add('active');
				const range = option.getAttribute('data-group');
				applyGroupRange(range);
			});
		});
	}

	function isFreePlan() {
		// Check both user storage systems
		const userId = localStorage.getItem('fizflashcard_user_id');
		const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
		
		// If we have current user data, use that
		if (currentUser && currentUser.plan) {
			return currentUser.plan === 'free';
		}
		
		// Fallback to users array
		if (!userId) return true;
		const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
		const user = users.find(u => u.id === userId);
		return !user || !user.plan || user.plan === 'free';
	}

	function applyGroupRange(rangeStr) {
		// Reload all words from localStorage to get latest data
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
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
		masteredWords = loadMasteredWords();
		reviewWords = loadReviewWords();
		
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
	
	const activeGroup = document.querySelector('.group-option.active');
	applyGroupRange(activeGroup ? activeGroup.getAttribute('data-group') : '1-100');
	
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
	function handleHskLevelChange() {
		// Get current HSK level
		const levelEl = document.getElementById('selectedHsk');
		const level = levelEl ? levelEl.textContent.match(/HSK\s*(\d+)/i)?.[1] || '4' : '4';
		
		// Update localStorage to track current HSK level
		localStorage.setItem('fizflashcard_current_hsk_level', level);
		
		// Reload all words from localStorage to get latest data
		allWords = JSON.parse(localStorage.getItem('fizflashcard_words')) || [];
		
		// Update group options to show only groups for this HSK level
		updateGroupOptionsForHskLevel();
		
		// Reset to first group and refresh data
		const firstGroup = document.querySelector('.group-option');
		if (firstGroup) {
			document.querySelectorAll('.group-option').forEach(opt => opt.classList.remove('active'));
			firstGroup.classList.add('active');
			applyGroupRange(firstGroup.getAttribute('data-group'));
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
				{ range: '1-433', label: 'Group 1 (1-433)' },
				{ range: '434-866', label: 'Group 2 (434-866)' },
				{ range: '867-1300', label: 'Group 3 (867-1300)' },
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
		
		groups.forEach((group, index) => {
			const div = document.createElement('div');
			div.className = 'group-option';
			div.setAttribute('data-group', group.range);
			
			// Calculate progress percentage for this group
			const percentage = calculateGroupProgress(level, group.range);
			
			// Check if this group is locked for free users
			const isLocked = isFreePlan() && index > 0;
			const lockIcon = isLocked ? ' <i class="fas fa-lock" style="color: #e74c3c;"></i>' : '';
			
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
		opt.addEventListener('click', () => {
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
			handleHskLevelChange();
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
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
		
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
		const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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
	window.refreshWordData = function() {
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
		masteredWords = loadMasteredWords();
		reviewWords = loadReviewWords();
		
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
	
	// Initialize mobile menu
	initializeMobileMenu();
	
	// Logout button event listeners
	document.querySelectorAll('.logout-btn').forEach(btn => {
		btn.addEventListener('click', (e) => {
			e.preventDefault();
			logout();
		});
	});
	
	// Refresh button event listener
	const refreshButton = document.getElementById('refreshButton');
	if (refreshButton) {
		refreshButton.addEventListener('click', (e) => {
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
			const groupRanges = ['1-50', '51-100', '101-150', '1-100', '101-200', '201-300', '301-400', '401-500', '501-600', '1-600', '1-433', '434-866', '867-1300', '867+', '1-1300'];
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
		
		// Update account page with user data if logged in
		if (isLoggedIn) {
			updateAccountPage();
		}
	}
	
	// Update account page with user data
	function updateAccountPage() {
		const userId = localStorage.getItem('fizflashcard_user_id');
		if (!userId) {
			console.log('No user ID found');
			return;
		}
		
		const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
		const user = users.find(u => u.id === userId);
		
		console.log('Updating account page for user:', user); // Debug log
		
		if (user) {
			const nameEl = document.getElementById('userName');
			const emailEl = document.getElementById('userEmail');
			const planEl = document.getElementById('userPlan');
			const daysEl = document.getElementById('remainingDays');
			
			if (nameEl) nameEl.textContent = user.name || 'User';
			if (emailEl) emailEl.textContent = user.email || 'No email';
			if (planEl) planEl.textContent = user.plan || 'Free';
			if (daysEl) daysEl.textContent = user.remainingDays || '0';
		} else {
			console.log('User not found in users array');
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
		const userId = localStorage.getItem('fizflashcard_user_id');
		if (!userId) return;
		
		const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
		const userIndex = users.findIndex(u => u.id === userId);
		if (userIndex === -1) return;
		
		const user = users[userIndex];
		if (!user.plan || user.plan === 'free') return;
		
		const enrollmentDate = new Date(user.enrollmentDate || Date.now());
		const now = new Date();
		const daysSinceEnrollment = Math.floor((now - enrollmentDate) / (1000 * 60 * 60 * 24));
		
		let planDays = 0;
		switch(user.plan) {
			case '1month': planDays = 30; break;
			case '6months': planDays = 180; break;
			case 'lifetime': planDays = 999999; break;
		}
		
		const remainingDays = Math.max(0, planDays - daysSinceEnrollment);
		
		// Update UI
		const remainingDaysEl = document.getElementById('remainingDays');
		if (remainingDaysEl) {
			remainingDaysEl.textContent = remainingDays;
		}
		
		// Auto-downgrade if expired
		if (remainingDays === 0 && user.plan !== 'free') {
			users[userIndex].plan = 'free';
			localStorage.setItem('fizflashcard_users', JSON.stringify(users));
			alert('Your plan has expired. You have been downgraded to the free plan.');
			// Refresh the page to update UI
			location.reload();
		}
	}

	// Check remaining days on load and set up daily check
	updateRemainingDays();
	
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
}); 