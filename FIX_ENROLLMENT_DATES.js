// Fix enrollment dates for existing users
// Run this in browser console to fix existing users

console.log('=== FIXING ENROLLMENT DATES ===');

// Fix localStorage users
const users = JSON.parse(localStorage.getItem('fizflashcard_users') || '[]');
let fixedCount = 0;

users.forEach(user => {
    if (user.enrollmentDate && user.enrollmentDate.includes('T') === false) {
        // Convert date string to proper ISO format
        const date = new Date(user.enrollmentDate);
        if (!isNaN(date.getTime())) {
            user.enrollmentDate = date.toISOString();
            fixedCount++;
            console.log('Fixed user:', user.email, 'enrollment date:', user.enrollmentDate);
        }
    }
});

if (fixedCount > 0) {
    localStorage.setItem('fizflashcard_users', JSON.stringify(users));
    console.log(`✅ Fixed ${fixedCount} users in localStorage`);
} else {
    console.log('✅ No users needed fixing in localStorage');
}

// Fix current user
const currentUser = JSON.parse(localStorage.getItem('fizflashcard_current_user') || 'null');
if (currentUser && currentUser.enrollmentDate && currentUser.enrollmentDate.includes('T') === false) {
    const date = new Date(currentUser.enrollmentDate);
    if (!isNaN(date.getTime())) {
        currentUser.enrollmentDate = date.toISOString();
        localStorage.setItem('fizflashcard_current_user', JSON.stringify(currentUser));
        console.log('✅ Fixed current user enrollment date:', currentUser.enrollmentDate);
    }
}

// Update the account page display
if (window.updateUserInterface) {
    window.updateUserInterface();
}
if (window.updateAccountPage) {
    window.updateAccountPage();
}

console.log('=== ENROLLMENT DATE FIX COMPLETE ===');
console.log('Refresh the account page to see the properly formatted date!');
