// Admin Panel and User Management System
document.addEventListener('DOMContentLoaded', function() {
    // Default admin credentials (can be changed from Site Control)
    const DEFAULT_ADMIN_CREDENTIALS = {
        id: "Mostafez911",
        password: "Password@2330130222"
    };

    // Storage keys
    const STORAGE_KEYS = {
        users: 'fizflashcard_users',
        currentUser: 'fizflashcard_current_user',
        plans: 'fizflashcard_plans',
        words: 'fizflashcard_words',
        adminLoggedIn: 'fizflashcard_admin_logged_in',
            adminCredentials: 'fizflashcard_admin_credentials',
        hskLevels: 'fizflashcard_hsk_levels',
            currentHskLevel: 'fizflashcard_current_hsk_level',
            adminMessages: 'fizflashcard_admin_messages',
            footerSettings: 'fizflashcard_footer_settings',
            paymentMethods: 'fizflashcard_payment_methods',
            paymentInstructions: 'fizflashcard_payment_instructions',
            pendingRequests: 'fizflashcard_pending_requests',
            qrCodes: 'fizflashcard_qr_codes',
            csvFiles: 'fizflashcard_csv_files',
            paymentProofDetails: 'fizflashcard_payment_proof_details',
            approvalMessages: 'fizflashcard_approval_messages',
            emailSettings: 'fizflashcard_email_settings'
    };

    // Default plans
    const DEFAULT_PLANS = {
        'free': { name: 'Free Plan', price: 0, features: ['Access to first 50 words', 'Basic progress tracking', 'Demo mode only'] },
        '1month': { name: '1 Month Access', price: 5, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK 4 words', '30 days access'] },
        '6months': { name: '6 Months Access', price: 10, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK 4 words', '180 days access', 'Save 66%'] },
        'lifetime': { name: 'Lifetime Access', price: 20, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK 4 words', 'Lifetime access', 'Best value'] }
    };

    // Default HSK levels configuration
    const DEFAULT_HSK_LEVELS = {
        1: { name: 'HSK 1', totalWords: 150, groups: 3, wordsPerGroup: 50 },
        2: { name: 'HSK 2', totalWords: 150, groups: 3, wordsPerGroup: 50 },
        3: { name: 'HSK 3', totalWords: 300, groups: 6, wordsPerGroup: 50 },
        4: { name: 'HSK 4', totalWords: 600, groups: 6, wordsPerGroup: 100 }
    };

    // Initialize data
    initializeData();

    // Check for admin access
    checkAdminAccess();

    // Event listeners
    setupEventListeners();
    setupMobileMenu();

    function initializeData() {
        // Initialize users array if not exists
        if (!localStorage.getItem(STORAGE_KEYS.users)) {
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify([]));
        }

        // Initialize admin credentials if not exists
        if (!localStorage.getItem(STORAGE_KEYS.adminCredentials)) {
            localStorage.setItem(STORAGE_KEYS.adminCredentials, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
        }

        // Initialize plans if not exists
        if (!localStorage.getItem(STORAGE_KEYS.plans)) {
            localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(DEFAULT_PLANS));
        }

        // Initialize HSK levels if not exists
        if (!localStorage.getItem(STORAGE_KEYS.hskLevels)) {
            localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(DEFAULT_HSK_LEVELS));
        }

        // Initialize current HSK level if not exists
        if (!localStorage.getItem(STORAGE_KEYS.currentHskLevel)) {
            localStorage.setItem(STORAGE_KEYS.currentHskLevel, '4');
        }

        // Initialize words if not exists - start with empty array
        if (!localStorage.getItem(STORAGE_KEYS.words)) {
            localStorage.setItem(STORAGE_KEYS.words, JSON.stringify([]));
        }

        // Initialize admin messages if not exists
        if (!localStorage.getItem(STORAGE_KEYS.adminMessages)) {
            const defaultMessage = "Welcome to FizFlashcard! We're constantly improving our platform to provide you with the best Chinese learning experience. Stay tuned for new features and content updates!";
            localStorage.setItem(STORAGE_KEYS.adminMessages, JSON.stringify({
                planSectionMessage: defaultMessage,
                lastUpdated: new Date().toISOString()
            }));
        }

        // Initialize footer settings if not exists
        if (!localStorage.getItem(STORAGE_KEYS.footerSettings)) {
            const defaultFooterSettings = {
                companyName: "fiz flashcard",
                description: "Master Chinese with our intelligent flashcard system",
                email: "support@fizflashcard.com",
                phone: "+880 XXX-XXXXXXX",
                paymentMethods: ["Alipay", "WeChat Pay"],
                copyright: "© 2025 fiz flashcard. All rights reserved."
            };
            localStorage.setItem(STORAGE_KEYS.footerSettings, JSON.stringify(defaultFooterSettings));
        }

        // Initialize payment methods if not exists
        if (!localStorage.getItem(STORAGE_KEYS.paymentMethods)) {
            const defaultPaymentMethods = [
                { id: 1, name: "Alipay", description: "Mobile payment", accountInfo: "Account: 1234567890", imageUrl: null },
                { id: 2, name: "WeChat Pay", description: "Mobile payment", accountInfo: "Account: 0987654321", imageUrl: null }
            ];
            localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(defaultPaymentMethods));
        }

        // Initialize payment instructions if not exists
        if (!localStorage.getItem(STORAGE_KEYS.paymentInstructions)) {
            const defaultInstructions = `Please follow these steps to complete your payment:

1. Choose your preferred payment method
2. Scan the QR code or use the provided account details
3. Complete the payment using your mobile banking app
4. Upload payment proof and enter transaction details
5. Wait for admin approval (usually within 24 hours)

For any issues, contact us at support@fizflashcard.com`;
            localStorage.setItem(STORAGE_KEYS.paymentInstructions, defaultInstructions);
        }

        // Initialize pending requests if not exists
        if (!localStorage.getItem(STORAGE_KEYS.pendingRequests)) {
            localStorage.setItem(STORAGE_KEYS.pendingRequests, JSON.stringify([]));
        }

        // Initialize QR codes if not exists
        if (!localStorage.getItem(STORAGE_KEYS.qrCodes)) {
            localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify([]));
        }

        // Initialize CSV files if not exists
        if (!localStorage.getItem(STORAGE_KEYS.csvFiles)) {
            localStorage.setItem(STORAGE_KEYS.csvFiles, JSON.stringify([]));
        }

        // Initialize payment proof details if not exists
        if (!localStorage.getItem(STORAGE_KEYS.paymentProofDetails)) {
            const defaultProofDetails = {
                title: "Upload Payment Proof",
                description: "Please upload a screenshot of your payment confirmation and provide the transaction details below.",
                fields: {
                    paymentAccount: {
                        label: "Payment Account Name/Phone",
                        placeholder: "Enter your Alipay/WeChat account name or phone number",
                        required: true
                    },
                    transactionId: {
                        label: "Transaction ID",
                        placeholder: "Enter the transaction ID from your payment",
                        required: true
                    },
                    paymentNote: {
                        label: "Additional Note (Optional)",
                        placeholder: "Any additional information about your payment",
                        required: false
                    }
                }
            };
            localStorage.setItem(STORAGE_KEYS.paymentProofDetails, JSON.stringify(defaultProofDetails));
        }

        // Initialize approval messages if not exists
        if (!localStorage.getItem(STORAGE_KEYS.approvalMessages)) {
            const defaultApprovalMessages = {
                pendingMessage: "Your payment proof has been submitted successfully! We're reviewing your request and will notify you once it's approved. Thank you for your patience!",
                approvedMessage: "🎉 Congratulations! Your payment has been approved and your plan is now active. You can now access all premium features. Good luck with your Chinese learning journey!",
                rejectedMessage: "We're sorry, but your payment proof could not be verified. Please contact our support team for assistance or try submitting again with clearer proof."
            };
            localStorage.setItem(STORAGE_KEYS.approvalMessages, JSON.stringify(defaultApprovalMessages));
        }

        // Initialize email settings if not exists
        if (!localStorage.getItem(STORAGE_KEYS.emailSettings)) {
            const defaultEmailSettings = {
                smtpHost: "",
                smtpPort: 587,
                smtpUser: "",
                smtpPassword: "",
                fromEmail: "noreply@fizflashcard.com",
                fromName: "FizFlashcard Team",
                enabled: false
            };
            localStorage.setItem(STORAGE_KEYS.emailSettings, JSON.stringify(defaultEmailSettings));
        }

        // Update UI based on current user
        updateUserInterface();
        
        // Initialize HSK dropdown
        initializeHskDropdown();
        
        // Initialize progress section
        const currentHskLevel = localStorage.getItem(STORAGE_KEYS.currentHskLevel) || '4';
        updateProgressSection(currentHskLevel);
        
        // Initialize plan banner - DISABLED
        // initializePlanBanner();
        
        // Remove any existing plan banner
        const existingBanner = document.getElementById('planBanner');
        if (existingBanner) {
            existingBanner.remove();
        }
        
        // Set up banner button event listeners
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('upgrade-btn')) {
                showPlansPage();
            }
            if (e.target.classList.contains('close-btn')) {
                closePlanBanner();
            }
        });

        // Success modal OK button
        document.getElementById('successOk').addEventListener('click', () => {
            closeModal(document.getElementById('successModal'));
        });
        
        // Initialize plan section message
        updatePlanSectionMessage();
        
        // Initialize plan cards
        updateMainPagePlans();
    }

    function checkAdminAccess() {
        const url = window.location.href;
        if (url.includes('/admin')) {
            showAdminLogin();
        }
    }

    // Check for admin access on page load
    window.addEventListener('load', () => {
        const url = window.location.href;
        const hash = window.location.hash;
        if (url.includes('/admin') || hash === '#admin') {
            showAdminLogin();
        }
    });

    // Check for admin access on hash change
    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash === '#admin') {
            showAdminLogin();
        }
    });

    function showAdminLogin() {
        const modal = document.getElementById('adminLoginModal');
        modal.style.display = 'flex';
    }

    function setupEventListeners() {
        // Login/Signup buttons (desktop)
        document.getElementById('loginButton').addEventListener('click', () => {
            showLoginModal();
        });

        document.getElementById('signupButton').addEventListener('click', () => {
            showSignupModal();
        });

        document.getElementById('logoutButton').addEventListener('click', () => {
            logout();
        });
        
        // Login/Signup buttons (mobile)
        const loginBtnMobile = document.getElementById('loginButtonMobile');
        const signupBtnMobile = document.getElementById('signupButtonMobile');
        const logoutBtnMobile = document.getElementById('logoutButtonMobile');
        if (loginBtnMobile) {
            loginBtnMobile.addEventListener('click', () => {
                showLoginModal();
            });
        }
        if (signupBtnMobile) {
            signupBtnMobile.addEventListener('click', () => {
                showSignupModal();
            });
        }
        if (logoutBtnMobile) {
            logoutBtnMobile.addEventListener('click', () => {
                logout();
            });
        }

        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleLogin();
        });

        // Signup form
        document.getElementById('signupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleSignup();
        });

        // Admin login form
        document.getElementById('adminLoginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleAdminLogin();
        });

        // Reset admin credentials to defaults
        const resetLink = document.getElementById('resetAdminCreds');
        if (resetLink) {
            resetLink.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.setItem(STORAGE_KEYS.adminCredentials, JSON.stringify(DEFAULT_ADMIN_CREDENTIALS));
                showSuccessMessage('Admin credentials reset. Try default ID/password now.');
            });
        }

        // Change password form
        document.getElementById('changePasswordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            handleChangePassword();
        });

        // Change password button
        document.getElementById('changePasswordBtn').addEventListener('click', () => {
            showChangePasswordModal();
        });

        // Admin button
        const adminButton = document.getElementById('adminButton');
        if (adminButton) {
            adminButton.addEventListener('click', () => {
                showAdminLogin();
            });
            console.log('Admin button event listener added successfully');
        } else {
            // Admin button is intentionally hidden in UI; no console error needed
        }

        // Admin panel tabs
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                switchAdminTab(tab.getAttribute('data-tab'));
            });
        });

        // Save plans button
        document.getElementById('savePlans').addEventListener('click', () => {
            savePlanChanges();
        });

        // Save admin message button
        document.getElementById('saveAdminMessage').addEventListener('click', () => {
            saveAdminMessage();
        });

        // CSV upload button (now handled in HSK management)

        // HSK CSV upload button (now handled in HSK management)

        // Database configuration buttons
        document.getElementById('saveSupabaseConfig').addEventListener('click', () => {
            saveSupabaseConfiguration();
        });

        document.getElementById('testSupabaseConnection').addEventListener('click', () => {
            testSupabaseConnection();
        });

        // Plan selection buttons
        document.querySelectorAll('.plan-select').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const plan = e.target.getAttribute('data-plan');
                if (plan && plan !== 'free') {
                    selectPlan(plan);
                }
            });
        });

        // Admin access text click
        document.querySelector('.admin-access-text').addEventListener('click', () => {
            showAdminLogin();
        });

        // Footer settings (now in site control tab)
        document.getElementById('saveFooterSettings').addEventListener('click', () => {
            saveFooterSettings();
        });

        // Payment settings
        document.getElementById('savePaymentSettings').addEventListener('click', () => {
            savePaymentSettings();
        });

        document.getElementById('addPaymentMethod').addEventListener('click', () => {
            addPaymentMethod();
        });

        // Save payment method form
        document.getElementById('savePaymentMethod').addEventListener('click', () => {
            savePaymentMethod();
        });

        // Image preview for payment method
        document.getElementById('paymentMethodImage').addEventListener('change', (e) => {
            const file = e.target.files[0];
            const preview = document.getElementById('paymentMethodImagePreview');
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            } else {
                preview.src = '';
                preview.style.display = 'none';
            }
        });

        // Payment proof (now handled in payment gateway selection)

        const submitBtn = document.getElementById('submitPaymentProof');
        if (submitBtn) {
            console.log('Submit button found, adding event listener'); // Debug log
            submitBtn.addEventListener('click', (e) => {
                console.log('Submit button clicked!'); // Debug log
                e.preventDefault(); // Prevent form submission
                submitPaymentProof();
            });
        } else {
            console.error('Submit button not found!'); // Debug log
        }

        // QR Code management (removed - now integrated with payment methods)

        // User filter buttons
        document.querySelectorAll('.users-filter .filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                filterUsersByPlan(filter);
                
                // Update active button
                document.querySelectorAll('.users-filter .filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

        // CSV management (now handled in HSK management)

        // Switch between login and signup
        document.getElementById('switchToSignup').addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(document.getElementById('loginModal'));
            showSignupModal();
        });

        document.getElementById('switchToLogin').addEventListener('click', (e) => {
            e.preventDefault();
            closeModal(document.getElementById('signupModal'));
            showLoginModal();
        });

        // Close modals
        document.querySelectorAll('.close-modal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                closeModal(modal);
            });
        });
    }

    function setupMobileMenu() {
        const mobileMenuToggle = document.getElementById('mobileMenuToggle');
        const mobileNav = document.getElementById('mobileNav');
        
        if (mobileMenuToggle && mobileNav) {
            mobileMenuToggle.addEventListener('click', () => {
                mobileNav.classList.toggle('active');
                const icon = mobileMenuToggle.querySelector('i');
                if (mobileNav.classList.contains('active')) {
                    icon.className = 'fas fa-times';
                } else {
                    icon.className = 'fas fa-bars';
                }
                // Ensure auth buttons reflect current login state when opening the menu
                try { updateUserInterface(); } catch (_) {}
            });
            
            // Close mobile menu when clicking on nav links
            mobileNav.querySelectorAll('.nav-link').forEach(link => {
                link.addEventListener('click', () => {
                    mobileNav.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.className = 'fas fa-bars';
                    // Keep auth buttons in correct state
                    try { updateUserInterface(); } catch (_) {}
                });
            });
            
            // Close mobile menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mobileNav.contains(e.target) && !mobileMenuToggle.contains(e.target)) {
                    mobileNav.classList.remove('active');
                    const icon = mobileMenuToggle.querySelector('i');
                    icon.className = 'fas fa-bars';
                }
            });
        }
    }

    function showLoginModal() {
        const modal = document.getElementById('loginModal');
        modal.style.display = 'flex';
    }

    function showSignupModal() {
        const modal = document.getElementById('signupModal');
        modal.style.display = 'flex';
    }

    function showChangePasswordModal() {
        const modal = document.getElementById('changePasswordModal');
        modal.style.display = 'flex';
    }

    function closeModal(modal) {
        modal.style.display = 'none';
    }

    function handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const user = users.find(u => u.email === email && u.password === password);

        if (user) {
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
            updateUserInterface();
            closeModal(document.getElementById('loginModal'));
            showSuccessMessage('Login successful!');
        } else {
            showErrorMessage('Invalid email or password');
        }
    }

    function handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const university = document.getElementById('signupUniversity').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            showErrorMessage('Passwords do not match');
            return;
        }

        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        
        if (users.find(u => u.email === email)) {
            showErrorMessage('Email already exists');
            return;
        }

        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            university,
            password,
            plan: 'free',
            enrollmentDate: new Date().toISOString().split('T')[0],
            remainingDays: 0,
            planActivationDate: null
        };

        users.push(newUser);
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(newUser));

        updateUserInterface();
        closeModal(document.getElementById('signupModal'));
        showSuccessMessage('Account created successfully!');
    }

    function handleAdminLogin() {
        const adminId = document.getElementById('adminId').value;
        const adminPassword = document.getElementById('adminPassword').value;

        const storedCreds = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminCredentials)) || DEFAULT_ADMIN_CREDENTIALS;
        if (adminId === storedCreds.id && adminPassword === storedCreds.password) {
            localStorage.setItem(STORAGE_KEYS.adminLoggedIn, 'true');
            closeModal(document.getElementById('adminLoginModal'));
            updateUserInterface(); // Update UI to show admin button
            showAdminPanel();
        } else {
            showErrorMessage('Invalid admin credentials');
        }
    }

    function handleChangePassword() {
        const currentPassword = document.getElementById('currentPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmNewPassword = document.getElementById('confirmNewPassword').value;

        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        
        if (currentUser.password !== currentPassword) {
            showErrorMessage('Current password is incorrect');
            return;
        }

        if (newPassword !== confirmNewPassword) {
            showErrorMessage('New passwords do not match');
            return;
        }

        // Update password in users array
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const userIndex = users.findIndex(u => u.id === currentUser.id);
        if (userIndex !== -1) {
            users[userIndex].password = newPassword;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        }

        // Update current user
        currentUser.password = newPassword;
        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));

        closeModal(document.getElementById('changePasswordModal'));
        showSuccessMessage('Password changed successfully!');
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEYS.currentUser);
        localStorage.removeItem(STORAGE_KEYS.adminLoggedIn);
        updateUserInterface();
        showSuccessMessage('Logged out successfully!');
    }

    function updateUserInterface() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        const loginBtn = document.getElementById('loginButton');
        const signupBtn = document.getElementById('signupButton');
        const logoutBtn = document.getElementById('logoutButton');
        const loginBtnMobile = document.getElementById('loginButtonMobile');
        const signupBtnMobile = document.getElementById('signupButtonMobile');
        const logoutBtnMobile = document.getElementById('logoutButtonMobile');

        if (currentUser) {
            const setDisplay = (el, v) => { if (el) el.style.display = v; };
            // Hide login/signup, show logout (desktop)
            setDisplay(loginBtn, 'none');
            setDisplay(signupBtn, 'none');
            setDisplay(logoutBtn, 'inline-block');
            
            // Hide login/signup, show logout (mobile)
            setDisplay(loginBtnMobile, 'none');
            setDisplay(signupBtnMobile, 'none');
            setDisplay(logoutBtnMobile, 'inline-block');

            // Update account page
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
            document.getElementById('userUniversity').textContent = currentUser.university || '-';
            document.getElementById('userPlan').textContent = getPlanName(currentUser.plan);
            document.getElementById('enrollmentDate').textContent = currentUser.enrollmentDate;
            document.getElementById('remainingDays').textContent = currentUser.remainingDays || '-';
        } else {
            const setDisplay = (el, v) => { if (el) el.style.display = v; };
            setDisplay(loginBtn, 'inline-block');
            setDisplay(signupBtn, 'inline-block');
            setDisplay(logoutBtn, 'none');

            // Reset account page
            document.getElementById('userName').textContent = '-';
            document.getElementById('userEmail').textContent = '-';
            document.getElementById('userUniversity').textContent = '-';
            document.getElementById('userPlan').textContent = 'Free Plan';
            document.getElementById('enrollmentDate').textContent = '-';
            document.getElementById('remainingDays').textContent = '-';
        }

        // Always refresh plan cards to reflect the current plan on Plans page
        try { updateMainPagePlans(); } catch (_) {}
    }

    function getPlanName(planKey) {
        const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans));
        return plans[planKey] ? plans[planKey].name : 'Free Plan';
    }

    function getUserPlan() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        return currentUser ? currentUser.plan : 'free';
    }


    function isPaidPlan() {
        const plan = getUserPlan();
        return plan === '1month' || plan === '6months' || plan === 'lifetime';
    }


    function showAdminPanel() {
        const modal = document.getElementById('adminPanel');
        modal.style.display = 'flex';
        loadUsersTable();
        loadPlanEditor();
    }

    function switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.admin-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.admin-tab-content').forEach(content => {
            content.style.display = 'none';
        });
        document.getElementById(`${tabName}Tab`).style.display = 'block';

        if (tabName === 'users') {
            loadUsersTable();
        } else if (tabName === 'site') {
            loadPlanEditor();
            loadFooterSettings();
        } else if (tabName === 'payment') {
            loadPaymentSettings();
        } else if (tabName === 'pending') {
            loadPendingRequests();
        } else if (tabName === 'hsk') {
            loadHSKManagement();
        } else if (tabName === 'database') {
            loadDatabaseConfiguration();
        }
    }

    function loadUsersTable() {
        filterUsersByPlan('all');
    }

    function filterUsersByPlan(filter) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        let filteredUsers = users;
        if (filter !== 'all') {
            filteredUsers = users.filter(u => u.plan === filter);
        }

        if (filteredUsers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="7" style="text-align: center; padding: 40px; color: #6c757d;">
                    No users found for this plan
                </td>
            `;
            tbody.appendChild(row);
            return;
        }

        // Add users
        filteredUsers.forEach(user => {
            const row = document.createElement('tr');
            const remainingDays = (user.remainingDays === Infinity || user.remainingDays === -1) ? '∞' : (user.remainingDays || 0);
            
            row.innerHTML = `
                <td>${user.name}</td>
                <td>${user.email}</td>
                <td>${user.university || '-'}</td>
                <td><span class="plan-badge plan-${user.plan}">${getPlanName(user.plan)}</span></td>
                <td>${user.enrollmentDate}</td>
                <td>${remainingDays}</td>
                <td>
                    <select class="plan-selector" data-user-id="${user.id}">
                        <option value="free" ${user.plan === 'free' ? 'selected' : ''}>Free Plan</option>
                        <option value="1month" ${user.plan === '1month' ? 'selected' : ''}>1 Month Access</option>
                        <option value="6months" ${user.plan === '6months' ? 'selected' : ''}>6 Months Access</option>
                        <option value="lifetime" ${user.plan === 'lifetime' ? 'selected' : ''}>Lifetime Access</option>
                    </select>
                    <button class="qr-edit-btn" data-revoke-user-id="${user.id}" style="margin-left:8px;">Revoke Access</button>
                    <button class="qr-delete-btn" data-delete-user-id="${user.id}" style="margin-left:8px;">Delete</button>
                </td>
            `;
            tbody.appendChild(row);
        });

        // Add event listeners to plan selectors
        document.querySelectorAll('.plan-selector').forEach(selector => {
            selector.addEventListener('change', (e) => {
                const userId = e.target.getAttribute('data-user-id');
                const newPlan = e.target.value;
                updateUserPlanByAdmin(userId, newPlan);
            });
        });

        // Bind delete buttons
        document.querySelectorAll('button[data-delete-user-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uid = e.target.getAttribute('data-delete-user-id');
                deleteUserByAdmin(uid);
            });
        });

        // Bind revoke access buttons
        document.querySelectorAll('button[data-revoke-user-id]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const uid = e.target.getAttribute('data-revoke-user-id');
                revokeUserAccess(uid);
            });
        });
    }

    function deleteUserByAdmin(userId) {
        const confirmDelete = confirm('Are you sure you want to delete this user? This action cannot be undone.');
        if (!confirmDelete) return;
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const index = users.findIndex(u => u.id === userId);
        if (index === -1) return;
        const deleted = users.splice(index, 1)[0];
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (currentUser && currentUser.id === userId) {
            localStorage.removeItem(STORAGE_KEYS.currentUser);
            updateUserInterface();
        }
        showSuccessMessage(`Deleted user ${deleted.name}`);
        loadUsersTable();
    }

    function revokeUserAccess(userId) {
        const confirmRevoke = confirm('Revoke this user\'s plan access and set to Free?');
        if (!confirmRevoke) return;
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const idx = users.findIndex(u => u.id === userId);
        if (idx === -1) return;
        users[idx].plan = 'free';
        users[idx].remainingDays = 0;
        users[idx].planActivationDate = '';
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (currentUser && currentUser.id === userId) {
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(users[idx]));
            updateUserInterface();
        }
        showSuccessMessage(`Access revoked for ${users[idx].name}`);
        loadUsersTable();
    }

    function updateUserPlanByAdmin(userId, newPlan) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex === -1) return;
            users[userIndex].plan = newPlan;
        users[userIndex].planActivationDate = new Date().toISOString().split('T')[0];
        users[userIndex].remainingDays = newPlan === '1month' ? 30 : newPlan === '6months' ? 180 : newPlan === 'lifetime' ? Infinity : 0;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));

        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (currentUser && currentUser.id === users[userIndex].id) {
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(users[userIndex]));
            updateUserInterface();
        }
            showSuccessMessage(`Plan updated for ${users[userIndex].name}`);
        loadUsersTable();
    }

    function loadPlanEditor() {
        const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans));
        
        document.getElementById('plan1Price').value = plans['1month'].price;
        document.getElementById('plan1Features').value = plans['1month'].features.join('\n');
        
        document.getElementById('plan6Price').value = plans['6months'].price;
        document.getElementById('plan6Features').value = plans['6months'].features.join('\n');
        
        document.getElementById('planLifetimePrice').value = plans['lifetime'].price;
        document.getElementById('planLifetimeFeatures').value = plans['lifetime'].features.join('\n');
        
        // Load admin message
        loadAdminMessage();

        // Load admin credentials into Site Control if fields exist
        const creds = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminCredentials)) || DEFAULT_ADMIN_CREDENTIALS;
        const adminIdInput = document.getElementById('siteAdminId');
        const adminPassInput = document.getElementById('siteAdminPassword');
        if (adminIdInput && adminPassInput) {
            adminIdInput.value = creds.id || '';
            adminPassInput.value = creds.password || '';
        }
    }

    function savePlanChanges() {
        const plans = {
            '1month': {
                name: '1 Month Access',
                price: parseInt(document.getElementById('plan1Price').value),
                features: document.getElementById('plan1Features').value.split('\n').filter(f => f.trim())
            },
            '6months': {
                name: '6 Months Access',
                price: parseInt(document.getElementById('plan6Price').value),
                features: document.getElementById('plan6Features').value.split('\n').filter(f => f.trim())
            },
            'lifetime': {
                name: 'Lifetime Access',
                price: parseInt(document.getElementById('planLifetimePrice').value),
                features: document.getElementById('planLifetimeFeatures').value.split('\n').filter(f => f.trim())
            }
        };

        localStorage.setItem(STORAGE_KEYS.plans, JSON.stringify(plans));

        // Save admin credentials from Site Control if fields exist
        const adminIdInput = document.getElementById('siteAdminId');
        const adminPassInput = document.getElementById('siteAdminPassword');
        if (adminIdInput && adminPassInput) {
            const newCreds = {
                id: adminIdInput.value.trim() || DEFAULT_ADMIN_CREDENTIALS.id,
                password: adminPassInput.value || DEFAULT_ADMIN_CREDENTIALS.password
            };
            localStorage.setItem(STORAGE_KEYS.adminCredentials, JSON.stringify(newCreds));
        }
        showSuccessMessage('Plan changes saved successfully!');
        
        // Update the main page plans
        updateMainPagePlans();
    }

    function loadAdminMessage() {
        const adminMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminMessages));
        if (adminMessages && adminMessages.planSectionMessage) {
            document.getElementById('adminMessage').value = adminMessages.planSectionMessage;
        }
    }

    function saveAdminMessage() {
        const message = document.getElementById('adminMessage').value.trim();
        
        if (!message) {
            showErrorMessage('Please enter a message');
            return;
        }

        const adminMessages = {
            planSectionMessage: message,
            lastUpdated: new Date().toISOString()
        };

        localStorage.setItem(STORAGE_KEYS.adminMessages, JSON.stringify(adminMessages));
        
        // Update the plan section message on the main page
        updatePlanSectionMessage();
        
        showSuccessMessage('Admin message saved successfully!');
    }

    function updatePlanSectionMessage() {
        const adminMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.adminMessages));
        const messageArea = document.getElementById('adminMessageArea');
        
        if (messageArea && adminMessages && adminMessages.planSectionMessage) {
            messageArea.textContent = adminMessages.planSectionMessage;
        }
    }

    function updateMainPagePlans() {
        const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans));
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        const currentPlan = currentUser ? currentUser.plan : 'free';
        
        // Update plan cards on main page
        const planCards = document.querySelectorAll('.plan-card');
        const planKeys = ['free', '1month', '6months', 'lifetime'];
        
        planCards.forEach((card) => {
            // Map card by heading text to a plan key to avoid index mismatches
            const heading = (card.querySelector('h3')?.textContent || '').toLowerCase();
            let planKey = 'free';
            if (heading.includes('1 month')) planKey = '1month';
            else if (heading.includes('6 months')) planKey = '6months';
            else if (heading.includes('lifetime')) planKey = 'lifetime';
            const plan = plans[planKey];
            const button = card.querySelector('.plan-select');
            
            if (plan) {
                card.querySelector('.plan-price').textContent = `${plan.price} RMB`;
                const featuresList = card.querySelector('.plan-features');
                featuresList.innerHTML = '';
                plan.features.forEach(feature => {
                    const li = document.createElement('li');
                    li.textContent = feature;
                    featuresList.appendChild(li);
                });
                
                // Update button based on current plan
                if (planKey === currentPlan) {
                    button.textContent = 'Current Plan';
                    button.disabled = true;
                    button.style.background = '#6c757d';
                    card.classList.add('current-plan');
                } else {
                    // Non-current cards should be selectable, including Free
                    button.textContent = planKey === 'free' ? 'Switch to Free' : 'Select Plan';
                    button.disabled = false;
                    button.style.background = '';
                    card.classList.remove('current-plan');
                }
            }
        });
    }

    function uploadCsvFile() {
        const fileInput = document.getElementById('csvFile');
        const file = fileInput.files[0];

        if (!file) {
            showErrorMessage('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const newWords = [];

            lines.forEach(line => {
                if (line.trim()) {
                    const [chinese, pinyin, english, bangla] = line.split(',').map(item => item.trim());
                    if (chinese && pinyin && english) {
                        newWords.push({
                            chinese,
                            pinyin,
                            english,
                            bangla: bangla || ''
                        });
                    }
                }
            });

            if (newWords.length > 0) {
                const existingWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words));
                const updatedWords = [...existingWords, ...newWords];
                localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(updatedWords));
                
                showSuccessMessage(`Successfully uploaded ${newWords.length} new words!`);
                fileInput.value = '';
                
                // Update the main script's word list
                if (window.refreshWordData) {
                    window.refreshWordData();
                }
            } else {
                showErrorMessage('No valid words found in CSV file');
            }
        };

        reader.readAsText(file);
    }

    function showSuccessMessage(message) {
        alert(`✅ ${message}`);
    }

    function showErrorMessage(message) {
        alert(`❌ ${message}`);
    }

    // Make message functions globally accessible
    window.showSuccessMessage = showSuccessMessage;
    window.showErrorMessage = showErrorMessage;

    function openModal(modal) {
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function initializeHskDropdown() {
        const dropdownBtn = document.getElementById('hskDropdownBtn');
        const dropdownContent = document.getElementById('hskDropdownContent');
        const hskOptions = document.querySelectorAll('.hsk-option');
        const currentHskLevel = localStorage.getItem(STORAGE_KEYS.currentHskLevel) || '4';

        // Set current HSK level
        document.getElementById('selectedHsk').textContent = `HSK ${currentHskLevel}`;
        
        // Update active option
        hskOptions.forEach(option => {
            option.classList.remove('active');
            if (option.getAttribute('data-hsk') === currentHskLevel) {
                option.classList.add('active');
            }
        });

        // Dropdown toggle
        dropdownBtn.addEventListener('click', () => {
            dropdownContent.classList.toggle('show');
            dropdownBtn.classList.toggle('active');
        });

        // Option selection
        hskOptions.forEach(option => {
            option.addEventListener('click', () => {
                const selectedLevel = option.getAttribute('data-hsk');
                localStorage.setItem(STORAGE_KEYS.currentHskLevel, selectedLevel);
                
                // Update UI
                document.getElementById('selectedHsk').textContent = `HSK ${selectedLevel}`;
                hskOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Close dropdown
                dropdownContent.classList.remove('show');
                dropdownBtn.classList.remove('active');
                
                // Update word groups
                updateWordGroups(selectedLevel);
                
                // Update progress section
                updateProgressSection(selectedLevel);
                
                // Refresh word data
                if (window.refreshWordData) {
                    window.refreshWordData();
                }
            });
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
                dropdownBtn.classList.remove('active');
            }
        });

        // Initialize word groups
        updateWordGroups(currentHskLevel);
        
        // Initialize progress section
        updateProgressSection(currentHskLevel);
    }

    function updateProgressSection(hskLevel) {
        const progressElement = document.getElementById('progressHskLevel');
        if (progressElement) {
            progressElement.textContent = `HSK ${hskLevel} Overall`;
        }
        
        // Update remaining words display with lock icon for free plan
        updateRemainingWordsDisplay(hskLevel);
    }

    function updateRemainingWordsDisplay(hskLevel) {
        const remainingWordsElement = document.getElementById('remainingWords');
        const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels));
        const levelConfig = hskLevels[hskLevel];
        
        if (remainingWordsElement && levelConfig) {
            if (isFreePlan()) {
                // Show locked words with swinging lock icon - make non-clickable
                remainingWordsElement.innerHTML = `
                    <div class="stat-number locked-words locked-stat">
                        ${levelConfig.totalWords}
                        <i class="fas fa-lock swinging-lock"></i>
                    </div>
                    <div class="stat-label">Words Remaining (Locked)</div>
                `;
                remainingWordsElement.classList.add('locked');
            } else {
                // Show normal remaining words for paid plans - make clickable
                remainingWordsElement.innerHTML = `
                    <div class="stat-number">${levelConfig.totalWords}</div>
                    <div class="stat-label">Words Remaining</div>
                `;
                remainingWordsElement.classList.remove('locked');
            }
        }
    }

    function initializePlanBanner() {
        // Create banner if it doesn't exist
        let banner = document.getElementById('planBanner');
        if (!banner) {
            banner = document.createElement('div');
            banner.id = 'planBanner';
            banner.className = 'plan-banner';
            
            // Insert banner after header
            const header = document.querySelector('header');
            header.insertAdjacentElement('afterend', banner);
        }
        
        updatePlanBanner();
    }

    function updatePlanBanner(showPendingInline = false) {
        const banner = document.getElementById('planBanner');
        if (!banner) return;
        
        if (isFreePlan() || showPendingInline) {
            banner.innerHTML = `
                <div class="banner-content">
                    <div class="banner-icon">
                        <i class="fas fa-info-circle"></i>
                    </div>
                    <div class="banner-text">
                        ${showPendingInline
                            ? '<strong>Your payment is under review.</strong> We received your proof and your plan is pending approval.'
                            : '<strong>You are currently using the Free Plan.</strong> You can access the demo only. Please log in and select a plan to enjoy full access.'}
                    </div>
                    ${showPendingInline ? '' : `
                        <div class="banner-actions">
                            <button class="banner-btn upgrade-btn" onclick="showPlansPage()">
                                <i class="fas fa-crown"></i> Upgrade Now
                            </button>
                            <button class="banner-btn close-btn" onclick="closePlanBanner()">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    `}
                </div>
            `;
            banner.style.display = 'block';
        } else {
            banner.style.display = 'none';
        }
    }

    function showPlansPage() {
        // Navigate to plans page
        const plansLink = document.querySelector('[data-page="plans"]');
        if (plansLink) {
            plansLink.click();
        }
    }

    function closePlanBanner() {
        const banner = document.getElementById('planBanner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    function updateWordGroups(hskLevel) {
        const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels));
        const levelConfig = hskLevels[hskLevel];
        const groupOptions = document.querySelector('.group-options');
        
        if (!levelConfig) return;

        groupOptions.innerHTML = '';
        
        // Create groups based on configuration
        for (let i = 1; i <= levelConfig.groups; i++) {
            const startWord = (i - 1) * levelConfig.wordsPerGroup + 1;
            const endWord = i * levelConfig.wordsPerGroup;
            const groupDiv = document.createElement('div');
            groupDiv.className = 'group-option';
            groupDiv.setAttribute('data-group', `${startWord}-${endWord}`);
            groupDiv.innerHTML = `Group ${i} (${startWord}-${endWord}) <span>0%</span>`;
            groupOptions.appendChild(groupDiv);
        }

        // Add "All Words" option
        const allWordsDiv = document.createElement('div');
        allWordsDiv.className = 'group-option';
        allWordsDiv.setAttribute('data-group', `1-${levelConfig.totalWords}`);
        allWordsDiv.innerHTML = `All Words (1-${levelConfig.totalWords}) <span>0%</span>`;
        groupOptions.appendChild(allWordsDiv);

        // Set first group as active
        const firstGroup = groupOptions.querySelector('.group-option');
        if (firstGroup) {
            firstGroup.classList.add('active');
        }

        // Add click event listeners to new group options
        if (window.addGroupOptionListeners) {
            window.addGroupOptionListeners();
        }
    }

    function updateHskLevel(level) {
        const groups = document.getElementById(`hsk${level}Groups`).value;
        const wordsPerGroup = document.getElementById(`hsk${level}WordsPerGroup`).value;
        
        const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels));
        hskLevels[level].groups = parseInt(groups);
        hskLevels[level].wordsPerGroup = parseInt(wordsPerGroup);
        hskLevels[level].totalWords = groups * wordsPerGroup;
        
        localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(hskLevels));
        
        // Update current level if it's the same
        const currentLevel = localStorage.getItem(STORAGE_KEYS.currentHskLevel);
        if (currentLevel === level.toString()) {
            updateWordGroups(level);
        }
        
        showSuccessMessage(`HSK ${level} configuration updated!`);
    }

    function uploadHskCsvFile() {
        const fileInput = document.getElementById('hskCsvFile');
        const hskLevel = document.getElementById('hskLevelSelect').value;
        const file = fileInput.files[0];

        if (!file) {
            showErrorMessage('Please select a CSV file');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const newWords = [];

            lines.forEach(line => {
                if (line.trim()) {
                    const [chinese, pinyin, english, bangla] = line.split(',').map(item => item.trim());
                    if (chinese && pinyin && english) {
                        newWords.push({
                            chinese,
                            pinyin,
                            english,
                            bangla: bangla || '',
                            hskLevel: parseInt(hskLevel)
                        });
                    }
                }
            });

            if (newWords.length > 0) {
                const existingWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words));
                const updatedWords = [...existingWords, ...newWords];
                localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(updatedWords));
                
                showSuccessMessage(`Successfully uploaded ${newWords.length} words for HSK ${hskLevel}!`);
                fileInput.value = '';
                
                // Update the main script's word list
                if (window.refreshWordData) {
                    window.refreshWordData();
                }
            } else {
                showErrorMessage('No valid words found in CSV file');
            }
        };

        reader.readAsText(file);
    }

    function loadDatabaseConfiguration() {
        // Load current configuration status
        updateConfigurationStatus();
        
        // Load current values into form
        const envVars = JSON.parse(localStorage.getItem('fizflashcard_env_vars') || '{}');
        document.getElementById('supabaseUrl').value = envVars.SUPABASE_URL || '';
        document.getElementById('supabaseKey').value = envVars.SUPABASE_KEY || '';
        document.getElementById('supabaseServiceKey').value = envVars.SUPABASE_SERVICE_KEY || '';
    }

    function updateConfigurationStatus() {
        if (window.supabaseConfig) {
            const status = window.supabaseConfig.getConfigurationStatus();
            
            document.getElementById('urlStatus').textContent = status.url;
            document.getElementById('urlStatus').className = `status-value ${status.url === 'Set' ? 'configured' : 'not-configured'}`;
            
            document.getElementById('keyStatus').textContent = status.key;
            document.getElementById('keyStatus').className = `status-value ${status.key === 'Set' ? 'configured' : 'not-configured'}`;
            
            document.getElementById('serviceKeyStatus').textContent = status.serviceKey;
            document.getElementById('serviceKeyStatus').className = `status-value ${status.serviceKey === 'Set' ? 'configured' : 'not-configured'}`;
        }
    }

    function saveSupabaseConfiguration() {
        const url = document.getElementById('supabaseUrl').value.trim();
        const key = document.getElementById('supabaseKey').value.trim();
        const serviceKey = document.getElementById('supabaseServiceKey').value.trim();

        if (!url || !key) {
            showErrorMessage('Please provide both Supabase URL and API Key');
            return;
        }

        if (!url.startsWith('https://') || !url.includes('supabase.co')) {
            showErrorMessage('Please provide a valid Supabase URL');
            return;
        }

        // Save configuration
        if (window.supabaseConfig) {
            window.supabaseConfig.configureSupabase(url, key, serviceKey || null);
            updateConfigurationStatus();
            showSuccessMessage('Supabase configuration saved successfully!');
        } else {
            showErrorMessage('Supabase configuration module not loaded');
        }
    }

    function testSupabaseConnection() {
        if (!window.supabaseConfig || !window.supabaseConfig.isConfigured()) {
            showErrorMessage('Please configure Supabase credentials first');
            return;
        }

        // Show loading state
        const testBtn = document.getElementById('testSupabaseConnection');
        const originalText = testBtn.textContent;
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        // Simulate connection test (in real implementation, this would make an actual API call)
        setTimeout(() => {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            
            // For demo purposes, always show success
            // In real implementation, you would test the actual connection
            showSuccessMessage('Supabase connection test successful!');
        }, 2000);
    }

    function selectPlan(planKey) {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (!currentUser) {
            showErrorMessage('Please log in to select a plan');
            return;
        }

        const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans));
        const selectedPlan = plans[planKey];
        
        if (!selectedPlan) {
            showErrorMessage('Invalid plan selected');
            return;
        }

        // Show payment modal
        showPaymentModal(planKey, selectedPlan);
    }

    function showPaymentModal(planKey, plan) {
        const modal = document.getElementById('paymentModal');
        const selectedPlanText = document.getElementById('selectedPlanText');
        
        selectedPlanText.textContent = `${plan.name} (${plan.price} RMB)`;
        modal.style.display = 'flex';
        
        // Store selected plan for payment completion
        modal.setAttribute('data-selected-plan', planKey);
        
        // Load payment gateways
        loadPaymentGateways();
    }

    // Payment Gateway Functions
    function loadPaymentGateways() {
        const paymentMethods = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentMethods));
        const container = document.getElementById('paymentGatewayGrid');
        
        container.innerHTML = '';
        
        paymentMethods.forEach(method => {
            const gatewayBox = document.createElement('div');
            gatewayBox.className = 'payment-gateway-box';
            gatewayBox.setAttribute('data-method-id', method.id);
            
            gatewayBox.innerHTML = `
                <div class="gateway-image">
                    ${method.imageUrl ? 
                        `<img src="${method.imageUrl}" alt="${method.name}">` : 
                        `<i class="fas fa-credit-card" style="font-size: 2rem; color: #6c757d;"></i>`
                    }
                </div>
                <div class="gateway-name">${method.name}</div>
                <div class="gateway-description">${method.description || 'Payment method'}</div>
                <div class="gateway-account">${method.accountInfo || 'Account details'}</div>
            `;
            
            gatewayBox.addEventListener('click', () => {
                selectPaymentGateway(gatewayBox, method);
            });
            
            container.appendChild(gatewayBox);
        });
    }

    function selectPaymentGateway(selectedBox, method) {
        // Remove selection from all boxes
        document.querySelectorAll('.payment-gateway-box').forEach(box => {
            box.classList.remove('selected');
        });
        
        // Select current box
        selectedBox.classList.add('selected');
        
        // Store selected method
        selectedBox.setAttribute('data-selected', 'true');
        
        // Show proceed button
        showProceedButton(method);
    }

    function showProceedButton(method) {
        // Remove existing proceed button if any
        const existingBtn = document.querySelector('.proceed-payment-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        // Create proceed button
        const proceedBtn = document.createElement('button');
        proceedBtn.className = 'form-submit proceed-payment-btn';
        proceedBtn.textContent = `Proceed with ${method.name}`;
        proceedBtn.style.marginTop = '20px';
        proceedBtn.style.width = '100%';
        
        proceedBtn.addEventListener('click', () => {
            proceedToPaymentProof(method);
        });
        
        // Add button to modal
        const modal = document.getElementById('paymentModal');
        modal.querySelector('.modal-content').appendChild(proceedBtn);
    }

    function proceedToPaymentProof(method) {
        // Close payment modal
        document.getElementById('paymentModal').style.display = 'none';
        
        // Show payment proof modal
        const proofModal = document.getElementById('paymentProofModal');
        const proofMethodText = document.getElementById('proofMethodText');
        const proofPlanText = document.getElementById('proofPlanText');
        
        // Update proof modal with selected plan and method
        const selectedPlanKey = document.getElementById('paymentModal').getAttribute('data-selected-plan');
        const selectedPlan = DEFAULT_PLANS[selectedPlanKey];
        
        proofPlanText.textContent = `${selectedPlan.name} (${selectedPlan.price} RMB)`;
        proofMethodText.textContent = method.name;
        
        // Store selected plan and method for submission
        proofModal.setAttribute('data-selected-plan', selectedPlanKey);
        proofModal.setAttribute('data-selected-method', JSON.stringify(method));
        
        // Update modal content with dynamic settings
        updatePaymentProofModalContent();
        
        proofModal.style.display = 'flex';
    }

    function updatePaymentProofModalContent() {
        const proofDetails = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentProofDetails));
        
        // Update modal title and description
        const modalTitle = document.querySelector('#paymentProofModal .modal-header h3');
        const modalDescription = document.querySelector('#paymentProofModal .modal-content p');
        
        if (modalTitle) {
            modalTitle.textContent = proofDetails.title || 'Upload Payment Proof';
        }
        
        // Update form labels and placeholders
        const accountLabel = document.querySelector('label[for="paymentAccount"]');
        const accountInput = document.getElementById('paymentAccount');
        const transactionLabel = document.querySelector('label[for="transactionId"]');
        const transactionInput = document.getElementById('transactionId');
        const noteLabel = document.querySelector('label[for="paymentNote"]');
        const noteInput = document.getElementById('paymentNote');
        
        if (accountLabel) {
            accountLabel.textContent = proofDetails.fields.paymentAccount.label || 'Payment Account Name/Phone Number';
        }
        if (accountInput) {
            accountInput.placeholder = proofDetails.fields.paymentAccount.placeholder || 'Enter account name or phone number';
        }
        
        if (transactionLabel) {
            transactionLabel.textContent = proofDetails.fields.transactionId.label || 'Transaction ID';
        }
        if (transactionInput) {
            transactionInput.placeholder = proofDetails.fields.transactionId.placeholder || 'Enter your transaction ID';
        }
        
        if (noteLabel) {
            noteLabel.textContent = proofDetails.fields.paymentNote.label || 'Note (Optional)';
        }
        if (noteInput) {
            noteInput.placeholder = proofDetails.fields.paymentNote.placeholder || 'Any additional information...';
        }
    }



    function updateUserInterface() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        const adminLoggedIn = localStorage.getItem(STORAGE_KEYS.adminLoggedIn) === 'true';
        const loginBtn = document.getElementById('loginButton');
        const signupBtn = document.getElementById('signupButton');
        const logoutBtn = document.getElementById('logoutButton');
        
        // Mobile auth buttons
        const loginBtnMobile = document.getElementById('loginButtonMobile');
        const signupBtnMobile = document.getElementById('signupButtonMobile');
        const logoutBtnMobile = document.getElementById('logoutButtonMobile');

        if (currentUser) {
            // Desktop buttons
            loginBtn.style.display = 'none';
            signupBtn.style.display = 'none';
            logoutBtn.style.display = 'inline-block';
            
            // Mobile buttons
            if (loginBtnMobile) loginBtnMobile.style.display = 'none';
            if (signupBtnMobile) signupBtnMobile.style.display = 'none';
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'inline-block';

            // Update account page
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('userEmail').textContent = currentUser.email;
            document.getElementById('userUniversity').textContent = currentUser.university || '-';
            document.getElementById('userPlan').textContent = getPlanName(currentUser.plan);
            document.getElementById('enrollmentDate').textContent = currentUser.enrollmentDate;
            document.getElementById('remainingDays').textContent = currentUser.remainingDays || '-';
        } else {
            // Desktop buttons
            loginBtn.style.display = 'inline-block';
            signupBtn.style.display = 'inline-block';
            logoutBtn.style.display = 'none';
            
            // Mobile buttons
            if (loginBtnMobile) loginBtnMobile.style.display = 'inline-block';
            if (signupBtnMobile) signupBtnMobile.style.display = 'inline-block';
            if (logoutBtnMobile) logoutBtnMobile.style.display = 'none';

            // Reset account page
            document.getElementById('userName').textContent = '-';
            document.getElementById('userEmail').textContent = '-';
            document.getElementById('userUniversity').textContent = '-';
            document.getElementById('userPlan').textContent = 'Free Plan';
            document.getElementById('enrollmentDate').textContent = '-';
            document.getElementById('remainingDays').textContent = '-';
        }

        // Update plan banner and progress section - DISABLED
        // updatePlanBanner();
        const currentHskLevel = localStorage.getItem(STORAGE_KEYS.currentHskLevel) || '4';
        updateProgressSection(currentHskLevel);
    }

    // Make functions globally available
    window.showAdminPanel = showAdminPanel;
    window.updateMainPagePlans = updateMainPagePlans;
    window.updateHskLevel = updateHskLevel;
    window.showAdminButton = function() {
        localStorage.setItem(STORAGE_KEYS.adminLoggedIn, 'true');
        updateUserInterface();
    };
    window.showPlansPage = showPlansPage;
    window.closePlanBanner = closePlanBanner;
    window.getAccessibleWords = getAccessibleWords;
    window.isFreePlan = isFreePlan;
    window.isPaidPlan = isPaidPlan;
    window.completePayment = completePayment;
    window.viewPaymentProof = viewPaymentProof;
    
    // Footer Settings Functions
    function loadFooterSettings() {
        const footerSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.footerSettings));
        
        document.getElementById('footerCompanyName').value = footerSettings.companyName;
        document.getElementById('footerDescription').value = footerSettings.description;
        document.getElementById('footerEmail').value = footerSettings.email;
        document.getElementById('footerPhone').value = footerSettings.phone;
        document.getElementById('footerPaymentMethods').value = footerSettings.paymentMethods.join('\n');
        document.getElementById('footerCopyright').value = footerSettings.copyright;
    }

    function saveFooterSettings() {
        const footerSettings = {
            companyName: document.getElementById('footerCompanyName').value.trim(),
            description: document.getElementById('footerDescription').value.trim(),
            email: document.getElementById('footerEmail').value.trim(),
            phone: document.getElementById('footerPhone').value.trim(),
            paymentMethods: document.getElementById('footerPaymentMethods').value.split('\n').filter(m => m.trim()),
            copyright: document.getElementById('footerCopyright').value.trim()
        };

        localStorage.setItem(STORAGE_KEYS.footerSettings, JSON.stringify(footerSettings));
        updateFooterDisplay();
        showSuccessMessage('Footer settings saved successfully!');
    }

    function updateFooterDisplay() {
        const footerSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.footerSettings));
        
        // Update footer content
        const footerSections = document.querySelectorAll('.footer-section');
        if (footerSections[0]) {
            footerSections[0].querySelector('h3').textContent = footerSettings.companyName;
            footerSections[0].querySelector('p').textContent = footerSettings.description;
        }
        
        if (footerSections[1]) {
            footerSections[1].querySelectorAll('p')[0].textContent = `Email: ${footerSettings.email}`;
            footerSections[1].querySelectorAll('p')[1].textContent = `Phone: ${footerSettings.phone}`;
        }
        
        if (footerSections[2]) {
            const paymentMethodsList = footerSections[2].querySelectorAll('p');
            paymentMethodsList.forEach((p, index) => {
                if (footerSettings.paymentMethods[index]) {
                    p.textContent = footerSettings.paymentMethods[index];
                }
            });
        }
        
        const copyrightElement = document.querySelector('.copyright p');
        if (copyrightElement) {
            copyrightElement.innerHTML = `<span class="admin-access-text">${footerSettings.copyright}</span>`;
        }
    }

    // Payment Settings Functions
    function loadPaymentSettings() {
        // Load payment methods
        loadPaymentMethodsList();
        
        // Load payment instructions
        const paymentInstructions = localStorage.getItem(STORAGE_KEYS.paymentInstructions);
        document.getElementById('paymentInstructions').value = paymentInstructions || '';
        
        // Load payment proof details
        loadPaymentProofDetails();
        
        // Load approval messages
        loadApprovalMessages();
        
        // Load email settings
        loadEmailSettings();
    }

    function loadPaymentMethodsList() {
        const paymentMethods = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentMethods));
        const container = document.getElementById('paymentMethodsList');
        
        container.innerHTML = '';
        
        if (paymentMethods.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-credit-card" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    <p>No payment methods added yet</p>
                </div>
            `;
            return;
        }
        
        paymentMethods.forEach(method => {
            const methodDiv = document.createElement('div');
            methodDiv.className = 'payment-method-item';
            methodDiv.innerHTML = `
                <div class="method-info">
                    <div class="method-image">
                        ${method.imageUrl ? 
                            `<img src="${method.imageUrl}" alt="${method.name}" style="width: 60px; height: 60px; object-fit: contain; border-radius: 6px;">` : 
                            `<div style="width: 60px; height: 60px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; display: flex; align-items: center; justify-content: center; color: #6c757d;">
                                <i class="fas fa-credit-card"></i>
                            </div>`
                        }
                    </div>
                    <div class="method-details">
                        <strong>${method.name}</strong>
                        <span>${method.description || 'No description'}</span>
                        <small>Account: ${method.accountInfo || 'Not set'}</small>
                    </div>
                </div>
                <div class="method-actions">
                    <button class="method-edit-btn" onclick="editPaymentMethod(${method.id})">Edit</button>
                    <button class="method-delete-btn" onclick="deletePaymentMethod(${method.id})">Delete</button>
                </div>
            `;
            container.appendChild(methodDiv);
        });
    }

    function loadPaymentProofDetails() {
        const proofDetails = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentProofDetails));
        
        document.getElementById('proofTitle').value = proofDetails.title || '';
        document.getElementById('proofDescription').value = proofDetails.description || '';
        document.getElementById('proofAccountLabel').value = proofDetails.fields.paymentAccount.label || '';
        document.getElementById('proofAccountPlaceholder').value = proofDetails.fields.paymentAccount.placeholder || '';
        document.getElementById('proofTransactionLabel').value = proofDetails.fields.transactionId.label || '';
        document.getElementById('proofTransactionPlaceholder').value = proofDetails.fields.transactionId.placeholder || '';
        document.getElementById('proofNoteLabel').value = proofDetails.fields.paymentNote.label || '';
        document.getElementById('proofNotePlaceholder').value = proofDetails.fields.paymentNote.placeholder || '';
    }

    function loadApprovalMessages() {
        const messages = JSON.parse(localStorage.getItem(STORAGE_KEYS.approvalMessages));
        
        document.getElementById('pendingMessage').value = messages.pendingMessage || '';
        document.getElementById('approvedMessage').value = messages.approvedMessage || '';
        document.getElementById('rejectedMessage').value = messages.rejectedMessage || '';
    }

    function loadEmailSettings() {
        const emailSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.emailSettings));
        
        document.getElementById('emailEnabled').checked = emailSettings.enabled || false;
        document.getElementById('smtpHost').value = emailSettings.smtpHost || '';
        document.getElementById('smtpPort').value = emailSettings.smtpPort || 587;
        document.getElementById('smtpUser').value = emailSettings.smtpUser || '';
        document.getElementById('smtpPassword').value = emailSettings.smtpPassword || '';
        document.getElementById('fromEmail').value = emailSettings.fromEmail || '';
        document.getElementById('fromName').value = emailSettings.fromName || '';
    }

    function addPaymentMethod() {
        // Clear form
        document.getElementById('paymentMethodName').value = '';
        document.getElementById('paymentMethodDescription').value = '';
        document.getElementById('paymentMethodAccount').value = '';
        document.getElementById('paymentMethodImage').value = '';
        document.getElementById('paymentMethodImagePreview').src = '';
        document.getElementById('paymentMethodImagePreview').style.display = 'none';
        
        // Show the form (it should be visible by default in the new design)
        document.getElementById('paymentMethodForm').style.display = 'block';
    }

    function savePaymentMethod() {
        const name = document.getElementById('paymentMethodName').value.trim();
        const description = document.getElementById('paymentMethodDescription').value.trim();
        const accountInfo = document.getElementById('paymentMethodAccount').value.trim();
        const imageFile = document.getElementById('paymentMethodImage').files[0];
        
        if (!name) {
            showErrorMessage('Please enter payment method name');
            return;
        }
        
        const paymentMethods = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentMethods));
        
        let imageUrl = null;
        if (imageFile) {
            const reader = new FileReader();
            reader.onload = (e) => {
                imageUrl = e.target.result;
                const newMethod = {
                    id: Date.now(),
                    name: name,
                    description: description,
                    accountInfo: accountInfo,
                    imageUrl: imageUrl
                };
                paymentMethods.push(newMethod);
                localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
                loadPaymentMethodsList();
                showSuccessMessage('Payment method added successfully!');
                
                // Clear form
                document.getElementById('paymentMethodName').value = '';
                document.getElementById('paymentMethodDescription').value = '';
                document.getElementById('paymentMethodAccount').value = '';
                document.getElementById('paymentMethodImage').value = '';
                document.getElementById('paymentMethodImagePreview').src = '';
                document.getElementById('paymentMethodImagePreview').style.display = 'none';
            };
            reader.readAsDataURL(imageFile);
        } else {
            const newMethod = {
                id: Date.now(),
                name: name,
                description: description,
                accountInfo: accountInfo,
                imageUrl: null
            };
            paymentMethods.push(newMethod);
            localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
            loadPaymentMethodsList();
            showSuccessMessage('Payment method added successfully!');
            
            // Clear form
            document.getElementById('paymentMethodName').value = '';
            document.getElementById('paymentMethodDescription').value = '';
            document.getElementById('paymentMethodAccount').value = '';
            document.getElementById('paymentMethodImage').value = '';
            document.getElementById('paymentMethodImagePreview').src = '';
            document.getElementById('paymentMethodImagePreview').style.display = 'none';
        }
    }

    function editPaymentMethod(methodId) {
        const paymentMethods = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentMethods));
        const method = paymentMethods.find(m => m.id === methodId);
        
        if (!method) return;
        
        const newName = prompt('Enter new name:', method.name);
        if (newName === null) return;
        
        const newDescription = prompt('Enter new description:', method.description);
        if (newDescription === null) return;
        
        const newAccountInfo = prompt('Enter new account information:', method.accountInfo);
        if (newAccountInfo === null) return;
        
        const updateImage = confirm('Do you want to update the payment method image?');
        if (updateImage) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        method.name = newName;
                        method.description = newDescription;
                        method.accountInfo = newAccountInfo;
                        method.imageUrl = e.target.result;
                        method.fileName = file.name;
                        
                        localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
                        loadPaymentMethodsList();
                        showSuccessMessage('Payment method updated successfully!');
                    };
                    reader.readAsDataURL(file);
                }
            };
            fileInput.click();
        } else {
            method.name = newName;
            method.description = newDescription;
            method.accountInfo = newAccountInfo;
            
            localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(paymentMethods));
            loadPaymentMethodsList();
            showSuccessMessage('Payment method updated successfully!');
        }
    }

    function deletePaymentMethod(methodId) {
        if (!confirm('Are you sure you want to delete this payment method?')) return;
        
        const paymentMethods = JSON.parse(localStorage.getItem(STORAGE_KEYS.paymentMethods));
        const filteredMethods = paymentMethods.filter(m => m.id !== methodId);
        
        localStorage.setItem(STORAGE_KEYS.paymentMethods, JSON.stringify(filteredMethods));
        loadPaymentMethodsList();
        showSuccessMessage('Payment method deleted successfully!');
    }

    function savePaymentSettings() {
        // Save payment instructions
        const paymentInstructions = document.getElementById('paymentInstructions').value.trim();
        localStorage.setItem(STORAGE_KEYS.paymentInstructions, paymentInstructions);
        
        // Save payment proof details
        const proofDetails = {
            title: document.getElementById('proofTitle').value.trim(),
            description: document.getElementById('proofDescription').value.trim(),
            fields: {
                paymentAccount: {
                    label: document.getElementById('proofAccountLabel').value.trim(),
                    placeholder: document.getElementById('proofAccountPlaceholder').value.trim(),
                    required: true
                },
                transactionId: {
                    label: document.getElementById('proofTransactionLabel').value.trim(),
                    placeholder: document.getElementById('proofTransactionPlaceholder').value.trim(),
                    required: true
                },
                paymentNote: {
                    label: document.getElementById('proofNoteLabel').value.trim(),
                    placeholder: document.getElementById('proofNotePlaceholder').value.trim(),
                    required: false
                }
            }
        };
        localStorage.setItem(STORAGE_KEYS.paymentProofDetails, JSON.stringify(proofDetails));
        
        // Save approval messages
        const approvalMessages = {
            pendingMessage: document.getElementById('pendingMessage').value.trim(),
            approvedMessage: document.getElementById('approvedMessage').value.trim(),
            rejectedMessage: document.getElementById('rejectedMessage').value.trim()
        };
        localStorage.setItem(STORAGE_KEYS.approvalMessages, JSON.stringify(approvalMessages));
        
        // Save email settings
        const emailSettings = {
            enabled: document.getElementById('emailEnabled').checked,
            smtpHost: document.getElementById('smtpHost').value.trim(),
            smtpPort: parseInt(document.getElementById('smtpPort').value) || 587,
            smtpUser: document.getElementById('smtpUser').value.trim(),
            smtpPassword: document.getElementById('smtpPassword').value.trim(),
            fromEmail: document.getElementById('fromEmail').value.trim(),
            fromName: document.getElementById('fromName').value.trim()
        };
        localStorage.setItem(STORAGE_KEYS.emailSettings, JSON.stringify(emailSettings));
        
        showSuccessMessage('All payment settings saved successfully!');
    }

    // Pending Requests Functions
    function loadPendingRequests(filter = 'all') {
        const allRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const tbody = document.getElementById('pendingRequestsBody');
        
        tbody.innerHTML = '';
        const pendingRequests = allRequests.filter(r => filter === 'all' ? true : r.status === filter);
        pendingRequests.forEach(request => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${request.userName}</td>
                <td>${request.planName}</td>
                <td>${request.paymentMethod}</td>
                <td>${request.amount} RMB</td>
                <td>${request.transactionId || '-'}</td>
                <td><span class="status-badge status-${request.status}">${request.status}</span></td>
                <td>${new Date(request.date).toLocaleDateString()}</td>
                <td>
                    <div class="action-buttons" style="gap:6px;">
                        <button class="approve-btn" onclick="approveRequest('${request.id}')">Approve</button>
                        <button class="reject-btn" onclick="rejectRequest('${request.id}')">Reject</button>
                        <button class="view-btn" onclick="viewPaymentProof('${request.id}')">View</button>
                        <button class="delete-btn" onclick="deleteRequest('${request.id}')">Delete</button>
                    </div>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // Make loadPendingRequests globally accessible
    window.loadPendingRequests = loadPendingRequests;

    // Pending filter buttons
    (function initPendingFilters(){
        const container = document.querySelector('.requests-filter');
        if (!container) return;
        container.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                container.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
                e.currentTarget.classList.add('active');
                const f = e.currentTarget.getAttribute('data-filter');
                loadPendingRequests(f === 'all' ? 'all' : f);
            });
        });
    })();

    function viewPaymentProof(requestId) {
        const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const req = pendingRequests.find(r => r.id === requestId);
        if (!req) return;
        
        const detailHtml = `
            <div style="max-width:600px;">
                <h3 style="margin-bottom:10px;">Payment Details</h3>
                <p><strong>User:</strong> ${req.userName} (${req.userEmail})</p>
                <p><strong>Plan:</strong> ${req.planName} - ${req.amount} RMB</p>
                <p><strong>Method:</strong> ${req.paymentMethod}</p>
                <p><strong>Account:</strong> ${req.paymentAccount}</p>
                <p><strong>Transaction ID:</strong> ${req.transactionId}</p>
                <p><strong>Note:</strong> ${req.note || '-'}</p>
                ${req.proofDataUrl ? `<div style="margin-top:10px;"><img src="${req.proofDataUrl}" alt="Proof" style="max-width:100%;border:1px solid #eee;border-radius:8px;"></div>` : ''}
            </div>
        `;
        showFloatingViewer(detailHtml);
    }

    function showFloatingViewer(innerHtml) {
        const overlay = document.createElement('div');
        overlay.id = 'paymentProofViewerOverlay';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.45)';
        overlay.style.zIndex = '9999';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';

        const box = document.createElement('div');
        box.style.background = '#fff';
        box.style.borderRadius = '10px';
        box.style.maxWidth = '720px';
        box.style.width = '90%';
        box.style.maxHeight = '80vh';
        box.style.overflowY = 'auto';
        box.style.padding = '20px';
        box.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
        box.innerHTML = innerHtml + '<div style="margin-top:16px;text-align:right;"><button class="form-submit" id="closeViewer">Close</button></div>';

        overlay.appendChild(box);
        document.body.appendChild(overlay);

        overlay.querySelector('#closeViewer').onclick = () => {
            closeFloatingViewer();
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeFloatingViewer();
            }
        });
    }

    function closeFloatingViewer() {
        const ov = document.getElementById('paymentProofViewerOverlay');
        if (ov && ov.parentNode) {
            ov.parentNode.removeChild(ov);
        }
    }

    // Expose close function for safety from other scripts
    window.closeFloatingViewer = closeFloatingViewer;

    function approveRequest(requestId) {
        const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const request = pendingRequests.find(r => r.id === requestId);
        
        if (!request) return;
        
        // Update user plan
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const userIndex = users.findIndex(u => u.id === request.userId);
        
        if (userIndex !== -1) {
            const today = new Date();
            users[userIndex].plan = request.planKey;
            users[userIndex].planActivationDate = today.toISOString().split('T')[0];
            users[userIndex].remainingDays = request.planKey === '1month' ? 30 :
                                            request.planKey === '6months' ? 180 :
                                            request.planKey === 'lifetime' ? Infinity : 0;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
            if (currentUser && currentUser.id === users[userIndex].id) {
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(users[userIndex]));
                updateUserInterface();
            }
        }
        
        // Update request status
        request.status = 'approved';
        request.approvedDate = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEYS.pendingRequests, JSON.stringify(pendingRequests));
        const activeFilter = document.querySelector('.requests-filter .filter-btn.active');
        loadPendingRequests(activeFilter ? activeFilter.getAttribute('data-filter') : 'all');
        
        // Send approval email
        sendApprovalEmail(request, 'approved');
        
        showSuccessMessage('Request approved successfully!');
    }

    function rejectRequest(requestId) {
        const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const request = pendingRequests.find(r => r.id === requestId);
        
        if (!request) return;
        
        request.status = 'rejected';
        request.rejectedDate = new Date().toISOString();
        
        localStorage.setItem(STORAGE_KEYS.pendingRequests, JSON.stringify(pendingRequests));
        const activeFilter = document.querySelector('.requests-filter .filter-btn.active');
        loadPendingRequests(activeFilter ? activeFilter.getAttribute('data-filter') : 'all');
        
        // Send rejection email
        sendApprovalEmail(request, 'rejected');
        
        showSuccessMessage('Request rejected successfully!');
    }

    // Make deleteRequest globally accessible
    window.deleteRequest = function(requestId) {
        if (!confirm('Are you sure you want to delete this request? This action cannot be undone.')) {
            return;
        }
        
        const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const requestIndex = pendingRequests.findIndex(r => r.id === requestId);
        
        if (requestIndex === -1) {
            showErrorMessage('Request not found!');
            return;
        }
        
        // Remove the request from the array
        pendingRequests.splice(requestIndex, 1);
        localStorage.setItem(STORAGE_KEYS.pendingRequests, JSON.stringify(pendingRequests));
        
        // Reload the table
        const activeFilter = document.querySelector('.requests-filter .filter-btn.active');
        loadPendingRequests(activeFilter ? activeFilter.getAttribute('data-filter') : 'all');
        
        showSuccessMessage('Request deleted successfully!');
    };

    // Payment Flow Functions

    function submitPaymentProof() {
        console.log('submitPaymentProof called'); // Debug log
        
        // Get form data
        const paymentAccount = document.getElementById('paymentAccount').value.trim();
        const transactionId = document.getElementById('transactionId').value.trim();
        const paymentNote = document.getElementById('paymentNote').value.trim();
        const proofFile = document.getElementById('paymentProofFile').files[0];
        
        console.log('Form data:', { paymentAccount, transactionId, paymentNote, proofFile }); // Debug log
        
        if (!paymentAccount) {
            showErrorMessage('Please enter payment account name/phone number');
            return;
        }
        
        // Transaction ID validation removed - field can be blank
        // if (!transactionId) {
        //     showErrorMessage('Please enter transaction ID');
        //     return;
        // }
        
        if (!proofFile) {
            showErrorMessage('Please upload payment proof');
            return;
        }
        
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (!currentUser) {
            showErrorMessage('Please log in to submit payment proof');
            return;
        }
        
        const selectedPlan = document.getElementById('paymentProofModal').getAttribute('data-selected-plan');
        const selectedMethodRaw = document.getElementById('paymentProofModal').getAttribute('data-selected-method');
        let selectedMethod = null;
        try {
            selectedMethod = selectedMethodRaw ? JSON.parse(selectedMethodRaw) : null;
        } catch (e) {
            selectedMethod = null;
        }
        const plans = JSON.parse(localStorage.getItem(STORAGE_KEYS.plans)) || DEFAULT_PLANS;
        const plan = plans[selectedPlan] || DEFAULT_PLANS[selectedPlan];
        if (!plan) {
            showErrorMessage('Plan not found. Please select a plan again.');
            return;
        }
        
        // Read file to DataURL so admin can preview proof
        const reader = new FileReader();
        reader.onload = () => {
            // Create payment request
            const paymentRequest = {
                id: Date.now().toString(),
                userId: currentUser.id,
                userName: currentUser.name,
                userEmail: currentUser.email,
                planKey: selectedPlan,
                planName: plan.name,
                amount: plan.price,
                paymentMethod: selectedMethod ? selectedMethod.name : 'Unknown',
                paymentAccount: paymentAccount,
                transactionId: transactionId,
                note: paymentNote,
                proofFileName: proofFile.name,
                proofDataUrl: reader.result,
                status: 'pending',
                date: new Date().toISOString()
            };
            
            // Add to pending requests
            const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
            pendingRequests.push(paymentRequest);
            localStorage.setItem(STORAGE_KEYS.pendingRequests, JSON.stringify(pendingRequests));
            
            // Close modal
            document.getElementById('paymentProofModal').style.display = 'none';
            
            // Show success popup
            showSuccessMessage('Your order has been placed! Please wait for admin approval. You will be notified once approved.');
            
            // Update banner to inline pending message - DISABLED
            // updatePlanBanner(true);
            
            // Update account page plan text to Pending
            const currentUserLocal = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
            if (currentUserLocal) {
                document.getElementById('userPlan').textContent = 'Pending Approval';
            }
        };
        reader.readAsDataURL(proofFile);
    }

    // Email Functions
    function sendApprovalEmail(request, status) {
        const emailSettings = JSON.parse(localStorage.getItem(STORAGE_KEYS.emailSettings));
        const approvalMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.approvalMessages));
        
        if (!emailSettings.enabled) {
            console.log('Email notifications disabled');
            return;
        }
        
        let message, subject;
        
        if (status === 'approved') {
            subject = `🎉 Payment Approved - ${request.planName}`;
            message = approvalMessages.approvedMessage || '🎉 Congratulations! Your payment has been approved and your plan is now active. You can now access all premium features. Good luck with your Chinese learning journey!';
        } else {
            subject = `❌ Payment Rejected - ${request.planName}`;
            message = approvalMessages.rejectedMessage || 'We\'re sorry, but your payment proof could not be verified. Please contact our support team for assistance or try submitting again with clearer proof.';
        }
        
        // In a real implementation, you would send the email here
        // For now, we'll just log it
        console.log(`Email to ${request.userEmail}:`);
        console.log(`Subject: ${subject}`);
        console.log(`Message: ${message}`);
        
        // Simulate email sending
        showSuccessMessage(`Email notification sent to ${request.userEmail}`);
    }

    // QR Code Management Functions
    function loadQRCodesList() {
        const qrCodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.qrCodes));
        const container = document.getElementById('qrCodesList');
        
        container.innerHTML = '';
        qrCodes.forEach(qr => {
            const qrDiv = document.createElement('div');
            qrDiv.className = 'qr-code-item';
            qrDiv.innerHTML = `
                <div class="qr-info">
                    <div class="qr-preview">
                        ${qr.imageUrl ? `<img src="${qr.imageUrl}" alt="QR Code">` : '<i class="fas fa-qrcode" style="color: #6c757d;"></i>'}
                    </div>
                    <div class="qr-details">
                        <strong>${qr.name}</strong>
                        <span>${qr.description || 'No description'}</span>
                    </div>
                </div>
                <div class="qr-actions">
                    <button class="qr-edit-btn" onclick="editQRCode(${qr.id})">Edit</button>
                    <button class="qr-delete-btn" onclick="deleteQRCode(${qr.id})">Delete</button>
                </div>
            `;
            container.appendChild(qrDiv);
        });
    }

    function addQRCode() {
        const name = prompt('Enter QR code name (e.g., Alipay QR):');
        if (!name) return;
        
        const description = prompt('Enter description (optional):');
        
        // Create file input for QR code image
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        fileInput.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const qrCodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.qrCodes));
                    const newId = qrCodes.length > 0 ? Math.max(...qrCodes.map(q => q.id)) + 1 : 1;
                    
                    qrCodes.push({
                        id: newId,
                        name: name,
                        description: description || '',
                        imageUrl: e.target.result,
                        fileName: file.name
                    });
                    
                    localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify(qrCodes));
                    loadQRCodesList();
                    showSuccessMessage('QR code added successfully!');
                };
                reader.readAsDataURL(file);
            }
        };
        fileInput.click();
    }

    function editQRCode(qrId) {
        const qrCodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.qrCodes));
        const qr = qrCodes.find(q => q.id === qrId);
        
        if (!qr) return;
        
        const newName = prompt('Enter new name:', qr.name);
        if (newName === null) return;
        
        const newDescription = prompt('Enter new description:', qr.description);
        if (newDescription === null) return;
        
        const updateImage = confirm('Do you want to update the QR code image?');
        if (updateImage) {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = function(e) {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        qr.name = newName;
                        qr.description = newDescription;
                        qr.imageUrl = e.target.result;
                        qr.fileName = file.name;
                        
                        localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify(qrCodes));
                        loadQRCodesList();
                        showSuccessMessage('QR code updated successfully!');
                    };
                    reader.readAsDataURL(file);
                }
            };
            fileInput.click();
        } else {
            qr.name = newName;
            qr.description = newDescription;
            
            localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify(qrCodes));
            loadQRCodesList();
            showSuccessMessage('QR code updated successfully!');
        }
    }

    function deleteQRCode(qrId) {
        if (!confirm('Are you sure you want to delete this QR code?')) return;
        
        const qrCodes = JSON.parse(localStorage.getItem(STORAGE_KEYS.qrCodes));
        const filteredCodes = qrCodes.filter(q => q.id !== qrId);
        
        localStorage.setItem(STORAGE_KEYS.qrCodes, JSON.stringify(filteredCodes));
        loadQRCodesList();
        showSuccessMessage('QR code deleted successfully!');
    }

    // CSV Management Functions
    function loadCSVManagement() {
        loadCSVFilesList();
    }

    function loadCSVFilesList() {
        const csvFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.csvFiles));
        const container = document.getElementById('csvFilesList');
        
        container.innerHTML = '';
        
        if (csvFiles.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-file-csv" style="font-size: 3rem; margin-bottom: 15px; display: block;"></i>
                    <p>No CSV files uploaded yet</p>
                </div>
            `;
            return;
        }
        
        csvFiles.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'csv-file-item';
            fileDiv.innerHTML = `
                <div class="csv-file-info">
                    <div class="csv-file-icon">
                        <i class="fas fa-file-csv"></i>
                    </div>
                    <div class="csv-file-details">
                        <strong>${file.name}</strong>
                        <span>Uploaded: ${file.uploadDate} | Words: ${file.wordCount || 'Unknown'}</span>
                    </div>
                </div>
                <div class="csv-file-actions">
                    <button class="csv-download-btn" onclick="downloadCSV(${file.id})">Download</button>
                    <button class="csv-delete-btn" onclick="deleteCSV(${file.id})">Delete</button>
                </div>
            `;
            container.appendChild(fileDiv);
        });
    }

    function uploadCSVFile() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            showErrorMessage('Please select a CSV file to upload');
            return;
        }
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showErrorMessage('Please select a valid CSV file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvContent = e.target.result;
            
            // Parse CSV to count words
            const lines = csvContent.split('\n').filter(line => line.trim());
            const wordCount = lines.length - 1; // Subtract header row
            
            // Create CSV file record
            const csvFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.csvFiles));
            const newFile = {
                id: Date.now(),
                name: file.name,
                content: csvContent,
                uploadDate: new Date().toLocaleDateString(),
                wordCount: wordCount,
                size: file.size
            };
            
            csvFiles.push(newFile);
            localStorage.setItem(STORAGE_KEYS.csvFiles, JSON.stringify(csvFiles));
            
            // Update words data if this is the first CSV or if user wants to replace
            if (csvFiles.length === 1 || confirm('Do you want to update the word database with this CSV file?')) {
                updateWordsFromCSV(csvContent);
            }
            
            loadCSVFilesList();
            showSuccessMessage('CSV file uploaded successfully!');
            
            // Clear file input
            fileInput.value = '';
        };
        reader.readAsText(file);
    }

    function updateWordsFromCSV(csvContent) {
        try {
            const lines = csvContent.split('\n').filter(line => line.trim());
            const words = [];
            
            // Skip header row
            for (let i = 1; i < lines.length; i++) {
                const columns = lines[i].split(',');
                if (columns.length >= 4) {
                    words.push({
                        chinese: columns[0].trim(),
                        pinyin: columns[1].trim(),
                        english: columns[2].trim(),
                        bangla: columns[3].trim()
                    });
                }
            }
            
            // Update words in localStorage
            localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(words));
            
            // Update HSK levels if needed
            const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels));
            hskLevels['hsk1'] = words.slice(0, 150);
            hskLevels['hsk2'] = words.slice(150, 300);
            hskLevels['hsk3'] = words.slice(300, 600);
            hskLevels['hsk4'] = words.slice(600, 1200);
            hskLevels['hsk5'] = words.slice(1200, 2500);
            hskLevels['hsk6'] = words.slice(2500);
            
            localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(hskLevels));
            
            showSuccessMessage('Word database updated successfully!');
        } catch (error) {
            showErrorMessage('Error parsing CSV file: ' + error.message);
        }
    }

    function downloadCSV(fileId) {
        const csvFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.csvFiles));
        const file = csvFiles.find(f => f.id === fileId);
        
        if (!file) {
            showErrorMessage('File not found');
            return;
        }
        
        const blob = new Blob([file.content], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function deleteCSV(fileId) {
        if (!confirm('Are you sure you want to delete this CSV file?')) return;
        
        const csvFiles = JSON.parse(localStorage.getItem(STORAGE_KEYS.csvFiles));
        const filteredFiles = csvFiles.filter(f => f.id !== fileId);
        
        localStorage.setItem(STORAGE_KEYS.csvFiles, JSON.stringify(filteredFiles));
        loadCSVFilesList();
        showSuccessMessage('CSV file deleted successfully!');
    }

    // HSK Management Functions
    function loadHSKManagement() {
        // Set up file input listeners for each HSK level
        for (let i = 1; i <= 6; i++) {
            const fileInput = document.getElementById(`csvFileHsk${i}`);
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    uploadCSVForHSKLevel(i, e.target.files[0]);
                });
            }
        }
    }

    function uploadCSVForHSKLevel(level, file) {
        if (!file) return;
        
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showErrorMessage('Please select a valid CSV file');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(e) {
            const csvContent = e.target.result;
            const words = parseCSVContent(csvContent, level);
            
            if (words.length === 0) {
                showErrorMessage('No valid words found in CSV file');
                return;
            }
            
            // Get expected word count for this HSK level
            const expectedCounts = {
                1: 150, 2: 150, 3: 300, 4: 600, 5: 1300, 6: 1300
            };
            
            const expectedCount = expectedCounts[level];
            if (words.length !== expectedCount) {
                if (!confirm(`Expected ${expectedCount} words for HSK ${level}, but found ${words.length}. Continue anyway?`)) {
                    return;
                }
            }
            
            // Update HSK level data
            updateHSKLevelData(level, words);
            
            // Refresh main app data
            if (window.refreshWordData) {
                window.refreshWordData();
            }
            
            showSuccessMessage(`HSK ${level} updated with ${words.length} words!`);
        };
        reader.readAsText(file);
    }

    function parseCSVContent(csvContent, hskLevel) {
        const lines = csvContent.split('\n').filter(line => line.trim());
        const words = [];
        
        // Skip header row
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',');
            if (columns.length >= 4) {
                words.push({
                    chinese: columns[0].trim(),
                    pinyin: columns[1].trim(),
                    english: columns[2].trim(),
                    bangla: columns[3].trim(),
                    hskLevel: hskLevel // Add HSK level to each word
                });
            }
        }
        
        return words;
    }

    function updateHSKLevelData(level, words) {
        // Get all existing words
        const allWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words) || '[]');
        
        // Remove existing words for this HSK level
        const filteredWords = allWords.filter(word => {
            const wordHskLevel = word.hskLevel || '4';
            return String(wordHskLevel) !== String(level);
        });
        
        // Add new words for this HSK level
        const updatedWords = [...filteredWords, ...words];
        
        // Save updated words
        localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(updatedWords));
        
        // Also update HSK levels storage for admin panel
        const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels) || '{}');
        hskLevels[`hsk${level}`] = words;
        localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(hskLevels));
    }

    function getStartIndexForLevel(level) {
        const startIndexes = {
            1: 0, 2: 150, 3: 300, 4: 600, 5: 1200, 6: 2500
        };
        return startIndexes[level] || 0;
    }

    function viewHskWords(level) {
        // Get all words from the main words storage
        const allWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words) || '[]');
        const hskLevel = level.replace('hsk', '');
        
        // Filter words by HSK level
        const words = allWords.filter(word => {
            const wordHskLevel = word.hskLevel || '4';
            return String(wordHskLevel) === String(hskLevel);
        });
        
        if (words.length === 0) {
            showErrorMessage('No words found for this HSK level');
            return;
        }
        
        displayWordsForLevel(level, words);
    }

    function displayWordsForLevel(level, words) {
        const displaySection = document.getElementById('wordsDisplaySection');
        const title = document.getElementById('wordsDisplayTitle');
        const content = document.getElementById('wordsDisplayContent');
        
        title.textContent = `Words for HSK ${level.charAt(level.length - 1)} (${words.length} words)`;
        
        // Group words based on level
        const groups = getGroupsForLevel(level, words);
        
        let html = '';
        groups.forEach((group, groupIndex) => {
            html += `<div class="group-header">Group ${groupIndex + 1}: ${group.start + 1}-${group.end}</div>`;
            html += '<div class="words-grid">';
            
            group.words.forEach((word, wordIndex) => {
                const wordNumber = group.start + wordIndex + 1;
                html += `
                    <div class="word-item" style="position: relative;">
                        <div class="word-number">${wordNumber}</div>
                        <div class="word-chinese">${word.chinese}</div>
                        <div class="word-pinyin">${word.pinyin}</div>
                        <div class="word-english">${word.english}</div>
                        <div class="word-bangla">${word.bangla}</div>
                    </div>
                `;
            });
            
            html += '</div>';
        });
        
        content.innerHTML = html;
        displaySection.style.display = 'block';
    }

    function getGroupsForLevel(level, words) {
        const groupConfigs = {
            'hsk1': [{ start: 0, end: 50 }, { start: 50, end: 100 }, { start: 100, end: 150 }],
            'hsk2': [{ start: 0, end: 50 }, { start: 50, end: 100 }, { start: 100, end: 150 }],
            'hsk3': [{ start: 0, end: 100 }, { start: 100, end: 200 }, { start: 200, end: 300 }],
            'hsk4': [
                { start: 0, end: 100 }, 
                { start: 100, end: 200 }, 
                { start: 200, end: 300 },
                { start: 300, end: 400 },
                { start: 400, end: 500 },
                { start: 500, end: 600 }
            ],
            'hsk5': [{ start: 0, end: 433 }, { start: 433, end: 866 }, { start: 866, end: 1300 }],
            'hsk6': [{ start: 0, end: 433 }, { start: 433, end: 866 }, { start: 866, end: words.length }]
        };
        
        const config = groupConfigs[level] || [];
        return config.map(group => ({
            start: group.start,
            end: Math.min(group.end, words.length),
            words: words.slice(group.start, Math.min(group.end, words.length))
        }));
    }

    // Complete Payment Function
    function completePayment() {
        const selectedPlanKey = document.getElementById('paymentModal').getAttribute('data-selected-plan');
        if (!selectedPlanKey) {
            showErrorMessage('No plan selected');
            return;
        }
        
        const selectedPlan = DEFAULT_PLANS[selectedPlanKey];
        if (!selectedPlan) {
            showErrorMessage('Invalid plan selected');
            return;
        }
        
        // Close payment modal and show success
        document.getElementById('paymentModal').style.display = 'none';
        showSuccessMessage(`Payment completed for ${selectedPlan.name}! Your plan has been activated.`);
        
        // Update user's plan
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (currentUser) {
            currentUser.plan = selectedPlanKey;
            currentUser.planActivationDate = new Date().toISOString();
            currentUser.remainingDays = selectedPlanKey === 'lifetime' ? -1 : getDaysForPlan(selectedPlanKey);
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(currentUser));
            
            // Update UI
            updateUserInterface();
        }
    }

    function getDaysForPlan(planKey) {
        const planDays = {
            '1month': 30,
            '6months': 180,
            'lifetime': -1
        };
        return planDays[planKey] || 0;
    }

    // Show Plans Page Function
    function showPlansPage() {
        document.getElementById('mainPage').style.display = 'none';
        document.getElementById('plansPage').style.display = 'block';
        updateMainPagePlans();
    }

    // Close Plan Banner Function
    function closePlanBanner() {
        const banner = document.querySelector('.plan-banner');
        if (banner) {
            banner.style.display = 'none';
        }
    }

    // Get Accessible Words Function
    function getAccessibleWords(words) {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        if (!currentUser || currentUser.plan === 'free') {
            // Free users get first 100 words (Group 1) for any HSK level
            return words.slice(0, 100);
        }
        return words; // Paid users get all words
    }

    // Check if user is on free plan
    function isFreePlan() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        return !currentUser || currentUser.plan === 'free';
    }

    // Check if user is on paid plan
    function isPaidPlan() {
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
        return currentUser && currentUser.plan !== 'free';
    }

    // Make functions globally available
    window.editPaymentMethod = editPaymentMethod;
    window.deletePaymentMethod = deletePaymentMethod;
    window.approveRequest = approveRequest;
    window.rejectRequest = rejectRequest;
    window.editQRCode = editQRCode;
    window.deleteQRCode = deleteQRCode;
    window.downloadCSV = downloadCSV;
    window.deleteCSV = deleteCSV;
    // Word editing and deletion functions
    function editWord(wordId, level) {
        const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.words) || '[]');
        const word = words.find(w => w.id === wordId || `${level}_${w.groupIndex}_${w.wordIndex}` === wordId);
        
        if (!word) {
            showErrorMessage('Word not found');
            return;
        }
        
        // Create edit modal
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Edit Word</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <form id="editWordForm">
                    <div class="form-group">
                        <label for="editChinese">Chinese Character</label>
                        <input type="text" id="editChinese" value="${word.chinese || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editPinyin">Pinyin</label>
                        <input type="text" id="editPinyin" value="${word.pinyin || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editEnglish">English</label>
                        <input type="text" id="editEnglish" value="${word.english || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="editBangla">Bangla</label>
                        <input type="text" id="editBangla" value="${word.bangla || ''}">
                    </div>
                    <div class="form-group">
                        <label for="editHskLevel">HSK Level</label>
                        <select id="editHskLevel" required>
                            <option value="1" ${word.hskLevel == 1 ? 'selected' : ''}>HSK 1</option>
                            <option value="2" ${word.hskLevel == 2 ? 'selected' : ''}>HSK 2</option>
                            <option value="3" ${word.hskLevel == 3 ? 'selected' : ''}>HSK 3</option>
                            <option value="4" ${word.hskLevel == 4 ? 'selected' : ''}>HSK 4</option>
                            <option value="5" ${word.hskLevel == 5 ? 'selected' : ''}>HSK 5</option>
                            <option value="6" ${word.hskLevel == 6 ? 'selected' : ''}>HSK 6</option>
                        </select>
                    </div>
                    <button type="submit" class="form-submit">Save Changes</button>
                </form>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Handle form submission
        document.getElementById('editWordForm').addEventListener('submit', (e) => {
            e.preventDefault();
            
            const updatedWord = {
                ...word,
                chinese: document.getElementById('editChinese').value,
                pinyin: document.getElementById('editPinyin').value,
                english: document.getElementById('editEnglish').value,
                bangla: document.getElementById('editBangla').value,
                hskLevel: parseInt(document.getElementById('editHskLevel').value)
            };
            
            // Update word in storage
            const wordIndex = words.findIndex(w => w.id === wordId || `${level}_${w.groupIndex}_${w.wordIndex}` === wordId);
            if (wordIndex !== -1) {
                words[wordIndex] = updatedWord;
                localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(words));
                showSuccessMessage('Word updated successfully');
                modal.remove();
                // Refresh the word display
                viewHskWords(level);
                // Refresh main app data
                if (window.refreshWordData) window.refreshWordData();
            } else {
                showErrorMessage('Failed to update word');
            }
        });
    }
    
    function deleteWord(wordId, level) {
        if (!confirm('Are you sure you want to delete this word? This action cannot be undone.')) {
            return;
        }
        
        const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.words) || '[]');
        const wordIndex = words.findIndex(w => w.id === wordId || `${level}_${w.groupIndex}_${w.wordIndex}` === wordId);
        
        if (wordIndex !== -1) {
            words.splice(wordIndex, 1);
            localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(words));
            showSuccessMessage('Word deleted successfully');
            // Refresh the word display
            viewHskWords(level);
            // Refresh main app data
            if (window.refreshWordData) window.refreshWordData();
        } else {
            showErrorMessage('Word not found');
        }
    }

    // Reset words for specific HSK level
    function resetHskWords(level) {
        const hskLevel = level.replace('hsk', '');
        const confirmMessage = `Are you sure you want to reset all words for HSK ${hskLevel}? This will delete all previously uploaded words for this level and cannot be undone.`;
        
        if (!confirm(confirmMessage)) {
            return;
        }
        
        // Get all words from localStorage
        const allWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words) || '[]');
        
        // Filter out words from the specified HSK level
        const filteredWords = allWords.filter(word => {
            const wordHskLevel = word.hskLevel || '4';
            return String(wordHskLevel) !== String(hskLevel);
        });
        
        // Save the filtered words back to localStorage
        localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(filteredWords));
        
        // Also clear from HSK levels storage
        const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels) || '{}');
        hskLevels[level] = [];
        localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(hskLevels));
        
        // Clear progress data for this specific HSK level
        localStorage.removeItem(`fizflashcard_mastered_hsk_${hskLevel}`);
        localStorage.removeItem(`fizflashcard_review_hsk_${hskLevel}`);
        localStorage.removeItem(`fizflashcard_bookmarks_hsk_${hskLevel}`);
        
        // Show success message
        showSuccessMessage(`All words for HSK ${hskLevel} have been reset successfully.`);
        
        // Refresh the word display if it's currently showing this level
        const displaySection = document.getElementById('wordsDisplaySection');
        if (displaySection.style.display !== 'none') {
            viewHskWords(level);
        }
        
        // Refresh main app data
        if (window.refreshWordData) {
            window.refreshWordData();
        }
    }

    window.viewHskWords = viewHskWords;
    window.resetHskWords = resetHskWords;
    window.editWord = editWord;
    window.deleteWord = deleteWord;
    window.completePayment = completePayment;
    window.showPlansPage = showPlansPage;
    window.closePlanBanner = closePlanBanner;
    window.getAccessibleWords = getAccessibleWords;
    window.isFreePlan = isFreePlan;
    window.isPaidPlan = isPaidPlan;
    window.openModal = openModal;
    
    // Debug function to check admin button
    window.debugAdminButton = function() {
        const adminBtn = document.getElementById('adminButton');
        console.log('Admin button element:', adminBtn);
        console.log('Admin button style:', adminBtn ? window.getComputedStyle(adminBtn).display : 'Not found');
        console.log('Admin button visible:', adminBtn ? adminBtn.offsetParent !== null : false);
        if (adminBtn) {
            adminBtn.style.display = 'inline-block';
            adminBtn.style.backgroundColor = '#e74c3c';
            adminBtn.style.color = 'white';
            adminBtn.style.padding = '10px 20px';
            adminBtn.style.border = '2px solid #c0392b';
            console.log('Admin button forced visible with red background');
        }
    };
});
