 // Global variable to store the user's connected wallet address
let userWalletAddress = null;

// 1. Check if the app is running in a Web3/MiniPay environment
function checkWalletEnvironment() {
    const connectBtn = document.getElementById("connectWalletBtn");
    
    if (window.ethereum) {
        console.log("Web3 Environment detected! MiniPay provider is available.");
        // Listen for a click on the connect button
        if (connectBtn) {
            connectBtn.addEventListener("click", connectWallet);
        }
    } else {
        console.log("Standard browser detected. MiniPay provider not found.");
        if (connectBtn) {
            connectBtn.innerText = "MiniPay Required";
            connectBtn.style.opacity = "0.7";
        }
    }
}

// 2. Request account access from MiniPay/Celo wallet
async function connectWallet() {
    const connectBtn = document.getElementById("connectWalletBtn");
    
    try {
        // Request wallet addresses from the provider
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
            userWalletAddress = accounts[0];
            console.log("Connected wallet address:", userWalletAddress);
            
            // Shorten the address for the UI (e.g., 0x1234...abcd)
            const shortAddress = `${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
            
            // Update the button text to show they are logged in
            if (connectBtn) {
                connectBtn.innerText = shortAddress;
                connectBtn.classList.add("connected"); // Optional: add styles later if you want
            }
        }
    } catch (error) {
        console.error("User denied account access or error occurred:", error);
    }
}
 
 document.addEventListener("DOMContentLoaded", () => {
    checkWalletEnvironment()
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