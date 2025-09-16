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
        '1month': { name: '1 Month Access', price: 5, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK words (1-5)', '30 days access'] },
        '6months': { name: '6 Months Access', price: 10, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK words (1-5)', '180 days access', 'Save 66%'] },
        'lifetime': { name: 'Lifetime Access', price: 20, features: ['Full access to all flashcards', 'Progress tracking', 'All HSK words (1-5)', 'Lifetime access', 'Best value'] }
    };

    // Default HSK levels configuration
    const DEFAULT_HSK_LEVELS = {
        1: { name: 'HSK 1', totalWords: 150, groups: 3, wordsPerGroup: 50 },
        2: { name: 'HSK 2', totalWords: 150, groups: 3, wordsPerGroup: 50 },
        3: { name: 'HSK 3', totalWords: 300, groups: 6, wordsPerGroup: 50 },
        4: { name: 'HSK 4', totalWords: 600, groups: 6, wordsPerGroup: 100 },
        5: { name: 'HSK 5', totalWords: 1300, groups: 13, wordsPerGroup: 100 }
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
        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleLogin();
        });

        // Signup form
        document.getElementById('signupForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleSignup();
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

        // CSV upload button
        document.getElementById('uploadCsv').addEventListener('click', () => {
            uploadCsvFile();
        });

        // HSK CSV upload buttons
        for (let i = 1; i <= 6; i++) {
            const fileInput = document.getElementById(`csvFileHsk${i}`);
            if (fileInput) {
                fileInput.addEventListener('change', (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        processCsvFile(file, i, false);
                        e.target.value = ''; // Reset file input
                    }
                });
            }
        }

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

        // Broadcast notification (Site Control tab)
        const sendBroadcastBtn = document.getElementById('sendBroadcast');
        if (sendBroadcastBtn) {
            sendBroadcastBtn.addEventListener('click', async () => {
                const planFilter = document.getElementById('broadcastPlanFilter').value;
                const title = (document.getElementById('broadcastTitle').value || '').trim();
                const message = (document.getElementById('broadcastMessage').value || '').trim();
                const statusEl = document.getElementById('broadcastStatus');

                if (!title || !message) {
                    if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = '#dc3545'; statusEl.textContent = 'Title and message are required.'; }
                    return;
                }

                try {
                    const allUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
                    const targetUsers = planFilter === 'all' ? allUsers : allUsers.filter(u => u.plan === planFilter);
                    for (const user of targetUsers) {
                        await sendNotificationToUser(user.id, title, message);
                    }
                    if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = '#28a745'; statusEl.textContent = `Notification sent to ${targetUsers.length} user(s).`; }
                    document.getElementById('broadcastTitle').value = '';
                    document.getElementById('broadcastMessage').value = '';
                } catch (err) {
                    if (statusEl) { statusEl.style.display = 'block'; statusEl.style.color = '#dc3545'; statusEl.textContent = 'Failed to send notifications. Check console.'; }
                    console.error('Broadcast notification error:', err);
                }
            });
        }

        // Admin access text click (delegated so it survives footer re-render)
        document.addEventListener('click', (e) => {
            const target = e.target;
            if (target && target.classList && target.classList.contains('admin-access-text')) {
                showAdminLogin();
            }
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

    async function handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                const result = await window.supabaseConfig.getUser(email);
                if (result.success && result.data) {
                    const user = result.data;
                    if (user.password === password) {
                        // Ensure user has a display ID
                        if (!user.displayId) {
                            user.displayId = generateUserId();
                        }
                        
                        localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
                        localStorage.setItem('fizflashcard_user_id', user.id);
                        updateUserInterface();
                        // Also call main app's updateUserInterface if available
                        if (window.updateUserInterface) {
                            window.updateUserInterface();
                        }
                        closeModal(document.getElementById('loginModal'));
                        showSuccessMessage('Login successful!');
                        return;
                    }
                }
                showErrorMessage('Invalid email or password');
            } catch (error) {
                console.warn('Error during login:', error);
                showErrorMessage('Login failed. Please try again.');
            }
        } else {
            // Fallback to localStorage
            const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(user));
                localStorage.setItem('fizflashcard_user_id', user.id);
                updateUserInterface();
                // Also call main app's updateUserInterface if available
                if (window.updateUserInterface) {
                    window.updateUserInterface();
                }
                closeModal(document.getElementById('loginModal'));
                showSuccessMessage('Login successful!');
            } else {
                showErrorMessage('Invalid email or password');
            }
        }
    }

    async function handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const university = document.getElementById('signupUniversity').value;
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;

        if (password !== confirmPassword) {
            showErrorMessage('Passwords do not match');
            return;
        }

        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                console.log('Checking for existing user with email:', email);
                // Check if user already exists
                const existingUser = await window.supabaseConfig.getUser(email);
                console.log('Existing user check result:', existingUser);
                
                if (existingUser.success && existingUser.data) {
                    showErrorMessage('Email already exists');
                    return;
                }

                const newUser = {
                    name,
                    email,
                    university,
                    password,
                    plan: 'free',
                    enrollment_date: new Date().toISOString(),
                    remaining_days: 0,
                    plan_activation_date: null,
                    displayId: generateUserId()
                };

                console.log('Creating new user:', newUser);
                const result = await window.supabaseConfig.createUser(newUser);
                console.log('Create user result:', result);
                
                if (result.success) {
                    // Ensure user has a display ID
                    if (!result.data.displayId) {
                        result.data.displayId = generateUserId();
                    }
                    
                    // Add user to the users list for admin panel
                    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
                    users.push(result.data);
                    localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
                    
                    localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(result.data));
                    localStorage.setItem('fizflashcard_user_id', result.data.id);
                    updateUserInterface();
                    // Also call main app's updateUserInterface if available
                    if (window.updateUserInterface) {
                        window.updateUserInterface();
                    }
                    closeModal(document.getElementById('signupModal'));
                    showSuccessMessage('Account created successfully!');
                } else {
                    console.error('Failed to create user:', result.error);
                    showErrorMessage('Failed to create account: ' + result.error);
                }
            } catch (error) {
                console.error('Error during signup:', error);
                showErrorMessage('Signup failed. Please try again.');
            }
        } else {
            // Fallback to localStorage
            console.log('Using localStorage fallback for signup');
            const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
            
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
                enrollmentDate: new Date().toISOString(),
                remainingDays: 0,
                planActivationDate: null,
                displayId: generateUserId()
            };

            users.push(newUser);
            localStorage.setItem('fizflashcard_users', JSON.stringify(users));
            localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(newUser));

            updateUserInterface();
            // Also call main app's updateUserInterface if available
            if (window.updateUserInterface) {
                window.updateUserInterface();
            }
            closeModal(document.getElementById('signupModal'));
            showSuccessMessage('Account created successfully!');
        }
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


    async function showAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        adminPanel.style.display = 'block';
        loadUsersTable();
        loadPlanEditor();
        loadFooterSettings();
        loadPaymentSettings();
        loadPendingRequests();
        await loadHelpMessages();
        loadHSKManagement();
        loadDatabaseConfiguration();
        
        // Initialize materials management when admin panel is shown
        setTimeout(() => {
            initializeMaterialsManagement();
        }, 100);
        
        // Add event listeners for close and refresh buttons
        setupAdminPanelEventListeners();
    }

    function closeAdminPanel() {
        const adminPanel = document.getElementById('adminPanel');
        adminPanel.style.display = 'none';
    }

    async function refreshAdminData() {
        // Show loading state
        const refreshBtn = document.getElementById('adminRefreshBtn');
        const originalText = refreshBtn.innerHTML;
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        refreshBtn.disabled = true;
        
        // Reload all admin data
        setTimeout(async () => {
            loadUsersTable();
            loadPlanEditor();
            loadFooterSettings();
            loadPaymentSettings();
            loadPendingRequests();
            await loadHelpMessages();
            loadHSKManagement();
            loadDatabaseConfiguration();
            
            // Initialize materials management
            initializeMaterialsManagement();
            
            // Reset button state
            refreshBtn.innerHTML = originalText;
            refreshBtn.disabled = false;
            
            // Show success message
            showNotification('Admin data refreshed successfully!', 'success');
        }, 1000);
    }

    function setupAdminPanelEventListeners() {
        // Close button
        const closeBtn = document.getElementById('closeAdminBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeAdminPanel);
        }
        
        // Refresh button
        const refreshBtn = document.getElementById('adminRefreshBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', refreshAdminData);
        }
    }

    async function switchAdminTab(tabName) {
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
        } else if (tabName === 'help') {
            await loadHelpMessages();
        } else if (tabName === 'materials') {
            // Ensure materials management is initialized
            setTimeout(() => {
                initializeMaterialsManagement();
            }, 50);
        } else if (tabName === 'hsk') {
            loadHSKManagement();
        } else if (tabName === 'database') {
            loadDatabaseConfiguration();
        } else if (tabName === 'externaldb') {
            loadExternalDbConfiguration();
        }
    }

    function loadUsersTable() {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
        updateTotalUsersCount(users.length);
        updateFilterCounts(users);
        filterUsersByPlan('all');
        initializeUserSearch();
    }
    
    function initializeUserSearch() {
        const searchInput = document.getElementById('userSearchInput');
        const clearBtn = document.getElementById('clearSearchBtn');
        
        if (!searchInput) return;
        
        // Search functionality
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            const clearBtn = document.getElementById('clearSearchBtn');
            
            if (searchTerm) {
                clearBtn.style.display = 'block';
                searchUsers(searchTerm);
            } else {
                clearBtn.style.display = 'none';
                // Restore original filter
                const activeFilter = document.querySelector('.users-filter .filter-btn.active');
                if (activeFilter) {
                    filterUsersByPlan(activeFilter.getAttribute('data-filter'));
                }
            }
        });
        
        // Clear search
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                searchInput.value = '';
                clearBtn.style.display = 'none';
                const activeFilter = document.querySelector('.users-filter .filter-btn.active');
                if (activeFilter) {
                    filterUsersByPlan(activeFilter.getAttribute('data-filter'));
                }
            });
        }
    }

    function updateTotalUsersCount(totalCount) {
        const totalCountElement = document.getElementById('totalUsersCount');
        if (totalCountElement) {
            totalCountElement.textContent = `Total: ${totalCount} users`;
        }
    }

    function updateFilterCounts(users) {
        const filters = ['all', 'free', '1month', '6months', 'lifetime'];
        
        filters.forEach(filter => {
            const button = document.querySelector(`[data-filter="${filter}"]`);
            if (button) {
                const countSpan = button.querySelector('.filter-count');
                if (countSpan) {
                    let count = 0;
                    if (filter === 'all') {
                        count = users.length;
                    } else {
                        count = users.filter(u => u.plan === filter).length;
                    }
                    countSpan.textContent = `(${count})`;
                }
            }
        });
    }
    
    function searchUsers(searchTerm) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';
        
        const filteredUsers = users.filter(user => {
            const userId = (user.displayId || '').toLowerCase();
            const name = (user.name || '').toLowerCase();
            const email = (user.email || '').toLowerCase();
            
            return userId.includes(searchTerm) || 
                   name.includes(searchTerm) || 
                   email.includes(searchTerm);
        });
        
        if (filteredUsers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" style="text-align: center; padding: 40px; color: #6c757d;">
                    No users found matching "${searchTerm}"
                </td>
            `;
            tbody.appendChild(row);
            return;
        }
        
        // Add filtered users
        filteredUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            const remainingDays = (user.remainingDays === Infinity || user.remainingDays === -1) ? '∞' : (user.remainingDays || 0);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="user-id-badge">${user.displayId || 'N/A'}</span></td>
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

    function filterUsersByPlan(filter) {
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = '';

        let filteredUsers = users;
        if (filter !== 'all') {
            filteredUsers = users.filter(u => u.plan === filter);
        }

        // Update total users count
        updateTotalUsersCount(users.length);

        // Update filter counts
        updateFilterCounts(users);

        if (filteredUsers.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td colspan="9" style="text-align: center; padding: 40px; color: #6c757d;">
                    No users found for this plan
                </td>
            `;
            tbody.appendChild(row);
            return;
        }

        // Add users
        filteredUsers.forEach((user, index) => {
            const row = document.createElement('tr');
            const remainingDays = (user.remainingDays === Infinity || user.remainingDays === -1) ? '∞' : (user.remainingDays || 0);
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td><span class="user-id-badge">${user.displayId || 'N/A'}</span></td>
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

        // Show HSK level selection modal
        showHskLevelSelectionModal(file);
    }

    function showHskLevelSelectionModal(file) {
        // Create modal for HSK level selection
        const modal = createAdminModal('hskLevelModal', `
            <div class="modal-content" style="max-width: 500px;">
                <div class="modal-header">
                    <h3>Select HSK Level for Upload</h3>
                    <button class="close-modal" onclick="this.closest('.modal').remove()">&times;</button>
                </div>
                <div class="form-group">
                    <label for="hskLevelSelect">HSK Level</label>
                    <select id="hskLevelSelect" style="width: 100%; padding: 12px 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem;">
                        <option value="1">HSK 1</option>
                        <option value="2">HSK 2</option>
                        <option value="3">HSK 3</option>
                        <option value="4">HSK 4</option>
                        <option value="5">HSK 5</option>
                        <option value="6">HSK 6</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>
                        <input type="checkbox" id="replaceExisting" style="margin-right: 8px;">
                        Replace existing words for this HSK level
                    </label>
                </div>
                <button class="form-submit" id="confirmCsvUpload">Upload CSV</button>
            </div>
        `);
        
        // Add event listener for confirm button
        document.getElementById('confirmCsvUpload').addEventListener('click', () => {
            const hskLevel = document.getElementById('hskLevelSelect').value;
            const replaceExisting = document.getElementById('replaceExisting').checked;
            processCsvFile(file, hskLevel, replaceExisting);
            modal.remove();
        });
        
        // Add event listener for close button
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    function processCsvFile(file, hskLevel, replaceExisting) {
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
                let existingWords = JSON.parse(localStorage.getItem(STORAGE_KEYS.words));
                
                if (replaceExisting) {
                    // Remove existing words for this HSK level
                    existingWords = existingWords.filter(word => word.hskLevel != hskLevel);
                }
                
                const updatedWords = [...existingWords, ...newWords];
                localStorage.setItem(STORAGE_KEYS.words, JSON.stringify(updatedWords));
                
                // Update HSK levels distribution
                updateHskLevelsDistribution();
                
                showSuccessMessage(`Successfully uploaded ${newWords.length} new words for HSK ${hskLevel}!`);
                document.getElementById('csvFile').value = '';
                
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

    function updateHskLevelsDistribution() {
        try {
            const words = JSON.parse(localStorage.getItem(STORAGE_KEYS.words));
            const hskLevels = JSON.parse(localStorage.getItem(STORAGE_KEYS.hskLevels));
            
            // Group words by HSK level
            const wordsByLevel = {};
            words.forEach(word => {
                const level = word.hskLevel || 4;
                if (!wordsByLevel[level]) {
                    wordsByLevel[level] = [];
                }
                wordsByLevel[level].push(word);
            });
            
            // Update HSK levels with actual word counts
            Object.keys(wordsByLevel).forEach(level => {
                const levelKey = `hsk${level}`;
                if (hskLevels[levelKey]) {
                    hskLevels[levelKey] = wordsByLevel[level];
                }
            });
            
            localStorage.setItem(STORAGE_KEYS.hskLevels, JSON.stringify(hskLevels));
        } catch (error) {
            console.error('Error updating HSK levels distribution:', error);
        }
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

    async function testSupabaseConnection() {
        if (!window.supabaseConfig || !window.supabaseConfig.isConfigured()) {
            showErrorMessage('Please configure Supabase credentials first');
            return;
        }

        // Show loading state
        const testBtn = document.getElementById('testSupabaseConnection');
        const originalText = testBtn.textContent;
        testBtn.textContent = 'Testing...';
        testBtn.disabled = true;

        try {
            // Check if client is properly initialized
            if (!window.supabaseConfig.client) {
                throw new Error('Supabase client not initialized. Please refresh the page and try again.');
            }

            // Test actual connection by trying to get users
            const result = await window.supabaseConfig.client
                .from('users')
                .select('count')
                .limit(1);
            
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            
            if (result.error) {
                showErrorMessage('Connection test failed: ' + result.error.message);
            } else {
                showSuccessMessage('Supabase connection test successful! Database is accessible.');
            }
        } catch (error) {
            testBtn.textContent = originalText;
            testBtn.disabled = false;
            showErrorMessage('Connection test failed: ' + error.message);
        }
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
    window.closeAdminPanel = closeAdminPanel;
    window.refreshAdminData = refreshAdminData;
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
    
    // Test function for materials management
    window.testMaterialsButtons = function() {
        console.log('Testing materials management buttons...');
        const addBookBtn = document.getElementById('addBookBtn');
        const addTextbookBtn = document.getElementById('addTextbookBtn');
        const addChapterBtn = document.getElementById('addChapterBtn');
        
        console.log('Button elements found:', {
            addBookBtn: addBookBtn,
            addTextbookBtn: addTextbookBtn,
            addChapterBtn: addChapterBtn
        });
        
        if (addTextbookBtn) {
            console.log('Testing Add Textbook button...');
            addTextbookBtn.click();
        } else {
            console.error('Add Textbook button not found!');
        }
    };
    
    // Make materials management functions globally available
    window.deleteTextbook = deleteTextbook;
    window.viewTextbookChapters = viewTextbookChapters;
    window.deleteChapter = deleteChapter;
    window.deleteBook = deleteBook;
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

    // Ensure footer reflects saved settings on initial page load
    try {
        document.addEventListener('DOMContentLoaded', () => {
            try { updateFooterDisplay(); } catch (_) {}
        });
    } catch (_) {}

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
        overlay.style.zIndex = '100001'; // Higher than admin panel
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
    
    // Helper function to create modals with proper z-index for admin panel
    function createAdminModal(modalId, content) {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.id = modalId;
        modal.style.display = 'flex';
        modal.style.zIndex = '100001'; // Higher than admin panel
        modal.innerHTML = content;
        document.body.appendChild(modal);
        return modal;
    }

    async function approveRequest(requestId) {
        const pendingRequests = JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingRequests));
        const request = pendingRequests.find(r => r.id === requestId);
        
        if (!request) return;
        
        // Update user plan
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
        const userIndex = users.findIndex(u => u.id === request.userId);
        
        if (userIndex !== -1) {
            const today = new Date();
            const newPlan = request.planKey;
            const planActivationDate = today.toISOString().split('T')[0];
            const remainingDays = newPlan === '1month' ? 30 :
                                newPlan === '6months' ? 180 :
                                newPlan === 'lifetime' ? Infinity : 0;
            
            // Update localStorage
            users[userIndex].plan = newPlan;
            users[userIndex].planActivationDate = planActivationDate;
            users[userIndex].remainingDays = remainingDays;
            localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
            
            // Update Supabase if configured
            if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
                try {
                    const updateData = {
                        plan: newPlan,
                        plan_activation_date: planActivationDate,
                        remaining_days: remainingDays
                    };
                    
                    const { error } = await window.supabaseConfig.client
                        .from('users')
                        .update(updateData)
                        .eq('id', request.userId);
                    
                    if (error) {
                        console.error('Error updating user plan in Supabase:', error);
                    } else {
                        console.log('Successfully updated user plan in Supabase');
                    }
                } catch (error) {
                    console.error('Error updating user plan in Supabase:', error);
                }
            }
            
            // Update current user if it's the same user
            const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser));
            if (currentUser && currentUser.id === users[userIndex].id) {
                localStorage.setItem(STORAGE_KEYS.currentUser, JSON.stringify(users[userIndex]));
                updateUserInterface();
                
                // Update remaining days calculation
                if (window.updateRemainingDays) {
                    window.updateRemainingDays();
                }
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
        
        // Send notification to user
        const approvalMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.approvalMessages));
        const message = approvalMessages.approvedMessage || '🎉 Congratulations! Your payment has been approved and your plan is now active. You can now access all premium features. Good luck with your Chinese learning journey!';
        sendNotificationToUser(request.userId, 'Payment Approved', message);
        
        showSuccessMessage('Request approved successfully!');
    }

    async function rejectRequest(requestId) {
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
        
        // Send notification to user
        const approvalMessages = JSON.parse(localStorage.getItem(STORAGE_KEYS.approvalMessages));
        const message = approvalMessages.rejectedMessage || 'We\'re sorry, but your payment proof could not be verified. Please contact our support team for assistance or try submitting again with clearer proof.';
        sendNotificationToUser(request.userId, 'Payment Rejected', message);
        
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
            
            // Show success popup (same style as help messages)
            showNotification('Payment proof submitted successfully! We\'ll review your request and notify you once approved.', 'success');
            
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
            'hsk5': [
                { start: 0, end: 100 }, { start: 100, end: 200 }, { start: 200, end: 300 },
                { start: 300, end: 400 }, { start: 400, end: 500 }, { start: 500, end: 600 },
                { start: 600, end: 700 }, { start: 700, end: 800 }, { start: 800, end: 900 },
                { start: 900, end: 1000 }, { start: 1000, end: 1100 }, { start: 1100, end: 1200 },
                { start: 1200, end: 1300 }
            ],
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
        showNotification(`Payment completed for ${selectedPlan.name}! Your plan has been activated.`, 'success');
        
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

    // Generate unique 5-digit user ID (same as in script.js)
    function generateUserId() {
        let userId;
        do {
            userId = Math.floor(10000 + Math.random() * 90000).toString();
        } while (isUserIdExists(userId));
        return userId;
    }
    
    function isUserIdExists(userId) {
        // Check localStorage users array
        const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.users) || '[]');
        if (users.some(user => user.displayId === userId)) {
            return true;
        }
        
        // Check current user (Supabase users)
        const currentUser = JSON.parse(localStorage.getItem(STORAGE_KEYS.currentUser) || 'null');
        if (currentUser && currentUser.displayId === userId) {
            return true;
        }
        
        return false;
    }

    // Test function for chapter validation (can be called from browser console)
    window.testChapterValidation = function() {
        console.log('🔍 Testing Chapter Validation...');
        
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        console.log('Available textbooks:', textbooks);
        
        if (textbooks.length === 0) {
            console.log('❌ No textbooks found! Add a textbook first.');
            return;
        }
        
        // Check form elements
        const textbookSelect = document.getElementById('modalChapterTextbook');
        const chapterNumberInput = document.getElementById('modalChapterNumber');
        const chapterTitleInput = document.getElementById('modalChapterTitle');
        const chapterContentInput = document.getElementById('modalChapterContent');
        
        console.log('Form elements found:', {
            textbookSelect: !!textbookSelect,
            chapterNumberInput: !!chapterNumberInput,
            chapterTitleInput: !!chapterTitleInput,
            chapterContentInput: !!chapterContentInput
        });
        
        if (textbookSelect) {
            console.log('Textbook select options:', Array.from(textbookSelect.options).map(opt => ({ value: opt.value, text: opt.text })));
        }
        
        // Test validation manually
        const textbookId = textbookSelect?.value || '';
        const chapterNumberInputValue = chapterNumberInput?.value || '';
        const chapterNumber = parseInt(chapterNumberInputValue);
        const title = (chapterTitleInput?.value || '').trim();
        const content = (chapterContentInput?.value || '').trim();
        
        console.log('Current form values:', { textbookId, chapterNumberInputValue, chapterNumber, title, content });
        console.log('Validation results:', {
            textbookIdValid: !!textbookId,
            chapterNumberValid: !isNaN(chapterNumber) && chapterNumber >= 1,
            titleValid: !!title,
            contentValid: !!content
        });
        
        // Additional debugging - check if elements exist and their properties
        if (chapterTitleInput) {
            console.log('Chapter Title Input:', {
                element: chapterTitleInput,
                value: chapterTitleInput.value,
                type: chapterTitleInput.type,
                id: chapterTitleInput.id
            });
        }
        
        if (chapterContentInput) {
            console.log('Chapter Content Input:', {
                element: chapterContentInput,
                value: chapterContentInput.value,
                type: chapterContentInput.type,
                id: chapterContentInput.id
            });
        }
    };

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
        const modal = createAdminModal('editModal', `
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
        `);
        
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
    // Help Messages Functions
    async function loadHelpMessages(filter = 'all') {
        const container = document.getElementById('helpMessagesContainer');
        
        // Load help messages from Supabase if configured, otherwise from localStorage
        let helpMessages = [];
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                console.log('Loading help messages from Supabase...');
                const result = await window.supabaseConfig.getHelpMessages();
                if (result.success) {
                    helpMessages = result.data;
                    console.log('Loaded help messages from Supabase:', helpMessages.length, 'messages');
                } else {
                    console.error('Error loading help messages from Supabase:', result.error);
                    // Fallback to localStorage
                    helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
                    console.log('Fell back to localStorage:', helpMessages.length, 'messages');
                }
            } catch (error) {
                console.error('Error loading help messages:', error);
                // Fallback to localStorage
                helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
                console.log('Fell back to localStorage due to error:', helpMessages.length, 'messages');
            }
        } else {
            helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
            console.log('Loading help messages from localStorage:', helpMessages.length, 'messages');
        }
        
        // Add filter buttons if not already present
        addHelpMessageFilters();
        
        // Filter messages based on login status
        let filteredMessages = helpMessages;
        if (filter === 'logged-in') {
            filteredMessages = helpMessages.filter(message => message.userId !== 'anonymous');
        } else if (filter === 'not-logged-in') {
            filteredMessages = helpMessages.filter(message => message.userId === 'anonymous');
        }
        
        if (filteredMessages.length === 0) {
            const filterText = filter === 'logged-in' ? 'logged-in users' : 
                             filter === 'not-logged-in' ? 'non-logged-in users' : 'any users';
            container.innerHTML = `
                <div class="no-help-messages">
                    <i class="fas fa-inbox" style="font-size: 3rem; margin-bottom: 15px; color: #dee2e6;"></i>
                    <p>No help messages from ${filterText} yet</p>
                </div>
            `;
            return;
        }
        
        // Sort messages by date (newest first)
        filteredMessages.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        container.innerHTML = filteredMessages.map(message => createHelpMessageCard(message)).join('');
        
        // Add event listeners for action buttons
        container.querySelectorAll('.mark-resolved-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageId = e.target.getAttribute('data-message-id');
                markHelpMessageResolved(messageId);
            });
        });
        
        container.querySelectorAll('.delete-help-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageId = e.target.getAttribute('data-message-id');
                deleteHelpMessage(messageId);
            });
        });
        
        container.querySelectorAll('.view-attachment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageId = e.target.getAttribute('data-message-id');
                viewHelpAttachment(messageId);
            });
        });
        
        container.querySelectorAll('.respond-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const messageId = e.target.getAttribute('data-message-id');
                showResponseModal(messageId);
            });
        });
    }
    
    function createHelpMessageCard(message) {
        const date = new Date(message.date).toLocaleString();
        const fileSize = message.attachmentSize ? formatFileSize(message.attachmentSize) : '';
        const resolvedClass = message.resolved ? 'resolved-message' : '';
        const resolvedBadge = message.resolved ? '<span class="resolved-badge">Resolved</span>' : '';
        const isLoggedIn = message.userId !== 'anonymous';
        const loginStatus = isLoggedIn ? 
            '<span class="login-status logged-in"><i class="fas fa-user-check"></i> Logged In</span>' : 
            '<span class="login-status not-logged-in"><i class="fas fa-user-times"></i> Not Logged In</span>';
        
        return `
            <div class="help-message-card ${resolvedClass}">
                <div class="help-message-header">
                    <div class="help-message-user">
                        <div class="help-message-name">
                            ${escapeHtml(message.userName)} 
                            ${resolvedBadge}
                            ${loginStatus}
                        </div>
                        <div class="help-message-email">${escapeHtml(message.userEmail)}</div>
                        <div class="help-message-userid">User ID: ${message.userDisplayId || 'N/A'}</div>
                    </div>
                    <div class="help-message-date">${date}</div>
                </div>
                
                <div class="help-message-content">
                    <div class="help-message-description">${escapeHtml(message.description)}</div>
                    
                    ${message.attachment ? `
                        <div class="help-message-attachment">
                            <i class="fas fa-paperclip attachment-icon"></i>
                            <div class="attachment-info">
                                <div class="attachment-name">${escapeHtml(message.attachmentName)}</div>
                                <div class="attachment-size">${fileSize}</div>
                            </div>
                            <button class="view-attachment-btn" data-message-id="${message.id}">
                                <i class="fas fa-eye"></i> View
                            </button>
                        </div>
                    ` : ''}
                </div>
                
                <div class="help-message-actions">
                    <button class="respond-btn" data-message-id="${message.id}">
                        <i class="fas fa-reply"></i> Respond
                    </button>
                    ${!message.resolved ? `
                        <button class="mark-resolved-btn" data-message-id="${message.id}">
                            <i class="fas fa-check"></i> Mark Resolved
                        </button>
                    ` : ''}
                    <button class="delete-help-btn" data-message-id="${message.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    async function markHelpMessageResolved(messageId) {
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                const result = await window.supabaseConfig.updateHelpMessage(messageId, { resolved: true });
                if (result.success) {
                    await loadHelpMessages(); // Refresh the display
                    showSuccessMessage('Help message marked as resolved');
                } else {
                    console.error('Error updating help message in Supabase:', result.error);
                    showErrorMessage('Failed to mark message as resolved');
                }
            } catch (error) {
                console.error('Error updating help message:', error);
                showErrorMessage('Failed to mark message as resolved');
            }
        } else {
            // Fallback to localStorage
            const helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
            const messageIndex = helpMessages.findIndex(msg => msg.id === messageId);
            
            if (messageIndex !== -1) {
                helpMessages[messageIndex].resolved = true;
                localStorage.setItem('fizflashcard_help_messages', JSON.stringify(helpMessages));
                await loadHelpMessages(); // Refresh the display
                showSuccessMessage('Help message marked as resolved');
            }
        }
    }
    
    async function deleteHelpMessage(messageId) {
        if (confirm('Are you sure you want to delete this help message?')) {
            if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
                try {
                    const result = await window.supabaseConfig.deleteHelpMessage(messageId);
                    if (result.success) {
                        await loadHelpMessages(); // Refresh the display
                        showSuccessMessage('Help message deleted');
                    } else {
                        console.error('Error deleting help message from Supabase:', result.error);
                        showErrorMessage('Failed to delete message');
                    }
                } catch (error) {
                    console.error('Error deleting help message:', error);
                    showErrorMessage('Failed to delete message');
                }
            } else {
                // Fallback to localStorage
                const helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
                const filteredMessages = helpMessages.filter(msg => msg.id !== messageId);
                localStorage.setItem('fizflashcard_help_messages', JSON.stringify(filteredMessages));
                await loadHelpMessages(); // Refresh the display
                showSuccessMessage('Help message deleted');
            }
        }
    }
    
    async function viewHelpAttachment(messageId) {
        let message = null;
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                const result = await window.supabaseConfig.getHelpMessages();
                if (result.success) {
                    const list = result.data || [];
                    message = list.find(m => String(m.id) === String(messageId));
                }
            } catch (err) {
                console.error('Error loading help message from Supabase:', err);
            }
        }
        if (!message) {
            const helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
            message = helpMessages.find(msg => String(msg.id) === String(messageId));
        }
        
        if (message && message.attachment) {
            const newWindow = window.open('', '_blank');
            newWindow.document.write(`
                <html>
                    <head>
                        <title>Attachment: ${escapeHtml(message.attachmentName)}</title>
                        <style>
                            body { font-family: Arial, sans-serif; margin: 20px; }
                            .header { background: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
                            .attachment-info { margin-bottom: 20px; }
                            .attachment-content { max-width: 100%; }
                        </style>
                    </head>
                    <body>
                        <div class="header">
                            <h2>Attachment: ${escapeHtml(message.attachmentName)}</h2>
                            <div class="attachment-info">
                                <p><strong>From:</strong> ${escapeHtml(message.userName)} (${escapeHtml(message.userEmail)})</p>
                                <p><strong>Date:</strong> ${new Date(message.date).toLocaleString()}</p>
                                <p><strong>Size:</strong> ${formatFileSize(message.attachmentSize)}</p>
                            </div>
                        </div>
                        <div class="attachment-content">
                            ${message.attachmentType && message.attachmentType.startsWith('image/') ? 
                                `<img src="${message.attachment}" style="max-width: 100%; height: auto;" />` :
                                `<iframe src="${message.attachment}" style="width: 100%; height: 600px; border: none;"></iframe>`
                            }
                        </div>
                    </body>
                </html>
            `);
        } else {
            showErrorMessage('No attachment found');
        }
    }
    
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    async function showResponseModal(messageId) {
        let message = null;
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            try {
                const result = await window.supabaseConfig.getHelpMessages();
                if (result.success) {
                    const list = result.data || [];
                    message = list.find(m => String(m.id) === String(messageId));
                }
            } catch (err) {
                console.error('Error loading help message from Supabase:', err);
            }
        }
        if (!message) {
            const helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
            message = helpMessages.find(msg => String(msg.id) === String(messageId));
        }
        
        if (!message) {
            showErrorMessage('Help message not found');
            return;
        }
        
        // Create response modal using helper function
        const modal = createAdminModal('responseModal', `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Respond to ${escapeHtml(message.userName)}</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="response-form-container">
                    <div class="original-message">
                        <h4>Original Message:</h4>
                        <div class="original-content">${escapeHtml(message.description)}</div>
                    </div>
                    <form id="adminResponseForm">
                        <div class="form-group">
                            <label for="adminResponseMessage">Your Response</label>
                            <textarea id="adminResponseMessage" rows="6" placeholder="Type your response here..." required></textarea>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="markAsResolved"> Mark this issue as resolved
                            </label>
                        </div>
                        <div class="form-actions">
                            <button type="button" class="cancel-btn" onclick="closeResponseModal()">Cancel</button>
                            <button type="submit" class="submit-btn">Send Response</button>
                        </div>
                    </form>
                </div>
            </div>
        `);
        
        // Add event listeners
        modal.querySelector('.close-modal').addEventListener('click', closeResponseModal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeResponseModal();
        });
        
        modal.querySelector('#adminResponseForm').addEventListener('submit', (e) => {
            e.preventDefault();
            sendAdminResponse(messageId, message.userId);
        });
    }
    
    function closeResponseModal() {
        const modal = document.getElementById('responseModal');
        if (modal) {
            modal.remove();
        }
    }
    
    async function sendAdminResponse(messageId, userId) {
        const responseMessage = document.getElementById('adminResponseMessage').value.trim();
        const markAsResolved = document.getElementById('markAsResolved').checked;
        
        console.log('Sending admin response:', { messageId, userId, responseMessage, markAsResolved });
        
        if (!responseMessage) {
            showErrorMessage('Please enter a response message');
            return;
        }
        
        // Send notification to user instead of response
        const notificationTitle = markAsResolved ? 'Help Request Resolved' : 'Admin Response';
        console.log('Sending notification:', { userId, notificationTitle, responseMessage });
        await sendNotificationToUser(userId, notificationTitle, responseMessage);
        
        // Mark help message as resolved if checkbox is checked
        if (markAsResolved) {
            if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
                try {
                    await window.supabaseConfig.updateHelpMessage(messageId, { resolved: true });
                } catch (error) {
                    console.error('Error updating help message in Supabase:', error);
                }
            } else {
                // Fallback to localStorage
                const helpMessages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
                const messageIndex = helpMessages.findIndex(msg => msg.id === messageId);
                if (messageIndex !== -1) {
                    helpMessages[messageIndex].resolved = true;
                    localStorage.setItem('fizflashcard_help_messages', JSON.stringify(helpMessages));
                }
            }
        }
        
        showSuccessMessage('Notification sent successfully!');
        closeResponseModal();
        await loadHelpMessages(); // Refresh the help messages display
    }
    
    function addHelpMessageFilters() {
        const helpTab = document.getElementById('helpTab');
        if (!helpTab) return;
        
        // Check if filters already exist
        if (helpTab.querySelector('.help-filters')) return;
        
        const filtersHTML = `
            <div class="help-filters" style="margin-bottom: 20px;">
                <h5 style="margin-bottom: 10px; color: #2c3e50;">Filter Messages:</h5>
                <div class="filter-buttons" style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button class="filter-btn active" data-filter="all">All Messages</button>
                    <button class="filter-btn" data-filter="logged-in">Logged In Users</button>
                    <button class="filter-btn" data-filter="not-logged-in">Not Logged In</button>
                </div>
            </div>
        `;
        
        const container = helpTab.querySelector('.help-messages-section');
        container.insertAdjacentHTML('afterbegin', filtersHTML);
        
        // Add event listeners for filter buttons
        helpTab.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                // Update active button
                helpTab.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Load filtered messages
                const filter = e.target.getAttribute('data-filter');
                await loadHelpMessages(filter);
            });
        });
    }
    
    // Send notification to user (same function as in script.js)
    async function sendNotificationToUser(userId, title, message) {
        console.log('Creating notification:', { userId, title, message });
        
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
                console.log('Saving notification to Supabase from admin panel...');
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
        
        console.log('Notification saved:', notification);
    }
    
    // Test function for admin notifications (can be called from browser console)
    window.testAdminNotification = function(userId, title, message) {
        if (!userId || !title || !message) {
            console.log('Usage: testAdminNotification(userId, title, message)');
            console.log('Example: testAdminNotification("12345", "Test", "Hello from admin!")');
            return;
        }
        sendNotificationToUser(userId, title, message);
        console.log('Test notification sent to user:', userId);
    };

    // Materials Management Functions
    function initializeMaterialsManagement() {
        console.log('Initializing materials management...');
        
        // Add event listeners for materials management
        const addBookBtn = document.getElementById('addBookBtn');
        const addTextbookBtn = document.getElementById('addTextbookBtn');
        const addChapterBtn = document.getElementById('addChapterBtn');
        
        console.log('Found buttons:', {
            addBookBtn: !!addBookBtn,
            addTextbookBtn: !!addTextbookBtn,
            addChapterBtn: !!addChapterBtn
        });
        
        // Remove existing event listeners to prevent duplicates
        if (addBookBtn) {
            addBookBtn.replaceWith(addBookBtn.cloneNode(true));
            const newAddBookBtn = document.getElementById('addBookBtn');
            newAddBookBtn.addEventListener('click', (e) => {
                console.log('Add Book button clicked!');
                showAddBookModal();
            });
            console.log('Added click listener to addBookBtn');
        }
        
        if (addTextbookBtn) {
            addTextbookBtn.replaceWith(addTextbookBtn.cloneNode(true));
            const newAddTextbookBtn = document.getElementById('addTextbookBtn');
            newAddTextbookBtn.addEventListener('click', (e) => {
                console.log('Add Textbook button clicked!');
                showAddTextbookModal();
            });
            console.log('Added click listener to addTextbookBtn');
        }
        
        if (addChapterBtn) {
            addChapterBtn.replaceWith(addChapterBtn.cloneNode(true));
            const newAddChapterBtn = document.getElementById('addChapterBtn');
            newAddChapterBtn.addEventListener('click', (e) => {
                console.log('Add Chapter button clicked!');
                showAddChapterModal();
            });
            console.log('Added click listener to addChapterBtn');
        }
        
        const storageInfoBtn = document.getElementById('storageInfoBtn');
        if (storageInfoBtn) {
            storageInfoBtn.addEventListener('click', showStorageInfo);
            console.log('Added click listener to storageInfoBtn');
        }
        
        // Load materials
        loadAdminBooks();
        loadAdminTextbooks();
    }

    function showAddBookModal() {
        const modal = createAdminModal('addBookModal', `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Book</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addBookForm">
                    <div class="form-group">
                        <label for="bookTitle">Book Title</label>
                        <input type="text" id="bookTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="bookDescription">Description</label>
                        <textarea id="bookDescription" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="bookCover">Cover Image</label>
                        <input type="file" id="bookCover" accept="image/*">
                    </div>
                    <div class="form-group">
                        <label for="bookFile">Book File (PDF)</label>
                        <input type="file" id="bookFile" accept=".pdf" required>
                    </div>
                    <button type="submit" class="form-submit">Add Book</button>
                </form>
            </div>
        `);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle form submission
        document.getElementById('addBookForm').addEventListener('submit', handleAddBook);
    }

    function showAddTextbookModal() {
        console.log('showAddTextbookModal called');
        const modal = createAdminModal('addTextbookModal', `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Add New Textbook</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addTextbookForm">
                    <div class="form-group">
                        <label for="textbookTitle">Textbook Title</label>
                        <input type="text" id="textbookTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="textbookDescription">Description</label>
                        <textarea id="textbookDescription" rows="3"></textarea>
                    </div>
                    <div class="form-group">
                        <label for="textbookLevel">HSK Level</label>
                        <select id="textbookLevel" required>
                            <option value="">Select Level</option>
                            <option value="hsk1">HSK 1</option>
                            <option value="hsk2">HSK 2</option>
                            <option value="hsk3">HSK 3</option>
                            <option value="hsk4">HSK 4</option>
                            <option value="hsk5">HSK 5</option>
                        </select>
                    </div>
                    <button type="submit" class="form-submit">Add Textbook</button>
                </form>
            </div>
        `);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle form submission
        document.getElementById('addTextbookForm').addEventListener('submit', handleAddTextbook);
    }

    function showAddChapterModal() {
        console.log('showAddChapterModal called');
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        console.log('Textbooks found for chapter modal:', textbooks);
        
        const modal = createAdminModal('addChapterModal', `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Add New Chapter</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <form id="addChapterForm">
                    <div class="form-group">
                        <label for="modalChapterTextbook">Select Textbook</label>
                        <select id="modalChapterTextbook" required>
                            <option value="">Select Textbook</option>
                            ${textbooks.map(book => `<option value="${book.id}">${book.title}</option>`).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label for="modalChapterNumber">Chapter Number</label>
                        <input type="number" id="modalChapterNumber" min="1" required>
                    </div>
                    <div class="form-group">
                        <label for="modalChapterTitle">Chapter Title</label>
                        <input type="text" id="modalChapterTitle" required>
                    </div>
                    <div class="form-group">
                        <label for="modalChapterContent">Chapter Content</label>
                        <textarea id="modalChapterContent" rows="15" placeholder="Write the chapter content here. You can use basic formatting:
**bold text**
*italic text*
# Heading 1
## Heading 2
### Heading 3
- List item
* Another list item

New paragraphs are created with blank lines." required></textarea>
                    </div>
                    <button type="submit" class="form-submit">Add Chapter</button>
                </form>
            </div>
        `);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
        
        // Handle form submission
        document.getElementById('addChapterForm').addEventListener('submit', handleAddChapter);
    }

    function handleAddBook(e) {
        e.preventDefault();
        
        const title = document.getElementById('bookTitle').value;
        const description = document.getElementById('bookDescription').value;
        const coverFile = document.getElementById('bookCover').files[0];
        const bookFile = document.getElementById('bookFile').files[0];
        
        if (!bookFile) {
            showErrorMessage('Please select a book file');
            return;
        }
        
        // Process files
        const reader = new FileReader();
        reader.onload = function(e) {
            const bookData = e.target.result;
            
            // Process cover image if provided
            let coverImage = null;
            if (coverFile) {
                const coverReader = new FileReader();
                coverReader.onload = function(e) {
                    coverImage = e.target.result;
                    saveBook(title, description, coverImage, bookData, bookFile.name, bookFile.size);
                };
                coverReader.readAsDataURL(coverFile);
            } else {
                saveBook(title, description, coverImage, bookData, bookFile.name, bookFile.size);
            }
        };
        reader.readAsDataURL(bookFile);
    }

    function handleAddTextbook(e) {
        e.preventDefault();
        
        const title = (document.getElementById('textbookTitle')?.value || '').trim();
        const description = (document.getElementById('textbookDescription')?.value || '').trim();
        const level = document.getElementById('textbookLevel')?.value || '';
        
        if (!title || !level) {
            showErrorMessage('Please fill in all required fields');
            return;
        }
        
        const textbook = {
            id: Date.now().toString(),
            title: title,
            description: description,
            level: level,
            dateAdded: new Date().toISOString()
        };
        
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        textbooks.unshift(textbook);
        localStorage.setItem('fizflashcard_textbooks', JSON.stringify(textbooks));
        
        showSuccessMessage('Textbook added successfully!');
        loadAdminTextbooks();
        
        // Close modal
        document.querySelector('.modal').remove();
    }

    function handleAddChapter(e) {
        e.preventDefault();
        console.log('handleAddChapter called');
        
        // Get form elements with more robust selection
        const textbookSelect = document.getElementById('modalChapterTextbook');
        const chapterNumberInput = document.getElementById('modalChapterNumber');
        const chapterTitleInput = document.getElementById('modalChapterTitle');
        const chapterContentInput = document.getElementById('modalChapterContent');
        
        console.log('Form elements found:', {
            textbookSelect: textbookSelect,
            chapterNumberInput: chapterNumberInput,
            chapterTitleInput: chapterTitleInput,
            chapterContentInput: chapterContentInput
        });
        
        const textbookId = textbookSelect?.value || '';
        const chapterNumberInputValue = chapterNumberInput?.value || '';
        const chapterNumber = parseInt(chapterNumberInputValue);
        const title = (chapterTitleInput?.value || '').trim();
        const content = (chapterContentInput?.value || '').trim();
        
        console.log('Chapter form data:', { textbookId, chapterNumberInputValue, chapterNumber, title, content });
        console.log('Textbook ID validation:', { textbookId, isEmpty: !textbookId, isString: typeof textbookId });
        console.log('Chapter number validation:', { chapterNumberInputValue, chapterNumber, isNaN: isNaN(chapterNumber), lessThan1: chapterNumber < 1 });
        console.log('Title validation:', { title, isEmpty: !title });
        console.log('Content validation:', { content, isEmpty: !content });
        
        // Check if there are any textbooks available
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        console.log('Available textbooks:', textbooks);
        
        if (textbooks.length === 0) {
            showErrorMessage('No textbooks available. Please add a textbook first.');
            return;
        }
        
        if (!textbookId || isNaN(chapterNumber) || chapterNumber < 1 || !title || !content) {
            showErrorMessage('Please fill in all required fields with valid values');
            return;
        }
        
        const chapter = {
            id: Date.now().toString(),
            bookId: textbookId,
            chapterNumber: chapterNumber,
            title: title,
            content: content,
            dateAdded: new Date().toISOString()
        };
        
        const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
        chapters.unshift(chapter);
        localStorage.setItem('fizflashcard_textbook_chapters', JSON.stringify(chapters));
        
        showSuccessMessage('Chapter added successfully!');
        loadAdminTextbooks();
        
        // Close modal
        document.querySelector('.modal').remove();
    }

    async function saveBook(title, description, coverImage, fileData, fileName, fileSize) {
        // Check if Supabase is configured
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            // Use Supabase for storage (unlimited)
            const book = {
                title: title,
                description: description,
                cover_image: coverImage,
                file_data: fileData,
                file_name: fileName,
                file_size: fileSize
            };
            
            try {
                const result = await window.supabaseConfig.addBook(book);
                if (result.success) {
                    showSuccessMessage('Book added successfully to Supabase!');
                    loadAdminBooks();
                    // Close modal
                    document.querySelector('.modal').remove();
                } else {
                    showErrorMessage('Error saving book to Supabase: ' + result.error);
                }
            } catch (error) {
                showErrorMessage('Error saving book: ' + error.message);
            }
        } else {
            // Fallback to localStorage with limits
            const maxFileSize = 2 * 1024 * 1024; // 2MB
            if (fileSize > maxFileSize) {
                showErrorMessage(`File is too large (${(fileSize / 1024 / 1024).toFixed(1)}MB). Please use files smaller than 2MB.`);
                return;
            }
            
            // Check total storage usage
            const { totalSize } = getStorageUsage();
            const estimatedNewSize = JSON.stringify(fileData).length;
            const maxStorage = 8 * 1024 * 1024; // 8MB limit
            
            if (totalSize + estimatedNewSize > maxStorage) {
                showErrorMessage('Storage quota exceeded. Please delete some books or use smaller files.');
                return;
            }
            
            const book = {
                id: Date.now().toString(),
                title: title,
                description: description,
                coverImage: coverImage,
                fileData: fileData,
                fileName: fileName,
                fileSize: formatFileSize(fileSize),
                dateAdded: new Date().toISOString()
            };
            
            try {
                const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
                books.unshift(book);
                localStorage.setItem('fizflashcard_books', JSON.stringify(books));
                
                showSuccessMessage('Book added successfully!');
                loadAdminBooks();
                
                // Close modal
                document.querySelector('.modal').remove();
            } catch (error) {
                if (error.name === 'QuotaExceededError') {
                    showErrorMessage('Storage quota exceeded. Please delete some books or use smaller files.');
                } else {
                    showErrorMessage('Error saving book: ' + error.message);
                }
            }
        }
    }
    
    function getStorageUsage() {
        let totalSize = 0;
        const breakdown = {};
        
        for (let key in localStorage) {
            if (localStorage.hasOwnProperty(key)) {
                const value = localStorage[key];
                const size = new Blob([value]).size;
                totalSize += size;
                
                // Categorize by data type
                if (key.includes('book_')) {
                    breakdown.books = (breakdown.books || 0) + size;
                } else if (key.includes('textbook_')) {
                    breakdown.textbooks = (breakdown.textbooks || 0) + size;
                } else if (key.includes('chapter_')) {
                    breakdown.chapters = (breakdown.chapters || 0) + size;
                } else if (key.includes('user_')) {
                    breakdown.users = (breakdown.users || 0) + size;
                } else if (key.includes('help_')) {
                    breakdown.help = (breakdown.help || 0) + size;
                } else if (key.includes('notification_')) {
                    breakdown.notifications = (breakdown.notifications || 0) + size;
                } else {
                    breakdown.other = (breakdown.other || 0) + size;
                }
            }
        }
        
        return { totalSize, breakdown };
    }
    
    function showStorageInfo() {
        const { totalSize, breakdown } = getStorageUsage();
        const maxStorage = 10 * 1024 * 1024; // Increased to 10MB
        const usagePercent = (totalSize / maxStorage * 100).toFixed(1);
        const usageMB = (totalSize / 1024 / 1024).toFixed(2);
        const maxMB = (maxStorage / 1024 / 1024).toFixed(1);
        
        // Format breakdown data
        const formatSize = (bytes) => {
            if (bytes === 0) return '0 B';
            const k = 1024;
            const sizes = ['B', 'KB', 'MB', 'GB'];
            const i = Math.floor(Math.log(bytes) / Math.log(k));
            return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
        };
        
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div class="modal-header">
                    <h3><i class="fas fa-database"></i> Storage Information</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div style="padding: 20px;">
                    <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <h4 style="margin: 0 0 10px 0;">Overall Usage</h4>
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                            <span>Used: ${usageMB} MB / ${maxMB} MB</span>
                            <span style="color: ${usagePercent > 80 ? '#dc3545' : usagePercent > 60 ? '#ffc107' : '#28a745'};">
                                ${usagePercent}%
                            </span>
                        </div>
                        <div style="background: #e9ecef; height: 20px; border-radius: 10px; overflow: hidden;">
                            <div style="background: ${usagePercent > 80 ? '#dc3545' : usagePercent > 60 ? '#ffc107' : '#28a745'}; 
                                        height: 100%; width: ${usagePercent}%; transition: width 0.3s ease;"></div>
                        </div>
                    </div>
                    
                    <h4 style="margin: 0 0 15px 0;">Breakdown by Data Type</h4>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px;">
                        <div style="background: #e3f2fd; padding: 10px; border-radius: 6px;">
                            <strong>Books:</strong> ${formatSize(breakdown.books || 0)}
                        </div>
                        <div style="background: #e8f5e8; padding: 10px; border-radius: 6px;">
                            <strong>Textbooks:</strong> ${formatSize(breakdown.textbooks || 0)}
                        </div>
                        <div style="background: #fff3e0; padding: 10px; border-radius: 6px;">
                            <strong>Chapters:</strong> ${formatSize(breakdown.chapters || 0)}
                        </div>
                        <div style="background: #f3e5f5; padding: 10px; border-radius: 6px;">
                            <strong>Users:</strong> ${formatSize(breakdown.users || 0)}
                        </div>
                        <div style="background: #e0f2f1; padding: 10px; border-radius: 6px;">
                            <strong>Help Messages:</strong> ${formatSize(breakdown.help || 0)}
                        </div>
                        <div style="background: #fce4ec; padding: 10px; border-radius: 6px;">
                            <strong>Other:</strong> ${formatSize(breakdown.other || 0)}
                        </div>
                    </div>
                    
                    ${usagePercent > 80 ? `
                        <div style="background: #f8d7da; color: #721c24; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
                            <strong>⚠️ Storage Warning:</strong> You're using ${usagePercent}% of available storage. 
                            Consider deleting some books or using smaller files.
                        </div>
                    ` : ''}
                    
                    <div style="text-align: center;">
                        <button class="admin-btn" onclick="clearStorageData()" style="background: #dc3545;">
                            <i class="fas fa-trash"></i> Clear All Data
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }
    
    function clearStorageData() {
        if (confirm('Are you sure you want to clear ALL data? This will delete all books, textbooks, chapters, users, and other data. This action cannot be undone!')) {
            localStorage.clear();
            showSuccessMessage('All data cleared successfully!');
            loadAdminBooks();
            loadAdminTextbooks();
            // Close any open modals
            document.querySelectorAll('.modal').forEach(modal => modal.remove());
        }
    }

    function saveSolution(hskLevel, chapter, fileData, fileName, fileSize) {
        const solution = {
            id: Date.now().toString(),
            hskLevel: hskLevel,
            chapter: chapter,
            fileData: fileData,
            fileName: fileName,
            fileSize: formatFileSize(fileSize),
            dateAdded: new Date().toISOString()
        };
        
        const solutions = JSON.parse(localStorage.getItem('fizflashcard_solutions') || '[]');
        solutions.unshift(solution);
        localStorage.setItem('fizflashcard_solutions', JSON.stringify(solutions));
        
        showSuccessMessage('Solution added successfully!');
        loadAdminSolutions();
        
        // Close modal
        document.querySelector('.modal').remove();
    }

    async function loadAdminBooks() {
        const booksGrid = document.getElementById('booksAdminGrid');
        if (!booksGrid) return;
        
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            // Use Supabase
            try {
                const result = await window.supabaseConfig.getBooks();
                if (result.success) {
                    const books = result.data || [];
                    if (books.length === 0) {
                        booksGrid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                                <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                                <p>No books uploaded yet</p>
                            </div>
                        `;
                        return;
                    }
                    booksGrid.innerHTML = books.map(book => createAdminBookCard(book)).join('');
                } else {
                    booksGrid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #dc3545;">
                            <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                            <p>Error loading books: ${result.error}</p>
                        </div>
                    `;
                }
            } catch (error) {
                booksGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #dc3545;">
                        <i class="fas fa-exclamation-triangle" style="font-size: 3rem; margin-bottom: 15px;"></i>
                        <p>Error loading books: ${error.message}</p>
                    </div>
                `;
            }
        } else {
            // Fallback to localStorage
            const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
            
            if (books.length === 0) {
                booksGrid.innerHTML = `
                    <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                        <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                        <p>No books uploaded yet</p>
                    </div>
                `;
                return;
            }
            
            booksGrid.innerHTML = books.map(book => createAdminBookCard(book)).join('');
        }
    }

    function loadAdminTextbooks() {
        const textbooksGrid = document.getElementById('textbooksAdminGrid');
        if (!textbooksGrid) return;
        
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
        
        if (textbooks.length === 0) {
            textbooksGrid.innerHTML = `
                <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #6c757d;">
                    <i class="fas fa-book" style="font-size: 3rem; margin-bottom: 15px; opacity: 0.5;"></i>
                    <p>No textbooks created yet</p>
                </div>
            `;
            return;
        }
        
        textbooksGrid.innerHTML = textbooks.map(textbook => {
            const bookChapters = chapters.filter(chapter => chapter.bookId === textbook.id);
            return createAdminTextbookCard(textbook, bookChapters);
        }).join('');
    }

    function createAdminBookCard(book) {
        // Handle both Supabase and localStorage data formats
        const fileName = book.file_name || book.fileName;
        const fileSize = book.file_size ? formatFileSize(book.file_size) : book.fileSize;
        const dateAdded = book.created_at || book.dateAdded;
        
        return `
            <div class="admin-book-card">
                <h6>${escapeHtml(book.title)}</h6>
                <p>${escapeHtml(book.description || 'No description')}</p>
                <p><strong>File:</strong> ${fileName}</p>
                <p><strong>Size:</strong> ${fileSize}</p>
                <p><strong>Added:</strong> ${new Date(dateAdded).toLocaleDateString()}</p>
                <div class="admin-book-actions">
                    <button class="admin-btn-small" onclick="downloadBook('${book.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="admin-btn-small danger" onclick="deleteBook('${book.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    // Add missing downloadBook function
    function downloadBook(bookId) {
        if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
            // For Supabase, we need to get the book data first
            window.supabaseConfig.getBooks().then(result => {
                if (result.success) {
                    const book = result.data.find(b => b.id === bookId);
                    if (book) {
                        downloadBookFile(book);
                    } else {
                        showErrorMessage('Book not found');
                    }
                } else {
                    showErrorMessage('Error loading book: ' + result.error);
                }
            });
        } else {
            // For localStorage
            const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
            const book = books.find(b => b.id === bookId);
            if (book) {
                downloadBookFile(book);
            } else {
                showErrorMessage('Book not found');
            }
        }
    }

    function downloadBookFile(book) {
        try {
            const fileData = book.file_data || book.fileData;
            const fileName = book.file_name || book.fileName;
            
            if (!fileData) {
                showErrorMessage('File data not found');
                return;
            }
            
            // Create blob and download
            const byteCharacters = atob(fileData.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: 'application/pdf' });
            
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showSuccessMessage('Book downloaded successfully!');
        } catch (error) {
            console.error('Error downloading book:', error);
            showErrorMessage('Error downloading book: ' + error.message);
        }
    }


    // Add missing downloadSolution function
    function downloadSolution(solutionId) {
        // This function is for downloading textbook solutions
        // For now, just show a message that this feature is not implemented
        showErrorMessage('Download solution functionality not yet implemented');
    }

    // Add missing deleteSolution function
    function deleteSolution(solutionId) {
        if (confirm('Are you sure you want to delete this solution?')) {
            // This function is for deleting textbook solutions
            // For now, just show a message that this feature is not implemented
            showErrorMessage('Delete solution functionality not yet implemented');
        }
    }

    function createAdminTextbookCard(textbook, chapters) {
        return `
            <div class="admin-textbook-card">
                <h6>${escapeHtml(textbook.title)}</h6>
                <p><strong>Level:</strong> ${textbook.level.toUpperCase()}</p>
                <p><strong>Description:</strong> ${escapeHtml(textbook.description || 'No description')}</p>
                <p><strong>Chapters:</strong> ${chapters.length}</p>
                <p><strong>Added:</strong> ${new Date(textbook.dateAdded).toLocaleDateString()}</p>
                <div class="admin-textbook-actions">
                    <button class="admin-btn-small" onclick="viewTextbookChapters('${textbook.id}')">
                        <i class="fas fa-eye"></i> View Chapters
                    </button>
                    <button class="admin-btn-small danger" onclick="deleteTextbook('${textbook.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }

    async function deleteBook(bookId) {
        if (!confirm('Are you sure you want to delete this book?')) return;
        try {
            if (window.supabaseConfig && window.supabaseConfig.isConfigured()) {
                const result = await window.supabaseConfig.deleteBook(bookId);
                if (!result.success) throw new Error(result.error || 'Delete failed');
            } else {
                const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
                const filteredBooks = books.filter(book => book.id !== bookId);
                localStorage.setItem('fizflashcard_books', JSON.stringify(filteredBooks));
            }
            loadAdminBooks();
            showSuccessMessage('Book deleted successfully!');
        } catch (e) {
            console.error('Delete book error:', e);
            showErrorMessage('Error deleting book: ' + e.message);
        }
    }

    function deleteTextbook(textbookId) {
        if (confirm('Are you sure you want to delete this textbook? This will also delete all its chapters.')) {
            const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
            const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
            
            // Delete textbook
            const filteredTextbooks = textbooks.filter(textbook => textbook.id !== textbookId);
            localStorage.setItem('fizflashcard_textbooks', JSON.stringify(filteredTextbooks));
            
            // Delete all chapters for this textbook
            const filteredChapters = chapters.filter(chapter => chapter.bookId !== textbookId);
            localStorage.setItem('fizflashcard_textbook_chapters', JSON.stringify(filteredChapters));
            
            loadAdminTextbooks();
            showSuccessMessage('Textbook and all its chapters deleted successfully!');
        }
    }

    function viewTextbookChapters(textbookId) {
        const textbooks = JSON.parse(localStorage.getItem('fizflashcard_textbooks') || '[]');
        const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
        
        const textbook = textbooks.find(t => t.id === textbookId);
        const bookChapters = chapters.filter(c => c.bookId === textbookId);
        
        if (!textbook) {
            showErrorMessage('Textbook not found');
            return;
        }
        
        // Create modal to show chapters
        const modal = createAdminModal('chaptersModal', `
            <div class="modal-content" style="max-width: 800px;">
                <div class="modal-header">
                    <h3>Chapters in "${textbook.title}"</h3>
                    <button class="close-modal">&times;</button>
                </div>
                <div style="max-height: 500px; overflow-y: auto;">
                    ${bookChapters.length === 0 ? 
                        '<p style="text-align: center; color: #6c757d; padding: 40px;">No chapters available</p>' :
                        bookChapters.sort((a, b) => a.chapterNumber - b.chapterNumber).map(chapter => `
                            <div style="border: 1px solid #e9ecef; border-radius: 8px; padding: 15px; margin-bottom: 10px;">
                                <h4 style="margin: 0 0 10px 0;">Chapter ${chapter.chapterNumber}: ${escapeHtml(chapter.title)}</h4>
                                <p style="margin: 0 0 10px 0; color: #6c757d; font-size: 0.9rem;">
                                    Added: ${new Date(chapter.dateAdded).toLocaleDateString()}
                                </p>
                                <div style="display: flex; gap: 10px;">
                                    <button class="admin-btn-small" onclick="editChapter('${chapter.id}')">
                                        <i class="fas fa-edit"></i> Edit
                                    </button>
                                    <button class="admin-btn-small danger" onclick="deleteChapter('${chapter.id}')">
                                        <i class="fas fa-trash"></i> Delete
                                    </button>
                                </div>
                            </div>
                        `).join('')
                    }
                </div>
            </div>
        `);
        
        // Close modal
        modal.querySelector('.close-modal').addEventListener('click', () => {
            modal.remove();
        });
    }

    function deleteChapter(chapterId) {
        if (confirm('Are you sure you want to delete this chapter?')) {
            const chapters = JSON.parse(localStorage.getItem('fizflashcard_textbook_chapters') || '[]');
            const filteredChapters = chapters.filter(chapter => chapter.id !== chapterId);
            localStorage.setItem('fizflashcard_textbook_chapters', JSON.stringify(filteredChapters));
            loadAdminTextbooks();
            showSuccessMessage('Chapter deleted successfully!');
        }
    }

    // Make functions globally accessible
    window.downloadBook = downloadBook;
    window.downloadSolution = downloadSolution;
    window.deleteBook = deleteBook;
    window.deleteSolution = deleteSolution;
    window.clearStorageData = clearStorageData;

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

    function loadExternalDbConfiguration() {
        // Load values from localStorage
        const cfg = JSON.parse(localStorage.getItem('fizflashcard_external_api') || '{}');
        const urlInput = document.getElementById('externalApiUrl');
        const keyInput = document.getElementById('externalApiKey');
        if (urlInput) urlInput.value = cfg.baseUrl || '';
        if (keyInput) keyInput.value = cfg.apiKey || '';
        // DB fields
        const d = cfg.db || {};
        const dialectInput = document.getElementById('extDbDialect');
        const hostInput = document.getElementById('extDbHost');
        const portInput = document.getElementById('extDbPort');
        const nameInput = document.getElementById('extDbName');
        const userInput = document.getElementById('extDbUser');
        const passInput = document.getElementById('extDbPassword');
        if (dialectInput) dialectInput.value = d.dialect || '';
        if (hostInput) hostInput.value = d.host || '';
        if (portInput) portInput.value = d.port || '';
        if (nameInput) nameInput.value = d.name || '';
        if (userInput) userInput.value = d.user || '';
        if (passInput) passInput.value = d.password || '';
        // Data source toggle
        const ds = cfg.dataSource || 'supabase';
        const dsSup = document.getElementById('dataSourceSupabase');
        const dsExt = document.getElementById('dataSourceExternal');
        if (dsSup && dsExt) {
            dsSup.checked = ds !== 'external';
            dsExt.checked = ds === 'external';
            dsSup.addEventListener('change', () => saveExternalDbConfiguration());
            dsExt.addEventListener('change', () => saveExternalDbConfiguration());
        }
        const dsStatus = document.getElementById('extDataSourceStatus');
        if (dsStatus) dsStatus.textContent = ds === 'external' ? 'External API' : 'Supabase';
        // Update status labels
        const urlStatus = document.getElementById('extApiUrlStatus');
        const keyStatus = document.getElementById('extApiKeyStatus');
        if (urlStatus) urlStatus.textContent = cfg.baseUrl ? 'Set' : 'Not set';
        if (keyStatus) keyStatus.textContent = cfg.apiKey ? 'Set' : 'Not set';
        // Bind buttons (avoid duplicate listeners)
        const saveBtn = document.getElementById('saveExternalDbConfig');
        if (saveBtn) {
            saveBtn.replaceWith(saveBtn.cloneNode(true));
            document.getElementById('saveExternalDbConfig').addEventListener('click', saveExternalDbConfiguration);
        }
        const testBtn = document.getElementById('testExternalDbConnection');
        if (testBtn) {
            testBtn.replaceWith(testBtn.cloneNode(true));
            document.getElementById('testExternalDbConnection').addEventListener('click', testExternalDbConnection);
        }
    }

    function saveExternalDbConfiguration() {
        const baseUrl = (document.getElementById('externalApiUrl')?.value || '').trim();
        const apiKey = (document.getElementById('externalApiKey')?.value || '').trim();
        const db = {
            dialect: (document.getElementById('extDbDialect')?.value || '').trim(),
            host: (document.getElementById('extDbHost')?.value || '').trim(),
            port: (document.getElementById('extDbPort')?.value || '').trim(),
            name: (document.getElementById('extDbName')?.value || '').trim(),
            user: (document.getElementById('extDbUser')?.value || '').trim(),
            password: (document.getElementById('extDbPassword')?.value || '').trim()
        };
        const dataSource = (document.getElementById('dataSourceExternal')?.checked) ? 'external' : 'supabase';
        const config = { baseUrl, apiKey, db, dataSource };
        localStorage.setItem('fizflashcard_external_api', JSON.stringify(config));
        // Update status
        const dsStatus = document.getElementById('extDataSourceStatus');
        if (dsStatus) dsStatus.textContent = dataSource === 'external' ? 'External API' : 'Supabase';
        const urlStatus = document.getElementById('extApiUrlStatus');
        const keyStatus = document.getElementById('extApiKeyStatus');
        if (urlStatus) urlStatus.textContent = baseUrl ? 'Set' : 'Not set';
        if (keyStatus) keyStatus.textContent = apiKey ? 'Set' : 'Not set';
        showSuccessMessage('External DB configuration saved');
    }

    async function testExternalDbConnection() {
        const cfg = JSON.parse(localStorage.getItem('fizflashcard_external_api') || '{}');
        if (!cfg.baseUrl) { showErrorMessage('Please save API Base URL first'); return; }
        const btn = document.getElementById('testExternalDbConnection');
        const original = btn ? btn.textContent : '';
        if (btn) { btn.textContent = 'Testing...'; btn.disabled = true; }
        try {
            const headers = { 'Content-Type': 'application/json' };
            if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;
            // Prefer POST /test-connection with DB payload; fallback to GET /health
            let url = cfg.baseUrl.replace(/\/$/, '') + '/test-connection';
            let res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ db: cfg.db || {} }) });
            if (!res.ok) {
                url = cfg.baseUrl.replace(/\/$/, '') + '/health';
                res = await fetch(url, { headers });
            }
            if (!res.ok) {
                url = cfg.baseUrl;
                res = await fetch(url, { headers });
            }
            if (btn) { btn.textContent = original; btn.disabled = false; }
            if (res.ok) {
                showSuccessMessage('External API connection successful');
            } else {
                showErrorMessage('External API responded with status ' + res.status);
            }
        } catch (e) {
            if (btn) { btn.textContent = original; btn.disabled = false; }
            showErrorMessage('Failed to reach External API: ' + e.message);
        }
    }
});
