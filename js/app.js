 document.addEventListener("DOMContentLoaded", () => {
    
    // ==========================================
    // 1. GLOBAL ELEMENT SELECTIONS
    // ==========================================
    const navHome = document.getElementById("nav-home");
    const navCreate = document.getElementById("nav-create");
    const navProfile = document.getElementById("nav-profile");
    
    const viewHome = document.getElementById("view-home");
    const viewCreate = document.getElementById("view-create");
    const viewProfile = document.getElementById("view-profile");

    const heroLaunchBtn = document.getElementById("hero-launch-btn");
    const campaignForm = document.getElementById("campaign-creation-form");
    const campaignList = document.querySelector(".campaign-list");
    
    const profileWalletText = document.getElementById("profile-wallet-address");
    const profileBalanceText = document.getElementById("profile-balance");

    // ==========================================
    // 2. VIEW SWITCHING ROUTER ENGINE
    // ==========================================
    function switchView(targetView, activeNavButton) {
        // Hide all views
        document.querySelectorAll(".app-view").forEach(view => {
            view.classList.remove("active");
        });
        // Remove active highlights from all buttons
        document.querySelectorAll(".nav-item").forEach(btn => {
            btn.classList.remove("active");
        });

        // Show target view and highlight its button
        targetView.classList.add("active");
        activeNavButton.classList.add("active");
        
        // Auto-scroll back to top of the mobile frame
        document.querySelector(".app-shell").scrollTop = 0;
    }

    // Attach click events to nav tabs
    if (navHome) navHome.addEventListener("click", () => switchView(viewHome, navHome));
    if (navCreate) navCreate.addEventListener("click", () => switchView(viewCreate, navCreate));
    if (navProfile) navProfile.addEventListener("click", () => switchView(viewProfile, navProfile));

    // Hook up home banner button to switch views
    if (heroLaunchBtn) {
        heroLaunchBtn.addEventListener("click", () => {
            switchView(viewCreate, navCreate);
        });
    }

    // ==========================================
    // 3. INITIAL MOCK STATES
    // ==========================================
    if (profileWalletText && profileBalanceText) {
        profileWalletText.textContent = "0x71C...49a1"; 
        profileBalanceText.textContent = "45.50";
    }

    // ==========================================
    // 4. DYNAMIC FORM PROCESSING
    // ==========================================
    if (campaignForm && campaignList) {
        campaignForm.addEventListener("submit", (e) => {
            e.preventDefault(); 

            const newTitle = document.getElementById("form-title").value;
            const newDesc = document.getElementById("form-desc").value;
            const newGoal = document.getElementById("form-goal").value;

            // Generate clean card string
            const newCardHTML = `
                <div class="campaign-card">
                    <div class="card-meta">
                        <span class="category-badge">Community</span>
                        <span class="time-left">Just now</span>
                    </div>
                    <h3>${newTitle}</h3>
                    <p class="card-description">${newDesc}</p>
                    <div class="card-progress-section">
                        <div class="progress-labels">
                            <span class="amount-raised"><strong>0 cUSD</strong> raised</span>
                            <span class="goal-percentage">0%</span>
                        </div>
                        <div class="progress-track">
                        <div class="progress-fill" style="width: 0%;"></div>
                        </div>
                        <div class="progress-footer">
                            <span class="total-goal">Target: ${newGoal} cUSD</span>
                        </div>
                    </div>
                </div>
            `;

            // Push to home timeline feed
            campaignList.insertAdjacentHTML("afterbegin", newCardHTML);

            // Clean input layout fields
            campaignForm.reset();

            // NOW THIS WORKS: Smoothly routes view right back home
            switchView(viewHome, navHome);
        });
    }
});