# 🔗 AWS WAF Integration - Complete Step-by-Step Guide

## 📋 Table of Contents
- [Prerequisites](#prerequisites)
- [Part 1: AWS Console Setup](#part-1-aws-console-setup)
- [Part 2: Backend Integration](#part-2-backend-integration)
- [Part 3: Testing](#part-3-testing)
- [Part 4: Production Deployment](#part-4-production-deployment)
- [Troubleshooting](#troubleshooting)
- [Cost Management](#cost-management)

---

## Prerequisites

✅ **Required:**
- Active AWS account
- AWS Console access
- DefenDDoS backend running
- PowerShell (Windows) or Bash (Linux/Mac)

✅ **Recommended:**
- AWS CLI installed
- Basic understanding of AWS IAM and WAF

---

## Part 1: AWS Console Setup

### Step 1.1: Create IAM User (5 minutes)

1. **Open AWS Console** → Search for **"IAM"** → Click **IAM**
2. Left sidebar → **Users** → **Create user**
3. Configure user:
   ```
   User name: defenddos-waf-user
   ```
4. Click **Next**
5. **Permissions options**: Select **Attach policies directly**
6. Search for: `WAFv2FullAccess`
7. ✅ Check the box next to **WAFv2FullAccess**
8. Click **Next** → **Create user**

### Step 1.2: Create Access Keys (3 minutes)

1. Click on **defenddos-waf-user** (the user you just created)
2. **Security credentials** tab
3. Scroll to **Access keys** section → **Create access key**
4. Select **Application running outside AWS** → **Next**
5. Description tag: `DefenDDoS Backend Integration`
6. Click **Create access key**

**⚠️ CRITICAL:** Copy these credentials NOW (won't be shown again):
```
Access key ID: AKIAIOSFODNN7EXAMPLE
Secret access key: wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

7. Click **Done**

---

### Step 1.3: Create AWS WAF IP Set (5 minutes)

1. AWS Console search → **"WAF"** → **WAF & Shield**
2. Left sidebar → **IP sets** → **Create IP set**
3. Configure IP set:
   ```
   IP set name: DefenDDoS-Blocklist
   Region: Global (CloudFront)  ← Important for CloudFront protection
   IP version: IPv4
   IP addresses: Leave empty (or add test IP: 203.0.113.42/32)
   Description: Blocked IPs from DefenDDoS ML system
   ```
4. Click **Create IP set**
5. **⚠️ COPY THE IP SET ARN** - looks like:
   ```
   arn:aws:wafv2:global:123456789012:global/ipset/defenddos-blocklist/a1b2c3d4-e5f6-7890-abcd-ef1234567890
   ```

---

### Step 1.4: Create Web ACL (Optional - 10 minutes)

**Note:** Skip this if you already have a Web ACL for your CloudFront/ALB.

1. WAF console → **Web ACLs** → **Create web ACL**
2. Configure Web ACL:
   ```
   Name: DefenDDoS-Protection
   Description: DDoS protection using ML-detected threats
   Resource type: CloudFront distributions (or Regional for ALB)
   Region: Global (CloudFront)
   ```
3. Click **Next**
4. **Add rules** → **Add my own rules and rule groups** → **Rule builder**
5. Configure rule:
   ```
   Name: BlockDefenDDoSIPs
   Type: IP set
   IP set: DefenDDoS-Blocklist (select from dropdown)
   IP address to use: Source IP address
   Action: Block
   ```
6. Click **Add rule** → **Next** → **Next**
7. **Default action**: **Allow** (allow all traffic except blocked IPs)
8. Click **Next** → **Create web ACL**

---

## Part 2: Backend Integration

### Step 2.1: Automated Setup (Recommended - 2 minutes)

Run the automated setup script:

```powershell
cd backend-service
.\setup-aws-waf.ps1
```

This script will:
- ✅ Verify AWS CLI installation
- ✅ Create IP Set via AWS CLI
- ✅ Generate `.env` file with credentials
- ✅ Enable AWS WAF in `application.properties`

**Follow the prompts:**
1. Enter AWS Access Key ID (from Step 1.2)
2. Enter AWS Secret Access Key (from Step 1.2)
3. Select region (1 for Global CloudFront)

---

### Step 2.2: Manual Setup (Alternative - 5 minutes)

If you prefer manual setup or the script fails:

#### 2.2.1: Create .env file

Create `backend-service/.env`:
```properties
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
AWS_WAF_IPSET_ID=arn:aws:wafv2:global:123456789012:global/ipset/defenddos-blocklist/a1b2c3d4...
AWS_REGION=us-east-1
```

#### 2.2.2: Update application.properties

Edit `src/main/resources/application.properties`:
```properties
# Change this line:
aws.waf.enabled=false
# To:
aws.waf.enabled=true
```

---

### Step 2.3: Build and Run (5 minutes)

1. **Build the project:**
```powershell
cd backend-service
.\mvnw clean package -DskipTests
```

2. **Load environment variables and run:**
```powershell
# Load .env file
Get-Content .env | ForEach-Object {
    if ($_ -match '^([^=]+)=(.*)$') {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], 'Process')
    }
}

# Run the backend
java -jar target/backend-service-0.0.1-SNAPSHOT.jar
```

3. **Verify startup logs:**
Look for these messages:
```
✅ AWS WAF client initialized for region: us-east-1
INFO  AWSWAFConfig - AWS WAF integration enabled
```

---

## Part 3: Testing

### Step 3.1: Automated Test (Recommended - 2 minutes)

Run the test script:
```powershell
cd backend-service
.\test-aws-waf.ps1
```

This will:
1. ✅ Check backend health
2. ✅ Get AWS WAF stats
3. ✅ Block a test IP (203.0.113.42)
4. ✅ Wait for sync (60 seconds)
5. ✅ Verify IP synced to AWS WAF

---

### Step 3.2: Manual Testing (Alternative - 5 minutes)

#### Test 1: Get WAF Stats
```powershell
curl http://localhost:8081/api/waf/stats
```

Expected response:
```json
{
  "enabled": true,
  "pendingSync": 0,
  "ipSetName": "DefenDDoS-Blocklist",
  "scope": "CLOUDFRONT",
  "totalIPsInWAF": 0
}
```

#### Test 2: Block an IP
```powershell
$body = @{
    ipAddress = "203.0.113.42"
    reason = "AWS WAF integration test"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:8081/api/mitigation/block" `
    -Method Post `
    -Body $body `
    -ContentType "application/json"
```

#### Test 3: Verify Sync (after 60 seconds)
```powershell
curl http://localhost:8081/api/waf/stats
```

Expected response:
```json
{
  "enabled": true,
  "pendingSync": 0,
  "ipSetName": "DefenDDoS-Blocklist",
  "scope": "CLOUDFRONT",
  "totalIPsInWAF": 1
}
```

#### Test 4: Verify in AWS Console
1. AWS Console → **WAF & Shield** → **IP sets**
2. Click **DefenDDoS-Blocklist**
3. ✅ Verify `203.0.113.42/32` appears in the list

---

## Part 4: Production Deployment

### Option A: Docker Compose

Add to `docker-compose.yml`:
```yaml
services:
  backend:
    environment:
      - AWS_ACCESS_KEY_ID=${AWS_ACCESS_KEY_ID}
      - AWS_SECRET_ACCESS_KEY=${AWS_SECRET_ACCESS_KEY}
      - AWS_WAF_IPSET_ID=${AWS_WAF_IPSET_ID}
      - AWS_REGION=us-east-1
```

### Option B: Kubernetes

Create secret:
```bash
kubectl create secret generic aws-waf-credentials \
  --from-literal=access-key-id=YOUR_ACCESS_KEY \
  --from-literal=secret-access-key=YOUR_SECRET_KEY \
  --from-literal=ipset-id=YOUR_IPSET_ARN
```

Update deployment:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: defenddos-backend
spec:
  template:
    spec:
      containers:
      - name: backend
        env:
        - name: AWS_ACCESS_KEY_ID
          valueFrom:
            secretKeyRef:
              name: aws-waf-credentials
              key: access-key-id
        - name: AWS_SECRET_ACCESS_KEY
          valueFrom:
            secretKeyRef:
              name: aws-waf-credentials
              key: secret-access-key
        - name: AWS_WAF_IPSET_ID
          valueFrom:
            secretKeyRef:
              name: aws-waf-credentials
              key: ipset-id
```

### Option C: AWS IAM Role (Recommended)

If running on AWS EC2/ECS/EKS:

1. Create IAM role with `WAFv2FullAccess` policy
2. Attach role to EC2 instance / ECS task / EKS service account
3. Remove AWS credentials from environment (auto-detected)

---

## Troubleshooting

### Issue 1: "AWS WAF client not initialized"

**Cause:** Missing or invalid credentials

**Solution:**
1. Verify `.env` file exists and has correct credentials
2. Check environment variables are loaded:
   ```powershell
   $env:AWS_ACCESS_KEY_ID
   $env:AWS_SECRET_ACCESS_KEY
   $env:AWS_WAF_IPSET_ID
   ```
3. Restart backend after loading variables

---

### Issue 2: "IP Set not found"

**Cause:** Invalid IP Set ID or wrong region

**Solution:**
1. Verify IP Set ARN in AWS Console
2. Check region matches (Global = us-east-1)
3. Update `AWS_WAF_IPSET_ID` in `.env`

---

### Issue 3: "Access Denied" error

**Cause:** IAM user lacks permissions

**Solution:**
1. AWS Console → IAM → Users → defenddos-waf-user
2. Verify **WAFv2FullAccess** policy is attached
3. If using custom policy, ensure these actions:
   ```json
   {
     "Effect": "Allow",
     "Action": [
       "wafv2:GetIPSet",
       "wafv2:UpdateIPSet",
       "wafv2:CreateIPSet"
     ],
     "Resource": "*"
   }
   ```

---

### Issue 4: IPs not syncing

**Cause:** Sync disabled or scheduled task not running

**Solution:**
1. Check `application.properties`:
   ```properties
   aws.waf.sync.enabled=true
   aws.waf.sync.interval-seconds=60
   ```
2. Manually trigger sync:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:8081/api/waf/sync" -Method Post
   ```
3. Check backend logs for sync errors

---

## Cost Management

### AWS WAF Pricing

| Component | Cost | Calculation |
|-----------|------|-------------|
| **Web ACL** | $5/month | Fixed |
| **Rule** | $1/month per rule | 1 rule = $1/month |
| **IP Set** | $1/month per 1,000 IPs | 100 IPs = $1/month |
| **Request evaluation** | $0.60 per million | 10M requests = $6/month |
| **IP Set updates** | Free | Unlimited updates |

**Example costs:**
- **Small site** (1M requests, 100 blocked IPs): ~$7/month
- **Medium site** (10M requests, 1,000 blocked IPs): ~$13/month
- **Large site** (100M requests, 5,000 blocked IPs): ~$70/month

### Cost Optimization Tips

1. **Use IP Set efficiently:**
   - Remove old IPs automatically (implement TTL)
   - Keep only active threats

2. **Monitor costs:**
   - AWS Cost Explorer → Filter by "WAF"
   - Set up billing alerts

3. **Free alternatives:**
   - Use DefenDDoS alone (no AWS WAF)
   - CloudFlare Free Tier (100k requests/month)
   - Nginx rate limiting (self-hosted)

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                         Internet                              │
└──────────────────────┬───────────────────────────────────────┘
                       │
                       ▼
             ┌─────────────────────┐
             │   AWS WAF (Layer 1)  │
             │ Blocks known threats │
             │ from IP Set          │
             └──────────┬───────────┘
                        │ Clean traffic
                        ▼
              ┌──────────────────────┐
              │  DefenDDoS (Layer 2)  │
              │  ML-based detection   │
              │  Real-time analysis   │
              └──────────┬────────────┘
                         │
                         ▼ Sync blocked IPs (every 60s)
              ┌──────────────────────┐
              │   AWS WAF IP Set     │
              │  (Bidirectional)     │
              └──────────────────────┘
```

---

## Success Checklist

- [ ] IAM user created with WAFv2FullAccess
- [ ] Access keys generated and saved
- [ ] IP Set created in AWS WAF
- [ ] Web ACL created (optional but recommended)
- [ ] `.env` file created with credentials
- [ ] `aws.waf.enabled=true` in application.properties
- [ ] Backend built successfully
- [ ] Backend running with AWS WAF logs visible
- [ ] Test IP blocked via API
- [ ] IP synced to AWS WAF (verified in console)
- [ ] Cost alerts configured in AWS

---

## Next Steps

1. **Monitor AWS WAF in production:**
   - AWS Console → WAF & Shield → Web ACLs → Metrics
   - View blocked requests in real-time

2. **Integrate with CloudFront/ALB:**
   - Associate Web ACL with your CloudFront distribution
   - Or attach to Application Load Balancer

3. **Set up alerting:**
   - CloudWatch alarms for blocked requests
   - SNS notifications for high attack rates

4. **Optimize costs:**
   - Review blocked IPs monthly
   - Remove old/inactive IPs
   - Monitor AWS Cost Explorer

---

## Support

**Issues?** Check troubleshooting section above or:
- Review backend logs: `logs/backend-service.log`
- Check AWS CloudTrail for WAF API calls
- Verify IAM permissions in AWS Console

**Questions?** Create an issue in GitHub repository.

---

✅ **Integration Complete!** Your DefenDDoS system now syncs blocked IPs with AWS WAF for layered protection.
