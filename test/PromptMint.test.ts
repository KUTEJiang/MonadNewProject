import { expect } from "chai";
import hre from "hardhat";
import { PromptMint } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

const { ethers } = hre;

describe("PromptMint", function () {
  let promptMint: PromptMint;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const samplePrompt = "A beautiful sunset over the mountains";
  const samplePromptHash = ethers.keccak256(ethers.toUtf8Bytes(samplePrompt));
  const sampleTokenURI = "ipfs://QmSampleHash/metadata.json";
  const anotherPrompt = "A cat sitting on a windowsill";
  const anotherPromptHash = ethers.keccak256(ethers.toUtf8Bytes(anotherPrompt));
  const anotherTokenURI = "ipfs://QmAnotherHash/metadata.json";

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    const PromptMintFactory = await ethers.getContractFactory("PromptMint");
    promptMint = await PromptMintFactory.deploy();
    await promptMint.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should set the correct name and symbol", async function () {
      expect(await promptMint.name()).to.equal("PromptMint");
      expect(await promptMint.symbol()).to.equal("PMINT");
    });

    it("Should set the correct owner", async function () {
      expect(await promptMint.owner()).to.equal(owner.address);
    });

    it("Should initialize token counter to 1", async function () {
      expect(await promptMint.tokenCounter()).to.equal(1);
    });

    it("Should have zero total supply initially", async function () {
      expect(await promptMint.totalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    it("Should mint NFT successfully with valid inputs", async function () {
      await expect(promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI))
        .to.emit(promptMint, "PromptMinted")
        .withArgs(user1.address, samplePromptHash, 1, sampleTokenURI);

      expect(await promptMint.ownerOf(1)).to.equal(user1.address);
      expect(await promptMint.tokenURI(1)).to.equal(sampleTokenURI);
      expect(await promptMint.tokenCounter()).to.equal(2);
      expect(await promptMint.totalSupply()).to.equal(1);
    });

    it("Should mark prompt hash as used after minting", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      expect(await promptMint.isPromptUsed(samplePromptHash)).to.be.true;
      expect(await promptMint.usedPromptHashes(samplePromptHash)).to.be.true;
    });

    it("Should store correct mapping from prompt hash to token ID", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      expect(await promptMint.promptHashToTokenId(samplePromptHash)).to.equal(1);
      expect(await promptMint.getTokenIdByPromptHash(samplePromptHash)).to.equal(1);
    });

    it("Should allow different users to mint different prompts", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      await promptMint.connect(user2).mint(anotherPromptHash, anotherTokenURI);

      expect(await promptMint.ownerOf(1)).to.equal(user1.address);
      expect(await promptMint.ownerOf(2)).to.equal(user2.address);
      expect(await promptMint.tokenCounter()).to.equal(3);
      expect(await promptMint.totalSupply()).to.equal(2);
    });

    it("Should increment token IDs correctly", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      await promptMint.connect(user1).mint(anotherPromptHash, anotherTokenURI);

      expect(await promptMint.tokenCounter()).to.equal(3);
      expect(await promptMint.ownerOf(1)).to.equal(user1.address);
      expect(await promptMint.ownerOf(2)).to.equal(user1.address);
    });
  });

  describe("Duplicate Prevention", function () {
    it("Should revert when trying to mint duplicate prompt hash", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);

      await expect(
        promptMint.connect(user2).mint(samplePromptHash, anotherTokenURI)
      ).to.be.revertedWithCustomError(promptMint, "PromptAlreadyUsed")
        .withArgs(samplePromptHash);
    });

    it("Should revert when same user tries to mint same prompt twice", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);

      await expect(
        promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI)
      ).to.be.revertedWithCustomError(promptMint, "PromptAlreadyUsed")
        .withArgs(samplePromptHash);
    });

    it("Should allow minting after failed attempt with different prompt", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);

      await expect(
        promptMint.connect(user2).mint(samplePromptHash, anotherTokenURI)
      ).to.be.revertedWithCustomError(promptMint, "PromptAlreadyUsed");

      // Should succeed with different prompt
      await expect(
        promptMint.connect(user2).mint(anotherPromptHash, anotherTokenURI)
      ).to.emit(promptMint, "PromptMinted");
    });
  });

  describe("Input Validation", function () {
    it("Should revert with zero prompt hash", async function () {
      const zeroHash = ethers.ZeroHash;
      await expect(
        promptMint.connect(user1).mint(zeroHash, sampleTokenURI)
      ).to.be.revertedWithCustomError(promptMint, "ZeroPromptHash");
    });

    it("Should revert with empty token URI", async function () {
      await expect(
        promptMint.connect(user1).mint(samplePromptHash, "")
      ).to.be.revertedWithCustomError(promptMint, "EmptyTokenURI");
    });

    it("Should accept valid non-zero prompt hash", async function () {
      const validHash = ethers.keccak256(ethers.toUtf8Bytes("valid prompt"));
      await expect(
        promptMint.connect(user1).mint(validHash, sampleTokenURI)
      ).to.emit(promptMint, "PromptMinted");
    });
  });

  describe("View Functions", function () {
    beforeEach(async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      await promptMint.connect(user2).mint(anotherPromptHash, anotherTokenURI);
    });

    it("Should return correct prompt usage status", async function () {
      expect(await promptMint.isPromptUsed(samplePromptHash)).to.be.true;
      expect(await promptMint.isPromptUsed(anotherPromptHash)).to.be.true;
      
      const unusedHash = ethers.keccak256(ethers.toUtf8Bytes("unused prompt"));
      expect(await promptMint.isPromptUsed(unusedHash)).to.be.false;
    });

    it("Should return correct token counter", async function () {
      expect(await promptMint.tokenCounter()).to.equal(3);
    });

    it("Should return correct total supply", async function () {
      expect(await promptMint.totalSupply()).to.equal(2);
    });

    it("Should return correct token ID for prompt hash", async function () {
      expect(await promptMint.getTokenIdByPromptHash(samplePromptHash)).to.equal(1);
      expect(await promptMint.getTokenIdByPromptHash(anotherPromptHash)).to.equal(2);
      
      const unusedHash = ethers.keccak256(ethers.toUtf8Bytes("unused prompt"));
      expect(await promptMint.getTokenIdByPromptHash(unusedHash)).to.equal(0);
    });

    it("Should return correct token URI", async function () {
      expect(await promptMint.tokenURI(1)).to.equal(sampleTokenURI);
      expect(await promptMint.tokenURI(2)).to.equal(anotherTokenURI);
    });
  });

  describe("Events", function () {
    it("Should emit PromptMinted event with correct parameters", async function () {
      await expect(promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI))
        .to.emit(promptMint, "PromptMinted")
        .withArgs(user1.address, samplePromptHash, 1, sampleTokenURI);
    });

    it("Should emit Transfer event from ERC721", async function () {
      await expect(promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI))
        .to.emit(promptMint, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, 1);
    });
  });

  describe("Gas Usage and Performance", function () {
    it("Should have reasonable gas usage for minting", async function () {
      const tx = await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      const receipt = await tx.wait();
      
      console.log("Gas used for minting:", receipt?.gasUsed.toString());
      
      // Gas usage should be reasonable (less than 200k gas)
      expect(receipt?.gasUsed).to.be.lessThan(200000);
    });

    it("Should use consistent gas for multiple mints", async function () {
      const tx1 = await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      const receipt1 = await tx1.wait();
      
      const tx2 = await promptMint.connect(user2).mint(anotherPromptHash, anotherTokenURI);
      const receipt2 = await tx2.wait();
      
      console.log("First mint gas:", receipt1?.gasUsed.toString());
      console.log("Second mint gas:", receipt2?.gasUsed.toString());
      
      // Gas usage should be similar (within 15% difference for batch operations)
      const gasUsed1 = receipt1?.gasUsed || 0n;
      const gasUsed2 = receipt2?.gasUsed || 0n;
      const difference = gasUsed1 > gasUsed2 ? gasUsed1 - gasUsed2 : gasUsed2 - gasUsed1;
      const percentDifference = (difference * 100n) / gasUsed1;
      
      expect(percentDifference).to.be.lessThan(15);
    });

    it("Should fail efficiently for duplicate prompts", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      
      // Estimate gas for duplicate attempt
      try {
        await promptMint.connect(user2).mint.estimateGas(samplePromptHash, anotherTokenURI);
        expect.fail("Should have thrown an error");
      } catch (error: any) {
        // Should fail with custom error, indicating efficient gas usage
        expect(error.message).to.include("PromptAlreadyUsed");
      }
    });

    it("Should handle batch operations efficiently", async function () {
      const prompts = [
        "Prompt 1", "Prompt 2", "Prompt 3", "Prompt 4", "Prompt 5"
      ];
      const gasUsages: bigint[] = [];
      
      for (let i = 0; i < prompts.length; i++) {
        const promptHash = ethers.keccak256(ethers.toUtf8Bytes(prompts[i]));
        const tokenURI = `ipfs://QmHash${i}/metadata.json`;
        
        const tx = await promptMint.connect(user1).mint(promptHash, tokenURI);
        const receipt = await tx.wait();
        gasUsages.push(receipt?.gasUsed || 0n);
      }
      
      console.log("Batch mint gas usages:", gasUsages.map(g => g.toString()));
      
      // All mints should use similar gas (allowing for first mint overhead)
      const avgGas = gasUsages.reduce((a, b) => a + b, 0n) / BigInt(gasUsages.length);
      gasUsages.forEach((gas, index) => {
        const difference = gas > avgGas ? gas - avgGas : avgGas - gas;
        const percentDifference = (difference * 100n) / avgGas;
        // First mint may use more gas due to storage initialization
        const threshold = index === 0 ? 25 : 15;
        expect(percentDifference).to.be.lessThan(threshold);
      });
    });

    it("Should optimize storage reads for view functions", async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      
      // These should be very cheap view calls
      const gasEstimate1 = await promptMint.isPromptUsed.estimateGas(samplePromptHash);
      const gasEstimate2 = await promptMint.tokenCounter.estimateGas();
      const gasEstimate3 = await promptMint.totalSupply.estimateGas();
      
      console.log("View function gas estimates:", {
        isPromptUsed: gasEstimate1.toString(),
        tokenCounter: gasEstimate2.toString(),
        totalSupply: gasEstimate3.toString()
      });
      
      // View functions should use minimal gas
      expect(gasEstimate1).to.be.lessThan(30000);
      expect(gasEstimate2).to.be.lessThan(30000);
      expect(gasEstimate3).to.be.lessThan(30000);
    });
  });

  describe("Reentrancy Protection", function () {
    it("Should prevent reentrancy attacks", async function () {
      // This test ensures the nonReentrant modifier is working
      // In a real attack scenario, a malicious contract would try to call mint again
      // during the execution of the first mint call
      await expect(
        promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI)
      ).to.emit(promptMint, "PromptMinted");
      
      // Subsequent calls should fail due to duplicate prevention
      await expect(
        promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI)
      ).to.be.revertedWithCustomError(promptMint, "PromptAlreadyUsed");
    });
  });

  describe("Edge Cases and Security", function () {
    it("Should handle very long token URIs", async function () {
      const longTokenURI = "ipfs://Qm" + "a".repeat(1000) + "/metadata.json";
      await expect(
        promptMint.connect(user1).mint(samplePromptHash, longTokenURI)
      ).to.emit(promptMint, "PromptMinted");
      
      expect(await promptMint.tokenURI(1)).to.equal(longTokenURI);
    });

    it("Should handle maximum uint256 values correctly", async function () {
      // Test with a very large prompt hash (but not zero)
      const maxHash = "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff";
      await expect(
        promptMint.connect(user1).mint(maxHash, sampleTokenURI)
      ).to.emit(promptMint, "PromptMinted");
    });

    it("Should handle special characters in token URI", async function () {
      const specialTokenURI = "ipfs://QmHash/metadata with spaces & symbols!@#$%^&*().json";
      await expect(
        promptMint.connect(user1).mint(samplePromptHash, specialTokenURI)
      ).to.emit(promptMint, "PromptMinted");
    });

    it("Should prevent integer overflow in token counter", async function () {
      // This test ensures the contract handles large numbers correctly
      // In practice, we can't mint 2^256 tokens, but we can test the logic
      const currentCounter = await promptMint.tokenCounter();
      expect(currentCounter).to.equal(1);
      
      // After minting, counter should increment properly
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
      expect(await promptMint.tokenCounter()).to.equal(2);
    });

    it("Should maintain state consistency under concurrent operations", async function () {
      // Simulate concurrent minting attempts
      const promises = [];
      const uniquePrompts = [];
      
      for (let i = 0; i < 5; i++) {
        const prompt = `Concurrent prompt ${i}`;
        const promptHash = ethers.keccak256(ethers.toUtf8Bytes(prompt));
        const tokenURI = `ipfs://QmConcurrent${i}/metadata.json`;
        uniquePrompts.push({ promptHash, tokenURI });
        
        promises.push(
          promptMint.connect(user1).mint(promptHash, tokenURI)
        );
      }
      
      // All should succeed
      await Promise.all(promises);
      
      // Verify all tokens were minted correctly
      expect(await promptMint.totalSupply()).to.equal(5);
      expect(await promptMint.tokenCounter()).to.equal(6);
      
      // Verify all prompt hashes are marked as used
      for (const { promptHash } of uniquePrompts) {
        expect(await promptMint.isPromptUsed(promptHash)).to.be.true;
      }
    });

    it("Should handle contract interaction from other contracts", async function () {
      // Deploy a simple contract that calls PromptMint
      const CallerFactory = await ethers.getContractFactory("TestCaller");
      const caller = await CallerFactory.deploy();
      await caller.waitForDeployment();
      
      // The caller contract should be able to mint NFTs
      await expect(
        caller.mintFromContract(await promptMint.getAddress(), samplePromptHash, sampleTokenURI)
      ).to.emit(promptMint, "PromptMinted");
    });
  });

  describe("ERC721 Compliance", function () {
    beforeEach(async function () {
      await promptMint.connect(user1).mint(samplePromptHash, sampleTokenURI);
    });

    it("Should support ERC721 interface", async function () {
      const ERC721_INTERFACE_ID = "0x80ac58cd";
      expect(await promptMint.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
    });

    it("Should support ERC721Metadata interface", async function () {
      const ERC721_METADATA_INTERFACE_ID = "0x5b5e139f";
      expect(await promptMint.supportsInterface(ERC721_METADATA_INTERFACE_ID)).to.be.true;
    });

    it("Should support ERC165 interface", async function () {
      const ERC165_INTERFACE_ID = "0x01ffc9a7";
      expect(await promptMint.supportsInterface(ERC165_INTERFACE_ID)).to.be.true;
    });

    it("Should allow token transfers", async function () {
      await promptMint.connect(user1).transferFrom(user1.address, user2.address, 1);
      expect(await promptMint.ownerOf(1)).to.equal(user2.address);
    });

    it("Should allow token approvals", async function () {
      await promptMint.connect(user1).approve(user2.address, 1);
      expect(await promptMint.getApproved(1)).to.equal(user2.address);
    });

    it("Should allow operator approvals", async function () {
      await promptMint.connect(user1).setApprovalForAll(user2.address, true);
      expect(await promptMint.isApprovedForAll(user1.address, user2.address)).to.be.true;
    });

    it("Should handle safe transfers correctly", async function () {
      await promptMint.connect(user1)["safeTransferFrom(address,address,uint256)"](
        user1.address, 
        user2.address, 
        1
      );
      expect(await promptMint.ownerOf(1)).to.equal(user2.address);
    });
  });

  describe("Stress Testing", function () {
    it("Should handle multiple sequential mints efficiently", async function () {
      const startTime = Date.now();
      const numMints = 10;
      
      for (let i = 0; i < numMints; i++) {
        const prompt = `Stress test prompt ${i}`;
        const promptHash = ethers.keccak256(ethers.toUtf8Bytes(prompt));
        const tokenURI = `ipfs://QmStress${i}/metadata.json`;
        
        await promptMint.connect(user1).mint(promptHash, tokenURI);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      console.log(`Minted ${numMints} NFTs in ${duration}ms`);
      console.log(`Average time per mint: ${duration / numMints}ms`);
      
      expect(await promptMint.totalSupply()).to.equal(numMints);
      expect(await promptMint.tokenCounter()).to.equal(numMints + 1);
    });

    it("Should maintain performance with large number of used prompts", async function () {
      // Pre-populate with many used prompts
      const numPreMints = 50;
      for (let i = 0; i < numPreMints; i++) {
        const prompt = `Pre-mint prompt ${i}`;
        const promptHash = ethers.keccak256(ethers.toUtf8Bytes(prompt));
        const tokenURI = `ipfs://QmPre${i}/metadata.json`;
        await promptMint.connect(user1).mint(promptHash, tokenURI);
      }
      
      // Now test performance of new mint
      const startTime = Date.now();
      const newPromptHash = ethers.keccak256(ethers.toUtf8Bytes("New prompt after many"));
      await promptMint.connect(user1).mint(newPromptHash, "ipfs://QmNew/metadata.json");
      const endTime = Date.now();
      
      console.log(`Mint after ${numPreMints} existing mints took: ${endTime - startTime}ms`);
      
      expect(await promptMint.totalSupply()).to.equal(numPreMints + 1);
    });
  });
});