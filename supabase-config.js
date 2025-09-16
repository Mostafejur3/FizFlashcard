// Supabase Configuration and Database Connection
// This file handles all database operations using environment variables

class SupabaseConfig {
    constructor() {
        this.supabaseUrl = this.getEnvVariable('SUPABASE_URL');
        this.supabaseKey = this.getEnvVariable('SUPABASE_KEY');
        this.supabaseServiceKey = this.getEnvVariable('SUPABASE_SERVICE_KEY');
        
        // Initialize Supabase client if credentials are available
        this.client = null;
        this.initializeClient();
    }

    // Provider selection
    isExternalEnabled() {
        try {
            const cfg = JSON.parse(localStorage.getItem('fizflashcard_external_api') || '{}');
            return cfg && cfg.dataSource === 'external' && cfg.baseUrl;
        } catch (_) { return false; }
    }

    getExternalConfig() {
        try { return JSON.parse(localStorage.getItem('fizflashcard_external_api') || '{}'); }
        catch (_) { return {}; }
    }

    async externalFetch(path, options = {}) {
        const cfg = this.getExternalConfig();
        const base = (cfg.baseUrl || '').replace(/\/$/, '');
        const url = base + path;
        const headers = Object.assign({ 'Content-Type': 'application/json' }, options.headers || {});
        if (cfg.apiKey) headers['Authorization'] = 'Bearer ' + cfg.apiKey;
        const res = await fetch(url, { ...options, headers });
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`External API ${res.status}: ${text || res.statusText}`);
        }
        return res.json().catch(() => ({}));
    }

    getEnvVariable(key) {
        // In a real application, these would come from environment variables
        // For now, we'll use localStorage as a fallback for development
        const envVars = JSON.parse(localStorage.getItem('fizflashcard_env_vars') || '{}');
        return envVars[key] || null;
    }

    setEnvVariable(key, value) {
        const envVars = JSON.parse(localStorage.getItem('fizflashcard_env_vars') || '{}');
        envVars[key] = value;
        localStorage.setItem('fizflashcard_env_vars', JSON.stringify(envVars));
    }

    initializeClient() {
        if (this.supabaseUrl && this.supabaseKey) {
            try {
                // Check if supabase is available
                if (typeof supabase === 'undefined') {
                    console.error('Supabase library not loaded. Please make sure the Supabase script is included.');
                    this.client = null;
                    return;
                }
                
                // Initialize actual Supabase client
                this.client = supabase.createClient(this.supabaseUrl, this.supabaseKey);
                console.log('Supabase client initialized successfully');
            } catch (error) {
                console.error('Failed to initialize Supabase client:', error);
                this.client = null;
            }
        } else {
            console.warn('Supabase credentials not found. Using localStorage fallback.');
        }
    }

    // User Management Methods
    async createUser(userData) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/users', { method: 'POST', body: JSON.stringify(userData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            // Implement Supabase user creation
            return await this.supabaseCreateUser(userData);
        } else {
            // Fallback to localStorage
            return this.localStorageCreateUser(userData);
        }
    }

    async getUser(email) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/users/by-email?email=${encodeURIComponent(email)}`);
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseGetUserByEmail(email);
        } else {
            return this.localStorageGetUserByEmail(email);
        }
    }

    async getUserById(userId) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/users/${encodeURIComponent(userId)}`);
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseGetUser(userId);
        } else {
            return this.localStorageGetUser(userId);
        }
    }

    async updateUserPlan(userId, plan) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch(`/users/${encodeURIComponent(userId)}/plan`, { method: 'PUT', body: JSON.stringify({ plan }) });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseUpdateUserPlan(userId, plan);
        } else {
            return this.localStorageUpdateUserPlan(userId, plan);
        }
    }

    // Word Management Methods
    async getWords(hskLevel = null) {
        if (this.isExternalEnabled()) {
            try {
                const qs = hskLevel ? `?hskLevel=${encodeURIComponent(hskLevel)}` : '';
                const data = await this.externalFetch(`/words${qs}`);
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseGetWords(hskLevel);
        } else {
            return this.localStorageGetWords(hskLevel);
        }
    }

    async addWords(words) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch('/words', { method: 'POST', body: JSON.stringify({ words }) });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseAddWords(words);
        } else {
            return this.localStorageAddWords(words);
        }
    }

    // Progress Tracking Methods
    async getUserProgress(userId) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/progress/${encodeURIComponent(userId)}`);
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseGetUserProgress(userId);
        } else {
            return this.localStorageGetUserProgress(userId);
        }
    }

    async updateUserProgress(userId, progressData) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch(`/progress/${encodeURIComponent(userId)}`, { method: 'PUT', body: JSON.stringify(progressData) });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            return await this.supabaseUpdateUserProgress(userId, progressData);
        } else {
            return this.localStorageUpdateUserProgress(userId, progressData);
        }
    }

    // Supabase Implementation Methods
    async supabaseCreateUser(userData) {
        try {
            // Convert camelCase to snake_case for database
            const dbUserData = {
                display_id: userData.displayId,
                name: userData.name,
                email: userData.email,
                university: userData.university,
                plan: userData.plan,
                enrollment_date: userData.enrollment_date,
                remaining_days: userData.remaining_days
            };

            const { data, error } = await this.client
                .from('users')
                .insert([dbUserData])
                .select()
                .single();
            
            if (error) throw error;
            
            // Convert snake_case back to camelCase for application
            const appUserData = {
                id: data.id, // This will be a UUID string
                displayId: data.display_id,
                name: data.name,
                email: data.email,
                university: data.university,
                plan: data.plan,
                enrollmentDate: data.enrollment_date,
                remainingDays: data.remaining_days,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: appUserData };
        } catch (error) {
            console.error('Error creating user in Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseGetUserByEmail(email) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            
            if (error) throw error;
            
            // Convert snake_case to camelCase for application
            const appUserData = {
                id: data.id,
                displayId: data.display_id,
                name: data.name,
                email: data.email,
                university: data.university,
                plan: data.plan,
                enrollmentDate: data.enrollment_date,
                remainingDays: data.remaining_days,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: appUserData };
        } catch (error) {
            console.error('Error getting user by email from Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseGetUser(userId) {
        try {
            const { data, error } = await this.client
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            
            // Convert snake_case to camelCase for application
            const appUserData = {
                id: data.id,
                displayId: data.display_id,
                name: data.name,
                email: data.email,
                university: data.university,
                plan: data.plan,
                enrollmentDate: data.enrollment_date,
                remainingDays: data.remaining_days,
                createdAt: data.created_at,
                updatedAt: data.updated_at
            };
            
            return { success: true, data: appUserData };
        } catch (error) {
            console.error('Error getting user from Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseUpdateUserPlan(userId, plan) {
        try {
            const { error } = await this.client
                .from('users')
                .update({ plan })
                .eq('id', userId);
            
            if (error) throw error;
        return { success: true };
        } catch (error) {
            console.error('Error updating user plan in Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseGetWords(hskLevel) {
        try {
            let query = this.client.from('words').select('*');
            if (hskLevel) {
                query = query.eq('hsk_level', hskLevel);
            }
            
            const { data, error } = await query;
            if (error) throw error;
            
            // Convert snake_case to camelCase for application
            const appWords = (data || []).map(word => ({
                id: word.id,
                chinese: word.chinese,
                pinyin: word.pinyin,
                english: word.english,
                hskLevel: word.hsk_level,
                groupNumber: word.group_number,
                createdAt: word.created_at
            }));
            
            return { success: true, data: appWords };
        } catch (error) {
            console.error('Error getting words from Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseAddWords(words) {
        try {
            // Convert camelCase to snake_case for database
            const dbWords = words.map(word => ({
                chinese: word.chinese,
                pinyin: word.pinyin,
                english: word.english,
                hsk_level: word.hskLevel,
                group_number: word.groupNumber
            }));

            const { error } = await this.client
                .from('words')
                .insert(dbWords);
            
            if (error) throw error;
        return { success: true };
        } catch (error) {
            console.error('Error adding words to Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseGetUserProgress(userId) {
        try {
            const { data, error } = await this.client
                .from('user_progress')
                .select('*')
                .eq('user_id', userId);
            
            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            console.error('Error getting user progress from Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    async supabaseUpdateUserProgress(userId, progressData) {
        try {
            const { error } = await this.client
                .from('user_progress')
                .upsert({
                    user_id: userId,
                    hsk_level: progressData.hsk_level,
                    group_range: progressData.group_range,
                    progress_type: progressData.progress_type,
                    word_indices: progressData.word_indices
                });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error updating user progress in Supabase:', error);
            return { success: false, error: error.message };
        }
    }

    // Additional Supabase methods for books, help messages, etc.
    async addBook(bookData) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/books', { method: 'POST', body: JSON.stringify(bookData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('books')
                    .insert([bookData])
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error adding book to Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageAddBook(bookData);
        }
    }

    async getBooks() {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/books');
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('books')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return { success: true, data: data || [] };
            } catch (error) {
                console.error('Error getting books from Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageGetBooks();
        }
    }

    async deleteBook(bookId) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch(`/books/${encodeURIComponent(bookId)}`, { method: 'DELETE' });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('books')
                    .delete()
                    .eq('id', bookId);
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error deleting book from Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            // LocalStorage fallback
            const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
            const filtered = books.filter(b => b.id !== bookId);
            localStorage.setItem('fizflashcard_books', JSON.stringify(filtered));
            return { success: true };
        }
    }

    async addHelpMessage(helpData) {
        console.log('addHelpMessage called with:', helpData);
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/help-messages', { method: 'POST', body: JSON.stringify(helpData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                // Convert camelCase to snake_case for database
                const dbHelpData = {
                    user_id: helpData.userId === 'anonymous' ? null : helpData.userId,
                    user_name: helpData.userName,
                    user_email: helpData.userEmail,
                    user_display_id: helpData.userDisplayId || null,
                    subject: helpData.subject || helpData.description,
                    message: helpData.message || helpData.description,
                    attachment: helpData.attachment,
                    attachment_name: helpData.attachmentName,
                    attachment_size: helpData.attachmentSize,
                    attachment_type: helpData.attachmentType,
                    resolved: false
                };
                const { data, error } = await this.client
                    .from('help_messages')
                    .insert([dbHelpData])
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error adding help message to Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            console.log('Supabase not configured, using localStorage fallback');
            return this.localStorageAddHelpMessage(helpData);
        }
    }

    async getHelpMessages() {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/help-messages');
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('help_messages')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                const appHelpMessages = data.map(msg => ({
                    id: msg.id,
                    userId: msg.user_id || 'anonymous',
                    userName: msg.user_name,
                    userEmail: msg.user_email,
                    userDisplayId: msg.user_display_id || null,
                    subject: msg.subject,
                    message: msg.message,
                    description: msg.message,
                    attachment: msg.attachment,
                    attachmentName: msg.attachment_name,
                    attachmentSize: msg.attachment_size,
                    attachmentType: msg.attachment_type,
                    date: msg.created_at,
                    resolved: msg.resolved || false
                }));
                return { success: true, data: appHelpMessages };
            } catch (error) {
                console.error('Error getting help messages from Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageGetHelpMessages();
        }
    }

    async updateHelpMessage(messageId, updateData) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/help-messages/${encodeURIComponent(messageId)}`, { method: 'PUT', body: JSON.stringify(updateData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('help_messages')
                    .update(updateData)
                    .eq('id', messageId)
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error updating help message in Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageUpdateHelpMessage(messageId, updateData);
        }
    }

    async deleteHelpMessage(messageId) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch(`/help-messages/${encodeURIComponent(messageId)}`, { method: 'DELETE' });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('help_messages')
                    .delete()
                    .eq('id', messageId);
                if (error) throw error;
                return { success: true };
            } catch (error) {
                console.error('Error deleting help message from Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageDeleteHelpMessage(messageId);
        }
    }

    async addNotification(notificationData) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch('/notifications', { method: 'POST', body: JSON.stringify(notificationData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const dbNotificationData = {
                    user_id: notificationData.userId,
                    title: notificationData.title,
                    message: notificationData.message,
                    read: notificationData.read || false,
                    date: notificationData.date || new Date().toISOString()
                };
                const { data, error } = await this.client
                    .from('notifications')
                    .insert([dbNotificationData])
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error adding notification to Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageAddNotification(notificationData);
        }
    }

    async getNotifications(userId) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/notifications?userId=${encodeURIComponent(userId)}`);
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { data, error } = await this.client
                    .from('notifications')
                    .select('*')
                    .eq('user_id', userId)
                    .order('created_at', { ascending: false });
                if (error) throw error;
                const appNotifications = data.map(notification => ({
                    id: notification.id,
                    userId: notification.user_id,
                    title: notification.title,
                    message: notification.message,
                    date: notification.date || notification.created_at,
                    read: notification.read || false
                }));
                return { success: true, data: appNotifications };
            } catch (error) {
                console.error('Error getting notifications from Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageGetNotifications(userId);
        }
    }

    async updateNotification(notificationId, updateData) {
        if (this.isExternalEnabled()) {
            try {
                const data = await this.externalFetch(`/notifications/${encodeURIComponent(notificationId)}`, { method: 'PUT', body: JSON.stringify(updateData) });
                return { success: true, data };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const dbUpdate = {};
                if (Object.prototype.hasOwnProperty.call(updateData, 'read')) dbUpdate.read = updateData.read;
                if (Object.prototype.hasOwnProperty.call(updateData, 'title')) dbUpdate.title = updateData.title;
                if (Object.prototype.hasOwnProperty.call(updateData, 'message')) dbUpdate.message = updateData.message;
                if (Object.prototype.hasOwnProperty.call(updateData, 'date')) dbUpdate.date = updateData.date;
                const { data, error } = await this.client
                    .from('notifications')
                    .update(dbUpdate)
                    .eq('id', notificationId)
                    .select()
                    .single();
                if (error) throw error;
                return { success: true, data };
            } catch (error) {
                console.error('Error updating notification in Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageUpdateNotification(notificationId, updateData);
        }
    }

    async deleteNotification(notificationId) {
        if (this.isExternalEnabled()) {
            try {
                await this.externalFetch(`/notifications/${encodeURIComponent(notificationId)}`, { method: 'DELETE' });
                return { success: true };
            } catch (e) { return { success: false, error: e.message }; }
        }
        if (this.client) {
            try {
                const { error } = await this.client
                    .from('notifications')
                    .delete()
                    .eq('id', notificationId);
                if (error) throw error;
        return { success: true };
            } catch (error) {
                console.error('Error deleting notification in Supabase:', error);
                return { success: false, error: error.message };
            }
        } else {
            return this.localStorageDeleteNotification(notificationId);
        }
    }

    // LocalStorage fallback methods for new functionality
    localStorageAddBook(bookData) {
        const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
        const newBook = { ...bookData, id: Date.now().toString(), created_at: new Date().toISOString() };
        books.unshift(newBook);
        localStorage.setItem('fizflashcard_books', JSON.stringify(books));
        return { success: true, data: newBook };
    }

    localStorageGetBooks() {
        const books = JSON.parse(localStorage.getItem('fizflashcard_books') || '[]');
        return { success: true, data: books };
    }

    localStorageAddHelpMessage(helpData) {
        const messages = JSON.parse(localStorage.getItem('fizflashcard_help_messages') || '[]');
        const newMessage = { ...helpData, id: Date.now().toString(), created_at: new Date().toISOString() };
        messages.unshift(newMessage);
        localStorage.setItem('fizflashcard_help_messages', JSON.stringify(messages));
        return { success: true, data: newMessage };
    }

    localStorageAddNotification(notificationData) {
        const notifications = JSON.parse(localStorage.getItem('fizflashcard_notifications') || '[]');
        const newNotification = { ...notificationData, id: Date.now().toString(), created_at: new Date().toISOString() };
        notifications.unshift(newNotification);
        localStorage.setItem('fizflashcard_notifications', JSON.stringify(notifications));
        return { success: true, data: newNotification };
    }

    // LocalStorage Fallback Methods
    localStorageCreateUser(userData) {
        const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
        const newUser = { ...userData, id: Date.now().toString() };
        users.push(newUser);
        localStorage.setItem('fizflashcard_users', JSON.stringify(users));
        return { success: true, data: newUser };
    }

    localStorageGetUserByEmail(email) {
        const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
        const user = users.find(u => u.email === email);
        return { success: true, data: user };
    }

    localStorageGetUser(userId) {
        const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
        const user = users.find(u => u.id === userId);
        return { success: true, data: user };
    }

    localStorageUpdateUserPlan(userId, plan) {
        const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
        const userIndex = users.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            users[userIndex].plan = plan;
            localStorage.setItem('fizflashcard_users', JSON.stringify(users));
            return { success: true };
        }
        return { success: false, error: 'User not found' };
    }

    localStorageGetWords(hskLevel) {
        const words = JSON.parse(localStorage.getItem('fizflashcard_words') || '[]');
        if (hskLevel) {
            const filteredWords = words.filter(word => !word.hskLevel || word.hskLevel.toString() === hskLevel.toString());
            return { success: true, data: filteredWords };
        }
        return { success: true, data: words };
    }

    localStorageAddWords(words) {
        const existingWords = JSON.parse(localStorage.getItem('fizflashcard_words') || '[]');
        const updatedWords = [...existingWords, ...words];
        localStorage.setItem('fizflashcard_words', JSON.stringify(updatedWords));
        return { success: true };
    }

    localStorageGetUserProgress(userId) {
        const progress = JSON.parse(localStorage.getItem(`fizflashcard_progress_${userId}`) || '{}');
        return { success: true, data: progress };
    }

    localStorageUpdateUserProgress(userId, progressData) {
        localStorage.setItem(`fizflashcard_progress_${userId}`, JSON.stringify(progressData));
        return { success: true };
    }

    // Configuration Methods
    configureSupabase(url, key, serviceKey = null) {
        this.setEnvVariable('SUPABASE_URL', url);
        this.setEnvVariable('SUPABASE_KEY', key);
        if (serviceKey) {
            this.setEnvVariable('SUPABASE_SERVICE_KEY', serviceKey);
        }
        
        this.supabaseUrl = url;
        this.supabaseKey = key;
        this.supabaseServiceKey = serviceKey;
        
        this.initializeClient();
        console.log('Supabase configuration updated');
    }

    isConfigured() {
        return !!(this.supabaseUrl && this.supabaseKey);
    }

    getConfigurationStatus() {
        return {
            configured: this.isConfigured(),
            url: this.supabaseUrl ? 'Set' : 'Not set',
            key: this.supabaseKey ? 'Set' : 'Not set',
            serviceKey: this.supabaseServiceKey ? 'Set' : 'Not set'
        };
    }
}

// Create global instance
window.supabaseConfig = new SupabaseConfig();

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupabaseConfig;
}



