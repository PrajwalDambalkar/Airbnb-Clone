# AWS Deployment TODO Checklist

Print this out and check off as you go! ✅

---

## PREPARATION (5 min)

- [ ] I have an AWS account
- [ ] My AWS account has Free Tier available
- [ ] I can access AWS Console: https://console.aws.amazon.com
- [ ] I have read START_HERE_AWS.md
- [ ] I have my MongoDB Atlas credentials ready

---

## LAUNCH EC2 (15 min)

- [ ] Opened AWS Console → EC2
- [ ] Clicked "Launch Instance"
- [ ] Set name: `airbnb-lab2`
- [ ] Selected AMI: Amazon Linux 2023 (Free tier)
- [ ] Selected Type: t2.micro (Free tier)
- [ ] Created new key pair: `airbnb-lab2-key`
- [ ] Downloaded .pem file to safe location
- [ ] Noted down where .pem file is saved: _________________
- [ ] Created security group with these ports:
  - [ ] Port 22 (SSH)
  - [ ] Port 5001 (Backend)
  - [ ] Port 5002 (Owner)
  - [ ] Port 5003 (Property)
  - [ ] Port 5004 (Booking)
  - [ ] Port 5005 (Traveler)
  - [ ] Port 5173 (Frontend)
  - [ ] Port 8080 (Kafka UI)
- [ ] Clicked "Launch Instance"
- [ ] Waited for instance to be "Running"
- [ ] Copied Public IP address: _________________

---

## CONNECT TO EC2 (10 min)

- [ ] Opened terminal on my computer
- [ ] Changed to Downloads folder: `cd ~/Downloads`
- [ ] Set permissions: `chmod 400 airbnb-lab2-key.pem`
- [ ] Connected: `ssh -i airbnb-lab2-key.pem ec2-user@MY-EC2-IP`
- [ ] Typed "yes" when asked
- [ ] Successfully connected (see ec2-user prompt)

---

## RUN DEPLOYMENT SCRIPT (15 min)

- [ ] Downloaded script:
  ```
  curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh
  ```
- [ ] Made it executable: `chmod +x deploy.sh`
- [ ] Ran script: `./deploy.sh`
- [ ] Waited patiently (10 minutes)
- [ ] Saw "✓ Installation Complete! 🎉"
- [ ] Noted my EC2 Public IP shown in script: _________________
- [ ] Logged out: `exit`
- [ ] Logged back in: `ssh -i airbnb-lab2-key.pem ec2-user@MY-EC2-IP`
- [ ] Changed directory: `cd Airbnb-Clone`

---

## START SERVICES (20 min)

- [ ] Started Docker Compose:
  ```
  docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
  ```
- [ ] Waited patiently (15-20 minutes)
- [ ] Checked running containers: `docker ps`
- [ ] Confirmed 9 containers are running:
  - [ ] backend
  - [ ] frontend
  - [ ] property-service
  - [ ] booking-service
  - [ ] traveler-service
  - [ ] owner-service
  - [ ] kafka
  - [ ] zookeeper
  - [ ] kafka-ui
- [ ] Tested backend: `curl http://localhost:5001/health`
- [ ] Got success response

---

## TAKE SCREENSHOTS (30 min)

### AWS Console Screenshots
- [ ] Screenshot 1: EC2 Dashboard (showing instance running)
- [ ] Screenshot 2: Instance details (type, AMI, state)
- [ ] Screenshot 3: Security groups (showing all ports)
- [ ] Screenshot 4: Monitoring tab (CPU/Network graphs)
- [ ] Screenshot 5: Billing Dashboard (showing $0.00)

### Application Screenshots
- [ ] Opened in browser: `http://MY-EC2-IP:5173`
- [ ] Screenshot 6: Frontend homepage
- [ ] Screenshot 7: Property search page
- [ ] Screenshot 8: Any other frontend page

### Kafka Screenshots
- [ ] Opened in browser: `http://MY-EC2-IP:8080`
- [ ] Screenshot 9: Kafka UI homepage
- [ ] Screenshot 10: Topics page (showing booking-requests, booking-updates)
- [ ] Screenshot 11: Messages in a topic

