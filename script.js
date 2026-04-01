const ITEM_HEIGHT = 58;
const MEAL_STORAGE_KEY = "savedFullMeals";
const RECIPE_CACHE_KEY = "mealRecipes";

import {marked} from "https://cdn.jsdelivr.net/npm/marked/lib/marked.esm.js";

const proteinOptions = [
    "Dunne worst", "Dikke worst", "Steak", "Varkenshaasje", "Gehaktballetjes",
    "Gevulde champignons", "Cordon bleu", "Schnitzel", "Rundsburger", "Spekburger",
    "Hamburger", "Scampi", "Garnaal", "Vispannetje", "Frituursnacks"
];

const carbOptions = [
    "Patat", "Puree", "Frieten", "Kroketten", "Pommekes", "Rijst", "Spaghetti", "Tagliatelle"
];

const veggieOptions = [
    "Broccoli", "Bloemkool", "Erwtjes", "Andijvie", "Tomaat & komkommer", "Gemengde groenten",
    "Selder", "Champignons", "Spinazie", "Rode kool", "Wortelmix", "Boontjes"
];

function buildLoopedItems(options, loops = 16) {
    const padded = [
        options[options.length - 2],
        options[options.length - 1],
        ...options,
        options[0],
        options[1]
    ];

    const items = [];
    for (let i = 0; i < loops; i++) {
        items.push(...padded);
    }
    return items;
}

function renderWheel(listEl, options) {
    const items = buildLoopedItems(options);
    listEl.innerHTML = items.map(item => `<li class="wheel-item">${item}</li>`).join("");
    listEl.dataset.totalItems = items.length;
    listEl.dataset.optionCount = options.length;
    listEl.style.transform = "translateY(0px)";
}

function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
}

function chooseRandomIndex(options) {
    return Math.floor(Math.random() * options.length);
}

function animateWheel(wheel, targetIndex, duration, onDone) {
    const optionCount = wheel.options.length;
    const baseLoops = Math.floor(Math.random() * 4) + 10;
    const finalIndex = baseLoops * (optionCount + 4) + targetIndex + 2;
    const startY = 0;
    const endY = -finalIndex * ITEM_HEIGHT;
    const startTime = performance.now();

    wheel.status.textContent = `${wheel.label[0].toUpperCase() + wheel.label.slice(1)} draait...`;
    wheel.list.style.transition = "none";

    function frame(now) {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = easeOutCubic(progress);
        const currentY = startY + (endY - startY) * eased;
        wheel.list.style.transform = `translateY(${currentY}px)`;

        if (progress < 1) {
            requestAnimationFrame(frame);
        } else {
            wheel.result.textContent = wheel.options[targetIndex];
            wheel.status.textContent = `Gestopt op ${wheel.options[targetIndex]}`;
            onDone();
        }
    }

    requestAnimationFrame(frame);
}

function initRoulettePage() {
    const wheels = {
        protein: {
            options: proteinOptions,
            list: document.getElementById("proteinWheel"),
            status: document.getElementById("proteinStatus"),
            result: document.getElementById("proteinResult"),
            label: "proteïne"
        },
        carb: {
            options: carbOptions,
            list: document.getElementById("carbWheel"),
            status: document.getElementById("carbStatus"),
            result: document.getElementById("carbResult"),
            label: "koolhydraat"
        },
        veggie: {
            options: veggieOptions,
            list: document.getElementById("veggieWheel"),
            status: document.getElementById("veggieStatus"),
            result: document.getElementById("veggieResult"),
            label: "groente"
        }
    };

    Object.values(wheels).forEach(wheel => renderWheel(wheel.list, wheel.options));

    const spinButton = document.getElementById("spinButton");
    const resetButton = document.getElementById("resetButton");
    const finalMeal = document.getElementById("finalMeal");

    let isSpinning = false;

    function updateFinalMeal() {
        const protein = wheels.protein.result.textContent;
        const carb = wheels.carb.result.textContent;
        const veggie = wheels.veggie.result.textContent;

        if ([protein, carb, veggie].every(value => value && value !== "-")) {
            finalMeal.textContent = `Resultaat: ${protein} met ${carb} en ${veggie}. Geen excuses meer, dit is blijkbaar het avondeten.`;
        }
    }

    function resetApp() {
        if (isSpinning) return;

        Object.values(wheels).forEach(wheel => {
            renderWheel(wheel.list, wheel.options);
            wheel.result.textContent = "-";
        });

        wheels.protein.status.textContent = "Klaar om te draaien";
        wheels.carb.status.textContent = "Wacht op chaos";
        wheels.veggie.status.textContent = "Nog volledig besluiteloos";
        finalMeal.textContent = "Je maaltijd verschijnt hier zodra de drie wielen uitgespeeld zijn.";
    }

    function spinAll() {
        if (isSpinning) return;
        isSpinning = true;
        spinButton.disabled = true;

        finalMeal.textContent = "De wielen razen. Je lot ligt in handen van een stel divs en JavaScript.";

        Object.values(wheels).forEach(wheel => {
            wheel.result.textContent = "-";
        });

        const proteinIndex = chooseRandomIndex(wheels.protein.options);
        const carbIndex = chooseRandomIndex(wheels.carb.options);
        const veggieIndex = chooseRandomIndex(wheels.veggie.options);

        animateWheel(wheels.protein, proteinIndex, 2400, () => {
            animateWheel(wheels.carb, carbIndex, 3300, () => {
                animateWheel(wheels.veggie, veggieIndex, 4200, () => {
                    isSpinning = false;
                    spinButton.disabled = false;
                    updateFinalMeal();
                });
            });
        });
    }

    spinButton.addEventListener("click", spinAll);
    resetButton.addEventListener("click", resetApp);
}

