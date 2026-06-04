 // Global variable to store the user's connected wallet address
let userWalletAddress = null;
let web3Provider = null;

// --- NEW: Smart Contract Deployment Parameters ---
// Placeholders for when we deploy the contract to the Celo Alfajores Testnet
const CONTRACT_ADDRESS = "0x0000000000000000000000000000000000000000"; 

// The ABI maps our JS to our smart contract functions
const CONTRACT_ABI = [
    "function fundCampaign(uint256 campaignId) public payable",
    "function createCampaign(string title, string description, uint256 goal) public",
    "function getCampaigns() public view returns (tuple(address creator, string title, string description, uint256 goal, uint256 amountRaised)[])"
];
//

// 1. Check if the app is running in a Web3/MiniPay environment
function checkWalletEnvironment() {
    const connectBtn = document.getElementById("connectWalletBtn");
    
    // --- DEVELOPMENT MODE AUTOMATION ---
    if (!window.ethereum) {
        console.log("Desktop detected: Activating automatic Test Wallet Environment...");
        window.ethereum = {
            request: async (args) => {
                if (args.method === 'eth_requestAccounts') {
                    return ["0x71C249a123456789abcdef123456789abcdef123"];
                }
                // ✅ ADDED: Fake the Chain ID request so Ethers v6 doesn't crash
                if (args.method === 'eth_chainId') {
                    return "0xaf43"; // Hex for 44787 (Celo Alfajores Testnet)
                }
                return null;
            }
        };
    }
    // ------------------------------------

    if (window.ethereum) {
        console.log("Web3 Environment detected! MiniPay provider is available.");
        
        // Initialize the Ethers wrapper around the provider object
        web3Provider = new ethers.BrowserProvider(window.ethereum);
        
        // Restore button to active state for testing
        if (connectBtn) {
            connectBtn.innerText = "Connect Wallet";
            connectBtn.style.opacity = "1";
            connectBtn.addEventListener("click", connectWallet);
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
            
            // --- NEW: Query Network Chain ID using Ethers ---
            if (web3Provider) {
                const network = await web3Provider.getNetwork();
                // Celo Mainnet Chain ID is 42220, Alfajores Testnet is 44787
                console.log("Connected to Chain ID:", network.chainId.toString());
            }
            // ------------------------------------------------
            
            // Shorten the address for the UI (e.g., 0x1234...abcd)
            const shortAddress = `${userWalletAddress.substring(0, 6)}...${userWalletAddress.substring(userWalletAddress.length - 4)}`;
            
            // Update the button text to show they are logged in
            if (connectBtn) {
                connectBtn.innerText = shortAddress;
                connectBtn.classList.add("connected"); 
            }
        }
    } catch (error) {
        console.error("User denied account access or error occurred:", error);
    }
}

// 3. Initialize the Smart Contract Instance for Read/Write Actions
async function getSmartContractInstance() {
    if (!web3Provider) return null;
    
    try {
        // Get the signer (the user's wallet that signs transactions)
        const signer = await web3Provider.getSigner();
        
        // Create a new Ethers contract instance linked to the network
        const fundMeContract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
        return fundMeContract;
    } catch (error) {
        console.error("Failed to initialize smart contract instance:", error);
        return null;
    }
}
 
document.addEventListener("DOMContentLoaded", () => {
    // Initialize verification checks instantly
    checkWalletEnvironment();

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
    const campaignList = document.querySelector(".campaign-list"); // Target class
    
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

            // Generate clean card string with precise data handling parameters
            const newCardHTML = 
                `<div class="campaign-card">
                    <div class="card-meta">
                        <span class="category-badge">Community</span>
                        <span class="time-left">Just now</span>
                    </div>
                    <h3>${newTitle}</h3>
                    <p class="card-description">${newDesc}</p>
                    <div class="card-progress-section">
                        <div class="progress-labels">
                            <span class="amount-raised"><strong>0</strong> cUSD raised</span>
                            <span class="goal-percentage">0%</span>
                        </div>
                        <div class="progress-track">
                            <div class="progress-fill" style="width: 0%;"></div>
                        </div>
                        <div class="progress-footer">
                            <span class="total-goal" data-target=${newGoal}">Target: ${newGoal} cUSD</span>
                        </div>
                    </div>
                    <button class="fund-btn">Fund Campaign</button>
                </div>`
            ;

            // Push to home timeline feed
            campaignList.insertAdjacentHTML("afterbegin", newCardHTML);

            // Clean input layout fields
            campaignForm.reset();

            // Smoothly routes view right back home
            switchView(viewHome, navHome);
        });
    }

    // ==========================================
    // 5. PHASE 4: SIMULATED FUNDING INTERACTION ENGINE
    // ==========================================
    if (campaignList) {
        campaignList.addEventListener("click", async (e) => {
            if (e.target.classList.contains("fund-btn")) {
                const button = e.target;
                const card = button.closest(".campaign-card");
                
                // 1. Guard check: Must be authenticated via MiniPay connection
                if (!userWalletAddress) {
                    alert("Please connect your MiniPay wallet at the top first!");
                    return;
                }
                
                // 2. Input Prompt
                const donationInput = prompt("Enter amount to fund (in cUSD):");
                const amount = parseFloat(donationInput);
                
                if (isNaN(amount) || amount <= 0) {
                    alert("Please enter a valid funding amount.");
                    return;
                }
                
                // 3. Process UI Transition State
                button.innerText = "Processing Tx...";
                button.disabled = true;
                button.style.opacity = "0.5";
 // Network consensus delay delay mimic (2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // 4. Extract parameters and metrics
                const raisedEl = card.querySelector(".amount-raised strong");
                const percentageEl = card.querySelector(".goal-percentage");
                const fillEl = card.querySelector(".progress-fill");
                const targetGoal = parseFloat(card.querySelector(".total-goal").getAttribute("data-target"));
                
                let currentRaised = parseFloat(raisedEl.innerText);
                
                // Recalculate metrics
                currentRaised += amount;
                let currentPercentage = Math.min(Math.round((currentRaised / targetGoal) * 100), 100);
                
                // 5. Apply updates directly into DOM layout
                raisedEl.innerText = currentRaised;
                percentageEl.innerText = `${currentPercentage}%`;
                fillEl.style.width = `${currentPercentage}%`;
                
                // Reset interaction states
                button.innerText = "Fund Campaign";
                button.disabled = false;
                button.style.opacity = "1";
                
                alert(`Successfully contributed ${amount} cUSD! Transaction Confirmed on Celo.`);
            }
        });
    }
});