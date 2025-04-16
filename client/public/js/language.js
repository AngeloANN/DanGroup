// Language switching functionality for Groupe Dan Inc.

document.addEventListener('DOMContentLoaded', function() {
    // Set default language based on browser preference or default to French
    const userLang = navigator.language || navigator.userLanguage;
    let defaultLang = 'fr'; // Default is French for Quebec compliance
    
    if (userLang.includes('en')) {
        defaultLang = 'en';
    }
    
    // Set initial language
    setLanguage(defaultLang);
    
    // Set active language button
    const langButtons = document.querySelectorAll('.language-toggle button');
    langButtons.forEach(button => {
        if (button.dataset.lang === defaultLang) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
        
        // Add event listeners to language buttons
        button.addEventListener('click', function() {
            const lang = this.dataset.lang;
            setLanguage(lang);
            
            // Update active button
            langButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Function to set language
    function setLanguage(lang) {
        document.documentElement.className = lang;
        
        // Store language preference in local storage
        localStorage.setItem('groupeDanLang', lang);
    }
    
    // Check for stored language preference
    const storedLang = localStorage.getItem('groupeDanLang');
    if (storedLang) {
        setLanguage(storedLang);
        
        // Update active button
        langButtons.forEach(button => {
            if (button.dataset.lang === storedLang) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
    }
});