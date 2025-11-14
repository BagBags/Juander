# Fix: Access Denied Error on Refresh

## Problem
When refreshing your hosted Juander app, you get an "Access Denied" error. This happens because:
1. The frontend tries to load images/files from S3
2. S3 bucket doesn't allow public access to the `uploads/` folder
3. CORS might not be configured for your production domain

## Solution

### Step 1: Make S3 Bucket Public for Uploads

1. Go to [AWS S3 Console](https://s3.console.aws.amazon.com/s3/)
2. Click on your bucket: `juander-frontend`
3. Go to **Permissions** tab

#### A. Unblock Public Access
1. Click **Edit** on "Block public access"
2. **UNCHECK** all 4 options:
   - ☐ Block all public access
   - ☐ Block public access to buckets and objects granted through new access control lists (ACLs)
   - ☐ Block public access to buckets and objects granted through any access control lists (ACLs)
   - ☐ Block public access to buckets and objects granted through new public bucket or access point policies
   - ☐ Block public and cross-account access to buckets and objects through any public bucket or access point policies
3. Click **Save changes**
4. Type `confirm` and click **Confirm**

#### B. Add Bucket Policy
1. Scroll down to **Bucket policy**
2. Click **Edit**
3. Paste this policy (replace `juander-frontend` if your bucket name is different):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": [
        "arn:aws:s3:::juander-frontend/*",
        "arn:aws:s3:::juander-frontend/uploads/*"
      ]
    }
  ]
}
```

4. Click **Save changes**

### Step 2: Configure CORS

1. Still in the **Permissions** tab
2. Scroll down to **Cross-origin resource sharing (CORS)**
3. Click **Edit**
4. Paste this configuration:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:5000",
      "http://juander-frontend.s3-website-ap-southeast-2.amazonaws.com",
      "https://d39zx5gyblzxjs.cloudfront.net",
      "https://d3des4qdhz53rp.cloudfront.net",
      "*"
    ],
    "ExposeHeaders": ["ETag", "Content-Length"],
    "MaxAgeSeconds": 3000
  }
]
```

5. Click **Save changes**

### Step 3: Verify Backend CORS Configuration

Your backend already has CORS configured in `server.js`. Make sure your production domain is included:

```javascript
cors({
  origin: [
    "http://localhost:5173",
    "http://juander-frontend.s3-website-ap-southeast-2.amazonaws.com",
    "https://d39zx5gyblzxjs.cloudfront.net",
    "https://d3des4qdhz53rp.cloudfront.net",
  ],
  credentials: true,
})
```

If you're accessing from a different domain, add it to this list.

### Step 4: Check Environment Variables

Make sure your backend `.env` has these set:

```env
AWS_REGION=ap-southeast-2
AWS_ACCESS_KEY_ID=your_access_key_id
AWS_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET_NAME=juander-frontend
```

### Step 5: Test

1. Clear your browser cache
2. Refresh your hosted app
3. Open browser DevTools (F12) → Network tab
4. Look for any failed requests
5. Check if images load from S3

## Common Issues

### Issue 1: Still Getting Access Denied
- **Check**: Is the S3 URL correct in the database?
- **Expected format**: `https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/folder/file.png`
- **Fix**: Update database records if they have wrong URLs

### Issue 2: CORS Error
- **Symptom**: Console shows "CORS policy: No 'Access-Control-Allow-Origin' header"
- **Fix**: Double-check CORS configuration in S3 includes your domain

### Issue 3: 403 Forbidden
- **Symptom**: Images return 403 status code
- **Fix**: Check bucket policy allows `s3:GetObject` for all resources

### Issue 4: Files Upload But Can't Be Viewed
- **Check**: IAM user has `s3:PutObject` and `s3:PutObjectAcl` permissions
- **Fix**: Update IAM policy to include these permissions

## Security Note

The bucket policy above makes ALL files in your bucket publicly readable. This is necessary for:
- Frontend static files (HTML, CSS, JS)
- User-uploaded images (profile pics, reviews, etc.)
- Photobooth filters

If you need more security:
1. Use signed URLs for sensitive files
2. Implement CloudFront with signed cookies
3. Use separate buckets for public vs private content

## Verification Checklist

- [ ] S3 bucket public access is enabled
- [ ] Bucket policy allows `s3:GetObject` for all files
- [ ] CORS configuration includes your production domain
- [ ] Backend environment variables are set correctly
- [ ] Files are uploading to S3 (check S3 console)
- [ ] File URLs in database are correct S3 URLs
- [ ] Browser can load images directly from S3 URLs
- [ ] No CORS errors in browser console
- [ ] App works after refresh

## Still Having Issues?

1. Check CloudWatch logs for backend errors
2. Check browser console for frontend errors
3. Verify S3 URLs are accessible in a new incognito window
4. Test with a simple curl command:
   ```bash
   curl -I https://juander-frontend.s3.ap-southeast-2.amazonaws.com/uploads/test-file.png
   ```
