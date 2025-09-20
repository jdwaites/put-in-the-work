# Putting in the Work

A comprehensive fitness tracking application for families, built with React, Firebase, and deployed on Google Cloud Run.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

"Putting in the Work" is a family-friendly fitness tracking application that helps monitor and analyze health and wellness activities. The application provides comprehensive tracking, reporting, and analytics capabilities for multiple family members.

## Features

- 📊 **Performance Analytics** - Detailed charts and metrics
- 👥 **Multi-Profile Support** - Track multiple family members
- ⏱️ **Timer Functionality** - Built-in workout timers
- 📈 **Progress Tracking** - Long-term progress monitoring
- 📋 **Exercise Routines** - Customizable workout plans
- 🏥 **Health Integrations** - Connect with health platforms
- 📱 **Responsive Design** - Works on all devices
- 📄 **Data Export** - Export data in multiple formats

## Tech Stack

### Frontend
- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe development
- **Material-UI (MUI)** - Modern component library
- **React Router** - Client-side routing
- **Chart.js & Recharts** - Data visualization
- **Firebase** - Authentication and real-time database

### Backend
- **Node.js** - Server runtime
- **TypeScript** - Type-safe backend development
- **Firebase Admin SDK** - Backend Firebase integration
- **Express.js** - Web framework

### Infrastructure
- **Google Cloud Run** - Serverless container platform
- **Google Artifact Registry** - Container image storage
- **Firebase Hosting** - Static asset hosting
- **Firebase Firestore** - NoSQL database
- **GitHub Actions** - CI/CD pipeline

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn
- Git
- Firebase CLI (for Firebase features)
- Google Cloud CLI (for deployment)

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/jdwaites/put-in-the-work.git
   cd put-in-the-work
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up Firebase (optional for local development)**
   ```bash
   # Install Firebase CLI
   npm install -g firebase-tools
   
   # Login to Firebase
   firebase login
   
   # Initialize Firebase (if not already done)
   firebase init
   ```

4. **Start development servers**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:frontend  # Frontend only
   npm run dev:backend   # Backend only
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - Backend: http://localhost:5000

## Development

### Project Structure

```
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   ├── pages/          # Application pages
│   │   ├── contexts/       # React contexts
│   │   ├── firebase/       # Firebase configuration
│   │   └── utils/          # Utility functions
│   └── public/             # Static assets
├── backend/                 # Node.js backend
│   └── src/
│       ├── services/       # Business logic services
│       └── types/          # TypeScript type definitions
├── deployment/             # Deployment configurations
└── .github/workflows/      # GitHub Actions CI/CD
```

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build the frontend for production
- `npm run test` - Run the test suite
- `npm run lint` - Run ESLint
- `npm run build:docker` - Build Docker image locally
- `npm run deploy` - Deploy to Google Cloud Run (requires setup)

## Deployment

This application is deployed on Google Cloud Run using GitHub Actions for continuous deployment. The setup supports both automated deployments via GitHub Actions and manual deployments using a local script.

### 🔧 Prerequisites

Before setting up deployment, ensure you have:

- **Google Cloud Platform account** with billing enabled
- **GitHub repository** with admin access
- **Local development environment** with:
  - Google Cloud CLI (`gcloud`)
  - Docker
  - Git

### 📋 Required GCP Services

The following Google Cloud services must be enabled in your project:

| Service | Purpose | Enable Command |
|---------|---------|----------------|
| **Cloud Run** | Container hosting platform | `gcloud services enable run.googleapis.com` |
| **Artifact Registry** | Docker image storage | `gcloud services enable artifactregistry.googleapis.com` |
| **Cloud Build** | Container building (optional) | `gcloud services enable cloudbuild.googleapis.com` |

### 🔐 Required Service Accounts

You need to create one service account with specific permissions:

#### Service Account: `github-actions-deployer`

**Purpose**: Allows GitHub Actions to deploy to Cloud Run

**Required Roles**:
- `roles/run.admin` - Deploy and manage Cloud Run services
- `roles/artifactregistry.admin` - Push/pull container images
- `roles/storage.admin` - Access Cloud Build storage
- `roles/iam.serviceAccountUser` - Use service accounts for deployment

**Creation Commands**:
```bash
# Set your project ID
export PROJECT_ID="your-project-id"

# Create service account
gcloud iam service-accounts create github-actions-deployer \
    --description="Service account for GitHub Actions Cloud Run deployment" \
    --display-name="GitHub Actions Deployer"

# Get service account email
export SA_EMAIL="github-actions-deployer@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant required permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/artifactregistry.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/storage.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:$SA_EMAIL" \
    --role="roles/iam.serviceAccountUser"

# Create and download service account key
gcloud iam service-accounts keys create github-actions-key.json \
    --iam-account=$SA_EMAIL
```

### 🔑 Required GitHub Secrets

Add these secrets to your GitHub repository (`Settings` → `Secrets and variables` → `Actions`):

| Secret Name | Value | Description |
|-------------|--------|-------------|
| **`GCP_PROJECT_ID`** | `your-gcp-project-id` | Your Google Cloud project ID |
| **`GCP_SA_KEY`** | `{entire JSON key content}` | Complete contents of `github-actions-key.json` |

