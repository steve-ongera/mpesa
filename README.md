# 📱 M-PESA Banking Application

A full-stack, production-ready M-PESA banking portal with real-time WebSocket notifications, built with **Django** (backend) and **React** (frontend).

---

## ✨ Features

### 💚 Customer Module
- **Send Money** — to any M-PESA number with live charge calculation
- **Withdraw Cash** — via Agent or ATM
- **Buy Airtime** — for self or any number
- **Lipa na M-PESA**
  - Paybill (with popular biller shortcuts)
  - Buy Goods & Services (till number)
  - Pochi la Biashara
- **M-Shwari**
  - Send/Withdraw to & from M-PESA
  - Lock Savings account
  - Check M-Shwari Balance
  - Mini Statement
  - Apply for M-Shwari Loan
- **KCB M-PESA**
  - Deposit / Withdraw
  - Apply for KCB Loan (up to KES 50,000)
- **My Account**
  - Mini Statement (last 5 M-PESA transactions)
  - M-PESA PIN Manager (change PIN)
  - Change Language (English / Kiswahili)
  - Check M-PESA Balance

### 🏪 Agent Module
- Agent dashboard with float & commission tracking
- Process customer withdrawals
- View transaction history
- Float management

### ⚙️ Admin / ICT Module
- Full system overview with stats
- User management (create / view all users)
- All transaction monitoring
- Role-based account creation

### 🎧 Customer Care Module
- Register new customers
- Search & view customer accounts
- Transaction monitoring
- Customer verification

---

## 🔄 Real-Time Features (WebSocket)
- **Instant notifications** when money is sent/received — no page refresh needed
- **Live balance updates** after every transaction
- Persistent WebSocket connection with auto-reconnect
- Toast notifications for all transaction events

---

## 🗂️ Project Structure

```
mpesa-app/
├── backend/                    # Django Backend
│   ├── core/                   # Main app
│   │   ├── models.py           # All DB models
│   │   ├── views.py            # All API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── urls.py             # API routes
│   │   ├── consumers.py        # WebSocket consumers
│   │   ├── routing.py          # WS URL routing
│   │   └── management/
│   │       └── commands/
│   │           └── seed_demo.py
│   ├── mpesa_project/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── asgi.py             # ASGI + WebSocket config
│   │   └── wsgi.py
│   └── requirements.txt
│
├── frontend/                   # React Frontend
│   ├── public/
│   │   └── index.html          # Loads Bootstrap Icons + Google Fonts
│   └── src/
│       ├── App.jsx             # Main app + client-side router
│       ├── index.js
│       ├── context/
│       │   └── AuthContext.jsx # Auth + WebSocket + balance state
│       ├── services/
│       │   └── api.js          # Full API client + WebSocketService
│       ├── styles/
│       │   └── global-style.css  # M-PESA brand CSS design system
│       ├── components/
│       │   └── common/
│       │       ├── Sidebar.jsx
│       │       ├── Topbar.jsx
│       │       ├── Toast.jsx
│       │       ├── PinInput.jsx
│       │       ├── NotificationPanel.jsx
│       │       └── TransactionModal.jsx
│       └── pages/
│           ├── LoginPage.jsx
│           ├── customer/
│           │   ├── CustomerDashboard.jsx
│           │   ├── SendMoneyPage.jsx
│           │   ├── MshwariPage.jsx
│           │   ├── LipaNaMpesaPage.jsx
│           │   └── OtherPages.jsx  (Withdraw, Airtime, KCB, Account)
│           ├── agent/
│           │   └── AgentDashboard.jsx
│           ├── admin/
│           │   └── AdminDashboard.jsx
│           └── customercare/
│               └── CustomerCareDashboard.jsx
│
├── setup.sh                    # One-command setup
└── docker-compose.yml          # Production deployment
```

---

## 🚀 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn

### 1. Run setup script
```bash
cd mpesa-app
bash setup.sh
```

### 2. Start manually (two terminals)

**Terminal 1 — Backend:**
```bash
cd mpesa-app/backend
pip install -r requirements.txt
python manage.py makemigrations core
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```

**Terminal 2 — Frontend:**
```bash
cd mpesa-app/frontend
npm install
npm start
```

App opens at **http://localhost:3000**

---

## 🔑 Demo Credentials

| Role | Phone | Password | M-PESA PIN |
|------|-------|----------|------------|
| Customer | `0712345678` | `demo1234` | `1234` |
| Agent | `0722345678` | `demo1234` | `1234` |
| Admin/ICT | `0732345678` | `demo1234` | `1234` |
| Customer Care | `0742345678` | `demo1234` | `1234` |

---

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login/` | POST | Login |
| `/api/auth/register/` | POST | Register |
| `/api/dashboard/` | GET | Dashboard data |
| `/api/send-money/` | POST | Send money |
| `/api/withdraw/` | POST | Withdraw |
| `/api/buy-airtime/` | POST | Buy airtime |
| `/api/paybill/` | POST | Paybill payment |
| `/api/buy-goods/` | POST | Buy goods |
| `/api/mshwari/deposit/` | POST | M-Shwari deposit |
| `/api/mshwari/withdraw/` | POST | M-Shwari withdraw |
| `/api/mshwari/lock/` | POST | Lock savings |
| `/api/mshwari/loan/` | POST | M-Shwari loan |
| `/api/kcb/deposit/` | POST | KCB deposit |
| `/api/kcb/withdraw/` | POST | KCB withdraw |
| `/api/kcb/loan/` | POST | KCB loan |
| `/api/transactions/` | GET | Transaction history |
| `/api/mini-statement/` | GET | Mini statement |
| `/api/change-pin/` | POST | Change PIN |
| `/api/notifications/` | GET | Notifications |
| `/api/admin/users/` | GET/POST | Admin user management |
| `/api/admin/stats/` | GET | System stats |

### WebSocket
```
ws://localhost:8000/ws/notifications/{user_id}/
```

---

## 🔧 Configuration

### Real M-PESA API (Safaricom Daraja)
Update `backend/mpesa_project/settings.py`:
```python
MPESA_CONSUMER_KEY = 'your-consumer-key'
MPESA_CONSUMER_SECRET = 'your-consumer-secret'
MPESA_SHORTCODE = '174379'
MPESA_PASSKEY = 'your-passkey'
MPESA_CALLBACK_URL = 'https://yourdomain.com/api/mpesa/callback/'
```

### Production (Redis for WebSocket channels)
```python
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {"hosts": [("redis", 6379)]}
    }
}
```

---

## 📱 Responsive Design
- Full desktop sidebar navigation
- Collapsible sidebar on medium screens
- Mobile-first bottom-sheet modals
- Hamburger menu on mobile
- Touch-optimized PIN input

---

## 🎨 Design System
- **Brand Colors**: M-PESA Green `#00A651`, Red `#E31E24`
- **Fonts**: Nunito (UI) + DM Sans (body)
- **Icons**: Bootstrap Icons 1.11
- All CSS variables in `global-style.css`