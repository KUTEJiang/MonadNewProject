// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title PromptMint
 * @dev NFT contract for minting AI-generated images based on text prompts
 * Prevents duplicate prompts from being minted multiple times
 */
contract PromptMint is ERC721, ERC721URIStorage, Ownable, ReentrancyGuard {
    // Counter for token IDs
    uint256 private _tokenIdCounter;
    
    // Mapping to track used prompt hashes to prevent duplicates
    mapping(bytes32 => bool) public usedPromptHashes;
    
    // Mapping from prompt hash to token ID
    mapping(bytes32 => uint256) public promptHashToTokenId;
    
    // Events
    event PromptMinted(
        address indexed minter,
        bytes32 indexed promptHash,
        uint256 indexed tokenId,
        string tokenURI
    );
    
    // Custom errors for gas efficiency
    error PromptAlreadyUsed(bytes32 promptHash);
    error EmptyTokenURI();
    error ZeroPromptHash();
    
    constructor() ERC721("PromptMint", "PMINT") Ownable(msg.sender) {
        _tokenIdCounter = 1; // Start token IDs from 1
    }
    
    /**
     * @dev Mint a new NFT with the given prompt hash and token URI
     * @param promptHash The keccak256 hash of the original prompt
     * @param tokenURI The IPFS URI containing the NFT metadata
     */
    function mint(bytes32 promptHash, string memory tokenURI) 
        external 
        nonReentrant 
    {
        // Validate inputs
        if (promptHash == bytes32(0)) {
            revert ZeroPromptHash();
        }
        if (bytes(tokenURI).length == 0) {
            revert EmptyTokenURI();
        }
        
        // Check if prompt hash has already been used
        if (usedPromptHashes[promptHash]) {
            revert PromptAlreadyUsed(promptHash);
        }
        
        // Mark prompt hash as used
        usedPromptHashes[promptHash] = true;
        
        // Get current token ID and increment counter
        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        
        // Store mapping from prompt hash to token ID
        promptHashToTokenId[promptHash] = tokenId;
        
        // Mint the NFT to the caller
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Emit event
        emit PromptMinted(msg.sender, promptHash, tokenId, tokenURI);
    }
    
    /**
     * @dev Check if a prompt hash has already been used
     * @param promptHash The keccak256 hash to check
     * @return bool True if the prompt hash has been used
     */
    function isPromptUsed(bytes32 promptHash) external view returns (bool) {
        return usedPromptHashes[promptHash];
    }
    
    /**
     * @dev Get the current token counter value
     * @return uint256 The next token ID that will be minted
     */
    function tokenCounter() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /**
     * @dev Get the total number of tokens minted
     * @return uint256 The total supply of tokens
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter - 1;
    }
    
    /**
     * @dev Get token ID by prompt hash
     * @param promptHash The prompt hash to look up
     * @return uint256 The token ID associated with the prompt hash (0 if not found)
     */
    function getTokenIdByPromptHash(bytes32 promptHash) external view returns (uint256) {
        return promptHashToTokenId[promptHash];
    }
    
    // Override required by Solidity for multiple inheritance
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}