#!/bin/bash

# GCP Service Account Setup Script
# This script creates the required service account and sets up permissions

set -e

# Load configuration if available
if [ -f "deployment/config.env" ]; then
    source deployment/config.env
else
    echo "❌ Configuration file deployment/config.env not found!"
    echo "Please run ./setup.sh first to create your configuration."
    exit 1
fi

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
echo "🔐 GCP Service Account Setup"
echo "============================"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

if ! command -v gcloud &> /dev/null; then
    print_error "gcloud CLI is not installed. Please install it first."
    echo "Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check authentication
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
    print_warning "Not authenticated with gcloud. Please login first."
    gcloud auth login
fi

# Set project
print_status "Setting project to $GCP_PROJECT_ID..."
gcloud config set project "$GCP_PROJECT_ID"

# Verify project exists
if ! gcloud projects describe "$GCP_PROJECT_ID" &>/dev/null; then
    print_error "Project $GCP_PROJECT_ID does not exist or you don't have access to it."
    exit 1
fi

print_success "Project verified: $GCP_PROJECT_ID"

# Enable required APIs
print_status "Enabling required APIs..."

apis=(
    "run.googleapis.com"
    "artifactregistry.googleapis.com"
    "cloudbuild.googleapis.com"
    "iam.googleapis.com"
)

for api in "${apis[@]}"; do
    print_status "Enabling $api..."
    gcloud services enable "$api"
done

print_success "All required APIs enabled"

# Create service account
print_status "Creating service account: $SERVICE_ACCOUNT_NAME..."

SA_EMAIL="$SERVICE_ACCOUNT_NAME@$GCP_PROJECT_ID.iam.gserviceaccount.com"

# Check if service account already exists
if gcloud iam service-accounts describe "$SA_EMAIL" &>/dev/null; then
    print_warning "Service account $SERVICE_ACCOUNT_NAME already exists"
else
    gcloud iam service-accounts create "$SERVICE_ACCOUNT_NAME" \
        --description="$SERVICE_ACCOUNT_DESCRIPTION" \
        --display-name="$SERVICE_ACCOUNT_DISPLAY_NAME"
    
    print_success "Service account created: $SA_EMAIL"
fi

# Grant required permissions
print_status "Granting IAM permissions..."

roles=(
    "roles/run.admin"
    "roles/artifactregistry.admin"
    "roles/storage.admin"
    "roles/iam.serviceAccountUser"
)

for role in "${roles[@]}"; do
    print_status "Granting $role..."
    gcloud projects add-iam-policy-binding "$GCP_PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$role" \
        --quiet
done

print_success "All IAM permissions granted"

# Create service account key
print_status "Creating service account key..."

KEY_FILE="github-actions-key.json"

if [ -f "$KEY_FILE" ]; then
    print_warning "Key file $KEY_FILE already exists"
    read -p "Do you want to create a new key? (y/N): " create_new
    if [[ $create_new =~ ^[Yy]$ ]]; then
        rm -f "$KEY_FILE"
    else
        print_status "Using existing key file"
        KEY_CREATED=false
    fi
fi

if [ ! -f "$KEY_FILE" ]; then
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SA_EMAIL"
    
    print_success "Service account key created: $KEY_FILE"
    KEY_CREATED=true
else
    KEY_CREATED=false
fi

# Create Artifact Registry repository
print_status "Creating Artifact Registry repository..."

if gcloud artifacts repositories describe "$REPOSITORY_NAME" \
    --location="$GAR_LOCATION" &>/dev/null; then
    print_warning "Artifact Registry repository $REPOSITORY_NAME already exists"
else
    gcloud artifacts repositories create "$REPOSITORY_NAME" \
        --repository-format=docker \
        --location="$GAR_LOCATION" \
        --description="$REPOSITORY_DESCRIPTION"
    
    print_success "Artifact Registry repository created: $REPOSITORY_NAME"
fi

# Configure Docker authentication
print_status "Configuring Docker authentication..."
gcloud auth configure-docker "$GAR_LOCATION-docker.pkg.dev"

print_success "Docker authentication configured"

# Summary
echo ""
print_success "🎉 GCP setup completed successfully!"
echo ""
echo "📋 Summary:"
echo "  • Project: $GCP_PROJECT_ID"
echo "  • Service Account: $SA_EMAIL"
echo "  • Repository: $GAR_LOCATION-docker.pkg.dev/$GCP_PROJECT_ID/$REPOSITORY_NAME"
echo "  • Region: $GCP_REGION"
echo ""

if [ "$KEY_CREATED" = true ]; then
    echo "🔑 Next Steps for GitHub Actions:"
    echo "1. Go to your GitHub repository settings"
    echo "2. Navigate to Secrets and variables > Actions"
    echo "3. Add the following secrets:"
    echo ""
    echo "   Secret: GCP_PROJECT_ID"
    echo "   Value:  $GCP_PROJECT_ID"
    echo ""
    echo "   Secret: GCP_SA_KEY"
    echo "   Value:  $(cat $KEY_FILE)"
    echo ""
    print_warning "⚠️  Keep the key file secure and delete it after adding to GitHub!"
    echo "   You can delete it with: rm $KEY_FILE"
else
    echo "🔑 GitHub Secrets:"
    echo "   Make sure you have these secrets configured in GitHub:"
    echo "   • GCP_PROJECT_ID: $GCP_PROJECT_ID"
    echo "   • GCP_SA_KEY: (contents of service account key)"
fi

echo ""
echo "🚀 Ready to deploy:"
echo "   ./deploy.sh"
echo ""