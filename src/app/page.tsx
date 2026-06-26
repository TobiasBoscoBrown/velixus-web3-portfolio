'use client'

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import {
  ArrowUpRight, Shield, Cpu, Layers, GitBranch, Blocks, Wallet,
  ChevronDown, Sparkles, Lock, Zap, Globe, Code2, Database,
  Network, FileCode, Box
} from 'lucide-react'
import ContractDemo from '@/components/ContractDemo'
import BlockchainVisualizer from '@/components/BlockchainVisualizer'

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.7, ease: [0.25, 0.4, 0.25, 1] },
  }),
}

const contracts = [
  {
    title: 'DeFi Vault — Yield Aggregator',
    description: 'ERC-4626 compliant vault with auto-compounding yield strategies, flash loan protection, and emergency withdrawal',
    color: 'blue' as const,
    actions: [
      { label: 'Deploy Vault', action: 'deploy' },
      { label: 'Deposit 1 ETH', action: 'deposit' },
      { label: 'Harvest Yield', action: 'harvest' },
      { label: 'Withdraw', action: 'withdraw' },
    ],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract YieldVault is ERC4626, ReentrancyGuard, Ownable {
    uint256 public totalStrategyDebt;
    uint256 public lastHarvestTimestamp;
    uint256 public performanceFee = 1000; // 10%
    
    mapping(address => Strategy) public strategies;
    
    struct Strategy {
        uint256 debt;
        uint256 maxDebtRatio;
        uint256 lastReport;
        bool isActive;
    }

    event Harvested(address indexed strategy, uint256 profit, uint256 loss);
    event StrategyAdded(address indexed strategy, uint256 maxDebtRatio);

    constructor(
        IERC20 _asset,
        string memory _name,
        string memory _symbol
    ) ERC4626(_asset) ERC20(_name, _symbol) Ownable(msg.sender) {}

    function deposit(uint256 assets, address receiver) 
        public override nonReentrant returns (uint256) 
    {
        require(assets <= maxDeposit(receiver), "Exceeds max deposit");
        return super.deposit(assets, receiver);
    }

    function harvest(address strategy) external nonReentrant {
        Strategy storage s = strategies[strategy];
        require(s.isActive, "Strategy not active");
        
        uint256 profit = _calculateProfit(strategy);
        uint256 fee = (profit * performanceFee) / 10000;
        
        totalStrategyDebt += profit - fee;
        s.lastReport = block.timestamp;
        lastHarvestTimestamp = block.timestamp;
        
        emit Harvested(strategy, profit, 0);
    }

    function totalAssets() public view override returns (uint256) {
        return IERC20(asset()).balanceOf(address(this)) + totalStrategyDebt;
    }

    function _calculateProfit(address) internal pure returns (uint256) {
        return 1e18; // Simplified for demo
    }
}`,
  },
  {
    title: 'NFT Collection — ERC-721A',
    description: 'Gas-optimized NFT with merkle-proof allowlist, royalty enforcement (EIP-2981), and on-chain metadata',
    color: 'purple' as const,
    actions: [
      { label: 'Deploy Collection', action: 'deploy' },
      { label: 'Mint NFT', action: 'mint' },
      { label: 'Verify Allowlist', action: 'verify' },
      { label: 'Set Royalties', action: 'royalty' },
    ],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "erc721a/contracts/ERC721A.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";

contract GenesisCollection is ERC721A, ERC2981, Ownable {
    uint256 public constant MAX_SUPPLY = 10000;
    uint256 public constant MAX_PER_WALLET = 3;
    uint256 public mintPrice = 0.08 ether;
    
    bytes32 public merkleRoot;
    string private _baseTokenURI;
    bool public mintActive;
    bool public allowlistOnly = true;
    
    mapping(address => uint256) public mintCount;

    error ExceedsMaxSupply();
    error ExceedsWalletLimit();
    error InvalidProof();
    error MintNotActive();
    error InsufficientPayment();

    constructor(
        bytes32 _merkleRoot,
        address royaltyReceiver
    ) ERC721A("Genesis Collection", "GEN") Ownable(msg.sender) {
        merkleRoot = _merkleRoot;
        _setDefaultRoyalty(royaltyReceiver, 500); // 5%
    }

    function allowlistMint(
        uint256 quantity,
        bytes32[] calldata proof
    ) external payable {
        if (!mintActive) revert MintNotActive();
        if (totalSupply() + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (mintCount[msg.sender] + quantity > MAX_PER_WALLET) 
            revert ExceedsWalletLimit();
        if (msg.value < mintPrice * quantity) revert InsufficientPayment();
        
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
        if (!MerkleProof.verify(proof, merkleRoot, leaf)) 
            revert InvalidProof();
        
        mintCount[msg.sender] += quantity;
        _mint(msg.sender, quantity);
    }

    function publicMint(uint256 quantity) external payable {
        if (!mintActive || allowlistOnly) revert MintNotActive();
        if (totalSupply() + quantity > MAX_SUPPLY) revert ExceedsMaxSupply();
        if (msg.value < mintPrice * quantity) revert InsufficientPayment();
        
        _mint(msg.sender, quantity);
    }

    function supportsInterface(bytes4 interfaceId) 
        public view override(ERC721A, ERC2981) returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}`,
  },
  {
    title: 'ERC-20 Governance Token',
    description: 'Governance token with delegation, vote checkpoints, permit (EIP-2612), and timelock-controlled minting',
    color: 'green' as const,
    actions: [
      { label: 'Deploy Token', action: 'deploy' },
      { label: 'Transfer 1000 TKN', action: 'transfer' },
      { label: 'Delegate Votes', action: 'delegate' },
      { label: 'Create Proposal', action: 'propose' },
    ],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract GovernanceToken is ERC20Votes, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    
    uint256 public constant MAX_SUPPLY = 100_000_000 * 1e18;
    uint256 public constant INITIAL_SUPPLY = 10_000_000 * 1e18;
    
    mapping(uint256 => Proposal) public proposals;
    uint256 public proposalCount;
    
    struct Proposal {
        address proposer;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startBlock;
        uint256 endBlock;
        bool executed;
        mapping(address => bool) hasVoted;
    }

    event ProposalCreated(uint256 id, address proposer, string desc);
    event VoteCast(uint256 proposalId, address voter, bool support, uint256 weight);

    constructor(address treasury) 
        ERC20("Governance Token", "GOV")
        ERC20Permit("Governance Token")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _mint(treasury, INITIAL_SUPPLY);
    }

    function createProposal(string calldata description) external returns (uint256) {
        require(getVotes(msg.sender) >= 100_000 * 1e18, "Insufficient voting power");
        
        uint256 proposalId = proposalCount++;
        Proposal storage p = proposals[proposalId];
        p.proposer = msg.sender;
        p.description = description;
        p.startBlock = block.number;
        p.endBlock = block.number + 50400; // ~7 days
        
        emit ProposalCreated(proposalId, msg.sender, description);
        return proposalId;
    }

    function castVote(uint256 proposalId, bool support) external {
        Proposal storage p = proposals[proposalId];
        require(block.number <= p.endBlock, "Voting ended");
        require(!p.hasVoted[msg.sender], "Already voted");
        
        uint256 weight = getPastVotes(msg.sender, p.startBlock);
        require(weight > 0, "No voting power");
        
        p.hasVoted[msg.sender] = true;
        if (support) p.forVotes += weight;
        else p.againstVotes += weight;
        
        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        _mint(to, amount);
    }
}`,
  },
  {
    title: 'Cross-Chain Bridge — Layer 2',
    description: 'Trustless bridge with merkle proof verification, optimistic challenge period, and multi-sig guardian recovery',
    color: 'orange' as const,
    actions: [
      { label: 'Deploy Bridge', action: 'deploy' },
      { label: 'Lock & Bridge', action: 'lock' },
      { label: 'Submit Proof', action: 'prove' },
      { label: 'Finalize Withdrawal', action: 'finalize' },
    ],
    contractCode: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract CrossChainBridge is ReentrancyGuard, AccessControl {
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant RELAYER_ROLE = keccak256("RELAYER_ROLE");
    
    uint256 public constant CHALLENGE_PERIOD = 7 days;
    uint256 public nonce;
    bytes32 public stateRoot;
    
    mapping(bytes32 => BridgeMessage) public messages;
    mapping(bytes32 => bool) public processedMessages;
    mapping(bytes32 => Challenge) public challenges;

    struct BridgeMessage {
        address sender;
        address recipient;
        uint256 amount;
        uint256 destChainId;
        uint256 nonce;
        uint256 timestamp;
        MessageStatus status;
    }

    struct Challenge {
        address challenger;
        uint256 timestamp;
        bool resolved;
    }

    enum MessageStatus { Pending, Proven, Finalized, Challenged }

    event MessageSent(bytes32 indexed msgHash, address sender, uint256 amount, uint256 destChain);
    event MessageProven(bytes32 indexed msgHash, bytes32 stateRoot);
    event MessageFinalized(bytes32 indexed msgHash, address recipient, uint256 amount);
    event MessageChallenged(bytes32 indexed msgHash, address challenger);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GUARDIAN_ROLE, msg.sender);
    }

    function sendMessage(
        address recipient,
        uint256 destChainId
    ) external payable nonReentrant returns (bytes32) {
        require(msg.value > 0, "No value sent");
        
        bytes32 msgHash = keccak256(abi.encodePacked(
            msg.sender, recipient, msg.value, destChainId, nonce++, block.timestamp
        ));

        messages[msgHash] = BridgeMessage({
            sender: msg.sender,
            recipient: recipient,
            amount: msg.value,
            destChainId: destChainId,
            nonce: nonce - 1,
            timestamp: block.timestamp,
            status: MessageStatus.Pending
        });

        emit MessageSent(msgHash, msg.sender, msg.value, destChainId);
        return msgHash;
    }

    function proveMessage(
        bytes32 msgHash,
        bytes32[] calldata proof,
        bytes32 _stateRoot
    ) external onlyRole(RELAYER_ROLE) {
        require(messages[msgHash].status == MessageStatus.Pending, "Invalid status");
        require(MerkleProof.verify(proof, _stateRoot, msgHash), "Invalid proof");
        
        messages[msgHash].status = MessageStatus.Proven;
        stateRoot = _stateRoot;
        
        emit MessageProven(msgHash, _stateRoot);
    }

    function finalizeMessage(bytes32 msgHash) external nonReentrant {
        BridgeMessage storage msg_ = messages[msgHash];
        require(msg_.status == MessageStatus.Proven, "Not proven");
        require(
            block.timestamp >= msg_.timestamp + CHALLENGE_PERIOD,
            "Challenge period active"
        );
        
        msg_.status = MessageStatus.Finalized;
        processedMessages[msgHash] = true;
        
        (bool success, ) = msg_.recipient.call{value: msg_.amount}("");
        require(success, "Transfer failed");
        
        emit MessageFinalized(msgHash, msg_.recipient, msg_.amount);
    }

    function challengeMessage(bytes32 msgHash) external {
        require(messages[msgHash].status == MessageStatus.Proven, "Not proven");
        require(
            block.timestamp < messages[msgHash].timestamp + CHALLENGE_PERIOD,
            "Challenge period ended"
        );
        
        messages[msgHash].status = MessageStatus.Challenged;
        challenges[msgHash] = Challenge(msg.sender, block.timestamp, false);
        
        emit MessageChallenged(msgHash, msg.sender);
    }
}`,
  },
]

