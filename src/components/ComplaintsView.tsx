import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Complaint } from '../types';
import { Headphones, Plus, Send, MessageSquare, CheckCircle2, Clock, Upload } from 'lucide-react';

export const ComplaintsView: React.FC = () => {
  const { complaints, submitComplaint, replyToComplaint, currentUser } = useApp();

  const userComplaints = currentUser.role === 'admin'
    ? complaints
    : complaints.filter(c => c.userId === currentUser.id || c.userEmail.toLowerCase() === currentUser.email.toLowerCase());

  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(userComplaints[0] || null);

  const [subject, setSubject] = useState('');
  const [orderNumber, setOrderNumber] = useState('');
  const [momoTxnId, setMomoTxnId] = useState('');
  const [message, setMessage] = useState('');
  const [replyMessage, setReplyMessage] = useState('');

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;

    submitComplaint(subject, message, orderNumber.trim() || undefined, momoTxnId.trim() || undefined);
    setShowNewModal(false);
    setSubject('');
    setMessage('');
    setOrderNumber('');
    setMomoTxnId('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedComplaint || !replyMessage.trim()) return;

    replyToComplaint(selectedComplaint.id, replyMessage.trim());
    setReplyMessage('');
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center space-x-2">
            <Headphones className="w-6 h-6 text-amber-500" />
            <span>Support & Complaints</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">Submit support tickets and attach screenshots for quick resolution</p>
        </div>

        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>New Support Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List Column */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Your Tickets</h3>
          {userComplaints.length === 0 ? (
            <p className="text-xs text-zinc-500">No support tickets submitted.</p>
          ) : (
            userComplaints.map(comp => (
              <div
                key={comp.id}
                onClick={() => setSelectedComplaint(comp)}
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  selectedComplaint?.id === comp.id
                    ? 'bg-amber-500/10 border-amber-500 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-xs text-zinc-900 dark:text-zinc-100 truncate">{comp.subject}</span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      comp.status === 'resolved'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    {comp.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 mt-1 line-clamp-1">
                  {comp.messages[comp.messages.length - 1]?.message}
                </p>
                <span className="text-[10px] text-zinc-400 mt-2 block">
                  Updated: {new Date(comp.updatedAt).toLocaleString()}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Selected Ticket Thread Column */}
        <div className="lg:col-span-2 bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 flex flex-col justify-between h-[500px]">
          {selectedComplaint ? (
            <>
              {/* Thread Header */}
              <div className="pb-4 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">{selectedComplaint.subject}</h3>
                  <span className="text-xs font-mono text-zinc-400">
                    {selectedComplaint.orderNumber ? `Order: ${selectedComplaint.orderNumber}` : ''}
                  </span>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto my-4 space-y-3 pr-2">
                {selectedComplaint.messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`p-3.5 rounded-2xl max-w-md text-xs space-y-1 ${
                      msg.senderRole === 'admin'
                        ? 'bg-amber-500/10 border border-amber-500/30 text-zinc-900 dark:text-zinc-100 ml-auto'
                        : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] opacity-70 font-bold">
                      <span>{msg.senderName}</span>
                      <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    <p className="leading-relaxed">{msg.message}</p>
                  </div>
                ))}
              </div>

              {/* Reply Input */}
              <form onSubmit={handleSendReply} className="flex items-center space-x-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <input
                  type="text"
                  placeholder="Type your reply..."
                  value={replyMessage}
                  onChange={e => setReplyMessage(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  className="p-2.5 bg-amber-500 text-black rounded-xl font-bold hover:bg-amber-400 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-zinc-400">
              <Headphones className="w-12 h-12 mb-2 opacity-40" />
              <p className="text-xs">Select a ticket to view conversation thread</p>
            </div>
          )}
        </div>
      </div>

      {/* New Complaint Modal */}
      {showNewModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-3xl max-w-lg w-full p-6 border border-zinc-200 dark:border-zinc-800 shadow-2xl space-y-4">
            <h3 className="font-extrabold text-base text-zinc-900 dark:text-zinc-100">Submit Support Ticket</h3>

            <form onSubmit={handleCreateSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Subject *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Delay in MTN Data Delivery"
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Order # (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. ORD-849201"
                    value={orderNumber}
                    onChange={e => setOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">MoMo Txn ID (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. 202607238910"
                    value={momoTxnId}
                    onChange={e => setMomoTxnId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block mb-1">Description *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain the issue in detail..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-amber-500 text-black font-extrabold text-xs rounded-xl"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
