# Lab 2: Airbnb Clone Enhancement Documentation

**Project Team:** Prajwal & Pukhraj  
**Due Date:** November 24, 2025  
**Course:** DATA-236 / Applied Data Science

---

## 🎯 Project Overview

Enhance existing Airbnb clone with:

- **Docker & Kubernetes** (15 points)
- **Kafka Message Queues** (10 points)
- **MongoDB Migration** (5 points)
- **Redux State Management** (5 points)
- **JMeter Performance Testing** (5 points)

**Key Change:** Migrate from MySQL to MongoDB (required by lab)

---

## 🏗️ Architecture Strategy

### **Local Development (100% Free)**

```
Frontend (React + Redux) → API Gateway → 5 Microservices → MongoDB Atlas
                                     ↓
                            Kafka (Message Queues)
                                     ↓
                           Backend Services (Consumers)
```

### **AWS Deployment (Free Tier Only)**

```
AWS ALB → EC2 (Frontend) → EC2 (Combined Backend) → MongoDB Atlas
         ├── ECR (Docker Images)
         └── CloudWatch (Monitoring)
```

---

## 🛠️ Technology Stack

### **Free Services**

| Service               | Purpose             | Cost         |
| --------------------- | ------------------- | ------------ |
| MongoDB Atlas         | Database            | Free (512MB) |
| GitHub                | Code Repository     | Free         |
| Docker                | Containerization    | Free         |
| Kubernetes (minikube) | Local Orchestration | Free         |
| Kafka (local)         | Message Queues      | Free         |
| Redis (local)         | Caching/Sessions    | Free         |
| JMeter                | Performance Testing | Free         |

### **AWS Services (Free Tier)**

| Service    | Usage           | Free Tier Limit    |
| ---------- | --------------- | ------------------ |
| EC2        | App Hosting     | 750 hours t2.micro |
| ECR        | Docker Registry | 500MB storage      |
| ALB        | Load Balancer   | Limited usage      |
| CloudWatch | Monitoring      | Basic metrics      |
| VPC        | Networking      | Default free       |

### **AWS Services (Document Only - Too Expensive)**

| Service | Purpose       | Why Not Used |
| ------- | ------------- | ------------ |
| EKS     | Kubernetes    | $73/month    |
| MSK     | Managed Kafka | $150+/month  |

---

## 📁 GitHub Repository Strategy

### **Repository Structure**

```
existing-airbnb-repo/
├── main (original Lab 1 code)
├── dev (development branch)
├── feature-* (individual features)
└── lab2 (NEW - Lab 2 enhancements)
```

### **Lab2 Branch Structure**

```
lab2/
├── docker/                    # Dockerfiles for all services
│   ├── frontend.Dockerfile
│   ├── traveler-service.Dockerfile
│   ├── owner-service.Dockerfile
│   ├── property-service.Dockerfile
│   ├── booking-service.Dockerfile
│   └── ai-service.Dockerfile
├── k8s/                      # Kubernetes manifests
│   ├── deployments/
│   ├── services/
│   └── configmaps/
├── kafka/                    # Kafka configurations
│   ├── topics.json
│   └── producer-consumer-configs/
├── frontend/                 # React + Redux
│   ├── src/redux/
│   └── src/components/
├── services/                 # 5 microservices
│   ├── traveler-service/
│   ├── owner-service/
│   ├── property-service/
│   ├── booking-service/
│   └── agentic-ai-service/
├── mongodb/                  # DB schemas & migrations
│   ├── schemas/
│   └── migration-scripts/
├── jmeter/                   # Performance test plans
│   ├── test-plans/
│   └── results/
├── deployment/               # AWS deployment scripts
│   ├── aws-configs/
│   └── docker-compose.yml
└── docs/                     # Documentation
    ├── architecture.md
    ├── aws-strategy.md
    └── performance-analysis.md
```

### **Collaboration Workflow**

```bash
# Both team members work on lab2 branch
git checkout main
git checkout -b lab2
git push -u origin lab2

# Daily workflow
git checkout lab2
git pull origin lab2
# Make changes
git add .
git commit -m "feat: add specific feature"
git push origin lab2
```

---

## 🗓️ 14-Day Implementation Plan

### **Week 1: Foundation & Local Setup (Days 1-7)**

**Day 1-2: Repository & Database Setup**

- [ ] Create lab2 branch from main
- [ ] Set up MongoDB Atlas cluster (free tier)
- [ ] Share MongoDB credentials between team members
- [ ] Create migration script from MySQL to MongoDB
- [ ] Test connection from both local environments

**Day 3-4: Microservices Architecture**

- [ ] Split existing code into 5 microservices:
  - Traveler Service (authentication, profile)
  - Owner Service (property management, bookings response)
  - Property Service (listings, search)
  - Booking Service (reservations, payments)
  - Agentic AI Service (recommendations)
- [ ] Implement MongoDB connections in all services
- [ ] Add encrypted password storage
- [ ] Test all services locally

**Day 5-6: Docker & Redis**

- [ ] Create Dockerfiles for each service
- [ ] Set up Redis for session management
- [ ] Create docker-compose.yml for local development
- [ ] Test containerized services locally
- [ ] Optimize Docker images for size

**Day 7: Kubernetes Local Setup**

