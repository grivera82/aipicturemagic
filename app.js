/**
 * AI Picture Magic - Premium Application Logic
 * Handles image upload, API integration via Cloudflare Worker, and result display
 */

// ============================================
// CONFIGURATION - Update this after deploying your worker!
// ============================================
const WORKER_URL = 'https://ai-picture-magic.gabriel82.workers.dev';

// DOM Elements
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const previewContainer = document.getElementById('previewContainer');
const previewImage = document.getElementById('previewImage');
const removeImageBtn = document.getElementById('removeImage');
const promptInput = document.getElementById('promptInput');
const charCounter = document.getElementById('charCounter');
const suggestionBtns = document.querySelectorAll('.suggestion-btn');
const generateBtn = document.getElementById('generateBtn');
const progressSection = document.getElementById('progressSection');
const progressFill = document.getElementById('progressFill');
const progressStatus = document.getElementById('progressStatus');
const resultSection = document.getElementById('resultSection');
const originalResult = document.getElementById('originalResult');
const generatedImage = document.getElementById('generatedImage');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const tryAgainBtn = document.getElementById('tryAgainBtn');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const errorDismiss = document.getElementById('errorDismiss');

// State
let uploadedImageBase64 = null;
let generatedImageUrl = null;

// Initialize
document.addEventListener('DOMContentLoaded', init);

function init() {
    setupDropZone();
    setupPromptInput();
    setupPromptSuggestions();
    setupGenerateButton();
    setupResultActions();
    setupErrorDismiss();
    createParticles();

    // Check if worker URL is configured
    if (!WORKER_URL) {
        console.warn('⚠️ Worker URL not configured! Please deploy your Cloudflare Worker and update WORKER_URL in app.js');
    }
}

// Particle Effect
function createParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    for (let i = 0; i < 30; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        particle.style.cssText = `
            position: absolute;
            width: ${Math.random() * 4 + 2}px;
            height: ${Math.random() * 4 + 2}px;
            background: rgba(139, 92, 246, ${Math.random() * 0.3 + 0.1});
            border-radius: 50%;
            left: ${Math.random() * 100}%;
            top: ${Math.random() * 100}%;
            animation: particleFloat ${Math.random() * 20 + 10}s ease-in-out infinite;
            animation-delay: ${Math.random() * -20}s;
        `;
        container.appendChild(particle);
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes particleFloat {
            0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
            25% { transform: translate(50px, -50px) scale(1.2); opacity: 0.6; }
            50% { transform: translate(-30px, 30px) scale(0.8); opacity: 0.2; }
            75% { transform: translate(40px, 20px) scale(1.1); opacity: 0.5; }
        }
    `;
    document.head.appendChild(style);
}

// Drag & Drop Functionality
function setupDropZone() {
    dropZone.addEventListener('click', () => fileInput.click());

    const browseBtn = dropZone.querySelector('.browse-btn');
    if (browseBtn) {
        browseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            fileInput.click();
        });
    }

    fileInput.addEventListener('change', handleFileSelect);

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0 && files[0].type.startsWith('image/')) {
            processFile(files[0]);
        }
    });

    removeImageBtn.addEventListener('click', removeImage);
}

function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        processFile(file);
    }
}

function processFile(file) {
    if (file.size > 10 * 1024 * 1024) {
        showError('Image is too large. Please use an image under 10MB.');
        return;
    }

    const reader = new FileReader();

    reader.onload = (e) => {
        uploadedImageBase64 = e.target.result;
        previewImage.src = uploadedImageBase64;
        previewContainer.classList.remove('hidden');
        dropZone.classList.add('hidden');
        updateGenerateButton();
    };

    reader.onerror = () => {
        showError('Failed to read the image file. Please try again.');
    };

    reader.readAsDataURL(file);
}

function removeImage() {
    uploadedImageBase64 = null;
    previewImage.src = '';
    previewContainer.classList.add('hidden');
    dropZone.classList.remove('hidden');
    fileInput.value = '';
    updateGenerateButton();
}

// Prompt Input
function setupPromptInput() {
    promptInput.addEventListener('input', () => {
        updateCharCounter();
        updateGenerateButton();
    });
    updateCharCounter();
}

function updateCharCounter() {
    const count = promptInput.value.length;
    charCounter.textContent = `${count} character${count !== 1 ? 's' : ''}`;
}

// Prompt Suggestions
function setupPromptSuggestions() {
    suggestionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            promptInput.value = btn.dataset.prompt;
            promptInput.focus();
            updateCharCounter();
            updateGenerateButton();

            btn.style.transform = 'scale(0.95)';
            setTimeout(() => {
                btn.style.transform = '';
            }, 150);
        });
    });
}

// Generate Button
function setupGenerateButton() {
    generateBtn.addEventListener('click', generateImage);
}

function updateGenerateButton() {
    const hasImage = uploadedImageBase64 !== null;
    const hasPrompt = promptInput.value.trim().length > 0;
    const hasWorker = WORKER_URL.length > 0;

    generateBtn.disabled = !(hasImage && hasPrompt && hasWorker);

    // Show warning if worker not configured
    if (!hasWorker && hasImage && hasPrompt) {
        showError('Worker URL not configured. Please deploy your Cloudflare Worker and update WORKER_URL in app.js');
    }
}

// Image Generation via Cloudflare Worker
async function generateImage() {
    const prompt = promptInput.value.trim();

    if (!uploadedImageBase64 || !prompt) {
        showError('Please upload an image and enter a prompt.');
        return;
    }

    if (!WORKER_URL) {
        showError('Worker URL not configured. Please deploy your Cloudflare Worker first.');
        return;
    }

    setLoading(true);
    showProgress();
    hideError();
    resultSection.classList.add('hidden');

    try {
        updateProgress(10, 'Sending request to AI...');

        // Submit the request via worker
        const submitResponse = await fetch(`${WORKER_URL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                image_urls: [uploadedImageBase64],
                num_images: 1,
                output_format: 'png'
            })
        });

        if (!submitResponse.ok) {
            const errorData = await submitResponse.json().catch(() => ({}));
            throw new Error(errorData.error || `API Error: ${submitResponse.status}`);
        }

        const submitData = await submitResponse.json();
        const requestId = submitData.request_id;

        if (!requestId) {
            throw new Error('No request ID received from API');
        }

        updateProgress(30, 'Request queued. AI is processing...');

        // Poll for the result via worker
        const result = await pollForResult(requestId);

        updateProgress(100, 'Generation complete!');

        if (result.images && result.images.length > 0) {
            generatedImageUrl = result.images[0].url;
            await new Promise(resolve => setTimeout(resolve, 500));
            displayResult();
        } else {
            throw new Error('No image was generated');
        }

    } catch (error) {
        console.error('Generation error:', error);
        showError(error.message || 'Failed to generate image. Please try again.');
    } finally {
        setLoading(false);
        hideProgress();
    }
}

