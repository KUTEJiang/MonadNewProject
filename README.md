# PromptMint | AI 图像生成 NFT 平台

<div align="center">

**🎨 从文本提示生成 AI 图像并铸造为 NFT | Generate AI Images from Text Prompts and Mint as NFTs**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)
[![Monad](https://img.shields.io/badge/Monad-Testnet-purple)](https://monad.xyz/)

</div>

## 🌍 语言 | Language

[🇨🇳 中文](#中文文档) | [🇺🇸 English](#english-documentation)

---

# 中文文档

## 📖 项目介绍

PromptMint 是一个基于 Web3 的 AI 图像生成和 NFT 铸造平台。用户可以通过文本提示生成独特的 AI 图像，并将其铸造为 NFT 存储在 Monad 测试网上。平台结合了 AI 图像生成、IPFS 分布式存储和智能合约功能，提供从创意想法到 NFT 所有权的无缝体验。

### ✨ 核心功能

- 🎨 **AI 图像生成**: 使用 OpenAI DALL-E 3 从文本提示生成独特图像
- 🔗 **IPFS 分布式存储**: 使用 Web3.Storage 进行图像和元数据的去中心化存储
- 🪙 **NFT 铸造**: 在 Monad 测试网上将生成的图像铸造为 ERC721 NFT
- 🚫 **防重复机制**: 智能合约防止相同提示词重复铸造
- 💰 **Gas 优化**: 高效的智能合约设计，降低交易成本
- 🔐 **钱包集成**: 支持主流 Web3 钱包连接
- 📱 **响应式设计**: 完美适配移动端和桌面端
- 🔍 **操作历史**: 完整的生成和铸造历史记录

### 🛠️ 技术栈

- **前端**: Next.js 15, TypeScript, TailwindCSS
- **区块链**: Solidity, Hardhat, OpenZeppelin
- **Web3 集成**: Wagmi, Viem
- **AI**: OpenAI DALL-E 3
- **存储**: IPFS via Web3.Storage
- **网络**: Monad Testnet
- **测试**: Jest, Playwright

## 🚀 5 分钟快速验证

### 前置条件
- Node.js 18+ 和 npm
- Web3 钱包（MetaMask 等）
- Monad 测试网 MON 代币

### 快速开始
```bash
# 1. 克隆项目
git clone <repository-url>
cd prompt-mint

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 填入必要的 API 密钥

# 4. 获取测试网代币
# 访问 https://testnet-faucet.monad.xyz

# 5. 部署智能合约
npm run deploy:testnet

# 6. 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 开始体验！

## 📋 详细安装指南

### 1. 环境准备

确保您的系统已安装：
- **Node.js 18+**: [下载地址](https://nodejs.org/)
- **Git**: [下载地址](https://git-scm.com/)
- **Web3 钱包**: 推荐 MetaMask

### 2. 项目克隆和依赖安装

```bash
# 克隆项目
git clone <repository-url>
cd prompt-mint

# 安装项目依赖
npm install

# 编译智能合约
npm run compile
```

### 3. 环境变量配置

创建 `.env.local` 文件：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，配置以下变量：

```env
# API 密钥（必需）
OPENAI_API_KEY=your_openai_api_key_here
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# 智能合约部署（如需部署）
PRIVATE_KEY=your_private_key_without_0x_prefix

# 前端配置（公开）
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_APP_NAME=PromptMint
NEXT_PUBLIC_APP_DESCRIPTION=Generate AI images and mint them as NFTs on Monad Testnet
```

#### 🔑 获取 API 密钥

**OpenAI API 密钥**:
1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 创建账户并登录
3. 进入 API Keys 页面
4. 创建新的 API 密钥
5. 复制密钥到 `OPENAI_API_KEY`

**Pinata IPFS 服务令牌**:
1. 访问 [Pinata](https://app.pinata.cloud/)
2. 创建免费账户（有 1GB 免费存储）
3. 进入 API Keys 页面
4. 点击 "New Key" 创建新的 API 密钥
5. 确保勾选 "Pinning Services" 权限
6. 复制 API Key 到 `PINATA_API_KEY`
7. 复制 Secret Key 到 `PINATA_SECRET_KEY`

**备用方案 - Web3.Storage 令牌**:
1. 访问 [Web3.Storage](https://web3.storage/)
2. 创建免费账户
3. 进入 API Tokens 页面
4. 创建新令牌
5. 复制令牌到 `WEB3_STORAGE_TOKEN`

### 4. 获取测试网代币

1. 访问 [Monad 测试网水龙头](https://testnet-faucet.monad.xyz)
2. 连接您的钱包
3. 申请 MON 测试代币
4. 等待交易确认（通常需要几分钟）

### 5. 智能合约部署

```bash
# 部署到 Monad 测试网
npm run deploy:testnet

# 验证合约（可选）
CONTRACT_ADDRESS=your_contract_address npm run verify:testnet
```

部署成功后，将合约地址更新到 `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
```

### 6. 启动应用

```bash
# 开发模式
npm run dev

# 生产构建
npm run build
npm start
```

## 🌐 网络配置

### Monad 测试网信息
- **网络名称**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **链 ID**: 10143
- **货币符号**: MON
- **区块浏览器**: https://testnet.monadexplorer.com
- **水龙头**: https://faucet.monad.xyz

### 钱包配置
如需手动添加 Monad 测试网到钱包：

1. 打开 MetaMask
2. 点击网络下拉菜单
3. 选择"添加网络"
4. 填入上述网络信息

## 🎯 使用指南

### 基本操作流程

1. **连接钱包**: 点击"连接钱包"选择您的 Web3 钱包
2. **切换网络**: 确保连接到 Monad 测试网
3. **输入提示词**: 输入描述性的文本提示（支持中英文）
4. **生成图像**: 点击"生成"等待 AI 处理（约 30-60 秒）
5. **预览图像**: 查看生成的图像，满意后继续
6. **铸造 NFT**: 点击"铸造"创建您的 NFT（需要 Gas 费）
7. **查看交易**: 在 [Monad 浏览器](https://testnet.monadexplorer.com) 查看交易

### 最佳实践

**提示词建议**:
- 使用描述性语言，包含风格、颜色、构图等细节
- 例如："一只在星空下漫步的发光独角兽，梦幻风格，蓝紫色调"
- 避免使用过于简单的提示词

**Gas 费优化**:
- 在网络拥堵较少时进行铸造
- 预估 Gas 费约 0.001-0.01 MON

## 🔧 故障排除

### 常见问题

#### 1. 钱包连接问题
**现象**: 无法连接钱包或网络错误
**解决方案**:
```bash
# 检查网络配置
- 确保钱包连接到 Monad 测试网
- 验证 RPC URL: https://testnet-rpc.monad.xyz
- 检查链 ID: 10143
```

#### 2. 图像生成失败
**现象**: 生成按钮无响应或报错
**解决方案**:
```bash
# 检查 API 配置
- 验证 OPENAI_API_KEY 是否正确
- 确认 API 配额未超限
- 检查网络连接
```

#### 3. NFT 铸造失败
**现象**: 交易失败或 Gas 不足
**解决方案**:
```bash
# 检查余额和合约
- 确保钱包有足够的 MON 代币
- 验证合约地址是否正确
- 重试交易（可能需要等待网络确认）
```

#### 4. IPFS 上传失败
**现象**: 图像生成成功但上传失败
**解决方案**:
```bash
# 检查存储配置
- 验证 WEB3_STORAGE_TOKEN 是否有效
- 检查存储配额
- 重试操作
```

### 错误代码说明

| 错误代码 | 含义 | 解决方案 |
|---------|------|----------|
| `WALLET_CONNECTION` | 钱包连接失败 | 检查钱包状态和网络 |
| `GENERATION_FAILED` | AI 图像生成失败 | 检查 API 密钥和网络 |
| `IPFS_UPLOAD_FAILED` | IPFS 上传失败 | 检查存储令牌 |
| `MINTING_FAILED` | NFT 铸造失败 | 检查 Gas 和合约地址 |
| `PROMPT_ALREADY_USED` | 提示词已被使用 | 尝试不同的提示词 |

### 开发调试

```bash
# 查看详细日志
npm run dev

# 运行测试
npm test
npm run test:contracts

# 检查构建
npm run build

# 查看网络状态
curl -X POST https://testnet-rpc.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🧪 测试

### 运行测试

```bash
# 前端单元测试
npm test

# 智能合约测试
npm run test:contracts

# 端到端测试
npx playwright test

# 测试覆盖率
npm run test:coverage
```

### 测试环境

项目包含完整的测试套件：
- **单元测试**: 组件和钩子函数测试
- **集成测试**: API 端点测试
- **合约测试**: 智能合约功能测试
- **E2E 测试**: 完整用户流程测试

## 📚 API 文档

### REST API 端点

#### POST /api/generate
生成 AI 图像并上传到 IPFS

**请求体**:
```json
{
  "prompt": "您的图像描述提示词"
}
```

**响应**:
```json
{
  "success": true,
  "tokenURI": "ipfs://...",
  "previewURL": "https://...",
  "metadata": {
    "name": "AI Generated NFT",
    "description": "Generated from prompt: ...",
    "image": "ipfs://...",
    "attributes": [...]
  }
}
```

#### GET /api/health
检查 API 服务状态

**响应**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 智能合约接口

#### 主要函数

```solidity
// 铸造 NFT
function mint(bytes32 promptHash, string memory tokenURI) external

// 检查提示词是否已使用
function isPromptUsed(bytes32 promptHash) external view returns (bool)

// 获取当前代币计数
function tokenCounter() external view returns (uint256)

// 获取总供应量
function totalSupply() external view returns (uint256)

// 批量查询代币 URI
function tokenURIBatch(uint256[] memory tokenIds) external view returns (string[] memory)
```

## 🤝 贡献指南

### 开发流程

1. Fork 项目到您的 GitHub 账户
2. 创建功能分支: `git checkout -b feature/your-feature`
3. 提交更改: `git commit -am 'Add some feature'`
4. 推送分支: `git push origin feature/your-feature`
5. 创建 Pull Request

### 代码规范

```bash
# 代码检查
npm run lint

# 代码格式化
npm run format

# 类型检查
npm run type-check
```

### 提交规范

使用约定式提交格式：
- `feat:` 新功能
- `fix:` 错误修复
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试相关
- `chore:` 构建过程或辅助工具的变动

## 📄 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](LICENSE) 文件。

## 🙏 致谢

感谢以下开源项目和服务：
- [OpenZeppelin](https://openzeppelin.com/) - 安全的智能合约库
- [Monad](https://monad.xyz/) - 高性能区块链平台
- [OpenAI](https://openai.com/) - AI 图像生成服务
- [Web3.Storage](https://web3.storage/) - 去中心化存储服务

---

# English Documentation

## 📖 Project Overview

PromptMint is a Web3-based AI image generation and NFT minting platform. Users can generate unique AI images from text prompts and mint them as NFTs on the Monad Testnet. The platform combines AI image generation, IPFS distributed storage, and smart contract functionality to provide a seamless experience from creative ideas to NFT ownership.

### ✨ Key Features

- 🎨 **AI Image Generation**: Generate unique images from text prompts using OpenAI DALL-E 3
- 🔗 **IPFS Distributed Storage**: Decentralized storage for images and metadata using Web3.Storage
- 🪙 **NFT Minting**: Mint generated images as ERC721 NFTs on Monad Testnet
- 🚫 **Duplicate Prevention**: Smart contract prevents duplicate prompts from being minted
- 💰 **Gas Optimized**: Efficient smart contract design with reduced transaction costs
- 🔐 **Wallet Integration**: Support for mainstream Web3 wallets
- 📱 **Responsive Design**: Perfect adaptation for mobile and desktop
- 🔍 **Operation History**: Complete generation and minting history records

### 🛠️ Technology Stack

- **Frontend**: Next.js 15, TypeScript, TailwindCSS
- **Blockchain**: Solidity, Hardhat, OpenZeppelin
- **Web3 Integration**: Wagmi, Viem
- **AI**: OpenAI DALL-E 3
- **Storage**: IPFS via Web3.Storage
- **Network**: Monad Testnet
- **Testing**: Jest, Playwright

## 🚀 5-Minute Quick Verification

### Prerequisites
- Node.js 18+ and npm
- Web3 wallet (MetaMask, etc.)
- Monad Testnet MON tokens

### Quick Start
```bash
# 1. Clone the project
git clone <repository-url>
cd prompt-mint

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env.local
# Edit .env.local with your API keys

# 4. Get testnet tokens
# Visit https://testnet-faucet.monad.xyz

# 5. Deploy smart contract
npm run deploy:testnet

# 6. Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to start experiencing!

## 📋 Detailed Installation Guide

### 1. Environment Setup

Ensure your system has:
- **Node.js 18+**: [Download](https://nodejs.org/)
- **Git**: [Download](https://git-scm.com/)
- **Web3 Wallet**: MetaMask recommended

### 2. Project Clone and Dependency Installation

```bash
# Clone project
git clone <repository-url>
cd prompt-mint

# Install dependencies
npm install

# Compile smart contracts
npm run compile
```

### 3. Environment Variable Configuration

Create `.env.local` file:

```bash
cp .env.example .env.local
```

Edit `.env.local` file with the following variables:

```env
# API Keys (Required)
OPENAI_API_KEY=your_openai_api_key_here
PINATA_API_KEY=your_pinata_api_key_here
PINATA_SECRET_KEY=your_pinata_secret_key_here

# Smart Contract Deployment (If deploying)
PRIVATE_KEY=your_private_key_without_0x_prefix

# Frontend Configuration (Public)
NEXT_PUBLIC_CONTRACT_ADDRESS=deployed_contract_address
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_CHAIN_ID=10143
NEXT_PUBLIC_APP_NAME=PromptMint
NEXT_PUBLIC_APP_DESCRIPTION=Generate AI images and mint them as NFTs on Monad Testnet
```

#### 🔑 Getting API Keys

**OpenAI API Key**:
1. Visit [OpenAI Platform](https://platform.openai.com/)
2. Create account and login
3. Go to API Keys page
4. Create new API key
5. Copy key to `OPENAI_API_KEY`

**Pinata IPFS Service Tokens**:
1. Visit [Pinata](https://app.pinata.cloud/)
2. Create free account (1GB free storage)
3. Go to API Keys page
4. Click "New Key" to create new API key
5. Ensure "Pinning Services" permission is checked
6. Copy API Key to `PINATA_API_KEY`
7. Copy Secret Key to `PINATA_SECRET_KEY`

**Alternative - Web3.Storage Token**:
1. Visit [Web3.Storage](https://web3.storage/)
2. Create free account
3. Go to API Tokens page
4. Create new token
5. Copy token to `WEB3_STORAGE_TOKEN`

### 4. Get Testnet Tokens

1. Visit [Monad Testnet Faucet](https://testnet-faucet.monad.xyz)
2. Connect your wallet
3. Request MON test tokens
4. Wait for transaction confirmation (usually takes a few minutes)

### 5. Smart Contract Deployment

```bash
# Deploy to Monad Testnet
npm run deploy:testnet

# Verify contract (optional)
CONTRACT_ADDRESS=your_contract_address npm run verify:testnet
```

After successful deployment, update the contract address in `.env.local`:
```env
NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
```

### 6. Start Application

```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 🌐 Network Configuration

### Monad Testnet Information
- **Network Name**: Monad Testnet
- **RPC URL**: https://testnet-rpc.monad.xyz
- **Chain ID**: 10143
- **Currency Symbol**: MON
- **Block Explorer**: https://testnet.monadexplorer.com
- **Faucet**: https://testnet-faucet.monad.xyz

### Wallet Configuration
To manually add Monad Testnet to your wallet:

1. Open MetaMask
2. Click network dropdown
3. Select "Add Network"
4. Fill in the network information above

## 🎯 Usage Guide

### Basic Operation Flow

1. **Connect Wallet**: Click "Connect Wallet" to select your Web3 wallet
2. **Switch Network**: Ensure connection to Monad Testnet
3. **Enter Prompt**: Input descriptive text prompt (supports Chinese and English)
4. **Generate Image**: Click "Generate" and wait for AI processing (about 30-60 seconds)
5. **Preview Image**: Review the generated image, continue if satisfied
6. **Mint NFT**: Click "Mint" to create your NFT (requires gas fee)
7. **View Transaction**: Check transaction on [Monad Explorer](https://testnet.monadexplorer.com)

### Best Practices

**Prompt Suggestions**:
- Use descriptive language including style, colors, composition details
- Example: "A glowing unicorn walking under starry sky, fantasy style, blue-purple tones"
- Avoid overly simple prompts

**Gas Fee Optimization**:
- Mint during less congested network times
- Estimated gas fee: ~0.001-0.01 MON

## 🔧 Troubleshooting

### Common Issues

#### 1. Wallet Connection Issues
**Symptoms**: Cannot connect wallet or network errors
**Solutions**:
```bash
# Check network configuration
- Ensure wallet is connected to Monad Testnet
- Verify RPC URL: https://testnet-rpc.monad.xyz
- Check Chain ID: 10143
```

#### 2. Image Generation Failure
**Symptoms**: Generate button unresponsive or errors
**Solutions**:
```bash
# Check API configuration
- Verify OPENAI_API_KEY is correct
- Confirm API quota not exceeded
- Check network connection
```

#### 3. NFT Minting Failure
**Symptoms**: Transaction fails or insufficient gas
**Solutions**:
```bash
# Check balance and contract
- Ensure wallet has sufficient MON tokens
- Verify contract address is correct
- Retry transaction (may need to wait for network confirmation)
```

#### 4. IPFS Upload Failure
**Symptoms**: Image generation succeeds but upload fails
**Solutions**:
```bash
# Check storage configuration
- Verify WEB3_STORAGE_TOKEN is valid
- Check storage quota
- Retry operation
```

### Error Code Reference

| Error Code | Meaning | Solution |
|------------|---------|----------|
| `WALLET_CONNECTION` | Wallet connection failed | Check wallet status and network |
| `GENERATION_FAILED` | AI image generation failed | Check API key and network |
| `IPFS_UPLOAD_FAILED` | IPFS upload failed | Check storage token |
| `MINTING_FAILED` | NFT minting failed | Check gas and contract address |
| `PROMPT_ALREADY_USED` | Prompt already used | Try different prompt |

### Development Debugging

```bash
# View detailed logs
npm run dev

# Run tests
npm test
npm run test:contracts

# Check build
npm run build

# Check network status
curl -X POST https://testnet-rpc.monad.xyz \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
```

## 🧪 Testing

### Running Tests

```bash
# Frontend unit tests
npm test

# Smart contract tests
npm run test:contracts

# End-to-end tests
npx playwright test

# Test coverage
npm run test:coverage
```

### Test Environment

The project includes a comprehensive test suite:
- **Unit Tests**: Component and hook function tests
- **Integration Tests**: API endpoint tests
- **Contract Tests**: Smart contract functionality tests
- **E2E Tests**: Complete user flow tests

## 📚 API Documentation

### REST API Endpoints

#### POST /api/generate
Generate AI image and upload to IPFS

**Request Body**:
```json
{
  "prompt": "Your image description prompt"
}
```

**Response**:
```json
{
  "success": true,
  "tokenURI": "ipfs://...",
  "previewURL": "https://...",
  "metadata": {
    "name": "AI Generated NFT",
    "description": "Generated from prompt: ...",
    "image": "ipfs://...",
    "attributes": [...]
  }
}
```

#### GET /api/health
Check API service status

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Smart Contract Interface

#### Main Functions

```solidity
// Mint NFT
function mint(bytes32 promptHash, string memory tokenURI) external

// Check if prompt is used
function isPromptUsed(bytes32 promptHash) external view returns (bool)

// Get current token count
function tokenCounter() external view returns (uint256)

// Get total supply
function totalSupply() external view returns (uint256)

// Batch query token URIs
function tokenURIBatch(uint256[] memory tokenIds) external view returns (string[] memory)
```

## 🤝 Contributing

### Development Workflow

1. Fork the project to your GitHub account
2. Create feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add some feature'`
4. Push branch: `git push origin feature/your-feature`
5. Create Pull Request

### Code Standards

```bash
# Code linting
npm run lint

# Code formatting
npm run format

# Type checking
npm run type-check
```

### Commit Convention

Use conventional commit format:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation updates
- `style:` Code formatting
- `refactor:` Refactoring
- `test:` Test related
- `chore:` Build process or auxiliary tool changes

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

Thanks to the following open source projects and services:
- [OpenZeppelin](https://openzeppelin.com/) - Secure smart contract libraries
- [Monad](https://monad.xyz/) - High-performance blockchain platform
- [OpenAI](https://openai.com/) - AI image generation service
- [Web3.Storage](https://web3.storage/) - Decentralized storage service

---

## 📞 Support | 支持

For questions and support | 如有问题和支持需求:

- 📧 Email: support@promptmint.xyz
- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/prompt-mint/issues)
- 💬 Discord: [Join our community](https://discord.gg/promptmint)
- 📖 Documentation: [Full docs](https://docs.promptmint.xyz)

**Happy minting! | 祝您铸造愉快！** 🎨✨