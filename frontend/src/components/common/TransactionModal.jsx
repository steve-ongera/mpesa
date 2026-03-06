import React from 'react';
import { formatKES, formatDate } from '../../services/api';

const TransactionModal = ({ transaction, onClose }) => {
  if (!transaction) return null;

  const typeLabels = {
    send_money: 'Send Money',
    receive_money: 'Receive Money',
    withdraw_agent: 'Withdraw via Agent',
    withdraw_atm: 'Withdraw via ATM',
    buy_airtime: 'Buy Airtime',
    paybill: 'Paybill',
    buy_goods: 'Buy Goods',
    mshwari_deposit: 'M-Shwari Deposit',
    mshwari_withdraw: 'M-Shwari Withdraw',
    mshwari_loan: 'M-Shwari Loan',
    kcb_deposit: 'KCB Deposit',
    kcb_withdraw: 'KCB Withdraw',
    kcb_loan: 'KCB Loan',
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-handle"></div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{
            width: 64, height: 64,
            background: transaction.status === 'completed' ? 'var(--mpesa-green-pale)' : 'var(--mpesa-red-pale)',
            borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px',
            fontSize: 28
          }}>
            {transaction.status === 'completed' ? '✅' : '❌'}
          </div>
          <div style={{ fontSize: 22, fontWeight: 900, color: 'var(--mpesa-gray-900)' }}>
            {formatKES(transaction.amount)}
          </div>
          <div style={{ fontSize: 14, color: 'var(--mpesa-gray-500)', marginTop: 4 }}>
            {typeLabels[transaction.transaction_type] || transaction.transaction_type}
          </div>
        </div>

        <div style={{ background: 'var(--mpesa-gray-50)', borderRadius: 12, padding: '4px 16px' }}>
          <div className="confirm-row">
            <span className="label">Transaction ID</span>
            <span className="value" style={{ fontFamily: 'monospace', fontSize: 13 }}>{transaction.transaction_id}</span>
          </div>
          <div className="confirm-row">
            <span className="label">Status</span>
            <span className={`txn-status ${transaction.status}`}>{transaction.status}</span>
          </div>
          {transaction.sender_name && (
            <div className="confirm-row">
              <span className="label">From</span>
              <span className="value">{transaction.sender_name} ({transaction.sender_phone})</span>
            </div>
          )}
          {transaction.receiver_name && (
            <div className="confirm-row">
              <span className="label">To</span>
              <span className="value">{transaction.receiver_name} ({transaction.receiver_phone})</span>
            </div>
          )}
          {parseFloat(transaction.charge) > 0 && (
            <div className="confirm-row">
              <span className="label">Transaction Cost</span>
              <span className="value">{formatKES(transaction.charge)}</span>
            </div>
          )}
          {transaction.reference && (
            <div className="confirm-row">
              <span className="label">Account/Reference</span>
              <span className="value">{transaction.reference}</span>
            </div>
          )}
          <div className="confirm-row">
            <span className="label">Date & Time</span>
            <span className="value">{formatDate(transaction.created_at)}</span>
          </div>
        </div>

        <button className="btn btn-outline btn-full mt-6" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default TransactionModal;