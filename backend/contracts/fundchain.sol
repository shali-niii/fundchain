// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract FundChain {
    struct Campaign {
        address payable owner;
        string title;
        string description;
        uint256 target;
        uint256 deadline;
        uint256 amountRaised;
        string image;
        bool claimed;
    }

    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public donations;
    mapping(uint256 => address[]) public campaignDonors;

    uint256 public numberOfCampaigns = 0;

    event CampaignCreated(uint256 indexed id, address indexed owner, string title, uint256 target, uint256 deadline);
    event Donated(uint256 indexed id, address indexed donor, uint256 amount);
    event FundsWithdrawn(uint256 indexed id, address indexed owner, uint256 amount);
    event Refunded(uint256 indexed id, address indexed donor, uint256 amount);

    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _target,
        uint256 _deadline,
        string memory _image
    ) public returns (uint256) {
        require(_deadline > block.timestamp, "Deadline must be in the future.");
        require(_target > 0, "Target must be greater than 0.");

        Campaign storage campaign = campaigns[numberOfCampaigns];

        campaign.owner = payable(msg.sender);
        campaign.title = _title;
        campaign.description = _description;
        campaign.target = _target;
        campaign.deadline = _deadline;
        campaign.amountRaised = 0;
        campaign.image = _image;
        campaign.claimed = false;

        emit CampaignCreated(numberOfCampaigns, msg.sender, _title, _target, _deadline);

        numberOfCampaigns++;
        return numberOfCampaigns - 1;
    }

    function donateToCampaign(uint256 _id) public payable {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp < campaign.deadline, "Campaign deadline has passed.");
        require(msg.value > 0, "Donation amount must be greater than 0.");

        if (donations[_id][msg.sender] == 0) {
            campaignDonors[_id].push(msg.sender);
        }

        donations[_id][msg.sender] += msg.value;
        campaign.amountRaised += msg.value;

        emit Donated(_id, msg.sender, msg.value);
    }

    function withdrawFunds(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];

        require(msg.sender == campaign.owner, "Only campaign owner can withdraw.");
        require(campaign.amountRaised >= campaign.target, "Target amount not reached.");
        require(!campaign.claimed, "Funds already claimed.");

        campaign.claimed = true;
        (bool sent, ) = campaign.owner.call{value: campaign.amountRaised}("");
        require(sent, "Failed to send Ether.");

        emit FundsWithdrawn(_id, campaign.owner, campaign.amountRaised);
    }

    function requestRefund(uint256 _id) public {
        Campaign storage campaign = campaigns[_id];

        require(block.timestamp >= campaign.deadline, "Campaign is still active.");
        require(campaign.amountRaised < campaign.target, "Campaign target was met.");

        uint256 donatedAmount = donations[_id][msg.sender];
        require(donatedAmount > 0, "No funds to refund.");

        donations[_id][msg.sender] = 0;

        (bool sent, ) = msg.sender.call{value: donatedAmount}("");
        require(sent, "Refund transfer failed.");

        emit Refunded(_id, msg.sender, donatedAmount);
    }

    function getDonors(uint256 _id) public view returns (address[] memory, uint256[] memory) {
        address[] memory donors = campaignDonors[_id];
        uint256[] memory donorAmounts = new uint256[](donors.length);

        for (uint256 i = 0; i < donors.length; i++) {
            donorAmounts[i] = donations[_id][donors[i]];
        }

        return (donors, donorAmounts);
    }

    function getCampaigns() public view returns (Campaign[] memory) {
        Campaign[] memory allCampaigns = new Campaign[](numberOfCampaigns);

        for (uint256 i = 0; i < numberOfCampaigns; i++) {
            allCampaigns[i] = campaigns[i];
        }

        return allCampaigns;
    }
}