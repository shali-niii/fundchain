import { expect } from "chai";
import { network } from "hardhat";

describe("FundChain Contract", function () {
  let fundChain: any;
  let owner: any;
  let donor1: any;
  let donor2: any;

  const ONE_DAY_IN_SECS = 24 * 60 * 60;

  beforeEach(async function () {
    const { ethers } = await network.connect();
    [owner, donor1, donor2] = await ethers.getSigners();

    const FundChainFactory = await ethers.getContractFactory("FundChain");
    fundChain = await FundChainFactory.deploy();
    await fundChain.waitForDeployment();
  });

  it("Should create a campaign successfully", async function () {
    const { ethers } = await network.connect();
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = (latestBlock?.timestamp || 0) + ONE_DAY_IN_SECS;

    await fundChain.createCampaign(
      "Test Campaign",
      "Description",
      ethers.parseEther("5"),
      deadline,
      "https://example.com/image.jpg"
    );

    const campaigns = await fundChain.getCampaigns();
    expect(campaigns.length).to.equal(1);
    expect(campaigns[0].title).to.equal("Test Campaign");
    expect(campaigns[0].owner).to.equal(owner.address);
  });

  it("Should accept donations", async function () {
    const { ethers } = await network.connect();
    const latestBlock = await ethers.provider.getBlock("latest");
    const deadline = (latestBlock?.timestamp || 0) + ONE_DAY_IN_SECS;

    await fundChain.createCampaign(
      "Test Campaign",
      "Description",
      ethers.parseEther("5"),
      deadline,
      "https://example.com/image.jpg"
    );

    await fundChain.connect(donor1).donateToCampaign(0, {
      value: ethers.parseEther("2"),
    });

    const campaigns = await fundChain.getCampaigns();
    expect(campaigns[0].amountRaised).to.equal(ethers.parseEther("2"));
  });
});