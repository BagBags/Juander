# 🤖 OpenAI API Migration Guide

## ✅ Changes Made:

### Frontend:
1. ✅ Removed Puter.js from `index.html`
2. ✅ Updated `Chatbot.jsx` to use backend OpenAI API
3. ✅ Added `VITE_USE_OPENAI=true` to `.env.production`

### Backend:
1. ✅ Created `/api/openai/chat` endpoint in `routes/openaiRoute.js`
2. ✅ Added route to `server.js`
3. ✅ Created `.env.example` with `OPENAI_API_KEY`

---

## 🚀 Deployment Steps:

### Step 1: Add OpenAI API Key to Backend

**⚠️ CRITICAL: Add to Elastic Beanstalk Environment Variables**

1. **AWS Console** → **Elastic Beanstalk**
2. Select environment: `juander-backend-env`
3. **Configuration** → **Software** → **Edit**
4. **Environment properties** → Add:
   ```
   Name: OPENAI_API_KEY
   Value: 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
   ```
5. **Apply** changes
6. **Wait** for environment to update (~5 minutes)

---

### Step 2: Deploy Backend

```bash
cd D:\Desktop\Juander\backend

# Create ZIP (use 7-Zip method)
# Run: CREATE_ZIP_7ZIP.bat

# Upload to Elastic Beanstalk:
# - AWS Console → Elastic Beanstalk
# - Environment: juander-backend-env
# - Upload: juander-backend-UNIX.zip
# - Version: v10-openai-migration
# - Deploy
```

**Wait:** 10-15 minutes for deployment ✅

---

### Step 3: Test Backend API

After backend deployment, test the OpenAI endpoint:

```bash
curl -X POST https://d3des4qdhz53rp.cloudfront.net/api/openai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      {"role": "system", "content": "You are a helpful assistant."},
      {"role": "user", "content": "Say hello"}
    ],
    "model": "gpt-4o-mini",
    "temperature": 0,
    "max_tokens": 50
  }'
```

**Expected Response:**
```json
{
  "message": "Hello! How can I assist you today?"
}
```

---

### Step 4: Deploy Frontend

```bash
cd D:\Desktop\Juander\frontend

# Rebuild
npm run build

# Upload to S3
# - Delete all files in juander-frontend bucket
# - Upload all files from frontend/dist/

# Invalidate CloudFront
# - Distribution: d39zx5gyblzxjs.cloudfront.net
# - Paths: /*
# - Wait 5-10 minutes
```

---

### Step 5: Test Chatbot

1. Visit: `https://d39zx5gyblzxjs.cloudfront.net`
2. Open chatbot
3. Ask: "Tell me about Intramuros"
4. Should get response from OpenAI! ✅

---

## 🔍 How It Works:

### Old Flow (Puter.js):
```
Frontend → Puter.js (browser) → Puter API → OpenAI
```

### New Flow (Direct OpenAI):
```
Frontend → Backend API → OpenAI
```

### Benefits:
- ✅ **Secure**: API key hidden in backend
- ✅ **Faster**: Direct API calls
- ✅ **Reliable**: No third-party dependency
- ✅ **PWA Compatible**: No external scripts

---

## 📋 API Endpoint Details:

### POST `/api/openai/chat`

**Request Body:**
```json
{
  "messages": [
    {"role": "system", "content": "System prompt"},
    {"role": "user", "content": "User message"}
  ],
  "model": "gpt-4o-mini",
  "temperature": 0,
  "max_tokens": 500
}
```

**Response:**
```json
{
  "message": "AI response text"
}
```

**Error Response:**
```json
{
  "error": "Error message",
  "details": "Detailed error info"
}
```

---

## 🔒 Security Notes:

### ✅ Good Practices:
- API key stored in backend environment variables
- Never exposed to frontend
- CORS configured to allow only your domain
- Rate limiting can be added if needed

### ❌ Never Do This:
- Don't hardcode API keys in frontend code
- Don't commit API keys to Git
- Don't expose API keys in client-side JavaScript

---

## 💰 Cost Monitoring:

**OpenAI Pricing (gpt-4o-mini):**
- Input: $0.150 / 1M tokens
- Output: $0.600 / 1M tokens

**Estimate:**
- Average chat: ~500 tokens
- Cost per chat: ~$0.0004
- 1000 chats: ~$0.40

**Monitor usage:**
- OpenAI Dashboard: https://platform.openai.com/usage

---

## 🆘 Troubleshooting:

### Error: "OpenAI API key not configured"
**Solution:** Add `OPENAI_API_KEY` to Elastic Beanstalk environment variables

### Error: "Failed to get response from OpenAI"
**Solution:** Check backend logs for detailed error message

### Chatbot not responding
**Solution:** 
1. Check browser console for errors
2. Verify backend API is deployed
3. Test backend endpoint directly with curl

### PWA still showing AccessDenied
**Solution:** 
1. Clear service worker cache
2. Reinstall PWA
3. Puter.js is now removed, should work!

---

## 📝 Files Changed:

### Frontend:
- `frontend/index.html` - Removed Puter.js
- `frontend/.env.production` - Added VITE_USE_OPENAI
- `frontend/src/components/userComponents/ChatbotComponents/Chatbot.jsx` - Uses backend API

### Backend:
- `backend/routes/openaiRoute.js` - New OpenAI API route
- `backend/server.js` - Added OpenAI route
- `backend/.env.example` - Added OPENAI_API_KEY example

---

## ✅ Checklist:

- [ ] Added OPENAI_API_KEY to Elastic Beanstalk environment variables
- [ ] Deployed backend with new OpenAI route
- [ ] Tested backend API endpoint
- [ ] Rebuilt frontend without Puter.js
- [ ] Uploaded frontend to S3
- [ ] Invalidated CloudFront cache
- [ ] Tested chatbot functionality
- [ ] Verified PWA works without AccessDenied errors

---

**🎉 Migration Complete! Your chatbot now uses OpenAI API directly!**
