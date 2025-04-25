// Form handling functionality for Groupe Dan Inc.

document.addEventListener('DOMContentLoaded', function() {
    // Get the API base URL (localhost in development, actual domain in production)
    const apiBaseUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
        ? `http://${window.location.hostname}:5000` 
        : 'https://groupe-dan-site.onrender.com'; // 
    
    // Contact Form
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate the form
            if (validateForm(contactForm)) {
                // Get form data
                const formData = {
                    name: contactForm.name.value,
                    email: contactForm.email.value,
                    subject: contactForm.subject.value,
                    message: contactForm.message.value
                };
                
                // Send the form data to the API
                sendFormData('https://groupe-dan-site.onrender.com/api/contact', formData, function() {
                    // Show success message
                    contactForm.style.display = 'none';
                    document.getElementById('formSuccess').style.display = 'block';
                    
                    // Reset form
                    contactForm.reset();
                });
            }
        });
    }
    
    // Quote Request Form
    const quoteForm = document.getElementById('quoteForm');
    if (quoteForm) {
        quoteForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Validate the form
            if (validateForm(quoteForm)) {
                // Get form data
                const formData = {
                    name: quoteForm.name.value,
                    email: quoteForm.email.value,
                    phone: quoteForm.phone.value,
                    companyName: quoteForm.companyName ? quoteForm.companyName.value : '',
                    serviceType: quoteForm.serviceType.value,
                    serviceDetails: quoteForm.serviceDetails.value
                };
                
                // Send the form data to the API
                sendFormData('https://groupe-dan-site.onrender.com/api/quotes', formData, function() {
                    // Show success message
                    quoteForm.style.display = 'none';
                    document.getElementById('quoteSuccess').style.display = 'block';
                    
                    // Reset form
                    quoteForm.reset();
                });
            }
        });
    }
    
// Appointment Form
const appointmentForm = document.getElementById('appointmentForm');
if (appointmentForm) {
    appointmentForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Validate the form
        if (validateForm(appointmentForm)) {
            // Get selected date and time
            const selectedDate = appointmentForm.appointmentDate.value;
            const selectedTime = appointmentForm.appointmentTime.value;
            
            // Create a Date object for the appointment start time
            const startDate = new Date(`${selectedDate}T${selectedTime}`);
            
            // Create a Date object for the appointment end time (1 hour after start)
            const endDate = new Date(startDate);
            endDate.setHours(endDate.getHours() + 1);
            
            // Get form data
            const formData = {
                name: appointmentForm.name.value,
                email: appointmentForm.email.value,
                phone: appointmentForm.phone.value,
                serviceType: appointmentForm.serviceType.value,
                date: startDate.toISOString(),
                endTime: endDate.toISOString(),
                description: appointmentForm.details ? appointmentForm.details.value : ''
            };
            
            // Send the form data to the API
            sendFormData('https://groupe-dan-site.onrender.com/api/appointments', formData, function() {
                // Show success message
                appointmentForm.style.display = 'none';
                document.getElementById('formSuccess').style.display = 'block';
                
                // Reset form
                appointmentForm.reset();
            });
        }
    });
}
    
    // Function to validate form
    function validateForm(form) {
        let isValid = true;
        
        // Clear previous error messages
        const errorMessages = form.querySelectorAll('.error-message');
        errorMessages.forEach(msg => msg.remove());
        
        // Check required fields
        const requiredFields = form.querySelectorAll('[required]');
        requiredFields.forEach(field => {
            field.classList.remove('error');
            
            if (!field.value.trim()) {
                isValid = false;
                field.classList.add('error');
                
                // Add error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                
                // Set appropriate message based on current language
                if (document.documentElement.className === 'fr') {
                    errorMsg.textContent = 'Ce champ est requis';
                } else {
                    errorMsg.textContent = 'This field is required';
                }
                
                field.parentNode.appendChild(errorMsg);
            }
        });
        
        // Validate email format if it exists
        const emailField = form.querySelector('input[type="email"]');
        if (emailField && emailField.value.trim()) {
            const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailPattern.test(emailField.value)) {
                isValid = false;
                emailField.classList.add('error');
                
                // Add error message
                const errorMsg = document.createElement('div');
                errorMsg.className = 'error-message';
                
                // Set appropriate message based on current language
                if (document.documentElement.className === 'fr') {
                    errorMsg.textContent = 'Veuillez entrer une adresse email valide';
                } else {
                    errorMsg.textContent = 'Please enter a valid email address';
                }
                
                emailField.parentNode.appendChild(errorMsg);
            }
        }
        
        // Add CSS for error styling
        if (!document.getElementById('formErrorStyles')) {
            const style = document.createElement('style');
            style.id = 'formErrorStyles';
            style.textContent = `
                .error {
                    border-color: var(--error-color) !important;
                }
                
                .error-message {
                    color: var(--error-color);
                    font-size: 0.85rem;
                    margin-top: 5px;
                }
            `;
            document.head.appendChild(style);
        }
        
        return isValid;
    }
    
    // Modified sendFormData function with full URL and better error handling
    function sendFormData(endpoint, data, callback) {
        // Create the full URL by combining the base URL with the endpoint
        const fullUrl = `${apiBaseUrl}${endpoint}`;
        
        console.log(`Sending data to ${fullUrl}:`, data);
        
        fetch(fullUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log('Response status:', response.status);
            return response.json().then(data => {
                if (!response.ok) {
                    throw new Error(data.message || `Server responded with ${response.status}`);
                }
                return data;
            });
        })
        .then(responseData => {
            console.log('Response data:', responseData);
            if (responseData.success) {
                callback();
            } else {
                alert(responseData.message || 'An error occurred. Please try again.');
            }
        })
        .catch(error => {
            console.error('Detailed fetch error:', error);
            alert(`Error: ${error.message}`);
        });
    }
});