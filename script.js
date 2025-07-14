// Configuration - Nutritionix API credentials
const API_CONFIG = {
    API_KEY: '61366c402a536a31c5e794174ca61fe1',
    APPLICATION_ID: '27665e1e',
    BASE_URL: 'https://trackapi.nutritionix.com/v2',
    SEARCH_URL: 'https://trackapi.nutritionix.com/v2/search/instant',
    NUTRIENTS_URL: 'https://trackapi.nutritionix.com/v2/natural/nutrients'
};

// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const loadingIndicator = document.getElementById('loadingIndicator');
const resultsContainer = document.getElementById('resultsContainer');
const noResults = document.getElementById('noResults');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    // Event listeners
    searchBtn.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });
    
    // Load some popular foods on initial load
    searchFood('apple');
});

// Remove OAuth token functions - not needed for Nutritionix API

// Perform search
async function performSearch() {
    const query = searchInput.value.trim();
    
    if (!query) {
        searchInput.focus();
        return;
    }
    
    showLoading();
    hideMessages();
    
    try {
        await searchFood(query);
    } catch (error) {
        console.error('Search error:', error);
        showError('Search failed. Please try again.');
    }
}

// Search for food items using Nutritionix API
async function searchFood(query) {
    try {
        const response = await fetch(`${API_CONFIG.SEARCH_URL}?query=${encodeURIComponent(query)}`, {
            headers: {
                'x-app-id': API_CONFIG.APPLICATION_ID,
                'x-app-key': API_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Combine branded and common foods
        const allFoods = [];
        
        if (data.common && data.common.length > 0) {
            allFoods.push(...data.common.slice(0, 10)); // Limit to 10 items
        }
        
        if (data.branded && data.branded.length > 0) {
            allFoods.push(...data.branded.slice(0, 10)); // Limit to 10 items
        }
        
        if (allFoods.length > 0) {
            displayResults(allFoods);
        } else {
            showNoResults();
        }
    } catch (error) {
        console.error('Error searching food:', error);
        showError('Failed to search food items. Please try again.');
    } finally {
        hideLoading();
    }
}

// Get detailed food nutrition information
async function getFoodNutrition(foodName) {
    try {
        const response = await fetch(API_CONFIG.NUTRIENTS_URL, {
            method: 'POST',
            headers: {
                'x-app-id': API_CONFIG.APPLICATION_ID,
                'x-app-key': API_CONFIG.API_KEY,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: foodName
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        return data.foods && data.foods.length > 0 ? data.foods[0] : null;
    } catch (error) {
        console.error('Error getting food nutrition:', error);
        return null;
    }
}

// Display search results
async function displayResults(foods) {
    resultsContainer.innerHTML = '';
    
    for (const food of foods) {
        const foodName = food.food_name || food.brand_name_item_name;
        const nutritionData = await getFoodNutrition(foodName);
        
        if (nutritionData) {
            const foodCard = createFoodCard(nutritionData);
            resultsContainer.appendChild(foodCard);
        } else {
            // Create a basic card with available information
            const basicCard = createBasicFoodCard(food);
            resultsContainer.appendChild(basicCard);
        }
    }
    
    if (resultsContainer.children.length === 0) {
        showNoResults();
    }
}

// Create food card element with Nutritionix data
function createFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-item';
    
    // Extract nutritional values from Nutritionix API response
    const calories = Math.round(food.nf_calories) || 'N/A';
    const carbs = Math.round(food.nf_total_carbohydrate) || 'N/A';
    const protein = Math.round(food.nf_protein) || 'N/A';
    const fat = Math.round(food.nf_total_fat) || 'N/A';
    const fiber = Math.round(food.nf_dietary_fiber) || 'N/A';
    const sugar = Math.round(food.nf_sugars) || 'N/A';
    const sodium = Math.round(food.nf_sodium) || 'N/A';
    
    // Get serving information
    const servingQty = food.serving_qty || 1;
    const servingUnit = food.serving_unit || 'serving';
    const servingWeight = food.serving_weight_grams ? `(${Math.round(food.serving_weight_grams)}g)` : '';
    
    card.innerHTML = `
        <h3>${food.food_name}</h3>
        <p class="serving-info">Per ${servingQty} ${servingUnit} ${servingWeight}</p>
        <div class="food-info">
            <div class="info-item">
                <div class="info-label">Calories</div>
                <div class="info-value">${calories}</div>
            </div>
            <div class="info-item carb-highlight">
                <div class="info-label">Carbs</div>
                <div class="info-value">${carbs}g</div>
            </div>
        </div>
        <div class="nutrition-details">
            <div class="nutrition-item">
                <strong>${protein}g</strong>
                <span>Protein</span>
            </div>
            <div class="nutrition-item">
                <strong>${fat}g</strong>
                <span>Fat</span>
            </div>
            <div class="nutrition-item">
                <strong>${fiber}g</strong>
                <span>Fiber</span>
            </div>
            <div class="nutrition-item">
                <strong>${sugar}g</strong>
                <span>Sugar</span>
            </div>
            <div class="nutrition-item">
                <strong>${sodium}mg</strong>
                <span>Sodium</span>
            </div>
        </div>
    `;
    
    return card;
}

// Create basic food card for items without detailed nutrition
function createBasicFoodCard(food) {
    const card = document.createElement('div');
    card.className = 'food-item';
    
    const foodName = food.food_name || food.brand_name_item_name;
    const brand = food.brand_name || '';
    
    card.innerHTML = `
        <h3>${foodName}</h3>
        ${brand ? `<p class="brand-name">${brand}</p>` : ''}
        <div class="food-info">
            <div class="info-item">
                <div class="info-label">Status</div>
                <div class="info-value">Loading...</div>
            </div>
            <div class="info-item carb-highlight">
                <div class="info-label">Carbs</div>
                <div class="info-value">-</div>
            </div>
        </div>
        <div class="nutrition-details">
            <div class="nutrition-item">
                <strong>-</strong>
                <span>Protein</span>
            </div>
            <div class="nutrition-item">
                <strong>-</strong>
                <span>Fat</span>
            </div>
            <div class="nutrition-item">
                <strong>-</strong>
                <span>Fiber</span>
            </div>
            <div class="nutrition-item">
                <strong>-</strong>
                <span>Sugar</span>
            </div>
            <div class="nutrition-item">
                <strong>-</strong>
                <span>Sodium</span>
            </div>
        </div>
    `;
    
    return card;
}

// Show loading indicator
function showLoading() {
    loadingIndicator.classList.remove('hidden');
    resultsContainer.innerHTML = '';
}

// Hide loading indicator
function hideLoading() {
    loadingIndicator.classList.add('hidden');
}

// Show no results message
function showNoResults() {
    noResults.classList.remove('hidden');
    errorMessage.classList.add('hidden');
}

// Show error message
function showError(message) {
    errorText.textContent = message;
    errorMessage.classList.remove('hidden');
    noResults.classList.add('hidden');
}

// Hide all messages
function hideMessages() {
    noResults.classList.add('hidden');
    errorMessage.classList.add('hidden');
}

// Handle API errors gracefully
function handleAPIError(error) {
    console.error('API Error:', error);
    
    if (error.message.includes('401')) {
        showError('Authentication failed. Please check your API credentials.');
    } else if (error.message.includes('429')) {
        showError('Rate limit exceeded. Please try again later.');
    } else if (error.message.includes('500')) {
        showError('Server error. Please try again later.');
    } else {
        showError('An unexpected error occurred. Please try again.');
    }
}

// Debounce function for search input
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Add real-time search with debouncing
const debouncedSearch = debounce(performSearch, 500);
searchInput.addEventListener('input', debouncedSearch);