const techStack = [
  { name: 'Solidity', icon: FileCode, category: 'Smart Contracts' },
  { name: 'Hardhat', icon: Box, category: 'Development' },
  { name: 'Foundry', icon: Cpu, category: 'Testing' },
  { name: 'OpenZeppelin', icon: Shield, category: 'Security' },
  { name: 'Ethers.js', icon: Code2, category: 'Frontend' },
  { name: 'The Graph', icon: Network, category: 'Indexing' },
  { name: 'IPFS', icon: Database, category: 'Storage' },
  { name: 'Chainlink', icon: GitBranch, category: 'Oracles' },
]

const projects = [
  {
    title: 'DeFi Lending Protocol',
    description: 'Full-stack lending platform with variable/stable rate borrowing, flash loans, and liquidation engine. $4.2M TVL at peak.',
    tags: ['Solidity', 'Aave Fork', 'Flash Loans', 'Liquidation'],
    metrics: '$4.2M TVL',
    chain: 'Ethereum + Arbitrum',
  },
  {
    title: 'NFT Marketplace',
    description: 'On-chain marketplace with lazy minting, collection offers, royalty enforcement, and meta-transaction support.',
    tags: ['ERC-721', 'EIP-2981', 'Seaport', 'Meta-TX'],
    metrics: '12K+ trades',
    chain: 'Polygon',
  },
  {
    title: 'DAO Governance Framework',
    description: 'Modular governance with timelocked execution, vote delegation, and on-chain proposal lifecycle management.',
    tags: ['Governor', 'Timelock', 'ERC-20 Votes', 'Snapshot'],
    metrics: '200+ proposals',
    chain: 'Ethereum',
  },
  {
    title: 'Cross-Chain Token Bridge',
    description: 'Optimistic bridge with merkle proof verification, multi-sig guardian system, and fraud proof challenge mechanism.',
    tags: ['Bridge', 'Merkle Proofs', 'L2', 'Multi-sig'],
    metrics: '$850K bridged',
    chain: 'Ethereum ↔ Optimism',
  },
  {
    title: 'Tokenization Platform',
    description: 'Real-world asset tokenization with compliance modules, transfer restrictions, and automated dividend distribution.',
    tags: ['ERC-1400', 'KYC/AML', 'Compliance', 'RWA'],
    metrics: '3 assets tokenized',
    chain: 'Ethereum',
  },
  {
    title: 'AI + Blockchain Oracle',
    description: 'Decentralized oracle feeding AI model outputs on-chain with consensus verification and stake-weighted reporting.',
    tags: ['Oracle', 'AI/ML', 'Staking', 'Consensus'],
    metrics: '1M+ data points',
    chain: 'Chainlink + Ethereum',
  },
]