function loadMeals() {
    try {
        const stored = JSON.parse(localStorage.getItem(MEAL_STORAGE_KEY));
        return Array.isArray(stored) ? stored : [];
    } catch {
        return [];
    }
}

function saveMeals(meals) {
    localStorage.setItem(MEAL_STORAGE_KEY, JSON.stringify(meals));
}

function normalizeMeal(value) {
    return value.trim().replace(/\s+/g, " ");
}

function shuffleArray(array) {
    const copy = [...array];

    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }

    return copy;
}

function loadRecipeCache() {
    try {
        const stored = JSON.parse(localStorage.getItem(RECIPE_CACHE_KEY));
        return stored && typeof stored === "object" ? stored : {};
    } catch {
        return {};
    }
}

function saveRecipeCache(cache) {
    localStorage.setItem(RECIPE_CACHE_KEY, JSON.stringify(cache));
}

function initPlannerPage() {
    const mealInput = document.getElementById("mealInput");
    const addMealButton = document.getElementById("addMealButton");
    const mealList = document.getElementById("mealList");
    const emptyMealState = document.getElementById("emptyMealState");
    const mealCount = document.getElementById("mealCount");
    const mealAmount = document.getElementById("mealAmount");
    const generateMealsButton = document.getElementById("generateMealsButton");
    const generatedMeals = document.getElementById("generatedMeals");
    const plannerError = document.getElementById("plannerError");

    let meals = loadMeals();

    function renderMeals() {
        mealList.innerHTML = "";

        mealCount.textContent = `${meals.length} ${meals.length === 1 ? "maaltijd" : "maaltijden"}`;
        emptyMealState.style.display = meals.length ? "none" : "block";

        meals.forEach((meal, index) => {
            const li = document.createElement("li");
            li.className = "meal-item";

            const span = document.createElement("span");
            span.className = "meal-item-text";
            span.textContent = meal;

            const removeButton = document.createElement("button");
            removeButton.className = "remove-button";
            removeButton.textContent = "Verwijderen";
            removeButton.addEventListener("click", () => {
                const removedMeal = meals[index];

                // Remove from meals
                meals.splice(index, 1);
                saveMeals(meals);

                // 🧹 Remove from recipe cache
                const cache = loadRecipeCache();
                delete cache[removedMeal];
                saveRecipeCache(cache);

                renderMeals();
            });

            li.appendChild(span);
            li.appendChild(removeButton);
            mealList.appendChild(li);
        });
    }

    function addMeal() {
        const value = normalizeMeal(mealInput.value);
        plannerError.textContent = "";

        if (!value) {
            plannerError.textContent = "Vul eerst een maaltijd in.";
            return;
        }

        const exists = meals.some(meal => meal.toLowerCase() === value.toLowerCase());
        if (exists) {
            plannerError.textContent = "Deze maaltijd staat al in de lijst.";
            return;
        }

        meals.push(value);
        saveMeals(meals);
        renderMeals();
        mealInput.value = "";
        mealInput.focus();
    }

    function generateMeals() {
        plannerError.textContent = "";
        generatedMeals.innerHTML = "";

        const requestedAmount = Number.parseInt(mealAmount.value, 10);

        if (!Number.isInteger(requestedAmount) || requestedAmount < 1) {
            plannerError.textContent = "Kies een geldig aantal maaltijden van minstens 1.";
            return;
        }

        if (meals.length < requestedAmount) {
            plannerError.textContent = `Je hebt maar ${meals.length} opgeslagen ${meals.length === 1 ? "maaltijd" : "maaltijden"}. Voeg er minstens ${requestedAmount} toe.`;
            return;
        }

        let selectedMeals = shuffleArray(meals).slice(0, requestedAmount);

        function renderGeneratedMeals() {
            generatedMeals.innerHTML = "";

            selectedMeals.forEach((meal, index) => {
                const li = document.createElement("li");
                li.style.display = "flex";
                li.style.flexDirection = "column";
                li.style.alignItems = "stretch";
                li.style.gap = "10px";

                const span = document.createElement("span");
                span.textContent = meal;

                const recipeBtn = document.createElement("button");
                recipeBtn.textContent = "🍳 Recept";
                recipeBtn.className = "secondary";

                const rerollBtn = document.createElement("button");
                rerollBtn.textContent = "↻";
                rerollBtn.className = "secondary";
                rerollBtn.style.padding = "8px 12px";

                recipeBtn.addEventListener("click", async () => {
                    let recipeBox = li.querySelector(".recipe-box");
                    const cache = loadRecipeCache();

                    // ✅ If recipe already exists in DOM → do nothing
                    if (recipeBox) return;

                    // ✅ If recipe is cached → use it instantly
                    if (cache[meal]) {
                        renderRecipe(cache[meal]);
                        return;
                    }

                    recipeBtn.disabled = true;
                    recipeBtn.textContent = "Laden...";

                    try {

                        const res = await fetch("/api/recipe", {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({meal})
                        });

                        const data = await res.json();

                        if (!res.ok) {
                            throw new Error(data.error || "Server error");
                        }

                        // 💾 Save to cache
                        cache[meal] = data.recipe;
                        saveRecipeCache(cache);

                        renderRecipe(data.recipe);

                    } catch (err) {
                        alert(err.message || "Kon geen recept ophalen.");
                    }

                    recipeBtn.disabled = false;
                    recipeBtn.textContent = "🍳 Recept";

                    function renderRecipe(recipeText) {
                        recipeBox = document.createElement("div");
                        recipeBox.className = "recipe-box";

                        const toggleRow = document.createElement("div");
                        toggleRow.style.display = "flex";
                        toggleRow.style.justifyContent = "flex-end";
                        toggleRow.style.marginBottom = "6px";

                        const toggleBtn = document.createElement("button");
                        toggleBtn.textContent = "Verbergen";
                        toggleBtn.className = "secondary";

                        const content = document.createElement("div");
                        content.className = "recipe-content";
                        content.innerHTML = marked.parse(recipeText);

                        toggleBtn.addEventListener("click", () => {
                            const isHidden = content.classList.toggle("hidden");
                            toggleBtn.textContent = isHidden ? "Toon recept" : "Verbergen";
                        });

                        toggleRow.appendChild(toggleBtn);
                        recipeBox.appendChild(toggleRow);
                        recipeBox.appendChild(content);

                        li.appendChild(recipeBox);
                    }
                });
                rerollBtn.addEventListener("click", () => {
                    // meals that are not already selected (except current one)
                    const available = meals.filter(m => !selectedMeals.includes(m) || m === meal);

                    if (available.length <= 1) return;

                    let newMeal;
                    do {
                        newMeal = available[Math.floor(Math.random() * available.length)];
                    } while (newMeal === meal);

                    selectedMeals[index] = newMeal;
                    renderGeneratedMeals();
                });

                const topRow = document.createElement("div");
                topRow.style.display = "flex";
                topRow.style.justifyContent = "space-between";
                topRow.style.alignItems = "center";
                topRow.style.gap = "10px";

                const buttonGroup = document.createElement("div");
                buttonGroup.style.display = "flex";
                buttonGroup.style.gap = "8px";

                buttonGroup.appendChild(rerollBtn);
                buttonGroup.appendChild(recipeBtn);

                topRow.appendChild(span);
                topRow.appendChild(buttonGroup);

                li.appendChild(topRow);
                generatedMeals.appendChild(li);
            });
        }

        renderGeneratedMeals();
    }

    addMealButton.addEventListener("click", addMeal);

    mealInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            addMeal();
        }
    });

    generateMealsButton.addEventListener("click", generateMeals);

    renderMeals();
}

document.addEventListener("DOMContentLoaded", () => {
    const page = document.body.dataset.page;

    if (page === "roulette") {
        initRoulettePage();
    }

    if (page === "planner") {
        initPlannerPage();
    }
});