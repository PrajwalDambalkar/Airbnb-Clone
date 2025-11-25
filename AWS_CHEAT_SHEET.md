# 🚀 AWS DEPLOYMENT CHEAT SHEET

**The absolute basics - nothing extra.**

---

## STEP 1: Launch EC2

Go to: https://console.aws.amazon.com/ec2/

Click: **"Launch Instance"**

Fill in:
- Name: `airbnb-lab2`
- AMI: **Amazon Linux 2023** (Free tier)
- Type: **t2.micro** (Free tier)
- Key: Create new → Save the `.pem` file!
- Security: Open ports **22, 5001-5005, 5173, 8080**

Click: **"Launch Instance"**

Copy the **Public IP address** (looks like: 54.123.45.67)

---

## STEP 2: Connect & Deploy

```bash
# On your computer - connect to EC2
cd ~/Downloads
chmod 400 airbnb-lab2-key.pem
ssh -i airbnb-lab2-key.pem ec2-user@YOUR-EC2-IP
```

```bash
# Inside EC2 - run these commands
curl -o deploy.sh https://raw.githubusercontent.com/PrajwalDambalkar/Airbnb-Clone/feature/Jmeter/scripts/deploy-aws.sh
chmod +x deploy.sh
./deploy.sh
```

Wait 10 minutes...

```bash
# Logout and login again
exit
ssh -i airbnb-lab2-key.pem ec2-user@YOUR-EC2-IP

# Start the app
cd Airbnb-Clone
docker-compose -f docker-compose.aws.yml --env-file .env.aws up -d --build
```

Wait 15 minutes...

```bash
# Check it's running
docker ps
```

Should show **9 containers** running ✅

---

## STEP 3: Access & Screenshot

Open in browser:
- Frontend: `http://YOUR-EC2-IP:5173`
- Kafka UI: `http://YOUR-EC2-IP:8080`

Take screenshots of:
1. AWS EC2 Dashboard
2. Your instance details
3. Security groups
4. Billing ($0.00)
5. Frontend in browser
6. Kafka UI in browser
7. `docker ps` output
8. Redux DevTools (F12 → Redux tab)

---

## DONE? Stop Everything

```bash
# In EC2
docker-compose -f docker-compose.aws.yml down

# In AWS Console
EC2 → Your instance → Stop instance
```

---

## HELP!

**Can't connect?**
```bash
chmod 400 airbnb-lab2-key.pem
```

**Services won't start?**
```bash
docker-compose -f docker-compose.aws.yml logs
```

**Out of memory?**
Edit `docker-compose.aws.yml`, comment out `agent-service`

---

**That's it! 🎉**

For detailed help: Read [`START_HERE_AWS.md`](START_HERE_AWS.md)
