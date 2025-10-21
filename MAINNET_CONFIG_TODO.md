# dYdX v4 Web 主网配置修改清单（Step by Step）

本清单指导你把项目从默认的 TESTNET/DEV 配置切换到 MAINNET（生产模式）可用配置，避免请求落到占位符路径导致 404。

参考关键文件/代码：
- `public/configs/v1/env.json`
- `src/constants/networks.ts`（MODE → MAINNET/TESTNET/DEV 映射）
- `src/hooks/useEndpointsConfig.ts`（读取 endpoints）
- `src/bonsai/rest/lib/compositeClientManager.ts`（REST/WS URL 组装）

---

## 0. 准备信息（你需要向后端/基础设施索取）
- [ ] Indexer 服务域名（HTTP/HTTPS + WS/WSS）
  - 描述：用于行情/数据索引服务。客户端会使用 `api`（HTTP）和 `socket`（WebSocket）两个地址。
  - 示例：
    - `https://indexer.mainnet.example.com`（api）
    - `wss://indexer.mainnet.example.com`（socket）
- [ ] Validators（一个或多个）
  - 描述：Cosmos/链验证节点的 REST 端点，客户端会从中择优。
  - 示例：`https://validator1.mainnet.example.com`
- [ ] Metadata Service（可选但常用）
  - 描述：元数据服务（如资产、图表、配置等），项目通过它补充展示信息。
  - 示例：`https://metadata.mainnet.example.com`
- [ ] Geo API（如需地理合规模块）
  - 描述：用于地理合规检测。
  - 示例：`https://api.mainnet.example.com/v4/geo`
- [ ] 其他可选服务（按需）：
  - Noble/Osmosis/Neutron 验证器、`stakingAPR`、`faucet`、`affiliates`、`spotCandleService`、`solanaRpcUrl` 等。
- [ ] WalletConnect 项目 ID
  - 描述：用于钱包连接（WC v2）。
  - 获取：在 WalletConnect Cloud 后台创建项目并复制 `Project ID`。
- [ ] 代币/链参数（`tokens`）
  - 描述：主网 `dydxprotocol-mainnet` 的 `chain/usdc` 配置（denom、decimals、gasDenom、图标路径等）。

---

## 1. 增加/完善 MAINNET 环境块（`public/configs/v1/env.json`）

1.1 在 `deployments.MAINNET` 中确认：
```jsonc
"deployments": {
  "MAINNET": {
    "environments": [
      "dydxprotocol-mainnet" // ← 使用你定义的主网 key
    ],
    "default": "dydxprotocol-mainnet" // ← 设置为主网 key
  }
}
```

1.2 在 `environments` 下新增/完善主网条目（示例）：
```jsonc
"environments": {
  "dydxprotocol-mainnet": {
    "name": "v4 Mainnet",
    "ethereumChainId": "1",              // 以太坊主网链 ID
    "dydxChainId": "dydxprotocol-mainnet", // 要与 tokens 段 key 对应
    "chainName": "dYdX Chain",
    "chainLogo": "/dydx-chain.png",
    "deployerName": "dYdX",
    "isMainNet": true,
    "endpoints": {
      "indexers": [
        {
          "api": "https://indexer.mainnet.example.com", // 必须是 https
          "socket": "wss://indexer.mainnet.example.com" // 必须是 wss
        }
      ],
      "validators": [
        "https://validator1.mainnet.example.com"
      ],
      "metadataService": "https://metadata.mainnet.example.com",
      "geo": "https://api.mainnet.example.com/v4/geo",
      "skip": "https://api.skip.build",
      "solanaRpcUrl": "https://api.mainnet-beta.solana.com/"
      // 如需："nobleValidator"、"osmosisValidator"、"neutronValidator"、
      //      "stakingAPR"、"faucet"、"affiliates"、"spotCandleService" 等
    }
  }
}
```

说明：
- `indexers[0].api/socket` 会被 `@dydxprotocol/v4-client-js` 用于 REST 和 WS 连接，必须分别是 HTTPS/WSS。
- `validators` 是一个列表，运行期会择优选取可用节点。
- 缺失任何一个关键 endpoint（尤其 `indexers`/`validators`）都会导致页面大量 404 或连接失败。