async function pollForResult(requestId, maxAttempts = 60) {
    const pollInterval = 2000;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        try {
            // Check status via worker
            const statusResponse = await fetch(`${WORKER_URL}/status/${requestId}`);

            if (!statusResponse.ok) {
                throw new Error(`Status check failed: ${statusResponse.status}`);
            }

            const statusData = await statusResponse.json();

            const progressPercent = Math.min(30 + (attempt / maxAttempts) * 60, 90);
            updateProgress(progressPercent, getProgressMessage(attempt));

            if (statusData.status === 'COMPLETED') {
                // Get result via worker
                const resultResponse = await fetch(`${WORKER_URL}/result/${requestId}`);

                if (!resultResponse.ok) {
                    throw new Error(`Result fetch failed: ${resultResponse.status}`);
                }

                return await resultResponse.json();
            } else if (statusData.status === 'FAILED') {
                throw new Error('Image generation failed on the server');
            }

            await new Promise(resolve => setTimeout(resolve, pollInterval));

        } catch (error) {
            if (attempt === maxAttempts - 1) {
                throw error;
            }
        }
    }

    throw new Error('Generation timed out. Please try again.');
}

function getProgressMessage(attempt) {
    const messages = [
        'AI is analyzing your image...',
        'Applying creative transformations...',
        'Adding magical touches...',
        'Refining the details...',
        'Almost there, finalizing...',
        'Just a few more moments...'
    ];
    return messages[Math.min(Math.floor(attempt / 5), messages.length - 1)];
}

function setLoading(loading) {
    const btnContent = generateBtn.querySelector('.btn-content');
    const btnLoader = generateBtn.querySelector('.btn-loader');

    if (loading) {
        generateBtn.disabled = true;
        btnContent.classList.add('hidden');
        btnLoader.classList.remove('hidden');
    } else {
        btnContent.classList.remove('hidden');
        btnLoader.classList.add('hidden');
        updateGenerateButton();
    }
}

function showProgress() {
    progressSection.classList.remove('hidden');
    progressFill.style.width = '0%';
}

function hideProgress() {
    progressSection.classList.add('hidden');
}

function updateProgress(percent, message) {
    progressFill.style.width = `${percent}%`;
    if (message) {
        progressStatus.textContent = message;
    }
}

// Result Display
function displayResult() {
    originalResult.src = uploadedImageBase64;
    generatedImage.src = generatedImageUrl;
    resultSection.classList.remove('hidden');

    setTimeout(() => {
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
}

function setupResultActions() {
    downloadBtn.addEventListener('click', downloadImage);

    shareBtn.addEventListener('click', async () => {
        if (!generatedImageUrl) return;

        try {
            await navigator.clipboard.writeText(generatedImageUrl);
            const originalText = shareBtn.querySelector('span:last-child').textContent;
            shareBtn.querySelector('span:last-child').textContent = 'Copied!';
            setTimeout(() => {
                shareBtn.querySelector('span:last-child').textContent = originalText;
            }, 2000);
        } catch (err) {
            showError('Failed to copy link to clipboard');
        }
    });

    tryAgainBtn.addEventListener('click', () => {
        resultSection.classList.add('hidden');
        promptInput.value = '';
        promptInput.focus();
        updateCharCounter();
        updateGenerateButton();
    });
}

async function downloadImage() {
    if (!generatedImageUrl) return;

    const originalText = downloadBtn.querySelector('span:last-child').textContent;
    downloadBtn.querySelector('span:last-child').textContent = 'Downloading...';

    try {
        const response = await fetch(generatedImageUrl);
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ai-picture-magic-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        downloadBtn.querySelector('span:last-child').textContent = 'Downloaded!';
        setTimeout(() => {
            downloadBtn.querySelector('span:last-child').textContent = originalText;
        }, 2000);
    } catch (error) {
        console.error('Download failed:', error);
        window.open(generatedImageUrl, '_blank');
        downloadBtn.querySelector('span:last-child').textContent = originalText;
    }
}

// Error Handling
function setupErrorDismiss() {
    if (errorDismiss) {
        errorDismiss.addEventListener('click', hideError);
    }
}

function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');

    setTimeout(() => {
        hideError();
    }, 10000);
}

function hideError() {
    errorMessage.classList.add('hidden');
}
