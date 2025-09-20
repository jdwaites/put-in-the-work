#!/bin/bash

# Deploy to Google Cloud Run
# This script can be used for manual deployments or local testing

set -e

# Load configuration from file if it exists
CONFIG_FILE="${CONFIG_FILE:-deployment/config.env}"
if [ -f "$CONFIG_FILE" ]; then
    print_status "Loading configuration from $CONFIG_FILE..."
    source "$CONFIG_FILE"
else
    print_warning "Configuration file $CONFIG_FILE not found. Using defaults and environment variables."
fi

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration - Can be overridden by environment variables or config file
PROJECT_ID="${GCP_PROJECT_ID:-}"
SERVICE_NAME="${SERVICE_NAME:-putting-in-the-work}"
REGION="${GCP_REGION:-us-central1}"
GAR_LOCATION="${GAR_LOCATION:-us-central1}"
IMAGE_TAG="${IMAGE_TAG:-$(git rev-parse --short HEAD 2>/dev/null || echo 'latest')}"

# Cloud Run Configuration
MEMORY="${CLOUD_RUN_MEMORY:-512Mi}"
CPU="${CLOUD_RUN_CPU:-1}"
MAX_INSTANCES="${CLOUD_RUN_MAX_INSTANCES:-10}"
MIN_INSTANCES="${CLOUD_RUN_MIN_INSTANCES:-0}"
PORT="${CLOUD_RUN_PORT:-8080}"
TIMEOUT="${CLOUD_RUN_TIMEOUT:-300}"
ALLOW_UNAUTHENTICATED="${ALLOW_UNAUTHENTICATED:-true}"

# Service Account Configuration
SERVICE_ACCOUNT_NAME="${SERVICE_ACCOUNT_NAME:-github-actions-deployer}"
REPOSITORY_NAME="${REPOSITORY_NAME:-putting-in-the-work}"

# Application Configuration
NODE_ENV="${NODE_ENV:-production}"

# Print colored output
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

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if gcloud is installed
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    # Check if project ID is set
    if [ -z "$PROJECT_ID" ]; then
        print_error "PROJECT_ID is not set. Please set GCP_PROJECT_ID environment variable or pass it as argument."
        echo "Usage: $0 [PROJECT_ID]"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Authenticate with GCP
authenticate_gcp() {
    print_status "Checking GCP authentication..."
    
    # Check if already authenticated
    if gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q "@"; then
        print_success "Already authenticated with GCP"
    else
        print_status "Authenticating with GCP..."
        gcloud auth login
    fi
    
    # Set project
    print_status "Setting project to $PROJECT_ID..."
    gcloud config set project "$PROJECT_ID"
    
    # Configure Docker
    print_status "Configuring Docker for Artifact Registry..."
    gcloud auth configure-docker "$GAR_LOCATION-docker.pkg.dev"
}

# Create Artifact Registry repository
create_artifact_registry() {
    print_status "Creating Artifact Registry repository..."
    
    gcloud artifacts repositories create "$REPOSITORY_NAME" \
        --repository-format=docker \
        --location="$GAR_LOCATION" \
        --description="Repository for $SERVICE_NAME" \
        --quiet || {
        print_warning "Repository might already exist"
    }
    
    print_success "Artifact Registry repository ready"
}

# Build and push Docker image
build_and_push() {
    print_status "Building Docker image..."
    
    IMAGE_URL="$GAR_LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME:$IMAGE_TAG"
    
    # Build the image
    docker build -t "$IMAGE_URL" .
    
    print_success "Docker image built successfully"
    
    print_status "Pushing image to Artifact Registry..."
    docker push "$IMAGE_URL"
    
    print_success "Image pushed successfully: $IMAGE_URL"
}

# Deploy to Cloud Run
deploy_to_cloudrun() {
    print_status "Deploying to Cloud Run..."
    
    IMAGE_URL="$GAR_LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME:$IMAGE_TAG"
    
    # Determine authentication flag
    AUTH_FLAG=""
    if [ "$ALLOW_UNAUTHENTICATED" = "true" ]; then
        AUTH_FLAG="--allow-unauthenticated"
    else
        AUTH_FLAG="--no-allow-unauthenticated"
    fi
    
    gcloud run deploy "$SERVICE_NAME" \
        --image="$IMAGE_URL" \
        --region="$REGION" \
        $AUTH_FLAG \
        --memory="$MEMORY" \
        --cpu="$CPU" \
        --max-instances="$MAX_INSTANCES" \
        --min-instances="$MIN_INSTANCES" \
        --port="$PORT" \
        --timeout="$TIMEOUT" \
        --set-env-vars=NODE_ENV="$NODE_ENV" \
        --quiet
    
    # Get service URL
    SERVICE_URL=$(gcloud run services describe "$SERVICE_NAME" --region="$REGION" --format="value(status.url)")
    
    print_success "Deployment completed successfully!"
    print_success "Service URL: $SERVICE_URL"
}

# Enable required APIs
enable_apis() {
    print_status "Enabling required GCP APIs..."
    
    gcloud services enable run.googleapis.com
    gcloud services enable artifactregistry.googleapis.com
    gcloud services enable cloudbuild.googleapis.com
    
    print_success "APIs enabled"
}

# Cleanup old images (optional)
cleanup_old_images() {
    if [ "$CLEANUP_OLD_IMAGES" = "true" ]; then
        print_status "Cleaning up old images..."
        
        KEEP_COUNT="${KEEP_IMAGE_COUNT:-5}"
        
        # Keep only the most recent images
        gcloud artifacts docker images list "$GAR_LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME" \
            --format="value(IMAGE)" \
            --sort-by="~UPDATE_TIME" \
            --limit="$KEEP_COUNT" > /tmp/keep_images.txt
        
        gcloud artifacts docker images list "$GAR_LOCATION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME/$SERVICE_NAME" \
            --format="value(IMAGE)" \
            --sort-by="~UPDATE_TIME" | \
            grep -v -f /tmp/keep_images.txt | \
            xargs -r gcloud artifacts docker images delete --quiet || true
        
        print_success "Cleanup completed"
    fi
}

# Main execution
main() {
    print_status "Starting deployment to Google Cloud Run..."
    
    # Parse arguments
    if [ $# -eq 1 ]; then
        PROJECT_ID="$1"
    fi
    
    check_prerequisites
    authenticate_gcp
    enable_apis
    create_artifact_registry
    build_and_push
    deploy_to_cloudrun
    cleanup_old_images
    
    print_success "Deployment process completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Visit your service at the URL above"
    echo "2. Configure custom domain if needed"
    echo "3. Set up monitoring and logging"
    echo "4. Configure environment variables if needed"
}

# Help function
show_help() {
    echo "Usage: $0 [PROJECT_ID]"
    echo ""
    echo "Environment variables:"
    echo "  GCP_PROJECT_ID    - GCP Project ID (required)"
    echo "  REGION           - Cloud Run region (default: us-central1)"
    echo "  GAR_LOCATION     - Artifact Registry location (default: us-central1)"
    echo "  IMAGE_TAG        - Docker image tag (default: git short hash)"
    echo "  CLEANUP          - Clean up old images (set to 'true' to enable)"
    echo ""
    echo "Examples:"
    echo "  $0 my-project-id"
    echo "  GCP_PROJECT_ID=my-project-id $0"
    echo "  CLEANUP=true $0 my-project-id"
}

# Check for help flag
if [ "$1" = "-h" ] || [ "$1" = "--help" ]; then
    show_help
    exit 0
fi

# Run main function
main "$@"