### ⚙️ Optional GitHub Variables

Configure these repository variables for customization (`Settings` → `Secrets and variables` → `Actions` → `Variables`):

| Variable Name | Default Value | Description |
|---------------|---------------|-------------|
| `GCP_REGION` | `us-central1` | Cloud Run deployment region |
| `GAR_LOCATION` | `us-central1` | Artifact Registry location |
| `SERVICE_NAME` | `putting-in-the-work` | Cloud Run service name |
| `CLOUD_RUN_MEMORY` | `512Mi` | Memory allocation |
| `CLOUD_RUN_CPU` | `1` | CPU allocation |
| `CLOUD_RUN_MAX_INSTANCES` | `10` | Maximum instances |
| `CLOUD_RUN_MIN_INSTANCES` | `0` | Minimum instances |
| `NODE_ENV` | `production` | Node.js environment |
| `ALLOW_UNAUTHENTICATED` | `true` | Allow public access |

### 🚀 Deployment Methods

#### Method 1: Automatic Deployment (Recommended)

**Triggers**: Automatic deployment occurs on:
- Push to `main` branch
- Manual workflow dispatch
- Pull request to `main` (for testing)

**Process**:
1. Push your changes to the `main` branch
2. GitHub Actions automatically:
   - Builds the Docker image
   - Pushes to Artifact Registry
   - Deploys to Cloud Run
   - Creates a release with deployment URL

#### Method 2: Manual Deployment

For local or manual deployments, use the provided script:

1. **Configure deployment variables**:
   ```bash
   # Copy and customize the configuration
   cp deployment/config.env.example deployment/config.env
   
   # Edit the configuration file
   nano deployment/config.env
   ```

2. **Run the deployment script**:
   ```bash
   # Deploy with project ID
   ./deploy.sh your-project-id
   
   # Or set environment variable
   export GCP_PROJECT_ID=your-project-id
   ./deploy.sh
   ```

### 🛠️ Configuration Management

All deployment configurations are centralized in `deployment/config.env.example`. Copy this file to `deployment/config.env` and customize:

```bash
# Copy the example configuration
cp deployment/config.env.example deployment/config.env

# Edit your configuration
nano deployment/config.env
```

**Key Configuration Sections**:

- **GCP Project Settings**: Project ID, region, locations
- **Application Settings**: Service name, image tags
- **Cloud Run Resources**: Memory, CPU, scaling settings
- **Security Settings**: Authentication, ingress policies
- **Service Account Settings**: Names and descriptions

### 📊 Monitoring and Maintenance

#### Viewing Logs
```bash
# View Cloud Run service logs
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=putting-in-the-work" --limit=50

# Follow live logs
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=putting-in-the-work"
```

#### Service Status
```bash
# Check service status
gcloud run services describe putting-in-the-work --region=us-central1

# Get service URL
gcloud run services describe putting-in-the-work --region=us-central1 --format="value(status.url)"
```

#### Resource Updates
```bash
# Update memory allocation
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --memory=1Gi

# Update environment variables
gcloud run services update putting-in-the-work \
    --region=us-central1 \
    --set-env-vars="NODE_ENV=production,NEW_VAR=value"
```

### 🔒 Security Best Practices

1. **Use least privilege**: Grant minimum required permissions
2. **Rotate keys regularly**: Replace service account keys periodically
3. **Monitor access**: Enable audit logging for Cloud Run
4. **Secure secrets**: Never commit secrets to code
5. **Use Workload Identity**: Consider Workload Identity Federation for enhanced security

### 🐛 Troubleshooting

#### Common Issues

**Build Failures**:
- Verify all required files are present in repository
- Check Docker build logs in GitHub Actions

**Permission Denied**:
- Verify service account has all required roles
- Check that `GCP_SA_KEY` secret contains valid JSON

**Service Unavailable**:
- Check Cloud Run service logs for startup errors
- Verify container exposes correct port (8080)

**Image Not Found**:
- Ensure Artifact Registry repository exists
- Verify image push completed successfully

#### Useful Debug Commands

```bash
# Test local Docker build
docker build -t test-image .
docker run -p 8080:8080 test-image

# Verify gcloud authentication
gcloud auth list

# Check enabled APIs
gcloud services list --enabled

# Validate service account permissions
gcloud projects get-iam-policy $PROJECT_ID \
    --flatten="bindings[].members" \
    --filter="bindings.members:serviceAccount:github-actions-deployer@$PROJECT_ID.iam.gserviceaccount.com"
```

### 💰 Cost Optimization

Cloud Run charges based on:
- **CPU allocation** (only during request processing)
- **Memory allocation**
- **Request count**
- **Outbound networking**

**Optimization Tips**:
- Use minimum instances `0` for development
- Set appropriate memory limits based on usage
- Enable CPU throttling for cost savings
- Monitor usage in Cloud Console

### 📚 Additional Resources

- [Cloud Run Documentation](https://cloud.google.com/run/docs)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Artifact Registry Documentation](https://cloud.google.com/artifact-registry/docs)
- [Workload Identity Federation](https://cloud.google.com/iam/docs/workload-identity-federation)

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by Jamal Waites**
