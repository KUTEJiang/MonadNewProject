# PromptMint 智能合约部署指南

本指南将帮助您将 PromptMint 智能合约部署到 Monad 测试网。

## 前置条件

1. **Node.js 和 npm**：确保您已安装 Node.js
2. **Monad 测试网 MON 代币**：部署需要测试网代币
3. **私钥**：拥有测试网 MON 代币的钱包私钥

## 步骤 1：获取 Monad 测试网代币

1. 访问 [Monad 测试网水龙头](https://testnet-faucet.monad.xyz)
2. 连接您的钱包或输入钱包地址
3. 申请测试网 MON 代币
4. 等待交易确认

## 步骤 2：配置环境变量

1. 复制您钱包的私钥（拥有测试网 MON 代币的钱包）
2. 打开项目根目录下的 `.env.local` 文件
3. 设置 `PRIVATE_KEY` 变量：
   ```
   PRIVATE_KEY=your_private_key_here_without_0x_prefix
   ```

**⚠️ 安全警告**：永远不要将私钥提交到版本控制系统。`.env.local` 文件已在 `.gitignore` 中。

## 步骤 3：部署合约

运行部署命令：

```bash
npm run deploy:testnet
```

或手动执行：

```bash
npx hardhat run scripts/deploy.ts --network monadTestnet
```

## 步骤 4：验证合约（可选）

部署后，您可以在 Monad 浏览器上验证合约：

```bash
CONTRACT_ADDRESS=your_deployed_contract_address npm run verify:testnet
```

或手动执行：

```bash
CONTRACT_ADDRESS=your_deployed_contract_address npx hardhat run scripts/verify.ts --network monadTestnet
```

## 步骤 5：更新环境变量

部署成功后：

1. 从部署输出中复制已部署的合约地址
2. 更新 `.env.local`：
   ```
   NEXT_PUBLIC_CONTRACT_ADDRESS=your_deployed_contract_address
   ```

## 故障排除

### 资金不足错误
- 确保您的钱包有足够的 MON 代币用于部署
- 部署的 Gas 费用通常约为 0.001-0.01 MON

### 网络连接问题
- 检查 Monad 测试网 RPC 是否可访问：https://testnet-rpc.monad.xyz
- 如果网络拥堵，请等待几分钟后重试

### 私钥问题
- 确保私钥正确且不包含 '0x' 前缀
- 确保与私钥关联的钱包拥有测试网 MON 代币

### 验证问题
- 验证可能需要在部署后等待几分钟
- 确保合约地址正确
- 某些浏览器可能不会立即支持验证

## 网络信息

- **网络名称**：Monad Testnet
- **RPC URL**：https://testnet-rpc.monad.xyz
- **链 ID**：10143
- **货币符号**：MON
- **区块浏览器**：https://testnet.monadexplorer.com

## 合约信息

部署后，您将拥有：
- **合约名称**：PromptMint
- **符号**：PMINT
- **类型**：带 URI 存储的 ERC721 NFT
- **功能**：防重复提示词、Gas 优化铸造

## 后续步骤

部署成功后：
1. 使用合约地址更新前端配置
2. 使用 Web 界面测试合约功能
3. 与想要交互的用户分享合约地址

## 支持

如果遇到问题：
1. 检查 Hardhat 控制台输出的详细错误信息
2. 验证环境变量设置是否正确
3. 确保您有足够的测试网代币
4. 检查 Monad 测试网状态和 RPC 连接性