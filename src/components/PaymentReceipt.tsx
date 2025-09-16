import React from 'react';
import { Download, Mail, X } from 'lucide-react';
import { formatCurrency, formatRelativeTime } from '../lib/utils';
import { Button } from './Button';

interface PaymentReceiptProps {
  ride: {
    id: string;
    pickup_address: string;
    dropoff_address: string;
    final_fare: number;
    created_at: string;
    driver?: {
      full_name: string;
    };
  };
  payment: {
    id: string;
    amount: number;
    status: string;
    created_at: string;
  };
  onClose: () => void;
}

export const PaymentReceipt: React.FC<PaymentReceiptProps> = ({
  ride,
  payment,
  onClose,
}) => {
  const handleDownload = () => {
    const receiptContent = generateReceiptHTML(ride, payment);
    const blob = new Blob([receiptContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tuk-tuk-receipt-${ride.id.slice(0, 8)}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleEmail = () => {
    const subject = `Tuk Tuk Eazy Receipt - ${ride.id.slice(0, 8)}`;
    const body = `Your ride receipt is attached. Trip from ${ride.pickup_address} to ${ride.dropoff_address} on ${new Date(ride.created_at).toLocaleDateString()}.`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-text">Payment Receipt</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Receipt Content */}
        <div className="space-y-4 mb-6">
          {/* Trip Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-text mb-2">Trip Details</h4>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-600">From:</span>
                <p className="font-medium">{ride.pickup_address}</p>
              </div>
              <div>
                <span className="text-gray-600">To:</span>
                <p className="font-medium">{ride.dropoff_address}</p>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(ride.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time:</span>
                <span className="font-medium">
                  {new Date(ride.created_at).toLocaleTimeString()}
                </span>
              </div>
              {ride.driver && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Driver:</span>
                  <span className="font-medium">{ride.driver.full_name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Payment Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-semibold text-text mb-2">Payment Details</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Ride Fare:</span>
                <span className="font-medium">{formatCurrency(payment.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span className="font-medium">Credit Card</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Status:</span>
                <span className="font-medium text-green-600 capitalize">
                  {payment.status.toLowerCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Transaction ID:</span>
                <span className="font-medium text-xs">{payment.id.slice(0, 8)}...</span>
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-text">Total Paid:</span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(payment.amount)}
              </span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <Button
            variant="outline"
            fullWidth
            onClick={handleDownload}
          >
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
          <Button
            variant="outline"
            fullWidth
            onClick={handleEmail}
          >
            <Mail className="w-4 h-4 mr-2" />
            Email
          </Button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          Thank you for choosing Tuk Tuk Eazy!
        </p>
      </div>
    </div>
  );
};

const generateReceiptHTML = (ride: any, payment: any): string => {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Tuk Tuk Eazy Receipt</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { text-align: center; border-bottom: 2px solid #2EC4B6; padding-bottom: 20px; margin-bottom: 20px; }
        .section { margin-bottom: 20px; }
        .row { display: flex; justify-content: space-between; margin-bottom: 8px; }
        .total { font-size: 18px; font-weight: bold; border-top: 1px solid #ccc; padding-top: 10px; }
    </style>
</head>
<body>
    <div class="header">
        <h1 style="color: #2EC4B6;">Tuk Tuk Eazy</h1>
        <h2>Payment Receipt</h2>
    </div>
    
    <div class="section">
        <h3>Trip Details</h3>
        <div class="row"><span>From:</span><span>${ride.pickup_address}</span></div>
        <div class="row"><span>To:</span><span>${ride.dropoff_address}</span></div>
        <div class="row"><span>Date:</span><span>${new Date(ride.created_at).toLocaleDateString()}</span></div>
        <div class="row"><span>Time:</span><span>${new Date(ride.created_at).toLocaleTimeString()}</span></div>
        ${ride.driver ? `<div class="row"><span>Driver:</span><span>${ride.driver.full_name}</span></div>` : ''}
    </div>
    
    <div class="section">
        <h3>Payment Details</h3>
        <div class="row"><span>Ride Fare:</span><span>${formatCurrency(payment.amount)}</span></div>
        <div class="row"><span>Payment Method:</span><span>Credit Card</span></div>
        <div class="row"><span>Status:</span><span>${payment.status}</span></div>
        <div class="row"><span>Transaction ID:</span><span>${payment.id}</span></div>
    </div>
    
    <div class="total">
        <div class="row"><span>Total Paid:</span><span>${formatCurrency(payment.amount)}</span></div>
    </div>
    
    <p style="text-align: center; margin-top: 30px; color: #666;">
        Thank you for choosing Tuk Tuk Eazy!
    </p>
</body>
</html>
  `;
};