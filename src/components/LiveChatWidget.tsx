import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { MessageSquare, X, Send, Bot, ExternalLink, Sparkles } from 'lucide-react';

// Official WhatsApp SVG Component
const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    stroke="currentColor"
    strokeWidth="0"
    fill="currentColor"
    className={className}
  >
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.105 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-1.141 4.166 4.314-1.165zm12.339-6.262c-.114-.19-.418-.304-.873-.532-.456-.228-2.697-1.332-3.114-1.484-.418-.152-.722-.228-1.026.228-.304.456-1.177 1.484-1.443 1.788-.266.304-.532.342-.987.114-.456-.228-1.927-.71-3.67-2.264-1.356-1.208-2.271-2.699-2.537-3.155-.266-.456-.028-.702.199-.928.204-.204.456-.532.684-.798.228-.266.304-.456.456-.76.152-.304.076-.57-.038-.798-.114-.228-1.026-2.47-1.406-3.382-.37-.887-.746-.766-1.026-.78-.266-.013-.57-.016-.874-.016-.304 0-.798.114-1.216.57-.418.456-1.601 1.564-1.601 3.81 0 2.247 1.636 4.416 1.864 4.72.228.304 3.22 4.918 7.799 6.897 1.09.47 1.94.75 2.603.96 1.092.345 2.086.296 2.871.179.876-.131 2.697-1.102 3.077-2.166.38-1.064.38-1.976.266-2.166z" />
  </svg>
);

export const LiveChatWidget: React.FC = () => {
  const { currentUser, packages, networks } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'bot',
      text: `Hello ${currentUser.fullName}, Welcome to Donmac Data Hub, How can I help you?`,
    }
  ]);
  const [input, setInput] = useState('');

  const generateSmartReply = (query: string): string => {
    const q = query.toLowerCase();

    // Balance query
    if (q.includes('balance') || q.includes('my money') || q.includes('wallet')) {
      return `Your current wallet balance is ₵${currentUser.walletBalance.toFixed(2)}. You can top up anytime via Mobile Money to 0549358359 (Osei Michael) using your reference code!`;
    }

    // MoMo payment details
    if (q.includes('momo') || q.includes('top up') || q.includes('number') || q.includes('payment') || q.includes('how to pay')) {
      return `To top up your wallet automatically:\n1. Click 'Top Up Wallet'\n2. Dial *170# or *110# → Send Money to 0549358359 (Name: Osei Michael)\n3. Enter your unique Reference Code in the MoMo reference field.\nYour wallet will credit automatically!`;
    }

    // Package prices
    if (q.includes('price') || q.includes('package') || q.includes('cost') || q.includes('mtn') || q.includes('telecel') || q.includes('at') || q.includes('ishare') || q.includes('big time')) {
      const matchPkgs = packages.filter(p => p.status !== 'hidden');
      let text = "Here are our current package prices:\n";
      matchPkgs.slice(0, 5).forEach(p => {
        text += `• ${p.name}: ₵${p.price.toFixed(2)} (${p.validity})\n`;
      });
      text += "\nAll packages are dispatched instantly upon purchase!";
      return text;
    }

    // Claim payment
    if (q.includes('claim') || q.includes('transaction id') || q.includes('txn') || q.includes('ref')) {
      return `If you omitted your reference code during MoMo payment, click 'Claim Payment', enter your MoMo Transaction ID from your SMS, and our webhook will verify and credit your account automatically!`;
    }

    // Validity
    if (q.includes('validity') || q.includes('expire') || q.includes('duration')) {
      return `Package Validity Periods:\n• MTN: 90 Days\n• Telecel: 60 Days\n• AT iShare: 60 Days\n• AT Big Time: Non-Expiry!`;
    }

    // Complaints or Escalation
    if (q.includes('admin') || q.includes('complaint') || q.includes('refund') || q.includes('issue') || q.includes('wrong') || q.includes('help')) {
      return `For account specific issues or manual assistance, please submit a ticket in the 'Support & Complaints' tab or contact admin on WhatsApp at 0549358359. Admin email: donmacdatahub@gmail.com.`;
    }

    return `I am here to help! I know about package prices, wallet top-ups, transaction ID claiming, and package validities. If you need direct human assistance, please reach out via WhatsApp at 0549358359 or submit a Support ticket!`;
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userText = input.trim();
    const userMsg = { id: Date.now().toString(), sender: 'user', text: userText };
    setMessages(prev => [...prev, userMsg]);
    setInput('');

    setTimeout(() => {
      const botReply = generateSmartReply(userText);
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), sender: 'bot', text: botReply }]);
    }, 600);
  };

  return (
    <>
      {/* Floating Buttons Group */}
      <div className="fixed bottom-20 right-4 md:bottom-6 md:right-6 z-40 flex flex-col space-y-2">
        {/* Real WhatsApp Button */}
        <a
          href="https://wa.me/233549358359?text=Hello%20Donmac%20Data%20Hub"
          target="_blank"
          rel="noopener noreferrer"
          className="w-12 h-12 rounded-full bg-[#25D366] hover:bg-[#20ba5a] text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-all border-2 border-white/20"
          title="Chat on WhatsApp"
        >
          <WhatsAppIcon className="w-6 h-6 text-white" />
        </a>

        {/* Live AI Assistant Trigger */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-black flex items-center justify-center shadow-2xl hover:scale-110 transition-all font-black border-2 border-white/20"
          title="Live AI Assistant Support"
        >
          <Sparkles className="w-6 h-6" />
        </button>
      </div>

      {/* Chat Popup */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 md:bottom-20 md:right-6 z-50 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col h-96 animate-in fade-in slide-in-from-bottom-4">
          <div className="p-4 bg-amber-500 text-black font-extrabold flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="w-5 h-5" />
              <span className="text-sm font-black uppercase tracking-wider">Donmac AI Assistant</span>
            </div>
            <button onClick={() => setIsOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
            {messages.map(m => (
              <div
                key={m.id}
                className={`p-3 rounded-2xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-amber-500 text-black font-medium ml-auto'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSend} className="p-3 border-t border-slate-100 dark:border-slate-800 flex space-x-2">
            <input
              type="text"
              placeholder="Ask AI about prices, top-ups, validity..."
              value={input}
              onChange={e => setInput(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
            />
            <button type="submit" className="p-2 bg-amber-500 text-black rounded-xl font-bold">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
};