---

## 2. 配置主网 tokens（`public/configs/v1/env.json`）

在 `tokens` 下新增与 `dydxChainId` 对应的主网项，例如：
```jsonc
"tokens": {
  "dydxprotocol-mainnet": {
    "chain": {
      "name": "dYdX",
      "denom": "adydx",         // 替换为主网实际 denom
      "decimals": 18,
      "image": "/currencies/dydx.png"
    },
    "usdc": {
      "name": "USDC",
      "denom": "ibc/......",    // 主网 USDC denom
      "gasDenom": "uusdc",
      "decimals": 6,
      "image": "/currencies/usdc.png"
    }
  }
}
```

---

## 3. 配置主网钱包（`wallets` 段）

在 `wallets` 下为主网 key 配置 WalletConnect v2：
```jsonc
"wallets": {
  "dydxprotocol-mainnet": {
    "walletconnect": {
      "client": {
        "name": "YourApp",
        "description": "YourApp on dYdX",
        "iconUrl": "/logos/yourapp.png"
      },
      "v2": {
        "projectId": "<your_walletconnect_project_id>"
      }
    }
  }
}
```

说明：
- `projectId` 必须替换为你在 WalletConnect Cloud 后台生成的 ID。

---

## 4. （可选）配置主网外链（`links` 段）

用于 UI 的外部链接（隐私、条款、文档、社区等）：
```jsonc
"links": {
  "dydxprotocol-mainnet": {
    "privacy": "https://...",
    "tos": "https://...",
    "documentation": "https://...",
    "community": "https://...",
    // 其他字段按需
  }
}
```

---

## 5. 构建与预览（生产模式 = MAINNET）

- 清理可能保存的历史选网（避免仍指向旧环境）：
  - 浏览器 → Application → Local Storage → 删除 `SelectedNetwork`（或改为 `dydxprotocol-mainnet`）。
- 构建与预览：
```bash
pnpm run build
pnpm preview
# 入口在多入口目录：
# 方式1：直接访问
# http://localhost:4173/entry-points/index.html
# 方式2：将入口复制到根，方便用 /
# cp dist/entry-points/index.html dist/index.html
# 访问 http://localhost:4173/
```

---

## 6. 验收与排查 Checklist

- [ ] 浏览器网络面板中的 REST 请求是否指向你的 `indexers[0].api`（HTTPS 域名），且返回 200/正常 JSON。
- [ ] WS 连接是否指向你的 `indexers[0].socket`（WSS 域名），状态为 `101 Switching Protocols` 并保持连接。
- [ ] `validators` 是否可访问，页面是否能正常读取链状态。
- [ ] `metadataService` 是否可访问（如项目依赖元数据）。
- [ ] 没有 `http://localhost:4173/[占位符…]` 这种 404 了。
- [ ] 钱包连接（WalletConnect）能否正常弹窗与连接。

---

## 7. 常见问题

- 仍然出现 `/[占位符]` 404：
  - 检查 `deployments.MAINNET.default` 是否指向了你配置完成的主网 key。
  - 检查 `environments.<主网 key>.endpoints` 是否填了真实地址（尤其 `indexers/validators`）。
  - 清理浏览器 `localStorage` 中残留的选网值。
- WS 连接失败：
  - 确认 `socket` 使用 `wss://`，服务端证书与 CORS/Origin 配置正确。
- GTM/扩展 CSP 警告：
  - 多为浏览器扩展探测/脚本 CSP 限制，不影响核心功能，可忽略。

---

## 8. 可选：Hash 路由（无需服务器回退）

若你将来把静态产物放到不支持回退的静态托管，可在 `.env` 写：
```dotenv
VITE_ROUTER_TYPE=hash
```
然后重新打包。这样 URL 会变成 `/#/path` 形式，避免服务器侧 rewrite 配置。

---

如需我代填主网配置（根据你提供的域名/链参数），请把第 0 步的所有信息发给我，我可以直接更新 `env.json` 并回传差异。
