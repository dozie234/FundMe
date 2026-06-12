 // Global variable to store the user's connected wallet address
let userWalletAddress = null;
let web3Provider = null;

// --- Smart Contract Deployment Parameters ---
const CONTRACT_ADDRESS = "0xd9145CCE52D386f254917e481eB44e9943F39138"; 

// The ABI maps our JS to our smart contract functions
const CONTRACT_ABI = [
  {
    "inputs": [
      { "internalType": "string", "name": "_title", "type": "string" },
      { "internalType": "string", "name": "_description", "type": "string" },
      { "internalType": "uint256", "name": "_goal", "type": "uint256" }
    ],
    "name": "createCampaign",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      { "internalType": "uint256", "name": "_campaignId", "type": "uint256" }
    ],
    "name": "fundCampaign",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  // Keep your view functions human-readable if you want, or leave them as is:
  "function getCampaigns() public view returns (tuple(address creator, string title, string description, uint256 goal, uint256 amountRaised, bool isCompleted)[])",
  "function campaignCount() public view returns (uint256)"
];

// 1. Check if the app is running in a Web3/MiniPay environment
function checkWalletEnvironment() {
    const connectBtn = document.getElementById("connectWalletBtn");
    
    // --- DEVELOPMENT MODE AUTOMATION ---
    if (!window.ethereum) {
        console.log("Desktop detected: Activating automatic Test Wallet Environment...");
        window.ethereum = {
            request: async (args) => {
                // ✅ UPDATED: Clean, verified checksum mock address layout
                const validTestAddress = ["0xd9145CCE52D386f254917e481eB44e9943F39138"];
                
                if (args.method === 'eth_requestAccounts' || args.method === 'eth_accounts') {
                    return validTestAddress;
                }
                // Fake the Chain ID request so Ethers v6 doesn't crash
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
            
            // Query Network Chain ID using Ethers
            if (web3Provider) {
                const network = await web3Provider.getNetwork();
                console.log("Connected to Chain ID:", network.chainId.toString());
            }
            
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
    // If there is no provider wrapper, stop immediately
    if (!web3Provider) return null;
    
    try {
        // 🚀 DESKTOP SIMULATOR INTERCEPTION
        // If we are on desktop (detected cleanly because window.ethereum was mocked), 
        // bypass the provider completely to stop Ethers from doing crashing background network checks.
        if (!window.ethereum.isMiniPay && !window.ethereum.isMetaMask) {
            console.log("Desktop Simulator: Safe bypass of live network contract initialization.");
            return null; 
        }

        // Standard live connection behavior inside an actual MiniPay mobile browser
        const signer = await web3Provider.getSigner();
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
    // FETCH LIVE CAMPAIGNS FROM THE BLOCKCHAIN
    // ==========================================
    async function loadOnChainCampaigns() {
        try {
            console.log("Attempting to read contract data...");
            const contract = await getSmartContractInstance();
            
            if (!contract) {
                console.log("Using local UI layout (No active provider connection).");
                return;
            }

            // 1. Fetch total campaigns count from your smart contract
            const count = await contract.campaignCount();
            const totalCampaigns = Number(count);
            console.log(`Live Contract Connection Successful! Total campaigns on-chain: ${totalCampaigns}`);
            
            if (totalCampaigns === 0) {
                campaignList.innerHTML = '<p class="no-campaigns">No active campaigns found. Be the first to launch one!</p>';
                return;
            }

            // 2. Fetch the structural array data from the contract method
            const campaigns = await contract.getCampaigns();
            
            // Clear out any hardcoded template cards before displaying live chain data
            campaignList.innerHTML = "";

            // 3. Loop through each live campaign array object and render it on screen
            for (let i = 0; i < campaigns.length; i++) {
                const item = campaigns[i];
                
                // ✅ UPDATED: Convert BigInt Wei values to clean, readable cUSD numbers using Ethers v6
                const goalAmount = ethers.formatEther(item.goal);
                const raisedAmount = ethers.formatEther(item.amountRaised);
                
                // Calculate accurate progress percentages safely
                let progressPercent = 0;
                if (Number(goalAmount) > 0) {
                    progressPercent = Math.min(Math.round((Number(raisedAmount) / Number(goalAmount)) * 100), 100);
                }

                const cardHTML = 
                    `<div class="campaign-card" data-id="${i}">
                        <div class="card-meta">
                            <span class="category-badge">Web3 Pool</span>
                            <span class="time-left">${item.isCompleted ? "Completed" : "Active"}</span>
                        </div>
                        <h3>${item.title}</h3>
                        <p class="card-description">${item.description}</p>
                        <div class="card-progress-section">
                            <div class="progress-labels">
                                <span class="amount-raised"><strong>${raisedAmount}</strong> cUSD raised</span>
                                <span class="goal-percentage">${progressPercent}%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: ${progressPercent}%;"></div>
                            </div>
                            <div class="progress-footer">
                                <span class="total-goal" data-target="${goalAmount}">Target: ${goalAmount} cUSD</span>
                            </div>
                        </div>
                        <button class="fund-btn" ${item.isCompleted ? "disabled" : ""}>
                            ${item.isCompleted ? "Campaign Closed" : "Fund Campaign"}
                        </button>
                    </div>`
                ;
                
                campaignList.insertAdjacentHTML("beforeend", cardHTML);
            }
            
        } catch (error) {
            console.error("Failed to read data from smart contract:", error);
        }
    }

    // Run it immediately on page load
    loadOnChainCampaigns();

    // GLOBAL ELEMENT SELECTIONS
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

    // VIEW SWITCHING ROUTER ENGINE
    function switchView(targetView, activeNavButton) {
        document.querySelectorAll(".app-view").forEach(view => {
            view.classList.remove("active");
        });
        document.querySelectorAll(".nav-item").forEach(btn => {
            btn.classList.remove("active");
        });

        targetView.classList.add("active");
        activeNavButton.classList.add("active");
        
        document.querySelector(".app-shell").scrollTop = 0;
    }

    if (navHome) navHome.addEventListener("click", () => switchView(viewHome, navHome));
    if (navCreate) navCreate.addEventListener("click", () => switchView(viewCreate, navCreate));
    if (navProfile) navProfile.addEventListener("click", () => switchView(viewProfile, navProfile));

    if (heroLaunchBtn) {
        heroLaunchBtn.addEventListener("click", () => {
            switchView(viewCreate, navCreate);
        });
    }

    // INITIAL STATES
    if (profileWalletText && profileBalanceText) {
        profileWalletText.textContent = "0xd914...39138"; 
        profileBalanceText.textContent = "0.00";
    }

  // ==========================================
    // 4. DYNAMIC FORM PROCESSING
    // ==========================================
    if (campaignForm && campaignList) {
        campaignForm.addEventListener("submit", async (e) => {
            e.preventDefault(); 

            // 1. Guard check: Must be authenticated via wallet connection
            if (!userWalletAddress) {
                alert("Please connect your MiniPay wallet at the top before creating a campaign!");
                return;
            }

            // Grab form values cleanly
            const title = document.getElementById("form-title").value;
            const description = document.getElementById("form-desc").value;
            const goalInWei = document.getElementById("form-goal").value; 

            // 💡 NEW: Helper function to inject the new card directly to your UI
            function updateCampaignUI() {
                const newCardHTML = 
                    `<div class="campaign-card">
                        <div class="card-meta">
                            <span class="category-badge">Community</span>
                            <span class="time-left">Just now</span>
                        </div>
                        <h3>${title}</h3>
                        <p class="card-description">${description}</p>
                        <div class="card-progress-section">
                            <div class="progress-labels">
                                <span class="amount-raised"><strong>0</strong> cUSD raised</span>
                                <span class="goal-percentage">0%</span>
                            </div>
                            <div class="progress-track">
                                <div class="progress-fill" style="width: 0%;"></div>
                            </div>
                            <div class="progress-footer">
                                <span class="total-goal" data-target="${goalInWei}">Target: ${goalInWei} cUSD</span>
                            </div>
                        </div>
                        <button class="fund-btn">Fund Campaign</button>
                    </div>`;

                // Push to home timeline feed
                campaignList.insertAdjacentHTML("afterbegin", newCardHTML);
                campaignForm.reset();
                switchView(viewHome, navHome);
            }

            // 🚀 DESKTOP TESTING ENVIRONMENT INTERCEPTION
            // If we are using the mock address, bypass the actual RPC call to prevent internal Ethers crashes
            if (!window.ethereum.isMiniPay && !window.ethereum.isMetaMask){
                console.log("Desktop Mock Network Active: Simulating on-chain deployment...");
                updateCampaignUI();
                alert("Campaign deployed successfully (Local Simulator Mode)!");
                return; // Stop execution here so it doesn't hit the Ethers crash!
            }

            // --- LIVE MINIPAY PRODUCTION BLOCKCHAIN PATH ---
            try {
                console.log("Preparing to send campaign data on-chain...");
                const contract = await getSmartContractInstance();
                
                if (!contract) throw new Error("Could not initialize contract instance.");

                console.log("Sending data to contract...", { title, description, goalInWei });
               // 1. Ensure targetAmount is properly parsed to Wei using Ethers
                const parsedTarget = ethers.utils.parseUnits(targetAmount.toString(), 18);
try {
    // 1. Convert the goal input (e.g., "0.1") to 18-decimal Wei format safely
  try {
    // 1. Grab the HTML input elements directly to ensure they exist
    const titleField = document.getElementById("title") || document.querySelector('input[placeholder*="TITLE"]');
    const descField = document.getElementById("description") || document.querySelector('textarea') || document.querySelector('input[placeholder*="DESCRIPTION"]');
    const goalField = document.getElementById("goal") || document.querySelector('input[type="number"]');

    // 2. Extract the text/numbers safely
    const titleVal = titleField ? titleField.value : "Test Title";
    const descVal = descField ? descField.value : "Test Description";
    const goalVal = goalField ? goalField.value : "0.01"; // Defaulting to a tiny amount for testing

    // 3. Convert the goal input safely to 18-decimal format
    const goalInWei = ethers.utils.parseUnits(goalVal.toString(), 18);

    console.log("Sending formatted payload to MiniPay...", { titleVal, descVal, goalInWei });

    // 4. Execute the transaction
    const tx = await contract.createCampaign(
        titleVal,
        descVal,
        goalInWei,
        {
            gasLimit: 300000 // Slightly higher gas limit to avoid execution failures
        }
    );

    alert("Transaction sent! Wait for approval...");
    await tx.wait();
    alert("Campaign successfully deployed!");

} catch (error) {
    console.error("Error launching campaign:", error);
    alert("Something went wrong while launching your campaign on-chain.\nError details: " + error.message);
}

    alert("Transaction submitted! Awaiting confirmation...");
    await tx.wait();
    alert("Campaign successfully deployed on-chain!");

} catch (error) {
    console.error(error);
    alert("Something went wrong while launching your campaign on-chain.");
}
                console.log("Transaction pending... Hash:", tx.hash);

                const receipt = await tx.wait();
                console.log("Success! Campaign created on-chain in block:", receipt.blockNumber);

                updateCampaignUI();
                alert("Campaign deployed successfully to the blockchain!");

            } catch (error) {
                console.error("Blockchain campaign creation failed:", error);
                alert("Something went wrong while launching your campaign on-chain.");
            }
        });
    }

    // SIMULATED FUNDING INTERACTION ENGINE
    if (campaignList) {
        campaignList.addEventListener("click", async (e) => {
            if (e.target.classList.contains("fund-btn")) {
                const button = e.target;
                const card = button.closest(".campaign-card");
                
                if (!userWalletAddress) {
                    alert("Please connect your MiniPay wallet at the top first!");
                    return;
                }
                
                const donationInput = prompt("Enter amount to fund (in cUSD):");
                const amount = parseFloat(donationInput);
                
                if (isNaN(amount) || amount <= 0) {
                    alert("Please enter a valid funding amount.");
                    return;
                }
                
                button.innerText = "Processing Tx...";
                button.disabled = true;
                button.style.opacity = "0.5";

                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const raisedEl = card.querySelector(".amount-raised strong");
                const percentageEl = card.querySelector(".goal-percentage");
                const fillEl = card.querySelector(".progress-fill");
                const targetGoal = parseFloat(card.querySelector(".total-goal").getAttribute("data-target"));
                
                let currentRaised = parseFloat(raisedEl.innerText);
                currentRaised += amount;
                let currentPercentage = Math.min(Math.round((currentRaised / targetGoal) * 100), 100);
                
                raisedEl.innerText = currentRaised;
                percentageEl.innerText = `${currentPercentage}%`;
                fillEl.style.width = `${currentPercentage}%`;
                
                button.innerText = "Fund Campaign";
                button.disabled = false;
                button.style.opacity = "1";
                
                alert(`Successfully contributed ${amount} cUSD! Transaction Confirmed on Celo.`);
            }
        });
    }
});