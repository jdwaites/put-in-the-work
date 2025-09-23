#!/bin/bash

# Quick Setup Script for GCP Deployment
# This script helps you configure your deployment environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Welcome message
echo "🚀 Putting in the Work - Deployment Setup"
echo "========================================"
echo ""

# Check if config already exists
if [ -f "deployment/config.env" ]; then
    print_warning "Configuration file deployment/config.env already exists."
    read -p "Do you want to overwrite it? (y/N): " overwrite
    if [[ ! $overwrite =~ ^[Yy]$ ]]; then
        echo "Setup cancelled."
        exit 0
    fi
fi

# Get project ID
echo ""
print_status "Setting up your GCP project configuration..."
read -p "Enter your GCP Project ID: " project_id

if [ -z "$project_id" ]; then
    print_error "Project ID is required!"
    exit 1
fi

# Get region preference
echo ""
print_status "Choose your deployment region:"
echo "1) us-central1 (Iowa) - Default"
echo "2) us-east1 (South Carolina)"
echo "3) us-west1 (Oregon)"
echo "4) europe-west1 (Belgium)"
echo "5) asia-east1 (Taiwan)"
echo "6) Custom region"

read -p "Select option (1-6): " region_choice

case $region_choice in
    1|"") region="us-central1" ;;
    2) region="us-east1" ;;
    3) region="us-west1" ;;
    4) region="europe-west1" ;;
    5) region="asia-east1" ;;
    6) 
        read -p "Enter custom region: " region
        if [ -z "$region" ]; then
            region="us-central1"
        fi
        ;;
    *) region="us-central1" ;;
esac

# Get service name
echo ""
read -p "Service name [putting-in-the-work]: " service_name
service_name=${service_name:-putting-in-the-work}

# Get resource configuration
echo ""
print_status "Configure Cloud Run resources:"
read -p "Memory allocation [512Mi]: " memory
memory=${memory:-512Mi}

read -p "CPU allocation [1]: " cpu
cpu=${cpu:-1}

read -p "Maximum instances [10]: " max_instances
max_instances=${max_instances:-10}

# Authentication setting
echo ""
read -p "Allow unauthenticated access? (Y/n): " allow_unauth
if [[ $allow_unauth =~ ^[Nn]$ ]]; then
    allow_unauth="false"
else
    allow_unauth="true"
fi

# Create configuration file
print_status "Creating configuration file..."

cat > deployment/config.env << EOF
# Deployment Configuration for Putting in the Work
# Generated on $(date)

# ================================
# GCP PROJECT CONFIGURATION
# ================================
GCP_PROJECT_ID=$project_id
GCP_REGION=$region
GAR_LOCATION=$region

# ================================
# APPLICATION CONFIGURATION
# ================================
SERVICE_NAME=$service_name
IMAGE_TAG=latest

# ================================
# CLOUD RUN CONFIGURATION
# ================================
# Resource limits
CLOUD_RUN_MEMORY=$memory
CLOUD_RUN_CPU=$cpu
CLOUD_RUN_MAX_INSTANCES=$max_instances
CLOUD_RUN_MIN_INSTANCES=0
CLOUD_RUN_PORT=8080
CLOUD_RUN_TIMEOUT=300
CLOUD_RUN_CONCURRENCY=1000

# Environment variables for the application
NODE_ENV=production

# ================================
# SERVICE ACCOUNT CONFIGURATION
# ================================
SERVICE_ACCOUNT_NAME=github-actions-deployer
SERVICE_ACCOUNT_DISPLAY_NAME="GitHub Actions Deployer"
SERVICE_ACCOUNT_DESCRIPTION="Service account for GitHub Actions Cloud Run deployment"

# ================================
# ARTIFACT REGISTRY CONFIGURATION
# ================================
REPOSITORY_NAME=$service_name
REPOSITORY_DESCRIPTION="Repository for $service_name application"

# ================================
# SECURITY CONFIGURATION
# ================================
# Set to 'true' to allow unauthenticated access to Cloud Run service
ALLOW_UNAUTHENTICATED=$allow_unauth
# Set ingress policy: 'all', 'internal', 'internal-and-cloud-load-balancing'
INGRESS_POLICY=all

# ================================
# OPTIONAL CONFIGURATIONS
# ================================
# Custom domain (leave empty if not using)
CUSTOM_DOMAIN=""
# Enable cleanup of old images (true/false)
CLEANUP_OLD_IMAGES=false
# Number of images to keep when cleaning up
KEEP_IMAGE_COUNT=5
EOF

print_success "Configuration file created at deployment/config.env"

# Show next steps
echo ""
print_status "Next Steps:"
echo "1. Review and edit deployment/config.env if needed"
echo "2. Set up GCP service account:"
echo "   ./setup-gcp.sh"
echo "3. Add GitHub secrets:"
echo "   - GCP_PROJECT_ID: $project_id"
echo "   - GCP_SA_KEY: (contents of service account key file)"
echo "4. Deploy:"
echo "   ./deploy.sh"
echo ""
print_success "Setup complete! 🎉"