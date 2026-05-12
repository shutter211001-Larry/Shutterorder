# 🔑 第三方金鑰取得指南

這份文件協助你取得 KitchenAsty 常用的第三方服務金鑰：

```dotenv
GEMINI_API_KEY=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_LOGIN_CLIENT_ID=
GOOGLE_LOGIN_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

::: warning 請保護你的金鑰
不要把真實金鑰 commit 到 Git。正式部署時，請把金鑰放在 Railway Variables、伺服器 `.env`，或其他 secret manager。
:::

## ✅ 快速對照表

| 變數 | 取得位置 | 用途 |
|------|----------|------|
| `GEMINI_API_KEY` | Google AI Studio | Gemini AI 功能 |
| `GOOGLE_CLIENT_ID` | 高權限 Google Cloud project 的 OAuth client | Gmail API 寄信授權 |
| `GOOGLE_CLIENT_SECRET` | 高權限 Google Cloud project 的 OAuth client | Gmail API 寄信授權 |
| `GOOGLE_REFRESH_TOKEN` | 高權限 OAuth client 產生 | Gmail API 長期寄信存取 |
| `GOOGLE_LOGIN_CLIENT_ID` | 低權限 Google Cloud project 的 OAuth client | 顧客 Google 登入 |
| `GOOGLE_LOGIN_CLIENT_SECRET` | 低權限 Google Cloud project 的 OAuth client | 顧客 Google 登入 |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Developers Console | LINE Messaging API 推播 / 回覆訊息 |
| `LINE_CHANNEL_SECRET` | LINE Developers Console | LINE webhook 簽章驗證 |

## 🤖 Gemini API Key

官方文件：[Gemini API keys](https://ai.google.dev/gemini-api/docs/api-key)

1. 打開 [Google AI Studio](https://aistudio.google.com/app/apikey)。
2. 使用你要綁定額度或計費的 Google 帳號登入。
3. 點擊 **Create API key**。
4. 選擇既有 Google Cloud project，或建立新的 project。
5. 複製產生的 API key。
6. 設定到環境變數：

```dotenv
GEMINI_API_KEY=your-gemini-api-key
```

::: tip
Google 的 Gemini SDK 也可讀取 `GOOGLE_API_KEY`，但此專案使用 `GEMINI_API_KEY`。
:::

## 🔐 Google OAuth Credentials

官方文件：[Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)

你的部署有兩個 Google project，建議明確分成「高權限寄信專案」與「低權限會員登入專案」。

### 變數歸屬

#### A. 高權限寄信專案：Gmail API / Email Sending

這組用在 server-side Gmail API 寄信，會搭配 `GOOGLE_REFRESH_TOKEN` 長期換取 access token。

```dotenv
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
```

程式使用位置：

- `packages/server/src/lib/email.ts`
- `packages/server/src/controllers/settings.controller.ts` 的寄送測試信流程

需要的 scope：

```text
https://www.googleapis.com/auth/gmail.send
```

這組權限較高，因為 refresh token 可以讓伺服器長期代表指定 Gmail 帳號寄信。請只放在 API server 的 Railway Variables，不要放到前端 service。

#### B. 低權限會員登入專案：Customer Google Login

這組只用於顧客登入 / 綁定 Google 帳號。

```dotenv
GOOGLE_LOGIN_CLIENT_ID=
GOOGLE_LOGIN_CLIENT_SECRET=
```

程式使用位置：

- `packages/server/src/lib/passport.ts`
- `packages/server/src/routes/auth.routes.ts`

實際 OAuth scope 只有：

```text
profile
email
```

這組權限較低，只能取得顧客的基本 Google profile 與 email，不能寄 Gmail。

::: warning 不建議混用
如果你已經有兩個 Google project，請不要把高權限寄信專案的 OAuth client 拿去做會員登入。會員登入只需要 `profile` 和 `email`，使用低權限 project 比較安全。
:::

### A. 建立高權限寄信 OAuth Client

1. 打開 [Google Cloud Console](https://console.cloud.google.com)。
2. 選擇你的「寄信 / Gmail API」project。
3. 前往 **APIs & Services → OAuth consent screen**。
4. 設定 app name、support email、developer contact email。
5. 如果 app 還在 testing 狀態，請把「要授權寄信的 Gmail 帳號」加入 test users。
6. 前往 **APIs & Services → Credentials**。
7. 點擊 **Create Credentials → OAuth client ID**。
8. Application type 選擇 **Web application**。
9. Authorized JavaScript origins 可加入：

```text
http://localhost:3000                    # 伺服端 API，本機開發
https://your-api-domain.example.com      # 伺服端 API，正式部署
```

10. 加入 Authorized redirect URIs：

```text
https://developers.google.com/oauthplayground  # Google OAuth Playground，用來產生 refresh token
```

11. 複製 **Client ID** 和 **Client Secret**。
12. 設定：

```dotenv
GOOGLE_CLIENT_ID=your-mail-project-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-mail-project-client-secret
```

### B. 建立低權限會員登入 OAuth Client

1. 打開 [Google Cloud Console](https://console.cloud.google.com)。
2. 選擇你的「會員登入」project。
3. 前往 **APIs & Services → OAuth consent screen**。
4. 設定 app name、support email、developer contact email。
5. 如果 app 還在 testing 狀態，請把測試登入用的 Google 帳號加入 test users。
6. 前往 **APIs & Services → Credentials**。
7. 點擊 **Create Credentials → OAuth client ID**。
8. Application type 選擇 **Web application**。
9. 加入 Authorized JavaScript origins：

```text
http://localhost:3000                         # 伺服端 API，本機開發
http://localhost:5173                         # 用戶端前台，本機開發
https://your-api-domain.example.com           # 伺服端 API，正式部署
https://your-storefront-domain.example.com    # 用戶端前台，正式部署
```

10. 加入 Authorized redirect URIs：

```text
http://localhost:3000/api/auth/google/callback                       # 伺服端 callback，本機開發
https://your-api-domain.example.com/api/auth/google/callback          # 伺服端 callback，正式部署
```

11. 複製 **Client ID** 和 **Client Secret**。
12. 設定：

```dotenv
GOOGLE_LOGIN_CLIENT_ID=your-login-project-client-id.apps.googleusercontent.com
GOOGLE_LOGIN_CLIENT_SECRET=your-login-project-client-secret
```

callback URL 必須和 API server domain 一致：

```text
https://your-api-domain.example.com/api/auth/google/callback          # 伺服端 callback
```

## 📧 Google Refresh Token

官方文件：[OAuth 2.0 Playground](https://developers.google.com/oauthplayground) 與 [Gmail API scopes](https://developers.google.com/gmail/api/auth/scopes)

`GOOGLE_REFRESH_TOKEN` 屬於「高權限寄信專案」。只有在你要使用 Gmail API 寄信，或其他需要長期 Google API 存取的功能時，才需要它。

### 1. 啟用 Gmail API

1. 打開 [Google Cloud Console](https://console.cloud.google.com)。
2. 選擇「高權限寄信專案」。
3. 前往 **APIs & Services → Library**。
4. 搜尋 **Gmail API**。
5. 點擊 **Enable**。

### 2. 產生 Refresh Token

1. 打開 [Google OAuth 2.0 Playground](https://developers.google.com/oauthplayground)。
2. 點右上角齒輪圖示。
3. 勾選 **Use your own OAuth credentials**。
4. 輸入：

```dotenv
GOOGLE_CLIENT_ID=your-mail-project-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-mail-project-client-secret
```

5. 在 scope 欄位加入：

```text
https://www.googleapis.com/auth/gmail.send
```

6. 點擊 **Authorize APIs**。
7. 使用要寄信的 Gmail 帳號登入。
8. 同意授權畫面。
9. 點擊 **Exchange authorization code for tokens**。
10. 複製 `refresh_token`。
11. 設定到環境變數：

```dotenv
GOOGLE_REFRESH_TOKEN=your-refresh-token
```

::: tip
如果 OAuth Playground 沒有回傳 `refresh_token`，請先到 Google Account 的第三方 app 權限中撤銷該 app 存取權，再重新授權一次。Google 通常只會在第一次授權 offline access 時回傳 refresh token。
:::

## 💬 LINE Messaging API 金鑰

官方文件：[LINE channel access tokens](https://developers.line.biz/en/docs/basics/channel-access-token/)

你需要一個 LINE Developers provider，以及一個 Messaging API channel。

### 1. 建立 LINE Messaging API Channel

1. 打開 [LINE Developers Console](https://developers.line.biz/console/)。
2. 建立 provider，或選擇既有 provider。
3. 建立新 channel。
4. 類型選擇 **Messaging API**。
5. 填寫 channel name、description、category、email。
6. 進入剛建立的 Messaging API channel。

### 2. 取得 `LINE_CHANNEL_SECRET`

1. 在 LINE channel 中，打開 **Basic settings** 分頁。
2. 找到 **Channel secret**。
3. 複製該值。
4. 設定：

```dotenv
LINE_CHANNEL_SECRET=your-channel-secret
```

### 3. 取得 `LINE_CHANNEL_ACCESS_TOKEN`

1. 在同一個 LINE channel 中，打開 **Messaging API** 分頁。
2. 找到 **Channel access token**。
3. 發行 long-lived channel access token。
4. 複製 token。
5. 設定：

```dotenv
LINE_CHANNEL_ACCESS_TOKEN=your-channel-access-token
```

### 4. 可選：設定 Webhook URL

如果你的部署有使用 LINE webhook，請在 LINE Developers 裡設定 webhook URL：

```text
https://your-api-domain.example.com/api/line/webhook                  # 伺服端 LINE webhook endpoint
```

然後在 Messaging API 分頁啟用 **Use webhook**。

## 🚂 Railway 設定位置

請把這些變數加到 **API server service**，不是 admin 或 storefront 這類靜態前端 service：

```dotenv
GEMINI_API_KEY=...
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_LOGIN_CLIENT_ID=...
GOOGLE_LOGIN_CLIENT_SECRET=...
GOOGLE_REFRESH_TOKEN=...
LINE_CHANNEL_ACCESS_TOKEN=...
LINE_CHANNEL_SECRET=...
```

修改 Railway Variables 後，請重新部署 API server。

## 🧪 驗證清單

- `GEMINI_API_KEY`：AI 功能不再回報缺少 Gemini key。
- `GOOGLE_LOGIN_CLIENT_ID` / `GOOGLE_LOGIN_CLIENT_SECRET`：顧客 Google 登入可正確導向，並回到 `/api/auth/google/callback`。
- `GOOGLE_REFRESH_TOKEN`：Gmail API 寄信流程可以成功換取 access token。
- `LINE_CHANNEL_ACCESS_TOKEN`：LINE push / reply message API 呼叫成功。
- `LINE_CHANNEL_SECRET`：LINE webhook 簽章驗證成功。

## 🔒 金鑰輪替清單

如果金鑰外洩：

1. 到對應 provider 後台撤銷或重新產生金鑰。
2. 更新 Railway Variables。
3. 重新部署 API server。
4. 檢查 provider usage logs，確認是否有異常使用紀錄。
