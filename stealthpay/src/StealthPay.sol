// SPDX-License-Identifier: MIT
pragma solidity ^0.8.25;

import "@fhenixprotocol/cofhe-contracts/FHE.sol";

contract StealthPay {
    // Registered tokens that can be used for payments
    mapping(address => bool) public supportedTokens;

    // User -> Bot -> IsAuthorized
    mapping(address => mapping(address => bool)) public botAuthorized;

    struct EncryptedVault {
        euint64 totalEncryptedBalance;
        bool isInitialized;
    }

    // Freelancer -> Token -> Vault
    mapping(address => mapping(address => EncryptedVault)) private vaults;

    struct PaymentRecord {
        string senderName;
        string description;
        uint256 rawAmount; // Store plaintext amount alongside (for demo history display)
    }

    // Freelancer -> PaymentRecord[]
    mapping(address => PaymentRecord[]) private freelancerRecords;

    // --- Generated Link History & Escrow ---
    struct GeneratedLink {
        string description;
        uint256 amount;
        uint256 timestamp;
        bool isPaid;
        address payer;
        bool freelancerDone;
        bool clientConfirmed;
        address token;
        bool isEscrow;
    }
    mapping(address => GeneratedLink[]) public freelancerLinks;

    // Events
    event SupportedTokenAdded(address indexed token);
    event PaymentReceived(address indexed freelancer, address indexed token, uint256 rawAmount);
    event SettlementCreated(address indexed freelancer, address indexed client, uint256 amount);
    event SettlementReleased(address indexed freelancer, uint256 amount);
    event BotAuthorized(address indexed user, address indexed bot, bool status);
    event WithdrawalProcessed(address indexed freelancer, address indexed to, uint256 amount, uint256 fee);

    function addSupportedToken(address token) external {
        supportedTokens[token] = true;
        emit SupportedTokenAdded(token);
    }

    /// @notice Internal FHE payment logic used by both direct pay and escrow release
    function _internalPay(
        address freelancer,
        address token,
        uint256 rawAmount,
        string memory senderName,
        string memory description
    ) internal {
        euint64 amount = FHE.asEuint64(rawAmount);
        
        if (!vaults[freelancer][token].isInitialized) {
            vaults[freelancer][token].totalEncryptedBalance = amount;
            vaults[freelancer][token].isInitialized = true;
        } else {
            vaults[freelancer][token].totalEncryptedBalance = FHE.add(
                vaults[freelancer][token].totalEncryptedBalance, 
                amount
            );
        }

        FHE.allowThis(vaults[freelancer][token].totalEncryptedBalance);
        FHE.allow(vaults[freelancer][token].totalEncryptedBalance, freelancer);
        FHE.allowPublic(vaults[freelancer][token].totalEncryptedBalance); // In production, replace with granular allows

        freelancerRecords[freelancer].push(PaymentRecord({
            senderName: senderName,
            description: description,
            rawAmount: rawAmount
        }));

        emit PaymentReceived(freelancer, token, rawAmount);
    }

    function pay(
        address freelancer,
        address token,
        uint256 rawAmount,
        string calldata senderName,
        string calldata description
    ) external {
        require(supportedTokens[token], "Token not supported");
        _internalPay(freelancer, token, rawAmount, senderName, description);
    }

    // --- INVOICE & ESCROW LOGIC ---
    function createLink(string memory description, uint256 amount) external {
        freelancerLinks[msg.sender].push(GeneratedLink({
            description: description,
            amount: amount,
            timestamp: block.timestamp,
            isPaid: false,
            payer: address(0),
            freelancerDone: false,
            clientConfirmed: false,
            token: address(0),
            isEscrow: false
        }));
    }

    function payWithEscrow(address freelancer, uint256 index, address token) external {
        require(supportedTokens[token], "Token not supported");
        GeneratedLink storage link = freelancerLinks[freelancer][index];
        require(!link.isPaid, "Already paid");
        
        link.isPaid = true;
        link.payer = msg.sender;
        link.token = token;
        link.isEscrow = true;
        
        emit SettlementCreated(freelancer, msg.sender, link.amount);
    }

    function markLinkDone(uint256 index) external {
        GeneratedLink storage link = freelancerLinks[msg.sender][index];
        require(link.isPaid, "Not paid yet");
        link.freelancerDone = true;
    }

    function releaseFunds(address freelancer, uint256 index) external {
        GeneratedLink storage link = freelancerLinks[freelancer][index];
        require(link.isPaid, "Not paid yet");
        require(link.payer == msg.sender, "Only payer can release");
        require(link.freelancerDone, "Freelancer not done yet");
        require(!link.clientConfirmed, "Already released");

        link.clientConfirmed = true;
        
        // Finalize FHE settlement
        _internalPay(freelancer, link.token, link.amount, "StealthClient", link.description);
        
        emit SettlementReleased(freelancer, link.amount);
    }
    
    function getLinksCount(address freelancer) external view returns (uint256) {
        return freelancerLinks[freelancer].length;
    }

    function getLink(address freelancer, uint256 index) external view returns (
        string memory description, 
        uint256 amount, 
        uint256 timestamp, 
        bool isPaid,
        bool freelancerDone,
        bool clientConfirmed,
        address payer
    ) {
        GeneratedLink memory link = freelancerLinks[freelancer][index];
        return (link.description, link.amount, link.timestamp, link.isPaid, link.freelancerDone, link.clientConfirmed, link.payer);
    }

    // --- USERNAME REGISTRY ---
    mapping(string => address) public usernameToAddress;
    mapping(address => string) public addressToUsername;
    
    event UsernameRegistered(address indexed user, string username);
    
    function registerUsername(string memory username) external {
        require(bytes(username).length > 0, "Username cannot be empty");
        require(bytes(username).length <= 20, "Username too long");
        require(usernameToAddress[username] == address(0), "Username already taken");
        
        // Clear old username if user had one
        string memory oldUsername = addressToUsername[msg.sender];
        if (bytes(oldUsername).length > 0) {
            usernameToAddress[oldUsername] = address(0);
        }
        
        usernameToAddress[username] = msg.sender;
        addressToUsername[msg.sender] = username;
        emit UsernameRegistered(msg.sender, username);
    }
    
    function resolveUsername(string memory username) external view returns (address) {
        return usernameToAddress[username];
    }

    // --- BOT AUTHORIZATION ---
    function authorizeBot(address bot, bool status) external {
        botAuthorized[msg.sender][bot] = status;
        emit BotAuthorized(msg.sender, bot, status);
    }

    // --- BALANCE READ LOGIC ---
    /// @notice Returns the encrypted ctHash handle - use cofhejs.decryptForView() on the frontend
    function getBalance(address freelancer, address token) external view returns (euint64) {
        require(msg.sender == freelancer || botAuthorized[freelancer][msg.sender], "Not authorized to view balance");
        return vaults[freelancer][token].totalEncryptedBalance;
    }

    function getRecordCount(address freelancer) external view returns (uint256) {
        return freelancerRecords[freelancer].length;
    }

    function getRecord(address freelancer, uint256 index) external view returns (string memory, string memory, uint256) {
        PaymentRecord memory rec = freelancerRecords[freelancer][index];
        return (rec.senderName, rec.description, rec.rawAmount);
    }

    // --- WITHDRAW LOGIC ---
    function botWithdraw(
        address freelancer,
        address token,
        uint256 amount,
        uint256 fee,
        address to
    ) external {
        require(botAuthorized[freelancer][msg.sender], "Bot not authorized");
        
        uint256 totalRaw = amount + fee;
        euint64 totalEncrypted = FHE.asEuint64(totalRaw);
        
        // Deduct total from encrypted balance
        vaults[freelancer][token].totalEncryptedBalance = FHE.sub(
            vaults[freelancer][token].totalEncryptedBalance,
            totalEncrypted
        );

        // Allow the new balance for the user
        FHE.allow(vaults[freelancer][token].totalEncryptedBalance, freelancer);
        FHE.allowPublic(vaults[freelancer][token].totalEncryptedBalance);

        emit WithdrawalProcessed(freelancer, to, amount, fee);
    }

    function withdraw(uint256 amount) external {
        // Direct user withdrawal (requires user to pay gas)
    }
}