- [ ] Install minikube/kind
- [ ] Create Kubernetes manifests for all services
- [ ] Deploy services to local Kubernetes
- [ ] Test service-to-service communication
- [ ] Document K8s configuration

### **Week 2: Integration & Deployment (Days 8-14)**

**Day 8-9: Kafka Implementation**

- [ ] Set up local Kafka cluster
- [ ] Implement booking flow with Kafka:
  - Traveler creates booking → Kafka event
  - Owner service consumes → Accept/Reject
  - Status updates back to Traveler
- [ ] Create separate frontend/backend services as producers/consumers
- [ ] Test message flow end-to-end

**Day 10-11: Redux & Frontend**

- [ ] Integrate Redux into React frontend
- [ ] Implement Redux store for:
  - User authentication (JWT tokens)
  - Property data (search results, details)
  - Booking data (status, favorites)
- [ ] Create actions, reducers, selectors
- [ ] Test state management across components

**Day 12: AWS Deployment**

- [ ] Push Docker images to AWS ECR
- [ ] Deploy frontend to EC2 t2.micro
- [ ] Deploy combined backend services to EC2
- [ ] Configure Application Load Balancer
- [ ] Test deployed application
- [ ] Monitor resource usage

**Day 13: Performance Testing**

- [ ] Create JMeter test plans for:
  - User authentication
  - Property search
  - Booking process
- [ ] Test with 100, 200, 300, 400, 500 concurrent users
- [ ] Generate performance reports
- [ ] Analyze bottlenecks and optimizations

**Day 14: Documentation & Submission**

- [ ] Create comprehensive project report
- [ ] Include screenshots of:
  - AWS services running
  - Kafka message flows
  - Redux DevTools state changes
  - JMeter performance results
- [ ] Document architecture decisions
- [ ] Prepare final GitHub repository
- [ ] Submit project

---

## 💰 Cost Management Strategy

### **Free Tier Utilization**

- **MongoDB Atlas:** 512MB free forever
- **AWS EC2:** 750 hours t2.micro (first year)
- **AWS ECR:** 500MB free storage/month
- **All development tools:** Completely free

### **Cost Avoidance**

- **EKS Replacement:** Local Kubernetes + documentation
- **MSK Replacement:** Local Kafka + architecture docs
- **Resource Monitoring:** Stay within EC2 free tier limits

### **Budget Safety**

- **Set AWS billing alerts** at $1, $5, $10
- **Monitor usage daily** during AWS deployment week
- **Have local fallback** ready for all AWS services

---

## 📋 Assignment Requirements Mapping

| Requirement  | Implementation                             | Points | Status |
| ------------ | ------------------------------------------ | ------ | ------ |
| Docker & K8s | All 5 services containerized + K8s configs | 15     | 📋     |
| Kafka        | Booking flow + Producer/Consumer pattern   | 10     | 📋     |
| MongoDB      | Atlas + encrypted passwords + sessions     | 5      | 📋     |
| Redux        | Auth + Property + Booking state mgmt       | 5      | 📋     |
| JMeter       | Performance testing 100-500 users          | 5      | 📋     |
| **Total**    |                                            | **40** |        |

---

## 🚀 Success Criteria

### **Technical Deliverables**

- [ ] All services running in Docker containers
- [ ] Kubernetes orchestration (local + configs)
- [ ] Kafka message flow working
- [ ] MongoDB integration complete
- [ ] Redux state management implemented
- [ ] AWS deployment functional
- [ ] JMeter performance results

### **Documentation Requirements**

- [ ] Architecture diagrams
- [ ] AWS deployment screenshots
- [ ] Kafka flow demonstrations
- [ ] Redux state change screenshots
- [ ] Performance analysis with graphs
- [ ] Cost optimization explanation

### **Repository Quality**

- [ ] Clean commit history
- [ ] Proper branching strategy
- [ ] Comprehensive README
- [ ] All configurations included
- [ ] Easy setup instructions

---

## 🤝 Team Coordination

### **Communication Protocol**

- **Daily standups:** Share progress and blockers
- **GitHub issues:** Track features and bugs
- **Shared documents:** Architecture decisions
- **Regular code reviews:** Maintain code quality

### **Responsibility Split** (Suggested)

- **Prajwal:** Backend services, Kafka, MongoDB migration
- **Pukhraj:** Frontend Redux, Docker, AWS deployment
- **Shared:** Architecture design, documentation, testing

---

## 🆘 Risk Mitigation

### **Technical Risks**

- **AWS costs:** Monitor billing alerts, have local backup
- **Complexity:** Start simple, add features incrementally
- **Integration issues:** Test components independently first
- **Performance bottlenecks:** JMeter testing early

### **Timeline Risks**

- **Scope creep:** Stick to minimum viable requirements
- **Learning curve:** Allocate extra time for new technologies
- **Dependencies:** Don't block each other's work
- **Last-minute issues:** Complete core features by Day 12

---

## 📞 Support Resources

- **MongoDB Atlas Documentation:** https://docs.atlas.mongodb.com/
- **AWS Free Tier Guide:** https://aws.amazon.com/free/
- **Kafka Documentation:** https://kafka.apache.org/documentation/
- **Redux Toolkit:** https://redux-toolkit.js.org/
- **JMeter User Manual:** https://jmeter.apache.org/usermanual/

---

**Good luck with Lab 2! 🚀**

_This documentation will be updated as the project progresses._