const stats = [
  { number: '40+', label: 'Smart Contracts Deployed' },
  { number: '$8M+', label: 'TVL Managed' },
  { number: '0', label: 'Security Incidents' },
  { number: '5', label: 'Chains Shipped On' },
]

export default function Home() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ['start start', 'end start'] })
  const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const heroOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <main className="min-h-screen overflow-hidden bg-[#0a0b0f] grid-bg">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-dark">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center">
              <Blocks className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white tracking-tight">TBB</span>
            <span className="text-xs text-gray-500 font-mono">web3.dev</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-6"
          >
            <a href="#contracts" className="text-xs text-gray-400 hover:text-neon-blue transition-colors">Contracts</a>
            <a href="#projects" className="text-xs text-gray-400 hover:text-neon-blue transition-colors">Projects</a>
            <a href="#stack" className="text-xs text-gray-400 hover:text-neon-blue transition-colors">Stack</a>
            <a href="#contact" className="text-xs px-4 py-2 rounded-lg bg-neon-blue/10 text-neon-blue border border-neon-blue/20 hover:bg-neon-blue/20 transition-all">
              Let&apos;s Build
            </a>
          </motion.div>
        </div>
      </nav>

      {/* Hero */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center px-6 pt-20">
        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.25, 0.4, 0.25, 1] }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-neon-blue/10 border border-neon-blue/20 mb-8">
              <div className="w-2 h-2 rounded-full bg-neon-green animate-pulse" />
              <span className="text-xs text-neon-blue font-mono">Available for Hire — Senior Blockchain Developer</span>
            </div>

            <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold leading-[0.95] tracking-tight mb-8 text-white">
              I architect<br />
              <span className="gradient-text-cyber">the future</span> of web3
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6">
              Production-grade smart contracts, DeFi protocols, NFT platforms, and cross-chain infrastructure.
              From concept to mainnet deployment — secure, scalable, and audited.
            </p>
            <p className="text-sm text-gray-500 font-mono mb-12">
              Solidity &middot; EVM &middot; DeFi &middot; NFT &middot; Layer 2 &middot; Cross-Chain &middot; AI + Blockchain
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-wrap items-center justify-center gap-4"
          >
            <a href="#contracts" className="group inline-flex items-center gap-2 px-8 py-4 bg-neon-blue text-black rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all hover:scale-105">
              Live Contract Demos
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </a>
            <a href="#projects" className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 text-white rounded-lg text-sm font-medium hover:border-neon-blue/30 transition-all hover:scale-105">
              View Projects
            </a>
          </motion.div>
        </motion.div>

        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 z-10"
        >
          <ChevronDown className="w-5 h-5 text-gray-600" />
        </motion.div>

        {/* Background effects */}
        <div className="absolute top-1/3 -left-48 w-[500px] h-[500px] bg-neon-blue/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-48 w-[500px] h-[500px] bg-neon-purple/5 rounded-full blur-[120px]" />
      </section>

      {/* Live Blockchain Visualizer */}
      <section className="py-16 px-6 border-y border-white/[0.04]">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-8"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neon-blue font-mono mb-2">Live Network Simulation</p>
            <p className="text-sm text-gray-500">Real-time block production and transaction processing visualization</p>
          </motion.div>
          <BlockchainVisualizer />
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="text-center p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
              >
                <p className="text-3xl md:text-4xl font-bold gradient-text-cyber font-mono">{stat.number}</p>
                <p className="text-xs text-gray-500 mt-2 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Live Contract Demos */}
      <section id="contracts" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neon-blue font-mono mb-4">Interactive Smart Contracts</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Production-grade code,<br />
              <span className="text-gray-500">live in your browser.</span>
            </h2>
            <p className="text-gray-400 mt-4 max-w-xl">
              Real Solidity contracts covering DeFi, NFT, Governance, and Cross-Chain patterns. 
              Click any action to simulate on-chain transactions.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-6">
            {contracts.map((contract, i) => (
              <ContractDemo key={contract.title} {...contract} />
            ))}
          </div>
        </div>
      </section>

      {/* Projects */}
      <section id="projects" className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neon-green font-mono mb-4">Shipped Products</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Built for production,<br />
              <span className="text-gray-500">not just hackathons.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project, i) => (
              <motion.div
                key={project.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="group p-6 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-neon-blue/20 transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">{project.title}</h3>
                  <ArrowUpRight className="w-4 h-4 text-gray-600 group-hover:text-neon-blue transition-colors" />
                </div>
                <p className="text-sm text-gray-400 leading-relaxed mb-4">{project.description}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {project.tags.map(tag => (
                    <span key={tag} className="text-[10px] px-2 py-0.5 rounded bg-white/[0.04] text-gray-400 font-mono">
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-white/[0.04]">
                  <span className="text-xs text-neon-blue font-semibold">{project.metrics}</span>
                  <span className="text-[10px] text-gray-500 font-mono">{project.chain}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section id="stack" className="py-24 px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
            className="mb-16"
          >
            <p className="text-xs uppercase tracking-[0.3em] text-neon-purple font-mono mb-4">Engineering Stack</p>
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
              Battle-tested tools,<br />
              <span className="text-gray-500">proven workflows.</span>
            </h2>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {techStack.map((tool, i) => (
              <motion.div
                key={tool.name}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-neon-purple/20 transition-all group"
              >
                <tool.icon className="w-6 h-6 text-gray-500 group-hover:text-neon-purple transition-colors mb-3" />
                <p className="font-semibold text-white text-sm">{tool.name}</p>
                <p className="text-[10px] text-gray-500 font-mono uppercase tracking-wider mt-1">{tool.category}</p>
              </motion.div>
            ))}
          </div>

          {/* Expertise grid */}
          <div className="mt-16 grid md:grid-cols-2 gap-6">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={0}
              className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <Shield className="w-8 h-8 text-neon-green mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Security-First Development</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-neon-green" /> Reentrancy guards & access control patterns</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-neon-green" /> Formal verification with Certora/SMT</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-neon-green" /> Gas optimization & storage packing</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-neon-green" /> Comprehensive test coverage (Foundry fuzz testing)</li>
                <li className="flex items-center gap-2"><Lock className="w-3.5 h-3.5 text-neon-green" /> Slither / Mythril static analysis integration</li>
              </ul>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              custom={1}
              className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <Layers className="w-8 h-8 text-neon-blue mb-4" />
              <h3 className="text-xl font-bold text-white mb-3">Full-Stack Blockchain</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-neon-blue" /> Smart contract design & architecture</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-neon-blue" /> Backend services & blockchain indexing</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-neon-blue" /> Frontend dApp integration (ethers.js/wagmi)</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-neon-blue" /> Subgraph development (The Graph)</li>
                <li className="flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-neon-blue" /> CI/CD for contract deployment pipelines</li>
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-32 px-6 border-t border-white/[0.04]">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={0}
          >
            <Sparkles className="w-8 h-8 text-neon-blue mx-auto mb-6" />
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white mb-6">
              Let&apos;s build the<br />
              <span className="gradient-text-cyber">decentralized future.</span>
            </h2>
            <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto">
              Ready to architect blockchain products from concept to deployment.
              Smart contracts, DeFi protocols, NFT platforms, cross-chain bridges — I ship production code that&apos;s secure, scalable, and battle-tested.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a href="mailto:tobias@example.com" className="group inline-flex items-center gap-2 px-8 py-4 bg-neon-blue text-black rounded-lg text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,212,255,0.3)] transition-all hover:scale-105">
                Start a Conversation
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>
              <a href="https://github.com/TobiasBoscoBrown" target="_blank" className="inline-flex items-center gap-2 px-8 py-4 border border-white/10 text-white rounded-lg text-sm font-medium hover:border-neon-blue/30 transition-all hover:scale-105">
                <Globe className="w-4 h-4" />
                GitHub
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-white/[0.04]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600 font-mono">Built with Next.js + Tailwind + Framer Motion &middot; Zero dependencies on Web3 wallets for demo</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/TobiasBoscoBrown" className="text-xs text-gray-500 hover:text-neon-blue transition-colors">GitHub</a>
            <a href="#" className="text-xs text-gray-500 hover:text-neon-blue transition-colors">LinkedIn</a>
            <a href="#" className="text-xs text-gray-500 hover:text-neon-blue transition-colors">Twitter</a>
          </div>
        </div>
      </footer>
    </main>
  )
}