### Docker Screenshots
- [ ] In EC2 terminal, ran: `docker ps`
- [ ] Screenshot 12: docker ps output
- [ ] Ran: `docker stats --no-stream`
- [ ] Screenshot 13: docker stats output

### Redux DevTools Screenshots
- [ ] Opened frontend in Chrome: `http://MY-EC2-IP:5173`
- [ ] Pressed F12 (opened DevTools)
- [ ] Clicked "Redux" tab
- [ ] Screenshot 14: State tree
- [ ] Performed a login action
- [ ] Screenshot 15: Action history
- [ ] Screenshot 16: State diff

### Optional Screenshots
- [ ] Screenshot 17: Backend API health check (Postman/curl)
- [ ] Screenshot 18: Container logs
- [ ] Screenshot 19: Architecture diagram (from docs)

---

## ORGANIZE SCREENSHOTS (10 min)

- [ ] Created folder: `Lab2-Screenshots`
- [ ] Created subfolders:
  - [ ] AWS-Console
  - [ ] Application
  - [ ] Kafka
  - [ ] Docker
  - [ ] Redux
- [ ] Moved screenshots to appropriate folders
- [ ] Renamed screenshots with descriptive names
- [ ] Added captions/notes for report

---

## EXPORT LOGS (5 min)

- [ ] Saved logs: `docker-compose -f docker-compose.aws.yml logs > deployment-logs.txt`
- [ ] Downloaded logs to my computer (if needed)

---

## CLEANUP (10 min)

### Stop Services
- [ ] Stopped containers: `docker-compose -f docker-compose.aws.yml down`
- [ ] Verified containers stopped: `docker ps`

### Stop EC2 Instance
- [ ] Went to AWS Console → EC2
- [ ] Selected my instance
- [ ] Clicked "Instance State" → "Stop instance"
- [ ] Confirmed instance is stopped
- [ ] Verified billing shows $0.00

### Optional: Terminate Instance (if completely done)
- [ ] Clicked "Instance State" → "Terminate instance"
- [ ] Confirmed termination
- [ ] Deleted security group (optional)

---

## DOCUMENT IN REPORT (60 min)

- [ ] Created report document
- [ ] Added Architecture section with diagram
- [ ] Added AWS Deployment section
- [ ] Inserted AWS Console screenshots
- [ ] Added Docker & Containers section
- [ ] Inserted Docker screenshots
- [ ] Added Kafka Implementation section
- [ ] Inserted Kafka screenshots
- [ ] Added Redux State Management section
- [ ] Inserted Redux screenshots
- [ ] Added Cost Analysis section
- [ ] Explained Free Tier strategy
- [ ] Added Challenges & Solutions section
- [ ] Added Performance Analysis section
- [ ] Proofread entire report
- [ ] Checked all screenshots are visible
- [ ] Added page numbers and table of contents

---

## FINAL CHECKLIST

- [ ] All 19 screenshots captured and organized
- [ ] Report written and proofread
- [ ] EC2 instance stopped (no charges)
- [ ] AWS billing confirmed at $0.00
- [ ] Logs exported and saved
- [ ] .pem key file stored safely (for future use)
- [ ] GitHub repository updated with docker-compose.aws.yml
- [ ] Ready to submit!

---

## SUCCESS METRICS

✅ Total Time: _______ hours (target: 2-3 hours)
✅ Total Cost: $_______ (target: $0.00)
✅ Screenshots: _______ of 19 minimum
✅ Report Pages: _______ pages
✅ Containers Running: _______ of 9

---

## NOTES / ISSUES ENCOUNTERED

_Use this space to note any problems you faced and how you solved them:_

Issue 1: 
Solution:

Issue 2:
Solution:

Issue 3:
Solution:

---

## HELP NEEDED?

If stuck, refer to:
- [ ] START_HERE_AWS.md
- [ ] AWS_QUICK_REFERENCE.md
- [ ] AWS_CHEAT_SHEET.md

---

**Date Started:** _______________
**Date Completed:** _______________
**Final Grade:** _______ / 40

🎉 CONGRATULATIONS! YOU'RE DONE! 🎉
