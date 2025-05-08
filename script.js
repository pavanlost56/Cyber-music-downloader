// Particle animation for background
function createParticles() {
    const particlesContainer = document.getElementById('particles');
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        
        // Random position
        const posX = Math.random() * 100;
        const posY = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3 + 1;
        
        // Random color
        const colors = ['#ff2e6a', '#00f0ff', '#b967ff', '#05ffa1'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        
        // Random opacity
        const opacity = Math.random() * 0.5 + 0.3;
        
        // Random animation duration
        const duration = Math.random() * 20 + 10;
        
        // Apply styles
        particle.style.cssText = `
            position: absolute;
            top: ${posY}%;
            left: ${posX}%;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            opacity: ${opacity};
            box-shadow: 0 0 ${size * 2}px ${color};
            animation: float ${duration}s linear infinite;
        `;
        
        particlesContainer.appendChild(particle);
    }
    
    // Add keyframes for float animation
    const style = document.createElement('style');
    style.innerHTML = `
        @keyframes float {
            0% {
                transform: translateY(0) translateX(0);
            }
            25% {
                transform: translateY(-20px) translateX(10px);
            }
            50% {
                transform: translateY(0) translateX(20px);
            }
            75% {
                transform: translateY(20px) translateX(10px);
            }
            100% {
                transform: translateY(0) translateX(0);
            }
        }
    `;
    document.head.appendChild(style);
}

// Random glitch effect for title
function addRandomGlitchToTitle() {
    const title = document.querySelector('h1');
    setInterval(() => {
        // Random chance to trigger glitch
        if (Math.random() < 0.1) {
            title.style.animation = 'none';
            setTimeout(() => {
                title.style.animation = 'glitch 5s infinite';
            }, 10);
        }
    }, 3000);
}

// Form submission handler
function handleFormSubmit(event) {
    event.preventDefault();
    
    const url = document.getElementById('url').value;
    const format = document.querySelector('input[name="format"]:checked').value;
    const statusElement = document.getElementById('status');
    const loadingContainer = document.getElementById('loading');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingPercentage = document.querySelector('.loading-percentage');
    const downloadForm = document.getElementById('download-form');
    
    // Validate URL (simple validation for demo)
    if (!url.includes('youtube.com') && !url.includes('youtu.be')) {
        statusElement.textContent = 'ERROR: INVALID YOUTUBE URL DETECTED';
        statusElement.className = 'status-message error';
        return;
    }
    
    // Show loading state
    statusElement.textContent = 'INITIALIZING DOWNLOAD SEQUENCE...';
    statusElement.className = 'status-message success';
    
    // Show loading UI
    downloadForm.style.display = 'none';
    loadingContainer.classList.add('active');
    loadingProgress.style.width = '0%';
    loadingPercentage.textContent = '0%';
    
    // Set up progress tracking
    let progress = 0;
    const progressInterval = setInterval(() => {
        // Random increment between 1-5%
        const increment = Math.floor(Math.random() * 5) + 1;
        progress = Math.min(progress + increment, 99); // Cap at 99% until complete
        
        loadingProgress.style.width = `${progress}%`;
        loadingPercentage.textContent = `${progress}%`;
        
        // Update status messages at certain thresholds
        if (progress > 25 && progress < 30) {
            statusElement.textContent = `ANALYZING ${format.toUpperCase()} STREAMS...`;
        } else if (progress > 60 && progress < 65) {
            statusElement.textContent = `DECRYPTING ${format.toUpperCase()} DATA...`;
        } else if (progress > 85 && progress < 90) {
            statusElement.textContent = `FINALIZING ${format.toUpperCase()} EXTRACTION...`;
        }
    }, 300);
    
    // Make actual API call to the backend
    fetch('/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, format })
    })
    .then(response => response.json())
    .then(data => {
        clearInterval(progressInterval);
        
        // Complete the progress bar
        loadingProgress.style.width = '100%';
        loadingPercentage.textContent = '100%';
        
        if (data.success) {
            // Update status message
            statusElement.textContent = `DOWNLOAD COMPLETE: ${format.toUpperCase()} EXTRACTION SUCCESSFUL`;
            statusElement.className = 'status-message success';
            
            // Create download link
            setTimeout(() => {
                const downloadLink = document.createElement('a');
                downloadLink.className = 'download-btn';
                downloadLink.href = data.downloadUrl;
                downloadLink.innerHTML = '<span class="btn-text">DOWNLOAD FILE</span><span class="btn-glow"></span>';
                downloadLink.download = '';
                statusElement.parentNode.insertBefore(downloadLink, statusElement.nextSibling);
                
                // Add reset button
                const resetButton = document.createElement('button');
                resetButton.className = 'download-btn reset-btn';
                resetButton.innerHTML = '<span class="btn-text">NEW DOWNLOAD</span><span class="btn-glow"></span>';
                downloadLink.parentNode.insertBefore(resetButton, downloadLink.nextSibling);
                
                resetButton.addEventListener('click', () => {
                    // Reset the form
                    downloadForm.style.display = 'block';
                    loadingContainer.classList.remove('active');
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                    downloadLink.remove();
                    resetButton.remove();
                });
            }, 1500);
        } else {
            // Show error message
            statusElement.textContent = `ERROR: ${data.error || 'DOWNLOAD FAILED'}`;
            statusElement.className = 'status-message error';
            
            // Add reset button
            setTimeout(() => {
                const resetButton = document.createElement('button');
                resetButton.className = 'download-btn reset-btn';
                resetButton.innerHTML = '<span class="btn-text">TRY AGAIN</span><span class="btn-glow"></span>';
                statusElement.parentNode.insertBefore(resetButton, statusElement.nextSibling);
                
                resetButton.addEventListener('click', () => {
                    // Reset the form
                    downloadForm.style.display = 'block';
                    loadingContainer.classList.remove('active');
                    statusElement.textContent = '';
                    statusElement.className = 'status-message';
                    resetButton.remove();
                });
            }, 1500);
        }
    })
    .catch(error => {
        clearInterval(progressInterval);
        
        console.error('API call failed:', error);
        
        // Show error message
        statusElement.textContent = 'ERROR: SERVER CONNECTION FAILED';
        statusElement.className = 'status-message error';
        
        // Add reset button
        setTimeout(() => {
            const resetButton = document.createElement('button');
            resetButton.className = 'download-btn reset-btn';
            resetButton.innerHTML = '<span class="btn-text">TRY AGAIN</span><span class="btn-glow"></span>';
            statusElement.parentNode.insertBefore(resetButton, statusElement.nextSibling);
            
            resetButton.addEventListener('click', () => {
                // Reset the form
                downloadForm.style.display = 'block';
                loadingContainer.classList.remove('active');
                statusElement.textContent = '';
                statusElement.className = 'status-message';
                resetButton.remove();
            });
        }, 1500);
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Create particle effect
    createParticles();
    
    // Add random glitch effect to title
    addRandomGlitchToTitle();
    
    // Set up form submission
    const downloadForm = document.getElementById('download-form');
    downloadForm.addEventListener('submit', handleFormSubmit);
    
    // Add glitch effect on hover for the title
    const title = document.querySelector('h1');
    title.addEventListener('mouseover', () => {
        title.style.animation = 'none';
        setTimeout(() => {
            title.style.animation = 'glitch 5s infinite';
        }, 10);
    });
});