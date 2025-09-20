# GCP Cloud Run Deployment Setup Guide

This guide will help you set up Google Cloud Platform (GCP) for deploying the "Putting in the Work" application to Cloud Run using GitHub Actions.

## Prerequisites

- Google Cloud Platform account
- GitHub repository with admin access
- `gcloud` CLI installed locally (for manual deployments)
- Docker installed locally (for manual deployments)

## 1. GCP Project Setup

### Create a new GCP project (or use existing)

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your `PROJECT_ID` - you'll need this later

### Enable Required APIs

```bash
gcloud services enable run.googleapis.com
gcloud services enable artifactregistry.googleapis.com
gcloud services enable cloudbuild.googleapis.com
```

## 2. Service Account Setup

### Create a service account for GitHub Actions

```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions-deployer \
    --description="Service account for GitHub Actions Cloud Run deployment" \
    --display-name="GitHub Actions Deployer"

# Get the service account email
export SA_EMAIL="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"
```

### Grant necessary permissions

```bash
# Cloud Run Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

# Artifact Registry Admin
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.admin"

# Storage Admin (for Cloud Build)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

# Service Account User (to deploy Cloud Run services)
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"
```

### Create and download service account key

```bash
# Create key file
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL

# The key file will be downloaded to your current directory
# Keep this file secure - you'll need its contents for GitHub Secrets
```

## 3. GitHub Repository Secrets Setup

Add the following secrets to your GitHub repository:

1. Go to your GitHub repository
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets

| Secret Name | Value | Description |
|-------------|--------|-------------|
| `GCP_PROJECT_ID` | Your GCP project ID | The Google Cloud project where resources will be created |
| `GCP_SA_KEY` | Contents of `github-actions-key.json` | The entire JSON content of the service account key file |

### Example of setting up secrets:

1. **GCP_PROJECT_ID**: 
   - Name: `GCP_PROJECT_ID`
   - Value: `my-project-12345`

2. **GCP_SA_KEY**:
   - Name: `GCP_SA_KEY`
   - Value: The entire contents of the `github-actions-key.json` file (including the curly braces)

## 4. Optional: Workload Identity Federation (More Secure)

For enhanced security, you can use Workload Identity Federation instead of service account keys:

### Create Workload Identity Pool

```bash
# Create workload identity pool
gcloud iam workload-identity-pools create "github-pool" \
    --location="global" \
    --description="Pool for GitHub Actions"

# Create workload identity provider
gcloud iam workload-identity-pools providers create-oidc "github-provider" \
    --location="global" \
    --workload-identity-pool="github-pool" \
    --issuer-uri="https://token.actions.githubusercontent.com" \
    --attribute-mapping="google.subject=assertion.sub,attribute.repository=assertion.repository,attribute.actor=assertion.actor" \
    --attribute-condition="assertion.repository=='your-username/put-in-the-work'"
```

### Configure Service Account for Workload Identity

```bash
# Allow GitHub Actions to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding $SA_EMAIL \
    --role="roles/iam.workloadIdentityUser" \
    --member="principalSet://iam.googleapis.com/projects/$(gcloud config get-value project)/locations/global/workloadIdentityPools/github-pool/attribute.repository/your-username/put-in-the-work"
```

### Update GitHub Actions workflow (if using Workload Identity)

Replace the authentication step in `.github/workflows/deploy.yml`:

```yaml
- name: Google Auth
  id: auth
  uses: 'google-github-actions/auth@v2'
  with:
    workload_identity_provider: 'projects/PROJECT_NUMBER/locations/global/workloadIdentityPools/github-pool/providers/github-provider'
    service_account: 'github-actions-deployer@PROJECT_ID.iam.gserviceaccount.com'
```

## 5. Local Development Setup

### Install gcloud CLI

```bash
# On macOS
brew install google-cloud-sdk

# On Ubuntu/Debian
sudo apt-get install google-cloud-cli

# On other systems, follow: https://cloud.google.com/sdk/docs/install
```

### Authenticate and configure

```bash
# Login to GCP
gcloud auth login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Configure Docker for Artifact Registry
gcloud auth configure-docker us-central1-docker.pkg.dev
```

### Manual deployment

```bash
# Clone the repository
git clone https://github.com/your-username/put-in-the-work.git
cd put-in-the-work

# Run the deployment script
./deploy.sh YOUR_PROJECT_ID
```

## 6. Environment Variables and Configuration

### Environment Variables for Cloud Run

The application supports the following environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node.js environment |
| `PORT` | `8080` | Port for the application |

### Updating Environment Variables

To add or update environment variables, modify the GitHub Actions workflow or use gcloud:

```bash
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --set-env-vars="NODE_ENV=production,CUSTOM_VAR=value"
```

## 7. Monitoring and Logging

### Enable Cloud Logging

Logs are automatically available in Cloud Logging:

```bash
# View logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=putting-in-the-work" --limit=50
```

### Set up monitoring

1. Go to Cloud Monitoring in the GCP Console
2. Create alerts for service availability and response times
3. Set up uptime checks for your service URL

## 8. Custom Domain Setup (Optional)

### Map a custom domain

```bash
# Map domain to Cloud Run service
gcloud run domain-mappings create \
    --service=putting-in-the-work \
    --domain=yourdomain.com \
    --region=us-central1
```

## 9. Security Considerations

### Recommended security practices:

1. **Use Workload Identity Federation** instead of service account keys when possible
2. **Restrict IAM permissions** to the minimum required
3. **Enable audit logging** for Cloud Run services
4. **Use Cloud Armor** for DDoS protection if needed
5. **Implement HTTPS-only** (Cloud Run provides this by default)
6. **Regular key rotation** for service account keys

### Network Security

```bash
# Restrict ingress to Cloud Run service (if needed)
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --ingress=internal-and-cloud-load-balancing
```

## 10. Troubleshooting

### Common issues and solutions:

1. **Build failures**: Check that all required files are present in the repository
2. **Permission denied**: Verify service account has all required roles
3. **Image not found**: Ensure Artifact Registry repository exists and is accessible
4. **Service unavailable**: Check Cloud Run service logs for startup errors

### Useful commands for debugging:

```bash
# Check service status
gcloud run services describe putting-in-the-work --region=us-central1

# View service logs
gcloud logs read "resource.type=cloud_run_revision" --limit=20

# List all Cloud Run services
gcloud run services list

# Get service URL
gcloud run services describe putting-in-the-work --region=us-central1 --format="value(status.url)"
```

## 11. Cost Optimization

### Cloud Run pricing factors:

- **CPU allocation**: Only charged when processing requests
- **Memory allocation**: Optimize based on actual usage
- **Request count**: Number of requests processed
- **Outbound networking**: Data transfer costs

### Optimization tips:

```bash
# Reduce cold starts with minimum instances
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --min-instances=1

# Optimize memory allocation
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --memory=256Mi
```

---

## Quick Start Checklist

- [ ] Create GCP project and enable APIs
- [ ] Create service account with required permissions
- [ ] Download service account key
- [ ] Add `GCP_PROJECT_ID` and `GCP_SA_KEY` to GitHub Secrets
- [ ] Push code to main branch to trigger deployment
- [ ] Verify deployment at the provided Cloud Run URL

For questions or issues, refer to the [Cloud Run documentation](https://cloud.google.com/run/docs) or create an issue in this repository.