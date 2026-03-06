from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

urlpatterns = [
    # Auth
    path('auth/login/', views.LoginView.as_view(), name='login'),
    path('auth/register/', views.RegisterView.as_view(), name='register'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),

    # Dashboard
    path('dashboard/', views.DashboardView.as_view(), name='dashboard'),
    path('balance/', views.BalanceView.as_view(), name='balance'),

    # Transactions
    path('send-money/', views.SendMoneyView.as_view(), name='send_money'),
    path('withdraw/', views.WithdrawView.as_view(), name='withdraw'),
    path('buy-airtime/', views.BuyAirtimeView.as_view(), name='buy_airtime'),
    path('paybill/', views.PaybillView.as_view(), name='paybill'),
    path('buy-goods/', views.BuyGoodsView.as_view(), name='buy_goods'),

    # M-Shwari
    path('mshwari/deposit/', views.MshwariDepositView.as_view(), name='mshwari_deposit'),
    path('mshwari/withdraw/', views.MshwariWithdrawView.as_view(), name='mshwari_withdraw'),
    path('mshwari/lock/', views.MshwariLockSavingsView.as_view(), name='mshwari_lock'),
    path('mshwari/loan/', views.MshwariLoanView.as_view(), name='mshwari_loan'),

    # KCB M-PESA
    path('kcb/deposit/', views.KCBDepositView.as_view(), name='kcb_deposit'),
    path('kcb/withdraw/', views.KCBWithdrawView.as_view(), name='kcb_withdraw'),
    path('kcb/loan/', views.KCBLoanView.as_view(), name='kcb_loan'),

    # Account
    path('transactions/', views.TransactionHistoryView.as_view(), name='transactions'),
    path('mini-statement/', views.MiniStatementView.as_view(), name='mini_statement'),
    path('change-pin/', views.ChangePINView.as_view(), name='change_pin'),
    path('change-language/', views.ChangeLanguageView.as_view(), name='change_language'),
    path('notifications/', views.NotificationListView.as_view(), name='notifications'),

    # Admin
    path('admin/users/', views.AdminUserListView.as_view(), name='admin_users'),
    path('admin/transactions/', views.AdminTransactionListView.as_view(), name='admin_transactions'),
    path('admin/stats/', views.AdminStatsView.as_view(), name='admin_stats'),

    # Agent
    path('agent/dashboard/', views.AgentDashboardView.as_view(), name='agent_dashboard'),

    # Billers
    path('billers/', views.PaybillListView.as_view(), name='billers'),
]