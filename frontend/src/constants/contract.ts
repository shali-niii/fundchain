export const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const CONTRACT_ABI = [
  "function createCampaign(string _title, string _description, uint256 _target, uint256 _deadline, string _image) returns (uint256)",
  "function donateToCampaign(uint256 _id) payable",
  "function withdrawFunds(uint256 _id)",
  "function requestRefund(uint256 _id)",
  "function getDonors(uint256 _id) view returns (address[], uint256[])",
  "function getCampaigns() view returns (tuple(address owner, string title, string description, uint256 target, uint256 deadline, uint256 amountRaised, string image, bool claimed)[])",
  "function numberOfCampaigns() view returns (uint256)",
  "event CampaignCreated(uint256 indexed id, address indexed owner, string title, uint256 target, uint256 deadline)",
  "event Donated(uint256 indexed id, address indexed donor, uint256 amount)"
];