// API Configuration
const API_CONFIG = {
    nutritionix: {
        apiKey: '61366c402a536a31c5e794174ca61fe1',
        appId: '27665e1e',
        baseUrl: 'https://trackapi.nutritionix.com/v2'
    }
};

// Application State
let foodItems = [];
let totalCarbs = 0;
let totalCalories = 0;

// DOM Elements
const searchInput = document.getElementById('foodSearch');
const searchBtn = document.getElementById('searchBtn');
const loadingElement = document.getElementById('loading');
const resultsSection = document.getElementById('resultsSection');
const foodItemsContainer = document.getElementById('foodItems');
const totalCarbsElement = document.getElementById('totalCarbs');
const totalCaloriesElement = document.getElementById('totalCalories');
const clearBtn = document.getElementById('clearBtn');
const exampleBtns = document.querySelectorAll('.example-btn');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    setupEventListeners();
    loadFromStorage();
});

// Setup Event Listeners
function setupEventListeners() {
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleSearch();
        }
    });
    
    clearBtn.addEventListener('click', clearAll);
    
    // Example button listeners
    exampleBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const foodText = this.dataset.food;
            searchInput.value = foodText;
            handleSearch();
        });
    });
}

// Handle Search
async function handleSearch() {
    const query = searchInput.value.trim();
    if (!query) {
        showError('Please enter a food item');
        return;
    }
    
    showLoading(true);
    
    try {
        const nutritionData = await getNutritionData(query);
        if (nutritionData && nutritionData.foods) {
            addFoodItems(nutritionData.foods);
            searchInput.value = '';
            updateTotals();
            showResults();
        } else {
            showError('No nutrition data found for this food item');
        }
    } catch (error) {
        console.error('Error fetching nutrition data:', error);
        showError('Unable to fetch nutrition data. Please try again.');
    } finally {
        showLoading(false);
    }
}

// Get Nutrition Data from Nutritionix API
async function getNutritionData(query) {
    try {
        const response = await fetch(${API_CONFIG.nutritionix.baseUrl}/natural/nutrients, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-app-id': API_CONFIG.nutritionix.appId,
                'x-app-key': API_CONFIG.nutritionix.apiKey
            },
            body: JSON.stringify({
                query: query
            })
        });
        
        if (!response.ok) {
            throw new Error(HTTP error! status: ${response.status});
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Add Food Items to the list
function addFoodItems(foods) {
    foods.forEach(food => {
        const foodItem = {
            id: Date.now() + Math.random(),
            name: food.food_name,
            quantity: food.serving_qty,
            unit: food.serving_unit,
            calories: Math.round(food.nf_calories || 0),
            carbs: Math.round(food.nf_total_carbohydrate || 0),
            protein: Math.round(food.nf_protein || 0),
            fat: Math.round(food.nf_total_fat || 0),
            fiber: Math.round(food.nf_dietary_fiber || 0),
            sugar: Math.round(food.nf_sugars || 0),
            sodium: Math.round(food.nf_sodium || 0),
            cholesterol: Math.round(food.nf_cholesterol || 0),
            magnesium: Math.round(food.nf_magnesium || 0),
            calcium: Math.round(food.nf_calcium || 0)
        };
        
        foodItems.push(foodItem);
    });
    
    renderFoodItems();
    saveToStorage();
}

// Render Food Items
function renderFoodItems() {
    foodItemsContainer.innerHTML = '';
    
    foodItems.forEach(item => {
        const foodItemElement = createFoodItemElement(item);
        foodItemsContainer.appendChild(foodItemElement);
    });
}

// Create Food Item Element
function createFoodItemElement(item) {
    const div = document.createElement('div');
    div.className = 'food-item';
    div.innerHTML = `
        <div class="food-item-header">
            <span class="food-name">${item.quantity} ${item.unit} ${item.name}</span>
            <button class="remove-btn" onclick="removeFood(${item.id})">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <div class="nutrition-grid">
            <div class="nutrition-item">
                <h4>Carbs</h4>
                <span>${item.carbs}g</span>
            </div>
            <div class="nutrition-item">
                <h4>Calories</h4>
                <span>${item.calories}</span>
            </div>
            <div class="nutrition-item">
                <h4>Protein</h4>
                <span>${item.protein}g</span>
            </div>
            <div class="nutrition-item">
                <h4>Fat</h4>
                <span>${item.fat}g</span>
            </div>
            <div class="nutrition-item">
                <h4>Fiber</h4>
                <span>${item.fiber}g</span>
            </div>
            <div class="nutrition-item">
                <h4>Sugar</h4>
                <span>${item.sugar}g</span>
            </div>
        </div>
    `;
    return div;
}

// Remove Food Item
function removeFood(id) {
    foodItems = foodItems.filter(item => item.id !== id);
    renderFoodItems();
    updateTotals();
    saveToStorage();
    
    if (foodItems.length === 0) {
        hideResults();
    }
}

// Update Totals
function updateTotals() {
    totalCarbs = foodItems.reduce((sum, item) => sum + item.carbs, 0);
    totalCalories = foodItems.reduce((sum, item) => sum + item.calories, 0);
    
    totalCarbsElement.textContent = ${totalCarbs}g;
    totalCaloriesElement.textContent = totalCalories;
}

// Clear All Items
function clearAll() {
    foodItems = [];
    renderFoodItems();
    updateTotals();
    hideResults();
    saveToStorage();
}

// Show/Hide Loading
function showLoading(show) {
    loadingElement.classList.toggle('hidden', !show);
}

// Show Results
function showResults() {
    resultsSection.classList.add('show');
}

// Hide Results
function hideResults() {
    resultsSection.classList.remove('show');
}

// Show Error Message
function showError(message) {
    // Create a temporary error element
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #ff4757;
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    errorDiv.textContent = message;
    
    document.body.appendChild(errorDiv);
    
    // Remove after 3 seconds
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Storage Functions
function saveToStorage() {
    const data = {
        foodItems: foodItems,
        totalCarbs: totalCarbs,
        totalCalories: totalCalories
    };
    
    // Since we can't use localStorage in Claude.ai, we'll store in memory
    window.carbCounterData = data;
}

function loadFromStorage() {
    // Since we can't use localStorage in Claude.ai, we'll load from memory
    const data = window.carbCounterData;
    if (data) {
        foodItems = data.foodItems || [];
        totalCarbs = data.totalCarbs || 0;
        totalCalories = data.totalCalories || 0;
        
        if (foodItems.length > 0) {
            renderFoodItems();
            updateTotals();
            showResults();
        }
    }
}

// Add CSS animation for error messages
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .error-message {
        animation: slideIn 0.3s ease;
    }
`;
document.head.appendChild(style);