#!/bin/bash

# Force Render to Redeploy Backend
# This adds an empty commit to trigger Render's auto-deploy

echo "🔄 Forcing Render redeploy..."

cd /Users/rubeenakhan/Downloads/CRM/crm-backend-main

# Create an empty commit to trigger deployment
git commit --allow-empty -m "chore: trigger Render redeploy for gzip header fix"

# Push to trigger Render
git push origin master

echo "✅ Empty commit pushed to trigger Render deployment"
echo "⏳ Check Render dashboard: https://dashboard.render.com/"
echo "   Look for service: crm-backend-fh34"
echo "   Status should change to: Building → Deploying → Live"
echo "   ETA: 2-3 minutes"
