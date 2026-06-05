 // SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FundMe {
    // We will define our custom structural types and state storage here next
    // Define the blueprint for a Campaign object
    struct Campaign {
        address creator;        // Wallet address of the person who launched it
        string title;          // Campaign heading
        string description;    // Campaign narrative details
        uint256 goal;          // Target fundraising goal in wei/cUSD units
        uint256 amountRaised;  // Total current funds contributed
        bool isCompleted;      // Flag tracking if goal was met/withdrawn
    }

    // State Variables (Permanently stored on the blockchain ledger)
    uint256 public campaignCount = 0;
    
    // Maps a unique ID (uint256) to its respective Campaign structural data object
    mapping(uint256 => Campaign) public campaigns;
}

// Function to create a new crowdfunding campaign on-chain
    function createCampaign(
        string memory _title, 
        string memory _description, 
        uint256 _goal
    ) public {
        // Validation check: Make sure the funding goal is greater than zero
        require(_goal > 0, "Funding goal must be greater than zero cUSD");

        // Increment our sequential identifier counter
        campaignCount++;

        // Store the new Campaign struct inside our blockchain storage mapping
        campaigns[campaignCount] = Campaign({
            creator: msg.sender,     // The wallet calling this function signs the record
            title: _title,
            description: _description,
            goal: _goal,
            amountRaised: 0,         // Starts with zero contributions
            isCompleted: false
        });
    }